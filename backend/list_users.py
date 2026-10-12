"""List every user and role in the database.

Usage:
    python list_users.py

The database URL is NOT stored in this file. Set DATABASE_URL in your terminal first,
or paste it when asked. Leave it empty to use the local .env / SQLite database.
"""
import os

# Must happen BEFORE importing database/models, because database.py reads the URL at import time.
if not os.getenv("DATABASE_URL"):
    url = input("Paste DATABASE_URL (Enter = local .env / SQLite): ").strip().strip('"').strip("'")
    if url:
        os.environ["DATABASE_URL"] = url

import models  # noqa: E402
from database import SessionLocal, engine  # noqa: E402

backend = engine.url.get_backend_name()
print(f"Connected to: {engine.url.render_as_string(hide_password=True)}")
print("Database type:", "LOCAL SQLite" if backend == "sqlite" else "PostgreSQL (live)", "\n")

with SessionLocal() as db:
    users = db.query(models.User).order_by(models.User.id).all()
    if not users:
        print("No users in this database.")
    for u in users:
        print(f"{u.id:>3}  {u.role:<9} {u.email}  ({u.name})")