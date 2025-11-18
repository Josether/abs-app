# VM Deployment Steps - Ubuntu 22.04

Panduan lengkap deployment ABS (Automated Backup System) di VM Ubuntu 22.04 setelah `sudo su`.

---

## 📋 Prerequisites

- VM Ubuntu 22.04 LTS sudah running
- Akses root/sudo
- Internet connection
- IP VM: Contoh `10.2.8.85`

---

## 🚀 Step-by-Step Deployment

### **Step 1: Update System**
```bash
apt-get update && apt-get upgrade -y
```

### **Step 2: Install Prerequisites**
```bash
# Install git dan tools
apt-get install -y git curl wget ca-certificates gnupg lsb-release

# Verify git
git --version
```

### **Step 3: Clone Repository**
```bash
# Navigate to /opt directory
cd /opt

# Clone from GitHub
git clone https://github.com/Josether/abs-app.git

# Enter project directory
cd abs-app

# Verify files downloaded
ls -la
```

**Expected files:**
- docker-compose.yml
- deploy.sh
- nginx.conf
- backend/
- frontend/
- README.md, DEPLOYMENT.md, QUICKSTART.md

### **Step 4: Run Deployment Script**
```bash
# Give execute permission
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

**Script akan otomatis:**
1. ✅ Check & install Docker
2. ✅ Check & install Docker Compose  
3. ✅ Create necessary directories (backend/data, backend/backups)
4. ✅ Setup .env file from example
5. ✅ Build Docker images (~5-10 minutes first time)
6. ✅ Start all services (backend, frontend, nginx)

**Wait for completion message:**
```
========================================
  Deployment Complete!
========================================

Access the application:
  • Local:   http://localhost:85
  • Network: http://10.2.8.85:85

Default credentials:
  • Admin:  admin / admin123
  • Viewer: viewer / viewer123
```

### **Step 5: Verify Services Running**
```bash
# Check container status
docker compose ps
```

**Expected output:**
```
NAME           STATUS         PORTS
abs-backend    Up (healthy)   0.0.0.0:2003->8000/tcp
abs-frontend   Up (healthy)   0.0.0.0:2309->3000/tcp
abs-nginx      Up             0.0.0.0:85->80/tcp
```

All containers should show **"Up"** or **"Up (healthy)"**.

### **Step 6: Test Services**
```bash
# Test backend
curl http://localhost:2003/health
# Should return: {"status":"ok"}

# Test frontend
curl http://localhost:2309
# Should return HTML content

# Test nginx (main entry point)
curl http://localhost:85/api/health
# Should return: {"status":"ok"}
```

### **Step 7: Get VM IP Address**
```bash
# Get IP address
hostname -I
# Output: 10.2.8.85 (example)

# Or use ip command
ip addr show | grep "inet " | grep -v 127.0.0.1
```

Note the IP address for accessing from other computers.

### **Step 8: Configure Firewall**
```bash
# Install UFW firewall
apt-get install -y ufw

# Allow SSH (CRITICAL - don't skip!)
ufw allow 22/tcp

# Allow application port
ufw allow 85/tcp

# Allow backend and frontend (optional, if needed)
ufw allow 2003/tcp
ufw allow 2309/tcp

# Enable firewall
ufw enable

# Confirm when prompted: yes

# Check firewall status
ufw status
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
85/tcp                     ALLOW       Anywhere
```

### **Step 9: Test from Browser**

#### From VM (localhost):
```
http://localhost:85
```

#### From PC kantor atau komputer lain di jaringan:
```
http://10.2.8.85:85
```

**Login credentials:**
- Username: `admin`
- Password: `admin123`

You should see the ABS login page and dashboard after login.

---

## 🔒 Post-Deployment Security

### **1. Change Default Admin Password**
1. Login as `admin` / `admin123`
2. Go to **Users** menu
3. Click **Reset Password** for admin user
4. Enter new strong password
5. Logout and login with new password

### **2. Create Additional Admin (Recommended)**
1. Go to **Users** menu
2. Click **Add User**
3. Create new admin user with strong password
4. Logout and test new admin login
5. Delete or disable default `admin` user

### **3. Change Viewer Password**
1. Go to **Users** menu
2. Click **Reset Password** for viewer user
3. Set new password

### **4. Verify SECRET_KEY (Already Set)**
```bash
# Check SECRET_KEY
cat backend/.env | grep SECRET_KEY

# Should show:
# SECRET_KEY=2502011285-josephcristianlubis
```

This is already set, no action needed unless you want to change it.

---

## 📊 Container Management Commands

### Start/Stop Services
```bash
# Navigate to project directory
cd /opt/abs-app

# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
docker compose restart nginx
```

### View Logs
```bash
# View all logs (real-time)
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend

# View last 100 lines
docker compose logs --tail=100

# View logs with timestamps
docker compose logs -t

# Press Ctrl+C to exit log view
```

### Check Status & Health
```bash
# Check container status
docker compose ps

# Check resource usage
docker stats

# Check disk usage
df -h

# Check memory usage
free -h
```

---

## 🐛 Troubleshooting

### Problem: Containers won't start
```bash
# Check logs for errors
docker compose logs

# Stop and remove containers
docker compose down

# Rebuild images (clean build)
docker compose build --no-cache

# Start again
docker compose up -d

# Check status
docker compose ps
```

### Problem: Port already in use
```bash
# Check what's using the ports
netstat -tulpn | grep :85
netstat -tulpn | grep :2003
netstat -tulpn | grep :2309

# If something is using the port, stop it
systemctl stop <service-name>

# Or kill the process
kill <PID>
```

### Problem: Can't access from network
```bash
# Check firewall
ufw status

# Check if port is open
netstat -tulpn | grep :85

# Check if nginx is running
docker compose ps | grep nginx

# Test from VM first
curl http://localhost:85/api/health

# Check VM IP
hostname -I
```

### Problem: Docker not running
```bash
# Start Docker service
systemctl start docker

# Enable Docker on boot
systemctl enable docker

# Check Docker status
systemctl status docker

# Restart Docker
systemctl restart docker
```

### Problem: Container shows "unhealthy"
```bash
# Check specific container logs
docker compose logs backend

# Check health status
docker inspect abs-backend --format='{{.State.Health.Status}}'

# Restart unhealthy container
docker compose restart backend

# Wait 30-60 seconds and check again
docker compose ps
```

### Problem: Database error
```bash
# Check if database file exists
ls -lh /opt/abs-app/backend/data/abs.db

# Check directory permissions
ls -ld /opt/abs-app/backend/data

# Fix permissions if needed
chmod 755 /opt/abs-app/backend/data
chmod 644 /opt/abs-app/backend/data/abs.db

# Restart backend
docker compose restart backend
```

---

## 🔄 Updating the Application

### Pull Latest Updates from GitHub
```bash
# Navigate to project directory
cd /opt/abs-app

# Stop services
docker compose down

# Backup current data (optional but recommended)
cp -r backend/data backend/data.backup
cp -r backend/backups backend/backups.backup

# Pull latest code
git pull origin main

# Rebuild images
docker compose build --no-cache

# Start services
docker compose up -d

# Check status
docker compose ps

# Verify application works
curl http://localhost:85/api/health
```

---

## 💾 Backup & Restore

### Backup Database
```bash
# Create backup directory
mkdir -p /opt/backups

# Backup database
cp /opt/abs-app/backend/data/abs.db /opt/backups/abs-$(date +%Y%m%d-%H%M%S).db

# Backup configuration backups
tar -czf /opt/backups/backups-$(date +%Y%m%d-%H%M%S).tar.gz /opt/abs-app/backend/backups/

# List backups
ls -lh /opt/backups/
```

### Restore Database
```bash
# Stop services
cd /opt/abs-app
docker compose down

# Restore database
cp /opt/backups/abs-20250118-120000.db /opt/abs-app/backend/data/abs.db

# Start services
docker compose up -d
```

---

## 📈 Monitoring & Maintenance

### Daily Checks
```bash
# Check container status
docker compose ps

# Check disk space
df -h

# Check application accessibility
curl http://localhost:85/api/health

# Check logs for errors
docker compose logs --tail=50 | grep -i error
```

### Weekly Maintenance
```bash
# Review logs
docker compose logs --since 7d

# Backup database
cp /opt/abs-app/backend/data/abs.db /opt/backups/weekly-$(date +%Y%m%d).db

# Clean up old Docker images (optional)
docker system prune -a --volumes
```

### Check Application Health
```bash
# All services status
docker compose ps

# Resource usage
docker stats --no-stream

# Health endpoints
curl http://localhost:85/api/health
curl http://localhost:2003/health
curl http://localhost:2309

# Check database size
du -sh /opt/abs-app/backend/data/abs.db

# Check backup directory size
du -sh /opt/abs-app/backend/backups/
```

---

## 🌐 Access Information

### URLs
- **Main Application**: `http://10.2.8.85:85`
- **API Documentation**: `http://10.2.8.85:85/api/docs`
- **Health Check**: `http://10.2.8.85:85/api/health`
- **Backend Direct**: `http://10.2.8.85:2003`
- **Frontend Direct**: `http://10.2.8.85:2309`

### Default Credentials
- **Admin**: admin / admin123
- **Viewer**: viewer / viewer123

⚠️ **Change these passwords immediately after first login!**

### Important Directories
- **Project Root**: `/opt/abs-app`
- **Database**: `/opt/abs-app/backend/data/abs.db`
- **Backups**: `/opt/abs-app/backend/backups/`
- **Environment**: `/opt/abs-app/backend/.env`

---

## ✅ Success Checklist

After deployment, verify:
- [ ] `docker compose ps` shows 3 containers running
- [ ] All containers show "Up" or "Up (healthy)" status
- [ ] `curl http://localhost:85/api/health` returns `{"status":"ok"}`
- [ ] Can access `http://10.2.8.85:85` from browser
- [ ] Login page appears
- [ ] Can login with admin/admin123
- [ ] Dashboard loads successfully
- [ ] All menu items (Devices, Jobs, Schedules, etc.) accessible
- [ ] No error messages in `docker compose logs`
- [ ] Firewall allows port 85
- [ ] Changed default admin password

---

## 🎯 Next Steps After Deployment

1. **Security Setup**
   - Change admin password
   - Change viewer password
   - Create new admin user
   - Disable/delete default users

2. **Add Test Device**
   - Go to Devices menu
   - Add a test device
   - Test connection
   - Verify success

3. **Run Manual Backup**
   - Go to Jobs menu
   - Click "Run Manual Backup"
   - Check job log
   - Verify backup file created in `/opt/abs-app/backend/backups/`

4. **Setup Automated Schedule**
   - Go to Schedules menu
   - Create daily backup schedule
   - Set time (e.g., 02:00)
   - Enable schedule

5. **Test with Real Devices**
   - Add production devices
   - Test connections
   - Run backups
   - Verify configurations

---

## 📞 Quick Reference Commands

```bash
# Navigate to project
cd /opt/abs-app

# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f

# Check status
docker compose ps

# Test health
curl http://localhost:85/api/health

# Backup database
cp backend/data/abs.db /opt/backups/abs-$(date +%Y%m%d).db
```

---

## 🆘 Need Help?

If you encounter issues:
1. Check logs: `docker compose logs -f`
2. Check container status: `docker compose ps`
3. Check health: `curl http://localhost:85/api/health`
4. Review troubleshooting section above
5. Check firewall: `ufw status`
6. Verify Docker running: `systemctl status docker`

---

*Last Updated: November 18, 2025*
*For Ubuntu 22.04 LTS with Docker deployment*
*Project: ABS - Automated Backup System*
