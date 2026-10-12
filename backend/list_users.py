import os

url = input("postgresql://it_helpdesk_db_tvo2_user:6Bf7F9p8Sowyibq0nhZONPY0Q0Q5dPWY@dpg-db6ds7nlk1mc73ct6qbg-a.oregon-postgres.render.com/it_helpdesk_db_tvo2 ").strip().strip('"').strip("'")
if url:
    os.environ["DATABASE_URL"] = url

import models  # noqa: E402
from database import SessionLocal, engine  # noqa: E402

print(f"Connected to: {engine.url.render_as_string(hide_password=True)}\n")
with SessionLocal() as db:
    users = db.query(models.User).order_by(models.User.id).all()
    if not users:
        print("No users in this database.")
    for u in users:
        print(f"{u.id:>3}  {u.role:<9} {u.email}  ({u.name})")