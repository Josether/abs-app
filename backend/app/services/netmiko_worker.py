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
    Connect ke perangkat jaringan dan ambil running config pakai Netmiko.
    Dibikin PERSIS SAMA dengan backup_switch_config.py yang sudah terbukti jalan.
    """
    import tempfile
    import os
    import traceback

    device_type = _device_type(vendor, protocol)

    # Session log untuk debug kalau gagal
    session_log = os.path.join(tempfile.gettempdir(), f"netmiko_{host}.log")

    # PERSIS SAMA dengan script lama: include secret dan pakai enable()
    device = {
        "device_type": device_type,
        "host": host,
        "username": username,
        "password": password,
        "secret": secret,          # ⬅️ CRITICAL: Must include like working script!
        "port": port,
        "session_log": session_log,
        "fast_cli": False,         # Telnet lebih stabil dengan fast_cli=False
    }

    print(f"\n{'='*60}")
    print("NETMIKO CONNECTION (MIRROR LEGACY SCRIPT):")
    print(f"  Device Type : {device_type}")
    print(f"  Host        : {host}:{port}")
    print(f"  Username    : {username}")
    print(f"  Secret      : {'***' if secret else 'None'}")
    print(f"{'='*60}\n")

    try:
        print(f"Mencoba terhubung ke {host}...")
        net_connect = ConnectHandler(**device)
        print("✓ Koneksi berhasil!")

        # Enable PERSIS seperti script lama - JANGAN pakai send_command_timing!
        if secret:
            print("Memasuki mode privileged (enable)...")
            net_connect.enable()
            print("✓ Berhasil masuk ke mode privileged.")

        print("Mengambil konfigurasi...")
        output = net_connect.send_command(cmd or "show running-config", read_timeout=60)
        print(f"✅ Backup konfigurasi berhasil ({len(output)} bytes)")

        # CRITICAL: Proper cleanup untuk Allied Telesis
        print("Menutup koneksi dengan proper...")
        try:
            # Send exit command explicitly before disconnect
            net_connect.send_command_timing("exit")
        except:
            pass
        
        try:
            net_connect.disconnect()
        except:
            pass
        
        print("✓ Koneksi ditutup.\n")

        # Hapus session log kalau sukses
        try:
            if os.path.exists(session_log):
                os.remove(session_log)
        except Exception:
            pass

    except Exception as e:
        error_msg = str(e)
        traceback_str = traceback.format_exc()

        print("\n❌ NETMIKO ERROR:")
        print(f"   Error: {error_msg}")
        print("\nTraceback:")
        print(traceback_str)

        # CRITICAL: Force cleanup connection on error
        try:
            if 'net_connect' in locals():
                print("⚠️  Force closing connection after error...")
                net_connect.send_command_timing("exit")
                net_connect.disconnect()
        except:
            pass

        # Otomatis print session log kalau ada - INI KUNCI untuk debug!
        try:
            if os.path.exists(session_log):
                with open(session_log, "r", encoding="utf-8", errors="ignore") as f:
                    log_content = f.read()
                print("\n📋 NETMIKO SESSION LOG (RAW TELNET DIALOG):")
                print("=" * 60)
                print(log_content)
                print("=" * 60)
                print("\n⚠️  Analisa log di atas untuk lihat prompt/banner yang muncul!")
                os.remove(session_log)
        except Exception as log_err:
            print(f"Tidak bisa baca session log: {log_err}")

        # Lempar error ke caller
        raise Exception(f"Connection failed: {host} | Error: {error_msg}")
    
    # Save to file
    content = output.encode()
    filehash = sha256(content).hexdigest()[:8]
    Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{host}_{filehash}.cfg"
    fullpath = Path(settings.BACKUP_DIR) / filename
    fullpath.write_bytes(content)
    
    return str(fullpath), content
