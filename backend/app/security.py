from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from .settings import settings

# Use Argon2 as the primary hashing algorithm with pbkdf2_sha256 as fallback.
pwd_context = CryptContext(schemes=["argon2", "pbkdf2_sha256"], deprecated="auto")

# OAuth2 scheme for Bearer tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def hash_password(password: str) -> str:
	return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
	return pwd_context.verify(password, password_hash)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
	to_encode = data.copy()
	if expires_delta:
		expire = datetime.utcnow() + expires_delta
	else:
		expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
	to_encode.update({"exp": expire, "sub": data.get("sub")})
	encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
	return encoded_jwt


def decode_access_token(token: str) -> dict:
	try:
		payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
		return payload
	except jwt.ExpiredSignatureError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
	except jwt.PyJWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(token: str = Depends(oauth2_scheme), db: Optional[object] = None):
	from .database import SessionLocal
	from .models import User

	payload = decode_access_token(token)
	username = payload.get("sub")
	if username is None:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
	dbs = SessionLocal()
	try:
		user = dbs.query(User).filter_by(username=username).first()
		if not user:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
		return user
	finally:
		dbs.close()


def require_admin(current_user=Depends(get_current_user)):
	if current_user.role != "admin":
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
	return current_user

