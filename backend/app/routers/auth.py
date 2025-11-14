from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from ..database import SessionLocal
from ..models import User
from ..security import verify_password, create_access_token, get_current_user
from ..settings import settings
from datetime import timedelta


class TokenRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", response_model=TokenResponse)
def login_for_access_token(payload: TokenRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username=payload.username).first()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        access_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token({"sub": user.username, "role": user.role}, expires_delta=access_expires)
        return TokenResponse(access_token=token, username=user.username, role=user.role)
    finally:
        db.close()


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role}
