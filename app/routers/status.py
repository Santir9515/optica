from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(prefix="/status", tags=["Status"])


@router.get("")
def status(db: Session = Depends(get_db)):
    # Chequeo DB simple
    db.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "ok",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }
