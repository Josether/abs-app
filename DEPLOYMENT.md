# Deployment Guide - Ubuntu 22.04 LTS

Complete guide untuk deploy ABS (Automated Backup System) menggunakan Docker di Ubuntu 22.04.

## 📋 Prerequisites

- Ubuntu 22.04 LTS VM
- Minimal 2 CPU cores
- Minimal 2GB RAM
- Minimal 20GB disk space
- Akses sudo/root
- Internet connection untuk download Docker images

## 🚀 Quick Start (Automatic Deployment)

### 1. Clone Repository

```bash
# Clone dari GitHub
git clone https://github.com/Josether/abs-app.git
cd abs-app

# Atau jika sudah download, extract dan masuk ke folder
cd abs-app
```

### 2. Run Deployment Script

```bash
# Beri execute permission
chmod +x deploy.sh

# Run deployment script dengan sudo
sudo ./deploy.sh
```

Script akan otomatis:
- ✅ Install Docker & Docker Compose
- ✅ Create necessary directories
- ✅ Build Docker images
- ✅ Start all services
- ✅ Setup networking

### 3. Access Application

```bash
# Local access
http://localhost

# Network access (dari komputer lain)
http://<VM_IP_ADDRESS>
```

**Default credentials:**
- Admin: `admin` / `admin123`
- Viewer: `viewer` / `viewer123`

---

## 🛠️ Manual Deployment

Jika prefer deploy manual atau troubleshooting:

### Step 1: Install Docker

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker compose version
```

### Step 2: Clone & Configure

```bash
# Clone repository
git clone https://github.com/Josether/abs-app.git
cd abs-app

# Create necessary directories
mkdir -p backend/backups backend/data

# Create .env file
cp backend/.env.example backend/.env

# Edit .env file (optional, tapi recommended untuk production)
nano backend/.env
```

**Important settings in `.env`:**
```env
SECRET_KEY=2502011285-josephcristianlubis  # Change this for production!
DB_URL=sqlite:////app/data/abs.db
BACKUP_DIR=/app/backups
CORS_ORIGINS=["http://localhost:3000","http://localhost"]
```

### Step 3: Build & Start

```bash
# Build images
sudo docker compose build

# Start services
sudo docker compose up -d

# Check status
sudo docker compose ps

# View logs
sudo docker compose logs -f
```

---

## 📊 Docker Compose Services

### Services Overview:

| Service | Port | Description |
|---------|------|-------------|
| `backend` | 8000 | FastAPI backend API |
| `frontend` | 3000 | Next.js frontend UI |
| `nginx` | 80 | Reverse proxy & load balancer |

### Architecture:

```
Internet/LAN
    ↓
[nginx:80] ← Reverse Proxy
    ↓
    ├─→ [frontend:3000] ← Next.js UI
    └─→ [backend:8000]  ← FastAPI API
            ↓
        [SQLite DB] ← Database
            ↓
        [backups/]  ← Backup files
```

---

## 🔧 Docker Commands Reference

### Container Management

```bash
# Start all services
sudo docker compose up -d

# Stop all services
sudo docker compose down

# Restart all services
sudo docker compose restart

# Restart specific service
sudo docker compose restart backend
sudo docker compose restart frontend

# View status
sudo docker compose ps

# View logs (all services)
sudo docker compose logs -f

# View logs (specific service)
sudo docker compose logs -f backend
sudo docker compose logs -f frontend
```

### Maintenance

```bash
# Rebuild after code changes
sudo docker compose build --no-cache
sudo docker compose up -d

# Remove all containers and volumes (CAREFUL!)
sudo docker compose down -v

# Access backend container shell
sudo docker exec -it abs-backend bash

# Access frontend container shell
sudo docker exec -it abs-frontend sh

# Check resource usage
sudo docker stats
```

### Backup & Restore

```bash
# Backup database
sudo cp backend/data/abs.db backend/data/abs.db.backup

# Backup configuration backups
sudo tar -czf backups-$(date +%Y%m%d).tar.gz backend/backups/

# Restore database
sudo cp backend/data/abs.db.backup backend/data/abs.db
sudo docker compose restart backend
```

---

## 🔒 Security Recommendations

### 1. Change Default Credentials

```bash
# Login as admin
# Go to Users page
# Change admin password
# Create new admin user
# Delete or disable default admin
```

### 2. Update SECRET_KEY

```bash
# Generate new secret key
openssl rand -hex 32

# Update in backend/.env
nano backend/.env
# Set: SECRET_KEY=your-new-generated-key

# Restart backend
sudo docker compose restart backend
```

### 3. Firewall Configuration

```bash
# Install UFW (if not installed)
sudo apt-get install ufw

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (if using SSL)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 4. Setup HTTPS with Let's Encrypt (Optional)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (replace your-domain.com)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is setup automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 📈 Monitoring & Logs

### View Real-time Logs

```bash
# All services
sudo docker compose logs -f

# Only errors
sudo docker compose logs -f | grep ERROR

# Last 100 lines
sudo docker compose logs --tail=100

# Specific service
sudo docker compose logs -f backend
```

### Check Service Health

```bash
# Check if services are healthy
sudo docker inspect abs-backend --format='{{.State.Health.Status}}'
sudo docker inspect abs-frontend --format='{{.State.Health.Status}}'

# Manual health check
curl http://localhost:8000/health
curl http://localhost:3000
```

### Resource Usage

```bash
# Check container resource usage
sudo docker stats

# Check disk usage
sudo docker system df

# Clean up unused images/containers
sudo docker system prune -a
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
sudo docker compose logs backend
sudo docker compose logs frontend

# Check port conflicts
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :80

# Rebuild and restart
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d
```

### Database Issues

```bash
# Reset database (CAREFUL - deletes all data!)
sudo docker compose down
sudo rm backend/data/abs.db
sudo docker compose up -d

# Check database file
sudo ls -lh backend/data/abs.db
```

### Network Issues

```bash
# Check if containers can communicate
sudo docker exec abs-backend ping frontend
sudo docker exec abs-frontend ping backend

# Check Docker networks
sudo docker network ls
sudo docker network inspect abs-app_abs-network
```

### Permission Issues

```bash
# Fix directory permissions
sudo chown -R 1000:1000 backend/backups backend/data
sudo chmod -R 755 backend/backups backend/data
```

---

## 🔄 Updating the Application

### Update from GitHub

```bash
# Pull latest changes
cd abs-app
git pull origin main

# Rebuild and restart
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d
```

### Manual Update

```bash
# Backup current version
sudo cp -r abs-app abs-app.backup

# Download new version
# Extract and replace files

# Rebuild
cd abs-app
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check application is accessible
- Monitor disk space

**Weekly:**
- Review logs for errors
- Check backup files are being created
- Verify scheduled backups running

**Monthly:**
- Update Docker images: `sudo docker compose pull`
- Backup database: `sudo cp backend/data/abs.db /backup/location/`
- Clean old backups if needed

### Performance Tuning

```bash
# Increase container resources (in docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## 📝 Notes

- Default SQLite database is stored in `backend/data/abs.db`
- Backup files are stored in `backend/backups/`
- For production, consider using PostgreSQL instead of SQLite
- Regular backups of database and configurations recommended
- Monitor disk space, backup files can grow large

---

*Last Updated: November 18, 2025*
*For Ubuntu 22.04 LTS (Jammy Jellyfish)*
