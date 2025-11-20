from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, time
from ..settings import settings
from ..database import SessionLocal
from ..models import Schedule, Device, Job, Backup
from ..utils.crypto import dec
from .netmiko_worker import fetch_running_config
from .audit_log import audit_event
from hashlib import sha256
import pytz
import asyncio

scheduler = AsyncIOScheduler(timezone=pytz.timezone(settings.TIMEZONE))


async def run_scheduled_backup(schedule_id: int, schedule_name: str):
    """
    Execute a scheduled backup job for a specific schedule.
    This function runs the actual backup logic.
    """
    db = SessionLocal()
    try:
        # Create job record
        job = Job(
            triggered_by=f"schedule:{schedule_name}",
            status="running"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        log_lines = []
        log_lines.append(f"Scheduled job started at {job.started_at.isoformat()}")
        log_lines.append(f"Schedule: {schedule_name}")
        
        # Get enabled devices
        devices = db.query(Device).filter_by(enabled=True).all()
        log_lines.append(f"Processing {len(devices)} enabled device(s)...")
        
        ok = 0
        for d in devices:
            try:
                log_lines.append(f"[{d.hostname}] Connecting to {d.ip}...")
                path, content = fetch_running_config(
                    vendor=d.vendor, host=d.ip, username=dec(d.username_enc),
                    password=dec(d.password_enc), secret=dec(d.secret_enc) if d.secret_enc else None,
                    protocol=d.protocol, port=d.port
                )
                b = Backup(
                    device_id=d.id, 
                    size_bytes=len(content),
                    hash=sha256(content).hexdigest()[:8], 
                    path=str(path)
                )
                db.add(b)
                ok += 1
                db.commit()
                log_lines.append(f"[{d.hostname}] Backup success ({len(content)} bytes, path={path})")
                
                # CRITICAL: Delay antar device untuk Allied Telesis (rate limiting)
                if len(devices) > 1:  # Only delay if multiple devices
                    await asyncio.sleep(3)  # Wait 3 seconds before next device
                    db.expire_all()  # Refresh all SQLAlchemy objects after async delay
                    log_lines.append(f"[{d.hostname}] Waiting 3s before next device...")
                
            except Exception as e:
                log_lines.append(f"[{d.hostname}] Backup failed: {str(e)}")
                # Also wait on error to prevent rapid failed attempts
                if len(devices) > 1:
                    await asyncio.sleep(2)
                    db.expire_all()  # Refresh session
        
        # Update job status
        job.status = "success"
        job.devices = ok
        job.finished_at = datetime.utcnow()
        log_lines.append(f"Job completed: {ok}/{len(devices)} successful")
        job.log = "\n".join(log_lines)
        db.commit()
        
        # Audit log
        audit_event(
            user="system",
            action="job_run_scheduled",
            target=f"schedule:{schedule_name}",
            result=f"success ({ok}/{len(devices)} devices)"
        )
        
    except Exception as e:
        # Handle unexpected errors
        if 'job' in locals():
            job.status = "failed"
            job.finished_at = datetime.utcnow()
            job.log = f"Job failed: {str(e)}"
            db.commit()
        audit_event(
            user="system",
            action="job_run_scheduled",
            target=f"schedule:{schedule_name}",
            result=f"failed: {str(e)}"
        )
    finally:
        db.close()


def load_schedules_from_db():
    """
    Load all enabled schedules from the database and register them with APScheduler.
    """
    db = SessionLocal()
    try:
        schedules = db.query(Schedule).filter_by(enabled=True).all()
        
        for sch in schedules:
            try:
                # Parse run_at time (format: "HH:MM")
                hour, minute = map(int, sch.run_at.split(":"))
                
                # Create interval trigger based on interval_days
                trigger = IntervalTrigger(
                    days=sch.interval_days,
                    start_date=datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0),
                    timezone=pytz.timezone(settings.TIMEZONE)
                )
                
                # Add job to scheduler
                scheduler.add_job(
                    run_scheduled_backup,
                    trigger=trigger,
                    args=(sch.id, sch.name),
                    id=f"schedule-{sch.id}",
                    replace_existing=True,
                    name=f"Scheduled Backup: {sch.name}"
                )
                print(f"✓ Loaded schedule: {sch.name} (every {sch.interval_days} days at {sch.run_at})")
            except Exception as e:
                print(f"✗ Failed to load schedule {sch.name}: {e}")
    finally:
        db.close()


def reload_schedules():
    """
    Reload all schedules from database. Call this after schedule changes.
    """
    # Remove all existing schedule jobs
    for job in scheduler.get_jobs():
        if job.id.startswith("schedule-"):
            job.remove()
    
    # Load fresh schedules from DB
    load_schedules_from_db()


def start():
    """
    Start the scheduler and load initial schedules.
    """
    if not scheduler.running:
        scheduler.start()
        print("✓ APScheduler started")
        load_schedules_from_db()
