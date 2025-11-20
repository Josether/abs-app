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
    Using telnetlib (proven working) instead of Netmiko for Allied Telesis switches.
    """
    try:
        import telnetlib
        import time
        
        # Connect to device
        tn = telnetlib.Telnet(host, port, timeout=30)
        time.sleep(1)
        
        # Wait for login prompt and send username
        tn.read_until(b"login:", timeout=10)
        tn.write(username.encode('ascii') + b"\n")
        time.sleep(1)
        
        # Wait for password prompt and send password
        tn.read_until(b"Password:", timeout=10)
        tn.write(password.encode('ascii') + b"\n")
        time.sleep(2)
        
        # Enter enable mode if secret provided
        if secret:
            tn.write(b"enable\n")
            time.sleep(1)
            tn.read_until(b"Password:", timeout=10)
            tn.write(secret.encode('ascii') + b"\n")
            time.sleep(2)
        
        # Disable paging
        tn.write(b"terminal length 0\n")
        time.sleep(1)
        tn.read_very_eager()  # Clear buffer
        
        # Send command to get config
        command = cmd or "show running-config"
        tn.write(command.encode('ascii') + b"\n")
        time.sleep(5)  # Wait for command output
        
        # Read all output
        output = tn.read_very_eager().decode('ascii', errors='ignore')
        
        # Exit and close
        tn.write(b"exit\n")
        time.sleep(1)
        tn.close()
        
        # Clean up output - remove command echo and prompt
        lines = output.split('\n')
        # Remove first line (command echo) and filter out prompts
        config_lines = [line for line in lines[1:] if not line.endswith('#') and not line.endswith('>')]
        output = '\n'.join(config_lines)
        
        if len(output) < 50:
            raise Exception(f"Output too short ({len(output)} bytes) - may have failed to get config")
        
    except Exception as e:
        error_msg = str(e)
        raise Exception(f"Connection failed: {host} | Error: {error_msg}")
    
    # Save to file
    content = output.encode()
    filehash = sha256(content).hexdigest()[:8]
    Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{host}_{filehash}.cfg"
    fullpath = Path(settings.BACKUP_DIR) / filename
    fullpath.write_bytes(content)
    
    return str(fullpath), content
