"""Pydantic schemas: validate what comes IN and shape what goes OUT."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from constants import Category, Priority, Role, Status


class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10, max_length=3000)
    category: Category = "Other"
    priority: Priority = "Medium"
    ai_solution: str | None = Field(default=None, max_length=4000)


class TicketUpdate(BaseModel):
    """Every field optional so the UI can send only what changed."""
    title: str | None = Field(default=None, min_length=3, max_length=150)
    description: str | None = Field(default=None, min_length=10, max_length=3000)
    category: Category | None = None
    priority: Priority | None = None
    status: Status | None = None
    assigned_to: str | None = None  # "" or null means unassigned


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    requester_name: str
    category: str
    priority: str
    status: str
    assigned_to: str | None
    ai_solution: str | None
    created_at: datetime
    updated_at: datetime


class AnalyzeRequest(BaseModel):
    title: str = Field(default="", max_length=150)
    description: str = Field(min_length=5, max_length=3000)


class AnalyzeResponse(BaseModel):
    category: Category
    priority: Priority
    solution: str
    source: str  # "groq", "gemini" or "fallback"


class ReplyResponse(BaseModel):
    reply: str
    source: str


# ---------- login ----------
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=120)
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: str = Field(max_length=120)
    password: str = Field(max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RoleUpdate(BaseModel):
    role: Role


class UserListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    created_at: datetime