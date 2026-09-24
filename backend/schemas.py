from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class MedicineCreate(BaseModel):
    medicine_name: str
    dosage: str
    instructions: str = "After Food"
    start_date: str
    end_date: str
    frequency: str = "Daily"
    reminder_times: List[str]
    notes: Optional[str] = None
    color: Optional[str] = "#3b82f6"

class MedicineResponse(BaseModel):
    id: str
    user_id: str
    medicine_name: str
    dosage: str
    instructions: str
    start_date: str
    end_date: str
    frequency: str
    color: Optional[str]
    notes: Optional[str]
    active: bool

    class Config:
        from_attributes = True

class ReminderResponse(BaseModel):
    id: str
    medicine_id: str
    user_id: str
    reminder_time: str
    frequency: str
    status: str
    snooze_until: Optional[str]
    enabled: bool
    date: str
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    instructions: Optional[str] = None

    class Config:
        from_attributes = True

class ActionPayload(BaseModel):
    action_time: Optional[str] = None
    notes: Optional[str] = None

class SnoozePayload(BaseModel):
    minutes: int = 10
    snooze_until: Optional[str] = None

class HistoryResponse(BaseModel):
    id: str
    medicine_id: Optional[str]
    user_id: str
    medicine_name: str
    dosage: str
    scheduled_time: str
    action_time: str
    status: str
    instructions: Optional[str]
    notes: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

class SettingsUpdate(BaseModel):
    notifications_enabled: bool
    alarm_enabled: bool
    voice_enabled: bool
    alarm_volume: int
    alarm_sound: str
    voice_language: str
    snooze_duration: int
    alarm_duration: int

    class Config:
        from_attributes = True
