# DoseMate - FastAPI Backend

This directory contains the Python FastAPI backend implementation for **DoseMate**, equipped with SQLite/MySQL SQLAlchemy models, JWT authentication, audible alarm status endpoints, snooze, and medicine history tracking.

## Features
- **Authentication**: JWT token issuance and user profile management
- **Medicine CRUD**: Create, read, update, and delete medicine schedules
- **Reminders**: Today's active queue, Taken, Missed, Snoozed, and Dismissed transitions
- **Audit History**: Historical adherence logs with actual vs scheduled timestamps
- **Preferences**: Notification toggles, alarm sound, volume, and voice language (English / Hindi)

## Quick Start

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI development server:
```bash
uvicorn backend.main:app --reload --port 8000
```

4. Interactive Swagger documentation will be available at:
```
http://localhost:8000/docs
```
