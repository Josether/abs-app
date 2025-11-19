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
    # No example audit logs - start clean
    pass


@router.get("", response_model=list[AuditOut])
def list_audit(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    rows = db.query(Audit).order_by(Audit.timestamp.desc()).all()
    return [AuditOut(id=r.id, timestamp=r.timestamp, user=r.user, action=r.action, target=r.target, result=r.result) for r in rows]
