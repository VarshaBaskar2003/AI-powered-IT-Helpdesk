"""FastAPI app: routes only. Rules live in schemas.py, security.py and ai_service.py."""
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import ai_service
import models
import schemas
from constants import CATEGORIES, PRIORITIES, STATUSES
from database import Base, SessionLocal, engine, get_db
from security import admin_only, create_token, current_user, hash_password, staff_only, verify_password


def admin_emails() -> set[str]:
    """Emails listed in ADMIN_EMAILS are admins."""
    return {e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()}


def demo_admin() -> tuple[str, str] | None:
    """Optional demo admin shown on the Admin panel card. Needs BOTH settings (password at least 8 characters)."""
    email = os.getenv("DEMO_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("DEMO_ADMIN_PASSWORD", "")
    return (email, password) if email and len(password) >= 8 else None


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # create tables on first start
    emails = admin_emails()
    creds = demo_admin()
    with SessionLocal() as db:
        if emails:  # make sure listed emails are admins, even if they signed up earlier
            db.query(models.User).filter(models.User.email.in_(emails), models.User.role != "admin") \
                .update({"role": "admin"}, synchronize_session=False)
        if creds:  # create (or repair) the demo admin so the details on the card always work
            email, password = creds
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                db.add(models.User(name="Admin", email=email, password_hash=hash_password(password), role="admin"))
            else:
                user.role = "admin"
                if not verify_password(password, user.password_hash):
                    user.password_hash = hash_password(password)
        db.commit()
    yield


app = FastAPI(title="AI-Powered IT Helpdesk", version="3.0.0", lifespan=lifespan)

# CORS: browsers block the React app (another origin) from calling this API unless we allow it.
origins = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])

STAFF_ROLES = ["agent", "admin"]


def staff_names(db: Session) -> list[str]:
    """Everyone who can work on tickets (agents and admins). Feeds the Assigned-to dropdowns."""
    rows = db.query(models.User.name).filter(models.User.role.in_(STAFF_ROLES)).all()
    return sorted({name for (name,) in rows})


def visible_tickets(db: Session, user: models.User):
    """THE visibility rule. Every ticket route starts from this query.

    admin    -> every ticket
    agent    -> tickets assigned to them, unassigned tickets (so they can pick them up), and ones they reported
    employee -> only the tickets they reported
    """
    q = db.query(models.Ticket)
    if user.role == "admin":
        return q
    if user.role == "agent":
        return q.filter(or_(models.Ticket.assigned_to == user.name,
                            models.Ticket.assigned_to.is_(None),
                            models.Ticket.created_by == user.id))
    return q.filter(models.Ticket.created_by == user.id)


def get_visible_ticket(db: Session, ticket_id: int, user: models.User) -> models.Ticket:
    """Tickets you may not see look exactly like tickets that do not exist."""
    ticket = visible_tickets(db, user).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/meta")
def meta(db: Session = Depends(get_db)):
    """Dropdown options for the UI, so the frontend never hard-codes them."""
    return {"categories": CATEGORIES, "priorities": PRIORITIES, "statuses": STATUSES, "staff": staff_names(db)}


# ---------------- login ----------------
@app.post("/api/auth/register", response_model=schemas.TokenOut, status_code=201)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    # Everyone who signs up is an employee, except emails in ADMIN_EMAILS (admins).
    # An admin can later make someone a support agent on the Team page.
    role = "admin" if email in admin_emails() else "employee"
    user = models.User(name=payload.name.strip(), email=email,
                       password_hash=hash_password(payload.password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_token(user), "user": user}


@app.post("/api/auth/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.strip().lower()).first()
    # Same message for "no such email" and "wrong password", so attackers learn nothing.
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": create_token(user), "user": user}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(current_user)):
    return user


@app.get("/api/demo-admin")
def demo_admin_details(user: models.User = Depends(current_user)):
    """Details for the Admin panel card. Turned off unless DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD are set."""
    creds = demo_admin()
    return {"enabled": True, "email": creds[0], "password": creds[1]} if creds else {"enabled": False}


# ---------------- team (admin only) ----------------
@app.get("/api/users", response_model=list[schemas.UserListOut])
def list_users(db: Session = Depends(get_db), admin: models.User = Depends(admin_only)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@app.put("/api/users/{user_id}/role", response_model=schemas.UserListOut)
def set_role(user_id: int, payload: schemas.RoleUpdate, db: Session = Depends(get_db),
             admin: models.User = Depends(admin_only)):
    target = db.get(models.User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    if payload.role in STAFF_ROLES:
        # Tickets are assigned by name, so two staff members may not share a name.
        clash = db.query(models.User).filter(
            func.lower(models.User.name) == target.name.lower(),
            models.User.id != target.id, models.User.role.in_(STAFF_ROLES)).first()
        if clash:
            raise HTTPException(status_code=409, detail=f"Another staff member is already called {target.name}")
    else:
        # No longer staff: give their tickets back to the unassigned pool.
        db.query(models.Ticket).filter(models.Ticket.assigned_to == target.name) \
            .update({"assigned_to": None}, synchronize_session=False)

    target.role = payload.role
    db.commit()
    db.refresh(target)
    return target


# ---------------- tickets ----------------
@app.post("/api/tickets", response_model=schemas.TicketOut, status_code=201)
def create_ticket(payload: schemas.TicketCreate, db: Session = Depends(get_db),
                  user: models.User = Depends(current_user)):
    # The requester is whoever is logged in; the browser cannot pretend to be someone else.
    ticket = models.Ticket(**payload.model_dump(), requester_name=user.name, created_by=user.id)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@app.get("/api/tickets", response_model=list[schemas.TicketOut])
def list_tickets(
    search: str | None = Query(None, max_length=100),
    status: str | None = None,
    priority: str | None = None,
    category: str | None = None,
    assigned_to: str | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(current_user),
):
    q = visible_tickets(db, user)
    if search:
        like = f"%{search.strip()}%"
        conditions = [
            models.Ticket.title.ilike(like),
            models.Ticket.description.ilike(like),
            models.Ticket.requester_name.ilike(like),
        ]
        digits = search.strip().lstrip("#")
        if digits.isdigit():
            conditions.append(models.Ticket.id == int(digits))  # search "12" or "#12"
        q = q.filter(or_(*conditions))
    if status:
        q = q.filter(models.Ticket.status == status)
    if priority:
        q = q.filter(models.Ticket.priority == priority)
    if category:
        q = q.filter(models.Ticket.category == category)
    if assigned_to == "Unassigned":
        q = q.filter(models.Ticket.assigned_to.is_(None))
    elif assigned_to:
        q = q.filter(models.Ticket.assigned_to == assigned_to)
    return q.order_by(models.Ticket.created_at.desc()).all()


@app.get("/api/tickets/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), user: models.User = Depends(current_user)):
    return get_visible_ticket(db, ticket_id, user)


@app.put("/api/tickets/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket(ticket_id: int, payload: schemas.TicketUpdate, db: Session = Depends(get_db),
                  user: models.User = Depends(staff_only)):
    ticket = get_visible_ticket(db, ticket_id, user)
    # An agent may only touch tickets that are theirs or still unassigned.
    if user.role == "agent" and ticket.assigned_to not in (None, user.name):
        raise HTTPException(status_code=403, detail="This ticket belongs to another agent")

    changes = payload.model_dump(exclude_unset=True)  # only the fields the client sent
    if "assigned_to" in changes:
        target = changes.pop("assigned_to") or None
        if target is not None and target not in staff_names(db):
            raise HTTPException(status_code=422, detail=f"Unknown staff member: {target}")
        if user.role == "agent" and target not in (None, user.name):
            raise HTTPException(status_code=403, detail="Only an admin can assign tickets to other people")
        ticket.assigned_to = target

    for field, value in changes.items():
        if value is not None:
            setattr(ticket, field, value)
    db.commit()
    db.refresh(ticket)
    return ticket


@app.delete("/api/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), user: models.User = Depends(admin_only)):
    db.delete(get_visible_ticket(db, ticket_id, user))
    db.commit()


# ---------------- dashboard (staff; numbers only count tickets the user may see) ----------------
@app.get("/api/stats")
def stats(db: Session = Depends(get_db), user: models.User = Depends(staff_only)):
    visible = visible_tickets(db, user)

    def grouped(column, allowed):
        counts = dict(visible.with_entities(column, func.count(models.Ticket.id)).group_by(column).all())
        return {k: counts.get(k, 0) for k in allowed}

    by_status = grouped(models.Ticket.status, STATUSES)
    active = models.Ticket.status.in_(["Open", "In Progress"])
    workload = dict(
        visible.filter(active).with_entities(models.Ticket.assigned_to, func.count(models.Ticket.id))
        .group_by(models.Ticket.assigned_to).all()
    )
    urgent = visible.filter(active, models.Ticket.priority.in_(["High", "Critical"])).count()
    return {
        "total": sum(by_status.values()),
        "by_status": by_status,
        "by_priority": grouped(models.Ticket.priority, PRIORITIES),
        "by_category": grouped(models.Ticket.category, CATEGORIES),
        "active_by_assignee": {(k or "Unassigned"): v for k, v in workload.items()},
        "urgent_active": urgent,
    }


# ---------------- AI ----------------
@app.post("/api/ai/analyze", response_model=schemas.AnalyzeResponse)
def ai_analyze(payload: schemas.AnalyzeRequest, user: models.User = Depends(current_user)):
    return ai_service.analyze_ticket(payload.title, payload.description)


@app.post("/api/tickets/{ticket_id}/draft-reply", response_model=schemas.ReplyResponse)
def ai_draft_reply(ticket_id: int, db: Session = Depends(get_db), user: models.User = Depends(staff_only)):
    return ai_service.draft_reply(get_visible_ticket(db, ticket_id, user))