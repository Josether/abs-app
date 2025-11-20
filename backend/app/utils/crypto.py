from cryptography.fernet import Fernet
from .timeutil import tznow
import base64
import hashlib
from ..settings import settings

# Generate consistent key from SECRET_KEY
# Use SHA256 hash of SECRET_KEY to create 32-byte key, then base64 encode
def _get_key() -> bytes:
    # Fernet requires 32 url-safe base64-encoded bytes
    hash_digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(hash_digest)

f = Fernet(_get_key())

# TEMPORARY: Disable encryption for testing - will enable after all working
def enc(s: str) -> str: 
    return s  # No encryption - store plaintext for testing
    
def dec(s: str) -> str: 
    return s  # No decryption - return as-is
