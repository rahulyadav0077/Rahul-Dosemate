from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    medicines = relationship("Medicine", back_populates="user", cascade="all, delete-orphan")
    history = relationship("MedicineHistory", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("NotificationSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    medicine_name = Column(String, nullable=False, index=True)
    dosage = Column(String, nullable=False)
    instructions = Column(String, default="After Food") # Before Food, After Food, With Food, At Bedtime
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    frequency = Column(String, default="Daily") # Once, Daily, Weekly, Custom
    color = Column(String, default="#3b82f6")
    notes = Column(String, nullable=True)
    active = Column(Boolean, default=True)

    user = relationship("User", back_populates="medicines")
    reminders = relationship("Reminder", back_populates="medicine", cascade="all, delete-orphan")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(String, primary_key=True, index=True)
    medicine_id = Column(String, ForeignKey("medicines.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    reminder_time = Column(String, nullable=False) # HH:mm
    frequency = Column(String, default="Daily")
    status = Column(String, default="Pending") # Pending, Taken, Snoozed, Missed, Dismissed
    snooze_until = Column(String, nullable=True) # ISO timestamp
    enabled = Column(Boolean, default=True)
    date = Column(String, nullable=False)

    medicine = relationship("Medicine", back_populates="reminders")


class MedicineHistory(Base):
    __tablename__ = "medicine_history"

    id = Column(String, primary_key=True, index=True)
    medicine_id = Column(String, ForeignKey("medicines.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    scheduled_time = Column(String, nullable=False)
    action_time = Column(String, nullable=False)
    status = Column(String, nullable=False) # Taken, Missed, Snoozed, Dismissed
    instructions = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="history")


class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    notifications_enabled = Column(Boolean, default=True)
    alarm_enabled = Column(Boolean, default=True)
    voice_enabled = Column(Boolean, default=True)
    alarm_volume = Column(Integer, default=85)
    alarm_sound = Column(String, default="chime")
    voice_language = Column(String, default="en") # en or hi
    snooze_duration = Column(Integer, default=10) # 5, 10, 15, 30
    alarm_duration = Column(Integer, default=2) # 1, 2, 3, 5

    user = relationship("User", back_populates="settings")
