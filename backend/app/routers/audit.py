from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Audit
from ..schemas import AuditOut
from ..security import require_admin

router = APIRouter(prefix="/audit-logs", tags=["audit"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_example_audit():
    db = SessionLocal()
    try:
        if not db.query(Audit).first():
            a1 = Audit(user="system", action="init", target="db", result="success")
            db.add(a1)
            db.commit()
    finally:
        db.close()


_ensure_example_audit()


@router.get("", response_model=list[AuditOut])
def list_audit(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    rows = db.query(Audit).order_by(Audit.timestamp.desc()).all()
    return [AuditOut(id=r.id, timestamp=r.timestamp, user=r.user, action=r.action, target=r.target, result=r.result) for r in rows]
