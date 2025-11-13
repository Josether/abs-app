from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from ..settings import settings
import pytz

scheduler = AsyncIOScheduler(timezone=pytz.timezone(settings.TIMEZONE))

def schedule_every_n_days(name: str, hour: int, minute: int, func, args=()):
    # contoh trigger: tiap hari (n-day logic bisa dimanage secara app-level)
    trig = CronTrigger(hour=hour, minute=minute)
    scheduler.add_job(func, trig, args=args, id=f"sch-{name}", replace_existing=True)

def start(): 
    if not scheduler.running: scheduler.start()
