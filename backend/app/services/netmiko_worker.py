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
    EXACT PATTERN from working script - use send_command_timing for enable!
    """
    import time
    import tempfile
    import os
    
    device_type = _device_type(vendor, protocol)
    
    # Create session log file
    session_log = os.path.join(tempfile.gettempdir(), f"netmiko_{host}.log")
    
    # Build device dict - EXACTLY like working script (simple, no secret in dict!)
    device = {
        "device_type": device_type,
        "host": host,
        "username": username,
        "password": password,
        "port": port,
        "session_log": session_log,  # Enable session logging
    }
    
    print(f"\n{'='*60}")
    print(f"NETMIKO CONNECTION (EXACT WORKING PATTERN):")
    print(f"  Device Type: {device_type}")
    print(f"  Host: {host}:{port}")
    print(f"  Username: {username}")
    print(f"{'='*60}\n")
    
    try:
        # Connect - EXACTLY like working script
        print(f"Mencoba terhubung ke {host}...")
        net_connect = ConnectHandler(**device)
        print("✓ Koneksi berhasil!")
        
        # Enable mode - EXACTLY like working script (use send_command_timing, NOT enable()!)
        if secret:
            print("Memasuki mode privileged...")
            net_connect.send_command_timing("enable")
            time.sleep(1)
            net_connect.send_command_timing(secret)
            time.sleep(1)
            print("✓ Berhasil masuk ke mode privileged.")
        
        # Fetch config - EXACTLY like working script
        print("Mengambil konfigurasi...")
        output = net_connect.send_command(cmd or "show running-config", read_timeout=60)
        print(f"✅ Backup konfigurasi berhasil ({len(output)} bytes)")
        
        # Disconnect
        net_connect.disconnect()
        print("✓ Koneksi ditutup.\n")
        
        # Clean up session log on success
        try:
            if os.path.exists(session_log):
                os.remove(session_log)
        except:
            pass
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback_str = traceback.format_exc()
        
        print(f"\n❌ NETMIKO ERROR:")
        print(f"   Error: {error_msg}")
        print(f"\nTraceback:")
        print(traceback_str)
        
        # Auto-print session log if error occurs
        try:
            if os.path.exists(session_log):
                with open(session_log, 'r', encoding='utf-8', errors='ignore') as f:
                    log_content = f.read()
                print(f"\n📋 NETMIKO SESSION LOG:")
                print(f"{'='*60}")
                print(log_content)
                print(f"{'='*60}\n")
                # Clean up log file
                os.remove(session_log)
        except Exception as log_err:
            print(f"Could not read session log: {log_err}")
        
        raise Exception(f"Connection failed: {host} | Error: {error_msg}")
    
    # Save to file
    content = output.encode()
    filehash = sha256(content).hexdigest()[:8]
    Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{host}_{filehash}.cfg"
    fullpath = Path(settings.BACKUP_DIR) / filename
    fullpath.write_bytes(content)
    
    return str(fullpath), content
