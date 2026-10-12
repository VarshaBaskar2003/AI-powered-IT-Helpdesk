"""Make an account an admin, or create one.

Usage:
    python make_admin.py abc@example.com
    python make_admin.py abc@example.com "MyPassword123" "Admin Name"   (creates the account if missing)

The database URL is NOT stored in this file. Set DATABASE_URL in your terminal first,
or paste it when asked. Leave it empty to use the local .env / SQLite database.
"""
import os
import sys

if len(sys.argv) < 2:
    sys.exit('Usage: python make_admin.py abc@example.com ["password" ["Name"]]')

email = sys.argv[1].strip().lower()
password = sys.argv[2] if len(sys.argv) > 2 else None
name = sys.argv[3] if len(sys.argv) > 3 else "Admin"

# Must happen BEFORE importing database/models, because database.py reads the URL at import time.
if not os.getenv("DATABASE_URL"):
    url = input("Paste DATABASE_URL (Enter = local .env / SQLite): ").strip().strip('"').strip("'")
    if url:
        os.environ["DATABASE_URL"] = url

import models  # noqa: E402
from database import Base, SessionLocal, engine  # noqa: E402
from security import hash_password  # noqa: E402

target = engine.url.render_as_string(hide_password=True)
print(f"Connected to: {target}")
if engine.url.get_backend_name() == "sqlite":
    if input("This is the LOCAL SQLite database, not Postgres. Continue? (y/N): ").strip().lower() != "y":
        sys.exit("Cancelled.")

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    user = db.query(models.User).filter(models.User.email == email).first()

    if user:
        user.role = "admin"
        if password:
            if len(password) < 8:
                sys.exit("Password must be at least 8 characters.")
            user.password_hash = hash_password(password)
            print("Password updated.")
        db.commit()
        print(f"{user.name} ({user.email}) is now an admin.")
    elif password:
        if len(password) < 8:
            sys.exit("Password must be at least 8 characters.")
        db.add(models.User(name=name, email=email, password_hash=hash_password(password), role="admin"))
        db.commit()
        print(f"Created admin account: {email}")
    else:
        sys.exit("No account with that email. Sign up in the app first, or give a password:\n"
                 '  python make_admin.py abc@example.com "MyPassword123"')