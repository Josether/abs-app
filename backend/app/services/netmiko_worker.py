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


def _connect_telnet_manual(
    host: str,
    username: str,
    password: str,
    secret: str | None,
    port: int,
    session_log: str,
):
    """Telnet login manual, mirip telnetlib, tapi lewat Netmiko channel."""
    from netmiko import ConnectHandler

    device = {
        "device_type": "terminal_server",  # ⬅️ KUNCI: bukan cisco_ios_telnet
        "host": host,
        "username": "",
        "password": "",
        "port": port,
        "session_log": session_log,
        "fast_cli": False,
        "global_delay_factor": 2,
    }

    print(f"\n[Telnet] Opening terminal_server to {host}:{port} ...")
    conn = ConnectHandler(**device)

    # Kick login prompt
    conn.write_channel("\r\n")
    output = conn.read_until_pattern(
        pattern=r"(Username:|username:|User Name:|login:)", read_timeout=15
    )
    print(f"[Telnet] Login prompt detected")

    # Username
    conn.write_channel(username + "\r\n")
    output = conn.read_until_pattern(
        pattern=r"(Password:|password:)", read_timeout=15
    )
    print(f"[Telnet] Password prompt detected")

    # Password
    conn.write_channel(password + "\r\n")

    # Tunggu prompt device (>, #, dll)
    prompt = conn.find_prompt()
    print(f"[Telnet] Logged in, prompt: {prompt}")

    # Enable jika perlu
    if secret and prompt.strip().endswith(">"):
        print("[Telnet] Entering enable mode...")
        conn.write_channel("enable\r\n")
        output = conn.read_until_pattern(
            pattern=r"(Password:|password:)", read_timeout=15
        )
        conn.write_channel(secret + "\r\n")
        prompt = conn.find_prompt()
        print(f"[Telnet] Enabled, prompt: {prompt}")

    return conn


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

    try:
        proto = protocol.lower()

        if proto == "telnet":
            conn = _connect_telnet_manual(
                host=host,
                username=username,
                password=password,
                secret=secret,
                port=port,
                session_log=session_log,
            )
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
        if conn:
            try:
                conn.disconnect()
            except Exception:
                pass
            # hard-close telnet socket
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
