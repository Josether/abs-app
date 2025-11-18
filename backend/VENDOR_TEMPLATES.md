# Device Vendor Templates - Mayora Test Configuration

This document lists all supported network device vendors and their Netmiko device types configured for the Mayora testing phase.

## Supported Vendors

### Cisco Devices

| Vendor Name | Netmiko Device Type | Devices | Default Command |
|-------------|---------------------|---------|----------------|
| Cisco (IOS Router/Switch) | `cisco_ios` | Routers, Layer 2/3 Switches | `show running-config` |
| Cisco (ASA Firewall) | `cisco_asa` | ASA Firewalls | `show running-config` |
| Cisco (NXOS Data Center) | `cisco_nxos` | Nexus Switches | `show running-config` |
| Cisco (WLC Controller) | `cisco_wlc_ssh` | Wireless LAN Controllers | `show run-config commands` |

**Notes:**
- IOS devices support both SSH and Telnet
- ASA requires enable password for privileged mode
- NXOS uses different command syntax for some operations
- WLC uses different commands (`show run-config` instead of `show running-config`)

---

### Allied Telesis

| Vendor Name | Netmiko Device Type | Devices | Default Command |
|-------------|---------------------|---------|----------------|
| Allied Telesis (AWPlus) | `allied_telesis_awplus` | AWPlus Series Switches | `show running-config` |

**Notes:**
- AWPlus is the modern AlliedWare Plus OS
- Supports SSH (recommended) and Telnet

---

### Aruba (HPE)

| Vendor Name | Netmiko Device Type | Devices | Default Command |
|-------------|---------------------|---------|----------------|
| Aruba (AOS-CX Switch) | `aruba_aoscx` | CX Series Switches | `show running-config` |
| Aruba (AOS AP/Controller) | `aruba_os` | Access Points, Mobility Controllers | `show running-config` |

**Notes:**
- AOS-CX is the newer switch platform (modern CLI)
- AOS is for controllers and older switch platforms
- Both support SSH with API access

---

### MikroTik

| Vendor Name | Netmiko Device Type | Devices | Default Command |
|-------------|---------------------|---------|----------------|
| MikroTik (RouterOS) | `mikrotik_routeros` | Routers, RouterBOARDs | `/export` |
| MikroTik (SwitchOS) | `mikrotik_switchos` | SwOS Switches | `export` |

**Notes:**
- RouterOS is the full-featured OS for routers
- SwitchOS is lightweight OS for simple switches
- Default port 22 (SSH), some devices use port 8291 (API)
- Use `/export` command to get full configuration

---

### Huawei

| Vendor Name | Netmiko Device Type | Devices | Default Command |
|-------------|---------------------|---------|----------------|
| Huawei (Switch/AP) | `huawei` | Switches, Access Points | `display current-configuration` |
| Huawei (OLT) | `huawei_olt` | OLT Devices | `display current-configuration` |
| Huawei (SmartAX) | `huawei_smartax` | SmartAX Access Devices | `display current-configuration` |

**Notes:**
- Huawei uses `display` instead of `show` commands
- OLT devices may require different privilege levels
- SmartAX is for broadband access equipment
- VRP (Versatile Routing Platform) used across products

---

### Fortinet

| Vendor Name | Netmiko Device Type | Devices | Default Command |
|-------------|---------------------|---------|----------------|
| Fortinet (FortiGate) | `fortinet` | FortiGate Firewalls (FortiOS) | `show full-configuration` |

**Notes:**
- FortiOS is the operating system for FortiGate firewalls
- Supports SSH (recommended) and Telnet
- Use `show full-configuration` to get complete config
- May require admin privileges for full config access
- VDOMs (Virtual Domains) supported if configured

---

### Juniper

| Vendor Name | Netmiko Device Type | Devices | Default Command |
|-------------|---------------------|---------|----------------|
| Juniper (JunOS) | `juniper` | Routers, Switches, Firewalls | `show configuration` |

**Notes:**
- JunOS is used across Juniper's product line (MX, EX, SRX, QFX series)
- SSH strongly recommended (Netconf support available)
- Uses `show configuration` or `show configuration | display set`
- Configuration in hierarchical format
- Supports operational mode and configuration mode

---

### Other Supported Vendors (Legacy)

| Vendor Name | Netmiko Device Type | Notes |
|-------------|---------------------|-------|
| Juniper | `juniper` | JunOS devices |
| Fortinet | `fortinet` | FortiGate firewalls |

---

## Protocol Support

All vendors support both protocols where applicable:
- **SSH** (Recommended, port 22) - Secure, encrypted
- **Telnet** (port 23) - Unencrypted, legacy support

Netmiko automatically appends `_telnet` suffix to device type when Telnet protocol is selected.

---

## Connection Parameters

When adding a device, you need:

| Parameter | Description | Example |
|-----------|-------------|---------|
| Hostname | Device name/identifier | `mayora-core-sw01` |
| IP Address | Management IP | `192.168.1.1` |
| Vendor | Select from dropdown | `Cisco (IOS Router/Switch)` |
| Protocol | SSH or Telnet | `SSH` |
| Port | Connection port | `22` (SSH), `23` (Telnet) |
| Username | Login username | `admin` |
| Password | Login password | `password123` |
| Secret | Enable password (optional) | `enablepass` |
| Tags | Optional labels | `core, production` |

---

## Testing Checklist for Mayora

### Pre-Test Verification
- [ ] Backend server running (`uvicorn app.main:app --reload`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Network connectivity to devices (ping test)
- [ ] Credentials verified on each device
- [ ] Backup directory exists and writable

### Device Addition
- [ ] Add Cisco IOS switch
- [ ] Add Cisco ASA firewall (if applicable)
- [ ] Add Allied Telesis switch
- [ ] Add Aruba switch/controller
- [ ] Add MikroTik router
- [ ] Add Huawei devices
- [ ] Add Fortinet FortiGate
- [ ] Add Juniper device

### Connection Testing
- [ ] Test connection for each device (Test button)
- [ ] Verify `show version` command works
- [ ] Check for authentication errors
- [ ] Verify enable password (if required)

### Backup Execution
- [ ] Run manual backup for all devices
- [ ] Check job log for errors
- [ ] Verify backup files created in `./backups/`
- [ ] Confirm backup file contents
- [ ] Test backup download from UI

### Scheduled Backups
- [ ] Create schedule (e.g., daily at 02:00)
- [ ] Enable schedule
- [ ] Verify scheduler picks up the job
- [ ] Check retention policy

---

## Troubleshooting

### Connection Timeout
```
Error: Connection timeout
```
**Solution:** Check firewall rules, verify IP address, confirm device is reachable

### Authentication Failed
```
Error: Authentication failed
```
**Solution:** Verify username/password, check if account is locked, ensure correct privilege level

### Enable Password Required
```
Error: Failed to enter enable mode
```
**Solution:** Add enable password in the "Secret" field for Cisco devices

### Unknown Command
```
Error: Invalid command
```
**Solution:** Verify correct vendor type selected, some vendors use different command syntax

### SSH Key Issues
```
Error: Unable to verify host key
```
**Solution:** Netmiko auto-accepts keys, check SSH version compatibility

---

## Command Reference by Vendor

| Vendor | Show Version | Show Config | Save Config |
|--------|--------------|-------------|-------------|
| Cisco IOS | `show version` | `show running-config` | `write memory` |
| Cisco ASA | `show version` | `show running-config` | `write memory` |
| Cisco NXOS | `show version` | `show running-config` | `copy running-config startup-config` |
| Allied Telesis | `show version` | `show running-config` | `write` |
| Aruba AOS-CX | `show version` | `show running-config` | `write memory` |
| MikroTik | `/system resource print` | `/export` | N/A (auto-saves) |
| Huawei | `display version` | `display current-configuration` | `save` |
| Fortinet | `get system status` | `show full-configuration` | N/A (auto-saves) |
| Juniper | `show version` | `show configuration` | `commit` |

---

## Support & Documentation

- **Netmiko Documentation**: https://github.com/ktbyers/netmiko
- **Supported Device Types**: https://github.com/ktbyers/netmiko/blob/develop/PLATFORMS.md
- **Backend Code**: `backend/app/services/netmiko_worker.py`
- **Frontend Vendor List**: `frontend/src/views/devices.tsx`

---

*Last Updated: November 18, 2025*
*Prepared for: Mayora Testing Phase*
