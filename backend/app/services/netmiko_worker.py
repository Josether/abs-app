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
    Connect to network device and fetch running configuration.
    TEMPORARY: Using telnetlib instead of Netmiko for debugging.
    """
    print(f"\n{'='*60}")
    print(f"TELNETLIB CONNECTION ATTEMPT:")
    print(f"  Host: {host}:{port}")
    print(f"  Username: {username}")
    print(f"  Password: {password}")
    print(f"  Secret: {secret}")
    print(f"{'='*60}\n")
    
    try:
        import telnetlib
        import time
        
        # Connect
        tn = telnetlib.Telnet(host, port, timeout=30)
        
        # Wait for login prompt and send username
        tn.read_until(b"login:", timeout=10)
        tn.write(username.encode('ascii') + b"\n")
        time.sleep(1)
        
        # Wait for password prompt and send password
        tn.read_until(b"Password:", timeout=10)
        tn.write(password.encode('ascii') + b"\n")
        time.sleep(2)
        
        # Enable mode if secret provided
        if secret:
            tn.write(b"enable\n")
            time.sleep(1)
            tn.read_until(b"Password:", timeout=5)
            tn.write(secret.encode('ascii') + b"\n")
            time.sleep(1)
        
        # Send command
        command = cmd or "show running-config"
        tn.write(command.encode('ascii') + b"\n")
        time.sleep(3)
        
        # Read output
        output = tn.read_very_eager().decode('ascii')
        
        # Close connection
        tn.write(b"exit\n")
        tn.close()
        
        print(f"SUCCESS! Got {len(output)} bytes of output\n")
        
    except Exception as e:
        error_msg = str(e)
        print(f"\nTELNETLIB ERROR: {error_msg}\n")
        raise Exception(f"Connection failed: {host} | Error: {error_msg}")
    
    # Save to file
    content = output.encode()
    filehash = sha256(content).hexdigest()[:8]
    Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{host}_{filehash}.cfg"
    fullpath = Path(settings.BACKUP_DIR) / filename
    fullpath.write_bytes(content)
    
    return str(fullpath), content
