from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from ..database import SessionLocal
from ..models import Backup, Device
from pathlib import Path
from ..security import get_current_user, require_admin
from ..services.audit_log import audit_event

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
    dev = db.get(Device, b.device_id)
    device_name = dev.hostname if dev else str(b.device_id)
    audit_event(user=current_user.username, action="backup_download", target=f"{device_name} ({b.timestamp.strftime('%Y-%m-%d %H:%M')})", result="success")
    return FileResponse(b.path, filename=Path(b.path).name, media_type="text/plain")

@router.delete("/{backup_id}")
def delete_backup(backup_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    b = db.get(Backup, backup_id)
    if not b:
        raise HTTPException(404, "Backup not found")
    
    dev = db.get(Device, b.device_id)
    device_name = dev.hostname if dev else str(b.device_id)
    
    # Delete file from filesystem
    try:
        file_path = Path(b.path)
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        audit_event(user=current_user.username, action="backup_delete", target=f"{device_name} ({b.timestamp.strftime('%Y-%m-%d %H:%M')})", result="failed")
        raise HTTPException(500, f"Failed to delete file: {str(e)}")
    
    # Delete from database
    db.delete(b)
    db.commit()
    
    audit_event(user=current_user.username, action="backup_delete", target=f"{device_name} ({b.timestamp.strftime('%Y-%m-%d %H:%M')})", result="success")
    return {"message": "Backup deleted successfully"}
