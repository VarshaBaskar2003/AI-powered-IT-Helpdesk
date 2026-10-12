"""Make an existing account an admin:   python make_admin.py abc@example.com

Use this if you cannot become admin any other way (for example ADMIN_EMAILS was not set
and nobody is an admin yet). The person must have signed up in the app first.
"""
import sys

import models
from database import SessionLocal

if len(sys.argv) != 2:
    sys.exit("Usage: python make_admin.py abc@example.com")

with SessionLocal() as db:
    user = db.query(models.User).filter(models.User.email == sys.argv[1].strip().lower()).first()
    if not user:
        sys.exit("No account with that email. Sign up in the app first, then run this again.")
    user.role = "admin"
    db.commit()
    print(f"{user.name} ({user.email}) is now an admin.")