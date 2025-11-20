from netmiko import ConnectHandler
from hashlib import sha256
from pathlib import Path
from ..settings import settings

# device_type hanya untuk SSH
VENDOR_MAP = {
    "Cisco (IOS Router/Switch)": "cisco_ios",
    "Cisco (ASA Firewall)": "cisco_asa",
    "Cisco (NXOS Data Center)": "cisco_nxos",
    "Cisco (WLC Controller)": "cisco_wlc_ssh",
    "Allied Telesis (AWPlus)": "cisco_ios",
    "Aruba (AOS-CX Switch)": "aruba_aoscx",
    "Aruba (AOS AP/Controller)": "aruba_os",
    "MikroTik (RouterOS)": "mikrotik_routeros",
    "MikroTik (SwitchOS)": "mikrotik_switchos",
    "Huawei (Switch/AP)": "huawei",
    "Huawei (OLT)": "huawei_olt",
    "Huawei (SmartAX)": "huawei_smartax",
    "Fortinet (FortiGate)": "fortinet",
    "Juniper (JunOS)": "juniper",
    # legacy
    "Cisco": "cisco_ios",
    "Juniper": "juniper",
    "Mikrotik": "mikrotik_routeros",
    "Fortinet": "fortinet",
}

def _device_type_ssh(vendor: str) -> str:
    return VENDOR_MAP.get(vendor, "cisco_ios")


def _read_all(tn, timeout=3):
    """Read until connection is idle for 'timeout' seconds. Handles large configs."""
    import time
    buf = b""
    last = time.time()

    while time.time() - last < timeout:
        data = tn.read_very_eager()
        if data:
            buf += data
            last = time.time()
        time.sleep(0.2)

    return buf


def _connect_telnet_manual(
    host: str,
    username: str,
    password: str,
    secret: str | None,
    port: int,
    session_log: str,
):
    """Telnet login manual using raw telnetlib - PROVEN WORKING!"""
    import telnetlib
    import time
    
    print(f"\n[Telnet] Opening connection to {host}:{port} ...")
    
    # Use telnetlib directly - this WORKS!
    tn = telnetlib.Telnet(host, port, timeout=30)
    time.sleep(1)
    
    # FLEXIBLE login prompt detection (Username, login, User Name, etc)
    print(f"[Telnet] Waiting for login prompt...")
    index, match, text = tn.expect([
        b"Username:", b"username:", b"User Name:", b"User:", 
        b"Login:", b"login:", b"USER:"
    ], timeout=15)
    
    # Send username
    tn.write(username.encode('ascii') + b"\n")
    time.sleep(1)
    print(f"[Telnet] Sent username")
    
    # Wait for password prompt (flexible detection)
    tn.expect([b"Password:", b"password:", b"PASS:"], timeout=15)
    tn.write(password.encode('ascii') + b"\n")
    time.sleep(2)
    print(f"[Telnet] Sent password")
    
    # Enter enable mode if secret provided
    if secret:
        tn.write(b"enable\n")
        time.sleep(1)
        tn.expect([b"Password:", b"password:"], timeout=15)
        tn.write(secret.encode('ascii') + b"\n")
        time.sleep(2)
        print(f"[Telnet] Entered enable mode")
    
    # Disable paging (try multiple times for reliability)
    tn.write(b"terminal length 0\n")
    time.sleep(1)
    tn.read_very_eager()  # Clear buffer
    
    # Double-send for stubborn devices
    tn.write(b"terminal length 0\n")
    time.sleep(0.5)
    tn.read_very_eager()
    
    print(f"[Telnet] Disabled paging")
    
    return tn


def _connect_ssh_normal(
    vendor: str,
    host: str,
    username: str,
    password: str,
    secret: str | None,
    port: int,
    session_log: str,
):
    """SSH biasa pakai mapping vendor."""
    device_type = _device_type_ssh(vendor)
    device = {
        "device_type": device_type,
        "host": host,
        "username": username,
        "password": password,
        "secret": secret,
        "port": port,
        "session_log": session_log,
        "fast_cli": False,
    }

    print(f"\n[SSH] Connecting to {host}:{port} (type={device_type}) ...")
    conn = ConnectHandler(**device)

    if secret:
        print("[SSH] Entering enable mode...")
        conn.enable()

    return conn


def fetch_running_config(
    *,
    vendor: str,
    host: str,
    username: str,
    password: str,
    secret: str | None,
    protocol: str,
    port: int,
    cmd: str | None = None,
) -> tuple[str, bytes]:
    """
    - Kalau protocol = 'Telnet'  -> pakai terminal_server + login manual
    - Kalau protocol = 'SSH'     -> pakai Netmiko normal (device_type dari vendor)
    """
    import tempfile
    import os
    import traceback

    session_log = os.path.join(tempfile.gettempdir(), f"netmiko_{host}.log")

    print(f"\n{'='*60}")
    print("FETCH RUNNING CONFIG")
    print(f"  Host     : {host}")
    print(f"  Vendor   : {vendor}")
    print(f"  Protocol : {protocol}")
    print(f"  Username : {username}")
    print(f"  Secret   : {'***' if secret else 'None'}")
    print(f"{'='*60}\n")

    conn = None
    output = ""
    tn = None  # For telnetlib connection

    try:
        # SAFE protocol detection (strip whitespace)
        proto = (protocol or "").strip().lower()

        if proto == "telnet":
            tn = _connect_telnet_manual(
                host=host,
                username=username,
                password=password,
                secret=secret,
                port=port,
                session_log=session_log,
            )
            
            # Send command to get config using telnetlib
            print("Mengambil konfigurasi...")
            command = cmd or "show running-config"
            tn.write(command.encode('ascii') + b"\n")
            import time
            time.sleep(2)  # Initial wait
            
            # Read ALL output using robust method (handles large configs)
            raw_output = _read_all(tn, timeout=3)
            
            # Handle --More-- prompts if paging not fully disabled
            while b"--More--" in raw_output or b"-- More --" in raw_output:
                print("[Telnet] Detected --More--, sending space...")
                tn.write(b" ")
                time.sleep(1)
                additional = _read_all(tn, timeout=2)
                raw_output += additional
                if not additional:
                    break
            
            # Decode output
            output = raw_output.decode('ascii', errors='ignore')
            
            # Clean up output - remove command echo by splitting on command
            if command in output:
                output = output.split(command, 1)[-1]
            
            # Remove trailing prompt/garbage
            output = output.strip()
            
            # Remove lines that are just prompts (but keep config lines with #)
            lines = output.split('\n')
            cleaned = []
            for line in lines:
                stripped = line.strip()
                # Skip empty lines and pure prompt lines
                if not stripped or (stripped.endswith('#') and len(stripped) < 20) or (stripped.endswith('>') and len(stripped) < 20):
                    continue
                cleaned.append(line)
            output = '\n'.join(cleaned)
            
            print(f"✅ Backup konfigurasi berhasil ({len(output)} bytes)")
            
        else:
            conn = _connect_ssh_normal(
                vendor=vendor,
                host=host,
                username=username,
                password=password,
                secret=secret,
                port=port,
                session_log=session_log,
            )
            
            print("Mengambil konfigurasi...")
            output = conn.send_command(cmd or "show running-config", read_timeout=60)
            print(f"✅ Backup konfigurasi berhasil ({len(output)} bytes)")

    except Exception as e:
        error_msg = str(e)
        traceback_str = traceback.format_exc()

        print("\n❌ NETMIKO ERROR:")
        print(f"   Error: {error_msg}")
        print("\nTraceback:")
        print(traceback_str)

        try:
            if os.path.exists(session_log):
                with open(session_log, "r", encoding="utf-8", errors="ignore") as f:
                    log_content = f.read()
                print("\n📋 NETMIKO SESSION LOG:")
                print("=" * 60)
                print(log_content)
                print("=" * 60)
        except Exception as log_err:
            print(f"Tidak bisa baca session log: {log_err}")

        raise Exception(f"Connection failed: {host} | Error: {error_msg}")

    finally:
        # Cleanup connections
        if tn:
            try:
                tn.write(b"exit\n")
                import time
                time.sleep(1)
                tn.close()
            except Exception:
                pass
        
        if conn:
            try:
                conn.disconnect()
            except Exception:
                pass
            # hard-close socket
            try:
                if hasattr(conn, "remote_conn"):
                    conn.remote_conn.close()
            except Exception:
                pass

        try:
            if os.path.exists(session_log):
                os.remove(session_log)
        except Exception:
            pass

    # Simpan ke file
    content = output.encode()
    filehash = sha256(content).hexdigest()[:8]
    Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{host}_{filehash}.cfg"
    fullpath = Path(settings.BACKUP_DIR) / filename
    fullpath.write_bytes(content)

    return str(fullpath), content
