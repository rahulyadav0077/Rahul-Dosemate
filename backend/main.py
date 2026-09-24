from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
import datetime
import re
import uuid
from typing import List

from .database import engine, Base, get_db
from . import models, schemas

SECRET_KEY = "dosemate-secret-key-change-me"
ALGORITHM = "HS256"
SecurityScheme = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PASSWORD_PATTERN = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    payload = {"sub": user_id, "exp": expires_at}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(SecurityScheme),
    db: Session = Depends(get_db),
):
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DoseMate - Smart Medicine Reminder, Alarm & Voice System API",
    description="FastAPI Backend for DoseMate with Medicine Management, Audible Alarms, Voice Synthesizer and History Tracking",
    version="1.0.0",
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication Endpoints ---
@app.post("/api/auth/register", response_model=schemas.TokenResponse)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    name = user_in.name.strip()
    email = user_in.email.strip().lower()

    if not name:
        raise HTTPException(status_code=400, detail="Please enter your name.")
    if not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if not PASSWORD_PATTERN.match(user_in.password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.",
        )
    if user_in.password != user_in.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user_id = f"user-{uuid.uuid4().hex[:8]}"
    db_user = models.User(
        id=user_id,
        name=name,
        email=email,
        password_hash=hash_password(user_in.password),
    )
    db.add(db_user)

    settings = models.NotificationSettings(
        id=f"set-{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        notifications_enabled=True,
        alarm_enabled=True,
        voice_enabled=True,
        alarm_volume=85,
        alarm_sound="chime",
        voice_language="en",
        snooze_duration=10,
        alarm_duration=2,
    )
    db.add(settings)
    db.commit()
    db.refresh(db_user)

    return {
        "token": create_access_token(user_id),
        "user": schemas.UserResponse(id=db_user.id, name=db_user.name, email=db_user.email),
    }

@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login_user(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    email = login_in.email.strip().lower()
    password = login_in.password

    if not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "token": create_access_token(user.id),
        "user": schemas.UserResponse(id=user.id, name=user.name, email=user.email),
    }

# --- Medicine Endpoints ---
@app.get("/api/medicines", response_model=List[schemas.MedicineResponse])
def get_medicines(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Medicine).filter(models.Medicine.user_id == current_user.id).all()

@app.post("/api/medicines", response_model=schemas.MedicineResponse)
def create_medicine(med: schemas.MedicineCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id

    med_id = f"med-{uuid.uuid4().hex[:8]}"
    db_med = models.Medicine(
        id=med_id,
        user_id=user_id,
        medicine_name=med.medicine_name,
        dosage=med.dosage,
        instructions=med.instructions,
        start_date=med.start_date,
        end_date=med.end_date,
        frequency=med.frequency,
        color=med.color or "#3b82f6",
        notes=med.notes,
        active=True,
    )
    db.add(db_med)

    # Auto-generate today's reminders
    today_str = datetime.date.today().isoformat()
    for time_str in med.reminder_times:
        reminder = models.Reminder(
            id=f"rem-{uuid.uuid4().hex[:8]}",
            medicine_id=med_id,
            user_id=user_id,
            reminder_time=time_str,
            frequency=med.frequency,
            status="Pending",
            snooze_until=None,
            enabled=True,
            date=today_str,
        )
        db.add(reminder)

    db.commit()
    db.refresh(db_med)
    return db_med

@app.put("/api/medicines/{medicine_id}", response_model=schemas.MedicineResponse)
def update_medicine(medicine_id: str, med_update: schemas.MedicineCreate, db: Session = Depends(get_db)):
    db_med = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    db_med.medicine_name = med_update.medicine_name
    db_med.dosage = med_update.dosage
    db_med.instructions = med_update.instructions
    db_med.start_date = med_update.start_date
    db_med.end_date = med_update.end_date
    db_med.frequency = med_update.frequency
    db_med.color = med_update.color
    db_med.notes = med_update.notes

    db.commit()
    db.refresh(db_med)
    return db_med

@app.delete("/api/medicines/{medicine_id}")
def delete_medicine(medicine_id: str, db: Session = Depends(get_db)):
    db_med = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(db_med)
    db.commit()
    return {"message": "Medicine deleted successfully"}

# --- Reminder Endpoints ---
@app.get("/api/reminders/today")
def get_today_reminders(db: Session = Depends(get_db)):
    reminders = db.query(models.Reminder).all()
    results = []
    for r in reminders:
        med = db.query(models.Medicine).filter(models.Medicine.id == r.medicine_id).first()
        results.append({
            "id": r.id,
            "medicine_id": r.medicine_id,
            "user_id": r.user_id,
            "reminder_time": r.reminder_time,
            "frequency": r.frequency,
            "status": r.status,
            "snooze_until": r.snooze_until,
            "enabled": r.enabled,
            "date": r.date,
            "medicine_name": med.medicine_name if med else "Medicine",
            "dosage": med.dosage if med else "",
            "instructions": med.instructions if med else "None",
            "color": med.color if med else "#3b82f6",
        })
    return results

@app.get("/api/reminders/upcoming")
def get_upcoming_reminders(db: Session = Depends(get_db)):
    reminders = db.query(models.Reminder).filter(
        models.Reminder.status.in_(["Pending", "Snoozed"])
    ).all()
    return reminders

@app.post("/api/reminders/{reminder_id}/taken")
def mark_reminder_taken(reminder_id: str, payload: schemas.ActionPayload, db: Session = Depends(get_db)):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder.status = "Taken"
    reminder.snooze_until = None

    med = db.query(models.Medicine).filter(models.Medicine.id == reminder.medicine_id).first()
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    # Record in history table
    history_entry = models.MedicineHistory(
        id=f"hist-{uuid.uuid4().hex[:8]}",
        medicine_id=reminder.medicine_id,
        user_id=reminder.user_id,
        medicine_name=med.medicine_name if med else "Medicine",
        dosage=med.dosage if med else "",
        scheduled_time=f"{reminder.date} {reminder.reminder_time}",
        action_time=payload.action_time or now_str,
        status="Taken",
        instructions=med.instructions if med else None,
        notes=payload.notes or "Taken on time",
    )
    db.add(history_entry)
    db.commit()
    return {"status": "Taken", "reminder_id": reminder_id}

@app.post("/api/reminders/{reminder_id}/missed")
def mark_reminder_missed(reminder_id: str, payload: schemas.ActionPayload, db: Session = Depends(get_db)):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder.status = "Missed"
    reminder.snooze_until = None

    med = db.query(models.Medicine).filter(models.Medicine.id == reminder.medicine_id).first()
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    history_entry = models.MedicineHistory(
        id=f"hist-{uuid.uuid4().hex[:8]}",
        medicine_id=reminder.medicine_id,
        user_id=reminder.user_id,
        medicine_name=med.medicine_name if med else "Medicine",
        dosage=med.dosage if med else "",
        scheduled_time=f"{reminder.date} {reminder.reminder_time}",
        action_time=now_str,
        status="Missed",
        instructions=med.instructions if med else None,
        notes=payload.notes or "User did not respond within reminder window",
    )
    db.add(history_entry)
    db.commit()
    return {"status": "Missed", "reminder_id": reminder_id}

@app.post("/api/reminders/{reminder_id}/snooze")
def snooze_reminder(reminder_id: str, payload: schemas.SnoozePayload, db: Session = Depends(get_db)):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    snooze_until_time = payload.snooze_until or (
        datetime.datetime.utcnow() + datetime.timedelta(minutes=payload.minutes)
    ).isoformat()

    reminder.status = "Snoozed"
    reminder.snooze_until = snooze_until_time
    db.commit()
    return {"status": "Snoozed", "snooze_until": snooze_until_time}

@app.post("/api/reminders/{reminder_id}/dismiss")
def dismiss_reminder(reminder_id: str, db: Session = Depends(get_db)):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder.status = "Dismissed"
    reminder.snooze_until = None

    med = db.query(models.Medicine).filter(models.Medicine.id == reminder.medicine_id).first()
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    history_entry = models.MedicineHistory(
        id=f"hist-{uuid.uuid4().hex[:8]}",
        medicine_id=reminder.medicine_id,
        user_id=reminder.user_id,
        medicine_name=med.medicine_name if med else "Medicine",
        dosage=med.dosage if med else "",
        scheduled_time=f"{reminder.date} {reminder.reminder_time}",
        action_time=now_str,
        status="Dismissed",
        instructions=med.instructions if med else None,
        notes="User dismissed the alarm",
    )
    db.add(history_entry)
    db.commit()
    return {"status": "Dismissed", "reminder_id": reminder_id}

# --- History & Settings Endpoints ---
@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(models.MedicineHistory).order_by(models.MedicineHistory.created_at.desc()).all()

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.NotificationSettings).first()
    if not settings:
        settings = models.NotificationSettings(
            id="settings-default",
            user_id="user-demo-1",
            notifications_enabled=True,
            alarm_enabled=True,
            voice_enabled=True,
            alarm_volume=85,
            alarm_sound="chime",
            voice_language="en",
            snooze_duration=10,
            alarm_duration=2,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.put("/api/settings")
def update_settings(new_settings: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(models.NotificationSettings).first()
    if not settings:
        settings = models.NotificationSettings(
            id="settings-default",
            user_id="user-demo-1",
            **new_settings.dict()
        )
        db.add(settings)
    else:
        for k, v in new_settings.dict().items():
            setattr(settings, k, v)

    db.commit()
    db.refresh(settings)
    return settings
