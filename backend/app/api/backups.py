from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from ..database import SessionLocal
from ..models import Backup, Device
from pathlib import Path
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/backups", tags=["backups"])
def get_db(): 
    db = SessionLocal(); 
    try: yield db
    finally: db.close()

@router.get("")
def list_backups(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Backup).order_by(Backup.timestamp.desc()).all()
    out = []
    for b in rows:
        dev = db.get(Device, b.device_id)
        out.append({
            "id": b.id,
            "device_id": b.device_id,
            "device_name": dev.hostname if dev else str(b.device_id),
            "timestamp": b.timestamp,
            "size": b.size_bytes,
            "hash": b.hash,
            "status": b.status,
            "path": b.path,
        })
    return out

@router.get("/{backup_id}/download")
def download_backup(backup_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    b = db.get(Backup, backup_id)
    if not b or not Path(b.path).exists():
        raise HTTPException(404, "Not found")
    return FileResponse(b.path, filename=Path(b.path).name, media_type="text/plain")
