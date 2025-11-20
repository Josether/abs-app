from netmiko import ConnectHandler
from hashlib import sha256
from pathlib import Path
from ..settings import settings

# map vendor -> device_type netmiko
# Format: "Vendor (Device Type)" -> "netmiko_device_type"
VENDOR_MAP = {
    # Cisco devices
    "Cisco (IOS Router/Switch)": "cisco_ios",
    "Cisco (ASA Firewall)": "cisco_asa",
    "Cisco (NXOS Data Center)": "cisco_nxos",
    "Cisco (WLC Controller)": "cisco_wlc_ssh",
    
    # Allied Telesis - CRITICAL: Use cisco_ios template (more compatible than allied_telesis_awplus)
    # Allied Telesis switches are Cisco-compatible and work better with cisco_ios driver
    "Allied Telesis (AWPlus)": "cisco_ios",
    
    # Aruba devices
    "Aruba (AOS-CX Switch)": "aruba_aoscx",
    "Aruba (AOS AP/Controller)": "aruba_os",
    
    # MikroTik devices
    "MikroTik (RouterOS)": "mikrotik_routeros",
    "MikroTik (SwitchOS)": "mikrotik_switchos",
    
    # Huawei devices
    "Huawei (Switch/AP)": "huawei",
    "Huawei (OLT)": "huawei_olt",
    "Huawei (SmartAX)": "huawei_smartax",
    
    # Fortinet devices
    "Fortinet (FortiGate)": "fortinet",
    
    # Juniper devices
    "Juniper (JunOS)": "juniper",
    
    # Legacy support (backward compatibility)
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
    """
    Connect to network device and fetch running configuration using Netmiko.
    SIMPLIFIED to match working script - NO extra parameters!
    """
    device_type = _device_type(vendor, protocol)
    
    # Build device dict - EXACTLY like working script (simple, no extras!)
    device = {
        "device_type": device_type,
        "host": host,
        "username": username,
        "password": password,
        "secret": secret,
        "port": port,
    }
    
    print(f"\n{'='*60}")
    print(f"NETMIKO CONNECTION (SIMPLIFIED):")
    print(f"  Device Type: {device_type}")
    print(f"  Host: {host}:{port}")
    print(f"  Username: {username}")
    print(f"  Secret: {secret}")
    print(f"{'='*60}\n")
    
    try:
        # Connect - EXACTLY like working script
        print(f"Mencoba terhubung ke {host}...")
        net_connect = ConnectHandler(**device)
        print("Koneksi berhasil!")
        
        # Enable - EXACTLY like working script
        net_connect.enable()
        print("Berhasil masuk ke mode privileged.")
        
        # Fetch config - EXACTLY like working script
        output = net_connect.send_command(cmd or "show running-config")
        print(f"✅ Backup konfigurasi berhasil ({len(output)} bytes)")
        
        # Disconnect
        net_connect.disconnect()
        print("Koneksi ditutup.")
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Terjadi kesalahan: {error_msg}")
        raise Exception(f"Connection failed: {host} | Error: {error_msg}")
    
    # Save to file
    content = output.encode()
    filehash = sha256(content).hexdigest()[:8]
    Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{host}_{filehash}.cfg"
    fullpath = Path(settings.BACKUP_DIR) / filename
    fullpath.write_bytes(content)
    
    return str(fullpath), content
