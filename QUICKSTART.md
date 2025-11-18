# Quick Start Guide - Deploy ke Ubuntu VM

Panduan singkat untuk deploy ABS ke VM Ubuntu 22.04 menggunakan Docker.

## 📋 Checklist Persiapan

- [ ] VM Ubuntu 22.04 sudah terinstall dan running
- [ ] Punya akses SSH ke VM
- [ ] VM bisa akses internet
- [ ] Minimal 2GB RAM, 2 CPU cores, 20GB disk

---

## 🚀 Langkah Deploy (Super Cepat)

### 1️⃣ Push ke GitHub (dari Windows)

```powershell
# Di Windows, dari folder abs-app
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2️⃣ Login ke VM Ubuntu

```bash
# SSH ke VM
ssh user@your-vm-ip

# Update system (optional tapi recommended)
sudo apt-get update && sudo apt-get upgrade -y
```

### 3️⃣ Clone & Deploy

```bash
# Clone repository
git clone https://github.com/Josether/abs-app.git
cd abs-app

# Jalankan deployment script
chmod +x deploy.sh
sudo ./deploy.sh
```

**Script akan otomatis:**
- ✅ Install Docker
- ✅ Install Docker Compose
- ✅ Build images
- ✅ Start semua services
- ✅ Setup networking

⏱️ **Waktu: ~5-10 menit** (tergantung kecepatan internet)

### 4️⃣ Test Akses

```bash
# Dari VM (local test)
curl http://localhost:85/api/health

# Dari browser (komputer lain di jaringan)
http://<vm-ip-address>:85
```

**Login:**
- Username: `admin`
- Password: `admin123`

---

## 🎯 Langkah Setelah Deploy

### 1. Ganti Password Default

1. Login sebagai admin
2. Ke menu **Users**
3. Klik **Reset Password** untuk user admin
4. Set password baru yang kuat

### 2. Update SECRET_KEY (Production Security)

```bash
# Generate random secret key
openssl rand -hex 32

# Edit .env file
nano backend/.env

# Update line:
SECRET_KEY=your-new-generated-key-here

# Restart backend
sudo docker compose restart backend
```

### 3. Test Koneksi ke Device

1. Ke menu **Devices**
2. Klik **Add Device**
3. Isi data device (IP, vendor, credentials)
4. Klik **Test** untuk test koneksi
5. Jika sukses, device siap untuk backup

### 4. Setup Scheduled Backup

1. Ke menu **Schedules**
2. Klik **Add Schedule**
3. Pilih device atau "All Devices"
4. Set waktu (misal: 02:00 setiap hari)
5. Enable schedule

---

## 📊 Monitoring

### Check Container Status

```bash
# Lihat status semua containers
sudo docker compose ps

# Lihat logs real-time
sudo docker compose logs -f

# Lihat logs backend saja
sudo docker compose logs -f backend

# Lihat logs frontend saja
sudo docker compose logs -f frontend
```

### Check Service Health

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
curl http://localhost:3000

# Check nginx
curl http://localhost
```

---

## 🔧 Management Commands

### Start/Stop Services

```bash
# Stop semua services
sudo docker compose down

# Start semua services
sudo docker compose up -d

# Restart semua services
sudo docker compose restart

# Restart backend saja
sudo docker compose restart backend
```

### View Logs

```bash
# Real-time logs (all)
sudo docker compose logs -f

# Last 100 lines
sudo docker compose logs --tail=100

# Only errors
sudo docker compose logs | grep ERROR
```

### Backup Database

```bash
# Backup database file
sudo cp backend/data/abs.db backup-$(date +%Y%m%d).db

# Backup semua config backups
sudo tar -czf backups-$(date +%Y%m%d).tar.gz backend/backups/
```

---

## ⚠️ Troubleshooting

### Services Tidak Start

```bash
# Check logs untuk error
sudo docker compose logs backend
sudo docker compose logs frontend

# Rebuild dan restart
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d
```

### Tidak Bisa Akses dari Network

```bash
# Check firewall
sudo ufw status

# Allow port 80
sudo ufw allow 80/tcp

# Check nginx
sudo docker compose logs nginx
```

### Database Error

```bash
# Check database file exists
ls -lh backend/data/abs.db

# Reset database (HATI-HATI: akan hapus semua data!)
sudo docker compose down
sudo rm backend/data/abs.db
sudo docker compose up -d
```

### Port Already in Use

```bash
# Check apa yang pakai port 80
sudo netstat -tulpn | grep :80

# Atau check port 8000, 3000
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# Stop service yang konflik, atau
# Ubah port di docker-compose.yml
```

---

## 🔄 Update Aplikasi

```bash
# Pull latest code
cd abs-app
git pull origin main

# Rebuild dan restart
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d
```

---

## 📝 Testing Checklist di Mayora

### Pre-Test
- [ ] Aplikasi accessible dari browser
- [ ] Login berhasil dengan admin account
- [ ] Semua menu bisa diakses
- [ ] Dashboard menampilkan data

### Device Testing
- [ ] Add Cisco device → Test connection → Success
- [ ] Add Allied Telesis device → Test connection → Success
- [ ] Add Aruba device → Test connection → Success
- [ ] Add MikroTik device → Test connection → Success
- [ ] Add Huawei device → Test connection → Success
- [ ] Add Fortinet device → Test connection → Success

### Backup Testing
- [ ] Run manual backup → Check job log → Success
- [ ] Verify backup files created di server
- [ ] Download backup dari UI → File OK
- [ ] Preview backup content → Config visible

### Schedule Testing
- [ ] Create daily schedule → Enable → Running
- [ ] Wait for scheduled time → Job executed
- [ ] Check job history → Success recorded

### Multi-User Testing
- [ ] Create viewer user → Login berhasil
- [ ] Viewer bisa lihat devices (read-only)
- [ ] Viewer tidak bisa edit/delete → Blocked ✓
- [ ] Admin bisa semua operasi → Full access ✓

### Audit Testing
- [ ] Check audit logs → All actions recorded
- [ ] Audit log shows user, action, timestamp
- [ ] Failed actions also logged

---

## 🎉 Success Criteria

Aplikasi dianggap berhasil deploy jika:

✅ Accessible dari browser (local & network)
✅ Login functionality working
✅ Dapat add device dan test connection
✅ Manual backup berhasil
✅ Backup files tersimpan
✅ Download backup berhasil
✅ Schedule dapat dibuat dan dijalankan
✅ Multi-user access control berfungsi
✅ Audit logging tercatat

---

## 📞 Quick Reference

### Important URLs
- **Web UI**: `http://<vm-ip>`
- **API Docs**: `http://<vm-ip>/api/docs`
- **Health Check**: `http://<vm-ip>/api/health`

### Default Credentials
- **Admin**: admin / admin123
- **Viewer**: viewer / viewer123

### Important Directories
- **Database**: `backend/data/abs.db`
- **Backups**: `backend/backups/`
- **Logs**: `docker compose logs -f`

### Docker Commands
```bash
sudo docker compose ps          # Status
sudo docker compose logs -f     # Logs
sudo docker compose restart     # Restart
sudo docker compose down        # Stop
sudo docker compose up -d       # Start
```

---

*Selamat testing di Mayora! 🚀*
