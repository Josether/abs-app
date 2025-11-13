from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from ..database import SessionLocal
from ..models import Backup
from pathlib import Path

router = APIRouter(prefix="/backups", tags=["backups"])
def get_db(): 
    db = SessionLocal(); 
    try: yield db
    finally: db.close()

@router.get("")
def list_backups(db: Session = Depends(get_db)):
    return [{"id": b.id, "device_id": b.device_id, "timestamp": b.timestamp, "size": b.size_bytes,
             "hash": b.hash, "status": "success"} for b in db.query(Backup).all()]

@router.get("/{backup_id}/download")
def download_backup(backup_id: int, db: Session = Depends(get_db)):
    b = db.get(Backup, backup_id)
    if not b or not Path(b.path).exists():
        raise HTTPException(404, "Not found")
    return FileResponse(b.path, filename=Path(b.path).name, media_type="text/plain")
