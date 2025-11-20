from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Device, Job, Backup
from ..utils.crypto import dec
from ..services.netmiko_worker import fetch_running_config
from ..services.job_controller import submit
from hashlib import sha256
from pathlib import Path
from ..security import get_current_user, require_admin
from ..services.audit_log import audit_event
import asyncio

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
        log_lines = []
        ok = 0
        
        log_lines.append(f"Job started at {job.started_at.isoformat()}")
        log_lines.append(f"Processing {len(devices)} enabled device(s)...")
        audit_event(user=current_user.username, action="job_run_manual", target=f"job#{job.id}", result="started")
        
        # Extract device info to avoid SQLAlchemy detached instance errors
        device_list = []
        for d in devices:
            device_list.append({
                'id': d.id,
                'hostname': d.hostname,
                'ip': d.ip,
                'vendor': d.vendor,
                'protocol': d.protocol,
                'port': d.port,
                'username_enc': d.username_enc,
                'password_enc': d.password_enc,
                'secret_enc': d.secret_enc,
            })
        
        ok = 0
        for idx, device_info in enumerate(device_list):
            try:
                log_lines.append(f"[{device_info['hostname']}] Connecting to {device_info['ip']}...")
                
                # Fetch running config
                path, content = fetch_running_config(
                    vendor=device_info['vendor'], 
                    host=device_info['ip'], 
                    username=dec(device_info['username_enc']),
                    password=dec(device_info['password_enc']), 
                    secret=dec(device_info['secret_enc']) if device_info['secret_enc'] else None,
                    protocol=device_info['protocol'], 
                    port=device_info['port']
                )
                
                # Save backup record
                b = Backup(
                    device_id=device_info['id'], 
                    size_bytes=len(content),
                    hash=sha256(content).hexdigest()[:8], 
                    path=str(path)
                )
                db.add(b)
                ok += 1
                db.commit()
                log_lines.append(f"[{device_info['hostname']}] Backup success ({len(content)} bytes, path={path})")
                
                # CRITICAL: Delay antar device untuk Allied Telesis (rate limiting)
                if idx < len(device_list) - 1:  # Not the last device
                    log_lines.append(f"[{device_info['hostname']}] Waiting 3s before next device...")
                    await asyncio.sleep(3)
                
            except Exception as e:
                log_lines.append(f"[{device_info['hostname']}] Backup failed: {str(e)}")
                # Also wait on error to prevent rapid failed attempts
                if idx < len(device_list) - 1:
                    await asyncio.sleep(2)
        
        from datetime import datetime
        log_lines.append(f"Job completed: {ok}/{len(device_list)} successful")
        
        # Re-query job to avoid DetachedInstanceError
        job = db.query(Job).filter_by(id=job.id).first()
        if job:
            job.status = "success"
            job.devices = ok
            job.finished_at = datetime.utcnow()
            job.log = "\n".join(log_lines)
            db.commit()
        
        audit_event(user=current_user.username, action="job_run_manual", target=f"job#{job.id}", result=f"success ({ok}/{len(device_list)} devices)")
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


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    j = db.get(Job, job_id)
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": j.id,
        "triggered_by": j.triggered_by,
        "status": j.status,
        "started_at": j.started_at.isoformat() if j.started_at else None,
        "finished_at": j.finished_at.isoformat() if j.finished_at else None,
        "devices_count": j.devices or 0,
        "log": j.log or ""
    }


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
    audit_event(user=current_user.username, action="job_cancel", target=f"job#{job_id}", result="success")
    return {"ok": True}
