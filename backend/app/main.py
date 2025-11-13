from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import settings
from .database import Base, engine
from .api import auth, devices, jobs, backups  # + users, schedules, audit (nanti)
from .services import scheduler

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ABS Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.get("/health")
def health(): return {"status":"ok"}

app.include_router(devices.router)
app.include_router(jobs.router)
app.include_router(backups.router)

@app.on_event("startup")
async def on_startup():
    scheduler.start()
