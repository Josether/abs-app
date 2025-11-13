from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    DB_URL: str = "sqlite:///./abs.db"
    TIMEZONE: str = "Asia/Jakarta"
    BACKUP_DIR: str = "./backups"
    class Config: env_file = ".env"

settings = Settings()
