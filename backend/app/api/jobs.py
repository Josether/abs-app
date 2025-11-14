from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Device, Job, Backup
from ..utils.crypto import dec
from ..services.netmiko_worker import fetch_running_config
from ..services.job_controller import submit
from hashlib import sha256
from pathlib import Path
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/jobs", tags=["jobs"])
def get_db():
    db = SessionLocal(); 
    try: yield db
    finally: db.close()

@router.post("/run/manual")
async def run_manual(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    async def task():
        job = Job(triggered_by="manual", status="running"); db.add(job); db.commit(); db.refresh(job)
        devices = db.query(Device).filter_by(enabled=True).all()
        ok = 0
        for d in devices:
            try:
                path, content = fetch_running_config(
                    vendor=d.vendor, host=d.ip, username=dec(d.username_enc),
                    password=dec(d.password_enc), secret=dec(d.secret_enc) if d.secret_enc else None,
                    protocol=d.protocol, port=d.port
                )
                b = Backup(device_id=d.id, size_bytes=len(content),
                           hash=sha256(content).hexdigest()[:8], path=str(path))
                db.add(b); ok += 1
                db.commit()
            except Exception as e:
                pass
        job.status = "success"; job.devices = ok; db.commit()
    await submit(task)
    return {"queued": True}


@router.get("")
def list_jobs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # return recent jobs (most recent first)
    rows = db.query(Job).order_by(Job.started_at.desc()).limit(100).all()
    out = []
    for r in rows:
        out.append({
            "id": r.id,
            "triggered_by": r.triggered_by,
            "devices": r.devices or 0,
            "status": r.status,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None,
            "log": r.log,
        })
    return out


@router.post("/{job_id}/cancel")
def cancel_job(job_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    j = db.get(Job, job_id)
    if not j:
        return {"error": "not found"}
    if j.status != 'running':
        return {"ok": False, "detail": "job not running"}
    j.status = 'failed'
    from datetime import datetime
    j.finished_at = datetime.utcnow()
    db.commit()
    return {"ok": True}
