#!/bin/bash

# ABS Deployment Script for Ubuntu 22.04
# This script automates the deployment of Automated Backup System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ABS - Automated Backup System${NC}"
echo -e "${BLUE}  Deployment Script for Ubuntu 22.04${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}This script needs sudo privileges for Docker installation.${NC}"
    echo -e "${YELLOW}Please run with: sudo ./deploy.sh${NC}\n"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check and install Docker
echo -e "${BLUE}[1/6] Checking Docker installation...${NC}"
if command_exists docker; then
    echo -e "${GREEN}✓ Docker is already installed${NC}"
    docker --version
else
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    
    # Update package index
    apt-get update
    
    # Install prerequisites
    apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    echo -e "${GREEN}✓ Docker installed successfully${NC}"
fi

# Step 2: Check Docker Compose
echo -e "\n${BLUE}[2/6] Checking Docker Compose...${NC}"
if docker compose version >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose is available${NC}"
    docker compose version
else
    echo -e "${RED}✗ Docker Compose not found${NC}"
    exit 1
fi

# Step 3: Create necessary directories
echo -e "\n${BLUE}[3/6] Creating directories...${NC}"
mkdir -p backend/backups
mkdir -p backend/data
chmod -R 755 backend/backups backend/data
echo -e "${GREEN}✓ Directories created${NC}"

# Step 4: Create .env file if not exists
echo -e "\n${BLUE}[4/6] Checking environment configuration...${NC}"
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}Creating .env file from example...${NC}"
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ .env file created${NC}"
        echo -e "${YELLOW}⚠ Please edit backend/.env and set your SECRET_KEY${NC}"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Step 5: Build and start containers
echo -e "\n${BLUE}[5/6] Building and starting Docker containers...${NC}"
echo -e "${YELLOW}This may take a few minutes on first run...${NC}\n"

docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# Wait for services to be healthy
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"
sleep 10

# Check container status
echo -e "\n${BLUE}[6/6] Checking container status...${NC}"
docker compose ps

# Get container health status
BACKEND_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' abs-backend 2>/dev/null || echo "unknown")
FRONTEND_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' abs-frontend 2>/dev/null || echo "unknown")

echo -e "\n${BLUE}Service Health Status:${NC}"
echo -e "Backend:  ${BACKEND_HEALTHY}"
echo -e "Frontend: ${FRONTEND_HEALTHY}"

# Final instructions
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "\n${BLUE}Access the application:${NC}"
echo -e "  • Local:   ${GREEN}http://localhost:85${NC}"
echo -e "  • Network: ${GREEN}http://${SERVER_IP}:85${NC}"
echo -e ""
echo -e "${BLUE}Default credentials:${NC}"
echo -e "  • Admin:  ${YELLOW}admin / admin123${NC}"
echo -e "  • Viewer: ${YELLOW}viewer / viewer123${NC}"
echo -e ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  • View logs:     ${YELLOW}docker compose logs -f${NC}"
echo -e "  • Stop services: ${YELLOW}docker compose down${NC}"
echo -e "  • Start services:${YELLOW}docker compose up -d${NC}"
echo -e "  • Restart:       ${YELLOW}docker compose restart${NC}"
echo -e ""
echo -e "${YELLOW}⚠ Important: Change default passwords after first login!${NC}"
echo -e "${YELLOW}⚠ Update SECRET_KEY in backend/.env for production!${NC}\n"
