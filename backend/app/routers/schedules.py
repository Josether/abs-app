from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Schedule
from ..schemas import ScheduleIn, ScheduleOut
import time
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/schedules", tags=["schedules"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_default_schedule():
    db = SessionLocal()
    try:
        if not db.query(Schedule).first():
            s = Schedule(name="weekly-all", interval_days=7, run_at="02:00", target_type="All", enabled=True)
            db.add(s)
            db.commit()
    finally:
        db.close()


_ensure_default_schedule()


@router.get("", response_model=list[ScheduleOut])
def list_schedules(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Schedule).all()
    out = []
    for r in rows:
        out.append(ScheduleOut(
            id=r.id, name=r.name, run_at=r.run_at, enabled=bool(r.enabled),
            interval_days=r.interval_days, target_type=r.target_type,
            retention=r.retention, notify_on_fail=bool(r.notify_on_fail)
        ))
    return out


@router.post("", response_model=ScheduleOut)
def create_schedule(payload: ScheduleIn, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    name = f"device-{payload.device_id}-{int(time.time())}" if payload.device_id else f"schedule-{int(time.time())}"
    interval = payload.interval_days or 7
    target_type = "Device" if payload.device_id else "All"
    s = Schedule(name=name, run_at=payload.schedule_time, enabled=payload.enabled,
                 interval_days=interval, target_type=target_type)
    db.add(s)
    db.commit()
    db.refresh(s)
    return ScheduleOut(
        id=s.id, name=s.name, run_at=s.run_at, enabled=bool(s.enabled),
        interval_days=s.interval_days, target_type=s.target_type,
        retention=s.retention, notify_on_fail=bool(s.notify_on_fail)
    )


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, payload: ScheduleIn, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    s = db.get(Schedule, schedule_id)
    if not s:
        raise HTTPException(status_code=404, detail="not found")
    s.run_at = payload.schedule_time
    s.enabled = payload.enabled
    if payload.interval_days:
        s.interval_days = payload.interval_days
    if payload.device_id:
        s.name = f"device-{payload.device_id}"
        s.target_type = "Device"
    db.commit()
    db.refresh(s)
    return ScheduleOut(
        id=s.id, name=s.name, run_at=s.run_at, enabled=bool(s.enabled),
        interval_days=s.interval_days, target_type=s.target_type,
        retention=s.retention, notify_on_fail=bool(s.notify_on_fail)
    )


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    s = db.get(Schedule, schedule_id)
    if not s:
        raise HTTPException(status_code=404, detail="not found")
    db.delete(s)
    db.commit()
    return {"deleted": True}
