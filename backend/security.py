"""Passwords and login tokens.

Passwords are never stored. We store a bcrypt hash (a one-way scramble).
After login the server gives the browser a signed token (JWT) which the browser sends
with every request, like a wristband that proves who you are.
"""
import logging
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models
from database import get_db

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-change-me")
ALGORITHM = "HS256"
TOKEN_HOURS = 12

if SECRET_KEY == "dev-only-secret-change-me":
    logging.getLogger("security").warning("SECRET_KEY is not set. Set it in .env before deploying.")

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode()[:72], password_hash.encode())
    except ValueError:
        return False


def create_token(user: models.User) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)
    return jwt.encode({"sub": str(user.id), "exp": expires}, SECRET_KEY, algorithm=ALGORITHM)


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.User:
    """Dependency: returns the logged-in user, or answers 401 if the token is missing or bad."""
    if not creds:
        raise HTTPException(status_code=401, detail="Please sign in")
    try:
        data = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.get(models.User, int(data["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again")
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    return user


def staff_only(user: models.User = Depends(current_user)) -> models.User:
    """Dependency: support agents and admins may pass."""
    if user.role not in ("agent", "admin"):
        raise HTTPException(status_code=403, detail="Only support staff can do this")
    return user


def admin_only(user: models.User = Depends(current_user)) -> models.User:
    """Dependency: only admins may pass."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only an admin can do this")
    return user