from netmiko import ConnectHandler
from hashlib import sha256
from pathlib import Path
from ..settings import settings

# map vendor -> device_type netmiko (bisa kamu tambah)
VENDOR_MAP = {
    "Cisco": "cisco_ios",
    "Juniper": "juniper",
    "Mikrotik": "mikrotik_routeros",
    "Fortinet": "fortinet",
}

def _device_type(vendor: str, protocol: str) -> str:
    base = VENDOR_MAP.get(vendor, "cisco_ios")
    if protocol.lower() == "telnet":
        return base + "_telnet" if not base.endswith("_telnet") else base
    return base

def fetch_running_config(*, vendor: str, host: str, username: str, password: str, secret: str | None, protocol: str, port: int, cmd: str | None=None) -> tuple[str, bytes]:
    device = {
        "device_type": _device_type(vendor, protocol),
        "host": host, "username": username, "password": password, "port": port,
    }
    with ConnectHandler(**device) as conn:
        if secret: 
            try: conn.enable()
            except: pass
        output = conn.send_command(cmd or "show running-config", read_timeout=60)
    content = output.encode()
    filehash = sha256(content).hexdigest()[:8]
    # simpan file
    Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{host}_{filehash}.cfg"
    fullpath = Path(settings.BACKUP_DIR) / filename
    fullpath.write_bytes(content)
    return str(fullpath), content
