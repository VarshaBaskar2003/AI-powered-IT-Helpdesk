# AI-Powered IT Helpdesk

A web app where employees report IT problems and support staff triage, assign and resolve them.
An AI step reads each problem and suggests a **category**, a **priority** and **first troubleshooting steps**,
and can **draft a reply** to the employee.

**Live demo:** _add your Vercel URL_  |  **API docs:** _add your Render URL_`/docs`

_Add 2 or 3 screenshots here (dashboard, new ticket with AI suggestion, admin panel)._

## Features
- **Sign in / create account** with three roles (see the table below)
- Create, view, edit and delete tickets; set priority, status, category and assignee
- Search (title, requester, ticket number) and filter by status, priority, category and assignee
- **AI triage** on the new-ticket form: category, priority and solution steps, editable before you submit
- **AI reply draft** for support staff on the ticket page
- **Dashboard** for staff: KPI cards, My queue with SLA progress bars, recent activity, tickets by category and per day
- **SLA target times** by priority: Critical 4 h, High 8 h, Medium 24 h, Low 72 h. Tickets past target show as overdue
- **Admin panel** with the team list, where an admin changes people's roles
- Light and dark theme, notification bell, and a layout that adapts to phones and tablets (the sidebar becomes a slide-in menu)

## Roles
| | Employee | Support agent | Admin |
|---|---|---|---|
| Sees tickets | Only the ones they reported | Assigned to them, unassigned ones (to pick up), and ones they reported | Every ticket |
| Dashboard | No | Numbers for their own tickets | Numbers for all tickets |
| Edits tickets | No | Only their own or unassigned ones | Any ticket |
| Assigns tickets | No | Only to themselves | To anyone |
| Deletes tickets | No | No | Yes |
| Admin panel (team and roles) | No | No | Yes |

A ticket you may not see behaves exactly like a ticket that does not exist (404).

## Accounts and the Admin panel
There are no pre-made users. People create their own account on the sign-up page.

- Everyone who signs up is an **employee**.
- Emails listed in `ADMIN_EMAILS` are **admins**. Sign up with one, or, if the account already exists, restart the backend and it is promoted.
- An admin makes people **support agents** (or more admins) in the **Admin panel**, in the sidebar.
- Locked out? Run `python make_admin.py you@example.com` inside `backend`. It makes an existing account an admin and works against the database in `DATABASE_URL`.
- **Admin panel link:** everyone sees it in the sidebar. Admins go straight to the team page. Everyone else gets an admin sign-in card, and signing in with a non-admin account is refused and changes nothing.
- **Admin details on the card (optional, for demos):** set `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD` (8+ characters). The backend creates that admin at every startup, and the card shows the email and password at the bottom with Copy buttons. Leave them empty to switch this off. Use a throwaway password: anyone who is signed in can read it.

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, lucide-react icons, plain CSS |
| Backend | Python 3.10+, FastAPI, Pydantic, PyJWT, bcrypt |
| Database | SQLite via SQLAlchemy (PostgreSQL supported through `DATABASE_URL`) |
| AI | Groq API (Llama 3.3 70B), optional Gemini backup, keyword-rule fallback |

## Project structure
```
backend/
  main.py          routes and the ticket visibility rule
  models.py        database tables (users, tickets)
  schemas.py       input and output validation
  security.py      password hashing, login tokens, role checks
  constants.py     allowed categories, priorities, statuses, roles
  ai_service.py    AI calls, output cleaning, keyword fallback
  make_admin.py    rescue script: make an account an admin
  tests/           pytest tests
frontend/src/
  App.jsx, api.js, utils.js, styles.css
  components/      Login, Sidebar, Topbar, Dashboard, charts, TicketList, TicketForm,
                   TicketDetail, Users (Admin panel), AdminSignIn, Badges
docs/
  AI_NOTE.md       short note on the AI tool used
```

## Run locally
You need Python 3.10+ and Node 18+.

**1. Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then edit .env (see the table below)
uvicorn main:app --reload
```
In `.env`, set at least `SECRET_KEY` (generate one with `python -c "import secrets; print(secrets.token_hex(32))"`),
`GROQ_API_KEY`, and `ADMIN_EMAILS` (your own email). The app also works without an AI key, using the keyword fallback.

The API runs at http://localhost:8000 and its interactive docs at http://localhost:8000/docs.
The database starts empty: sign up with your `ADMIN_EMAILS` address to become the first admin.
`--reload` watches code, not `.env`, so **restart the backend after changing `.env`**.

**2. Frontend** (new terminal)
```bash
cd frontend
npm install
cp .env.example .env             # VITE_API_URL=http://localhost:8000
npm run dev
```
Open http://localhost:5173.

**3. Tests**
```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

Upgrading from an older version? Delete `backend/helpdesk.db` once, because the tables changed (users were added).

## Environment variables
| Variable | Where | Purpose |
|---|---|---|
| `SECRET_KEY` | backend | Signs login tokens. Required in production |
| `ADMIN_EMAILS` | backend | Emails that are admins (comma-separated) |
| `GROQ_API_KEY` | backend | Groq key (https://console.groq.com/keys) |
| `AI_PROVIDER` | backend | `groq` (default) or `gemini` |
| `GEMINI_API_KEY` | backend | Optional backup AI provider |
| `FRONTEND_ORIGINS` | backend | Frontend URLs allowed to call the API (CORS), comma-separated |
| `DATABASE_URL` | backend | Optional PostgreSQL URL. Defaults to a local SQLite file |
| `DEMO_ADMIN_EMAIL` | backend | Optional. Demo admin shown on the Admin panel card |
| `DEMO_ADMIN_PASSWORD` | backend | Optional. Needs 8+ characters; set together with the email |
| `VITE_API_URL` | frontend | Backend URL |

## API
Interactive documentation is at `/docs`. Every route except health, meta, register and login needs a signed-in user.

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/api/health` | anyone | Health check |
| GET | `/api/meta` | anyone | Dropdown options and the staff list |
| POST | `/api/auth/register` | anyone | Create an account (employee, or admin if the email is in `ADMIN_EMAILS`) |
| POST | `/api/auth/login` | anyone | Sign in, returns a token |
| GET | `/api/auth/me` | signed in | Who am I |
| GET | `/api/demo-admin` | signed in | Demo admin details for the card (empty unless configured) |
| POST | `/api/tickets` | signed in | Create a ticket (the requester is the signed-in user) |
| GET | `/api/tickets?search=&status=&priority=&category=&assigned_to=` | signed in | List, search and filter the tickets you may see |
| GET | `/api/tickets/{id}` | signed in | One ticket |
| PUT | `/api/tickets/{id}` | staff | Edit, change status, priority, assignee (agents: own or unassigned tickets only) |
| DELETE | `/api/tickets/{id}` | admin | Delete a ticket |
| GET | `/api/stats` | staff | Dashboard numbers for the tickets the user may see |
| POST | `/api/ai/analyze` | signed in | AI category, priority and solution |
| POST | `/api/tickets/{id}/draft-reply` | staff | AI reply draft |
| GET | `/api/users` | admin | Everyone who signed up |
| PUT | `/api/users/{id}/role` | admin | Change someone's role |

## The AI feature
Groq (Llama 3.3 70B) is called from the backend only, so the key never reaches the browser. The model's answer is
parsed defensively and every field is forced into the allowed values. If Groq fails, the app tries Gemini (if a key is
set) and then simple keyword rules, so creating a ticket never breaks. The AI only **suggests**; the person confirms.
Details, prompt design and limitations: [docs/AI_NOTE.md](docs/AI_NOTE.md).

## Deployment
**Backend on Render** (Web Service, root directory `backend`)
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `SECRET_KEY`, `ADMIN_EMAILS`, `GROQ_API_KEY`, `FRONTEND_ORIGINS=https://<your-vercel-app>.vercel.app`, `PYTHON_VERSION=3.12.3`, and optionally `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`
- Free instances sleep when idle (the first request is slow) and SQLite data resets on every redeploy.
  The demo admin is recreated at startup, so it always exists. For permanent data, add a free PostgreSQL database,
  set `DATABASE_URL`, and add `psycopg2-binary` to `requirements.txt`.

**Frontend on Vercel** (root directory `frontend`, framework Vite)
- Environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com`
- Deploy the backend first to get its URL, then set `FRONTEND_ORIGINS` on Render once the frontend URL exists.

## Design decisions and limitations
- Login uses bcrypt password hashes and signed tokens that last 12 hours. The token is kept in the browser's
  localStorage for simplicity; a production app would use an httpOnly cookie.
- There is no email verification, password reset or login rate limiting. If an email is listed in `ADMIN_EMAILS`, sign up with it right away.
- Tickets are assigned to staff by name, so two staff members cannot share a name (the Admin panel blocks it).
- The demo admin details are shown to every signed-in user on purpose, for demonstrations. Leave them unset for real use.
- The dashboard's average resolution time is approximate: it uses the time of the last update on finished tickets.
- There is no rate limiting on the AI endpoints; add one before exposing the app publicly at scale.