from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Device
from ..schemas import DeviceIn, DeviceOut, TestResult
from ..utils.crypto import enc, dec
from ..services.netmiko_worker import fetch_running_config
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/devices", tags=["devices"])

def get_db(): 
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.post("", response_model=DeviceOut)
def create_device(payload: DeviceIn, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    dev = Device(
        hostname=payload.hostname, ip=payload.ip, vendor=payload.vendor,
        protocol=payload.protocol, port=payload.port,
        username_enc=enc(payload.username), password_enc=enc(payload.password),
        secret_enc=enc(payload.secret) if payload.secret else None, tags=payload.tags
    )
    db.add(dev); db.commit(); db.refresh(dev)
    return DeviceOut.model_validate(dev.__dict__)


@router.put("/{device_id}", response_model=DeviceOut)
def update_device(device_id: int, payload: DeviceIn, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    d = db.get(Device, device_id)
    if not d:
        raise HTTPException(404, "Not found")
    d.hostname = payload.hostname
    d.ip = payload.ip
    d.vendor = payload.vendor
    d.protocol = payload.protocol
    d.port = payload.port
    if payload.username:
        d.username_enc = enc(payload.username)
    if payload.password:
        d.password_enc = enc(payload.password)
    d.secret_enc = enc(payload.secret) if payload.secret else None
    d.tags = payload.tags
    db.commit(); db.refresh(d)
    return DeviceOut.model_validate(d.__dict__)


@router.delete("/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    d = db.get(Device, device_id)
    if not d:
        raise HTTPException(404, "Not found")
    db.delete(d); db.commit()
    return {"deleted": True}

@router.get("", response_model=list[DeviceOut])
def list_devices(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return [DeviceOut.model_validate(d.__dict__) for d in db.query(Device).all()]

@router.post("/{device_id}/test", response_model=TestResult)
def test_device(device_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    d = db.get(Device, device_id)
    if not d: raise HTTPException(404, "Not found")
    try:
        fetch_running_config(
            vendor=d.vendor, host=d.ip, username=dec(d.username_enc),
            password=dec(d.password_enc), secret=dec(d.secret_enc) if d.secret_enc else None,
            protocol=d.protocol, port=d.port, cmd="show version"
        )
        return TestResult(success=True, message="OK")
    except Exception as e:
        return TestResult(success=False, message=f"Failed: {e}")
