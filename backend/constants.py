"""Single source of truth for the allowed values used across the app."""
from typing import Literal, get_args

Category = Literal["Network", "Hardware", "Software", "Account", "Email", "Security", "Other"]
Priority = Literal["Low", "Medium", "High", "Critical"]
Status = Literal["Open", "In Progress", "Resolved", "Closed"]

CATEGORIES = list(get_args(Category))
PRIORITIES = list(get_args(Priority))
STATUSES = list(get_args(Status))
Role = Literal["employee", "agent", "admin"]
ROLES = list(get_args(Role))