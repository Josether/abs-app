from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import User
from ..schemas import UserCreate, UserOut, UserUpdate
from ..security import hash_password, get_current_user, require_admin
from ..models import Audit

from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_default_users():
    db = SessionLocal()
    try:
        if not db.query(User).first():
            admin = User(username="admin", password_hash=hash_password("admin123"), role="admin")
            viewer = User(username="viewer", password_hash=hash_password("viewer123"), role="viewer")
            db.add_all([admin, viewer])
            db.commit()
    finally:
        db.close()


_ensure_default_users()


@router.get("", response_model=list[UserOut])
def list_users(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [UserOut(id=u.id, username=u.username, role=u.role, created_at=u.created_at) for u in users]


@router.post("", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    if db.query(User).filter_by(username=payload.username).first():
        raise HTTPException(status_code=400, detail="username exists")
    ph = hash_password(payload.password)
    u = User(username=payload.username, password_hash=ph, role=payload.role)
    db.add(u)
    db.commit()
    db.refresh(u)
    # audit log
    a = Audit(user=current_user.username, action="create_user", target=u.username, result="success", timestamp=datetime.utcnow())
    db.add(a); db.commit()
    return UserOut(id=u.id, username=u.username, role=u.role, created_at=u.created_at)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="not found")
    if payload.role:
        # prevent demoting the last admin
        if u.role == 'admin' and payload.role != 'admin':
            admin_count = db.query(User).filter_by(role='admin').count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="cannot remove last admin")
        u.role = payload.role
    if payload.password:
        u.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(u)
    a = Audit(user=current_user.username, action="update_user", target=u.username, result="success", timestamp=datetime.utcnow())
    db.add(a); db.commit()
    return UserOut(id=u.id, username=u.username, role=u.role, created_at=u.created_at)
    return UserOut(id=u.id, username=u.username, role=u.role, created_at=u.created_at)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="not found")
    # prevent deleting the last admin
    if u.role == 'admin':
        admin_count = db.query(User).filter_by(role='admin').count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="cannot delete last admin")
    db.delete(u)
    db.commit()
    a = Audit(user=current_user.username, action="delete_user", target=u.username, result="success", timestamp=datetime.utcnow())
    db.add(a); db.commit()
    return {"deleted": True}
