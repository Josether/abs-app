from pydantic import BaseModel

class DeviceIn(BaseModel):
    hostname: str; ip: str; vendor: str
    protocol: str = "SSH"; port: int = 22
    username: str; password: str; secret: str | None = None
    tags: str | None = None

class DeviceOut(BaseModel):
    id: int; hostname: str; ip: str; vendor: str
    protocol: str; port: int; tags: str | None = None

class TestResult(BaseModel):
    success: bool; message: str
