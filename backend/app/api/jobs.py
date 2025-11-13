from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Device, Job, Backup
from ..utils.crypto import dec
from ..services.netmiko_worker import fetch_running_config
from ..services.job_controller import submit
from hashlib import sha256
from pathlib import Path

router = APIRouter(prefix="/jobs", tags=["jobs"])
def get_db():
    db = SessionLocal(); 
    try: yield db
    finally: db.close()

@router.post("/run/manual")
async def run_manual(db: Session = Depends(get_db)):
    async def task():
        job = Job(triggered_by="manual", status="running"); db.add(job); db.commit(); db.refresh(job)
        devices = db.query(Device).all()
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
