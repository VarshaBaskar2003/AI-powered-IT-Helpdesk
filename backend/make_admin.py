"""Make an account an admin, or create one.

Usage:
    python make_admin.py abc@example.com
    python make_admin.py abc@example.com "MyPassword123" "Admin Name"   (creates the account if missing)

The script asks you to paste your DATABASE_URL (leave it empty to use the local SQLite
database or the DATABASE_URL already set in .env). Paste the External Database URL from
Render to change the live database.
"""
import os
import sys

if len(sys.argv) < 2:
    sys.exit('Usage: python make_admin.py abc@example.com ["password" ["Name"]]')

email = sys.argv[1].strip().lower()
password = sys.argv[2] if len(sys.argv) > 2 else None
name = sys.argv[3] if len(sys.argv) > 3 else "Admin"

# Must happen BEFORE importing database/models, because database.py reads the URL at import time.
url = input("Paste DATABASE_URL (or press Enter to use .env / local SQLite): ").strip().strip('"').strip("'")
if url:
    os.environ["DATABASE_URL"] = url

import models  # noqa: E402
from database import Base, SessionLocal, engine  # noqa: E402
from security import hash_password  # noqa: E402

print(f"Connected to: {engine.url.render_as_string(hide_password=True)}")
Base.metadata.create_all(bind=engine)  # makes sure the tables exist

with SessionLocal() as db:
    user = db.query(models.User).filter(models.User.email == email).first()

    if user:
        user.role = "admin"
        if password:  # optionally reset the password too
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
        sys.exit("No account with that email. Sign up in the app first, or give a password "
                 "to create it:\n  python make_admin.py abc@example.com \"Abc12345\"")