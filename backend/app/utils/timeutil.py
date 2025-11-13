from datetime import datetime
import pytz
from ..settings import settings
def tz(): return pytz.timezone(settings.TIMEZONE)
def tznow(): return datetime.now(tz())
