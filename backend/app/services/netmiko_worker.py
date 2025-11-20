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
    
    # Allied Telesis
    "Allied Telesis (AWPlus)": "allied_telesis_awplus",
    
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
    MATCHES EXACT PATTERN FROM WORKING SCRIPT - secret MUST be in device dict!
    """
    device_type = _device_type(vendor, protocol)
    
    # Build device dict - CRITICAL: Include secret here, not passed to enable()
    device = {
        "device_type": device_type,
        "host": host, 
        "username": username, 
        "password": password,
        "secret": secret,  # ← CRITICAL: Must be here for enable() to work!
        "port": port,
    }
    
    print(f"\n{'='*60}")
    print(f"NETMIKO CONNECTION (FIXED):")
    print(f"  Device Type: {device_type}")
    print(f"  Host: {host}:{port}")
    print(f"  Username: {username}")
    print(f"  Password: {password}")
    print(f"  Secret: {secret}")
    print(f"{'='*60}\n")
    
    try:
        # Connect - same as working script: ConnectHandler(**device)
        net_connect = ConnectHandler(**device)
        print(f"Connected to {host}")
        
        # Enable - same as working script: net_connect.enable()
        # No parameter needed - Netmiko uses 'secret' from device dict
        net_connect.enable()
        print(f"Entered privileged mode on {host}")
        
        # Fetch config
        output = net_connect.send_command(cmd or "show running-config", read_timeout=60)
        print(f"Got {len(output)} bytes from {host}")
        
        # Disconnect
        net_connect.disconnect()
        
    except Exception as e:
        error_msg = str(e)
        print(f"\nNETMIKO ERROR: {error_msg}\n")
        raise Exception(f"Connection failed: {host} | Error: {error_msg}")
    
    # Save to file
    content = output.encode()
    filehash = sha256(content).hexdigest()[:8]
    Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{host}_{filehash}.cfg"
    fullpath = Path(settings.BACKUP_DIR) / filename
    fullpath.write_bytes(content)
    
    return str(fullpath), content
