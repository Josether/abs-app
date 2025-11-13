from cryptography.fernet import Fernet
from .timeutil import tznow

# KUNCI: idealnya simpan di .env, generate sekali lalu tetap
_KEY = Fernet.generate_key()
f = Fernet(_KEY)

def enc(s: str) -> str: return f.encrypt(s.encode()).decode()
def dec(s: str) -> str: return f.decrypt(s.encode()).decode()
