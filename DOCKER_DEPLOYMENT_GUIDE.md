# 🐳 Docker Deployment Guide - Windchill PLM App

## **COMPLETE DOCKER SETUP - COPY & PASTE COMMANDS**

---

## **📋 PREREQUISITES**

### 1. Install Docker Desktop

**Windows:**
```bash
# Download from: https://www.docker.com/products/docker-desktop/
# Install Docker Desktop for Windows
# Enable WSL2 backend (recommended)
```

**Verify Installation:**
```bash
docker --version
docker-compose --version
```

Expected output:
```
Docker version 24.0.x
Docker Compose version v2.x.x
```

---

## **🚀 QUICK START - 3 COMMANDS TO RUN EVERYTHING**

### Step 1: Clone and Navigate
```bash
cd C:\Users\YourName\windchill-plm-app
git checkout feature/ai-impact-engine
git pull origin feature/ai-impact-engine
```

### Step 2: Configure Environment
```bash
# Copy example environment file
copy .env.example .env

# Edit .env file (optional - works with defaults)
# Set your email credentials if you want email notifications
```

### Step 3: Start Everything with Docker Compose
```bash
# Build and start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build
```

**That's it!** 🎉

---

## **🌐 ACCESS YOUR APPLICATION**

Once containers are running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **API Docs:** http://localhost:8080/swagger-ui.html
- **Database:** localhost:5432

---

## **📝 DETAILED COMMANDS**

### Build Services
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Start Services
```bash
# Start in foreground (see logs)
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Start and rebuild if needed
docker-compose up --build

# Start specific service
docker-compose up backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs
```bash
# View all logs
docker-compose logs

# Follow logs (live tail)
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Follow specific service
docker-compose logs -f backend
```

### Check Status
```bash
# List running containers
docker-compose ps

# Check health status
docker-compose ps --format json | jq
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Execute Commands Inside Containers
```bash
# Open shell in backend container
docker-compose exec backend sh

# Open shell in database
docker-compose exec postgres psql -U windchill -d windchill_db

# Run Maven commands
docker-compose exec backend mvn clean install
```

---

## **⚙️ ENVIRONMENT CONFIGURATION**

### Edit `.env` File:

```bash
# Database
DB_PASSWORD=your-secure-password

# Email (Gmail Example)
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_ENABLED=true
EMAIL_FROM=noreply@windchill-plm.com

# Application
APP_BASE_URL=http://localhost:3000

# Security
JWT_SECRET=change-this-to-a-very-long-random-secret-key
```

### How to Get Gmail App Password:
1. Enable 2-Factor Authentication on Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Create new app password for "Mail"
4. Copy the 16-character password
5. Use it as `EMAIL_PASSWORD`

---

## **🗄️ DATABASE ACCESS**

### Connect to PostgreSQL:
```bash
# From host machine
psql -h localhost -p 5432 -U windchill -d windchill_db
# Password: windchill123 (or your DB_PASSWORD)

# From Docker container
docker-compose exec postgres psql -U windchill -d windchill_db
```

### Useful SQL Commands:
```sql
-- List all tables
\dt

-- Describe table
\d notifications
\d file_metadata

-- Query data
SELECT * FROM notifications LIMIT 10;
SELECT * FROM file_metadata LIMIT 10;

-- Check notification count
SELECT COUNT(*) FROM notifications;

-- Exit
\q
```

---

## **📊 MONITORING & HEALTH CHECKS**

### Check Service Health:
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Expected response:
# {"status":"UP"}
```

### Check Container Stats:
```bash
# Real-time resource usage
docker stats

# One-time stats
docker stats --no-stream
```

### View Container Logs:
```bash
# Last 100 lines
docker-compose logs --tail=100 backend

# Since specific time
docker-compose logs --since="2024-01-01T00:00:00" backend
```

---

## **🔧 DEVELOPMENT WORKFLOW**

### Make Code Changes:

1. **Edit Backend Code:**
```bash
# Edit files in windchill-backend/src/
# Rebuild backend
docker-compose up --build backend
```

2. **Edit Frontend Code:**
```bash
# Edit files in windchill-frontend/src/
# Rebuild frontend
docker-compose up --build frontend
```

### Hot Reload (Development Mode):

For faster development without Docker:

**Backend:**
```bash
cd windchill-backend
mvn spring-boot:run
```

**Frontend:**
```bash
cd windchill-frontend
npm start
```

---

## **🧹 CLEANUP COMMANDS**

### Remove Stopped Containers:
```bash
docker-compose down
```

### Remove Volumes (Delete Data):
```bash
# WARNING: This deletes all data!
docker-compose down -v
```

### Clean Docker System:
```bash
# Remove unused images
docker image prune

# Remove all unused data
docker system prune -a

# Free up space (removes everything not in use)
docker system prune -a --volumes
```

---

## **🐛 TROUBLESHOOTING**

### Problem: Containers won't start

**Solution:**
```bash
# Check logs
docker-compose logs

# Restart Docker Desktop
# Then try again
docker-compose up --build
```

### Problem: Port already in use

**Solution:**
```bash
# Find process using port
netstat -ano | findstr :8080
netstat -ano | findstr :3000

# Kill process (Windows PowerShell as Admin)
Stop-Process -Id <PID> -Force

# Or change port in docker-compose.yml
ports:
  - "8081:8080"  # Change 8080 to 8081
```

### Problem: Database connection failed

**Solution:**
```bash
# Wait for database to be ready (check logs)
docker-compose logs postgres

# Restart backend after postgres is healthy
docker-compose restart backend
```

### Problem: Out of disk space

**Solution:**
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

### Problem: Backend can't connect to database

**Solution:**
```bash
# Check if postgres is healthy
docker-compose ps

# Check network
docker network ls
docker network inspect windchill-plm-app_windchill-network

# Restart services
docker-compose restart postgres backend
```

### Problem: Frontend can't reach backend API

**Solution:**
```bash
# Check nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check if backend is running
curl http://localhost:8080/actuator/health

# Rebuild frontend
docker-compose up --build frontend
```

---

## **📦 VOLUMES & DATA PERSISTENCE**

### List Volumes:
```bash
docker volume ls
```

### Inspect Volume:
```bash
docker volume inspect windchill-plm-app_postgres_data
docker volume inspect windchill-plm-app_windchill_files
```

### Backup Database:
```bash
# Create backup
docker-compose exec postgres pg_dump -U windchill windchill_db > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U windchill -d windchill_db
```

### Backup File Uploads:
```bash
# Windows PowerShell
docker cp windchill-backend:/opt/windchill/files ./backup-files

# Restore
docker cp ./backup-files/. windchill-backend:/opt/windchill/files
```

---

## **🚀 PRODUCTION DEPLOYMENT**

### Build Production Images:
```bash
# Tag with version
docker-compose build
docker tag windchill-backend:latest windchill-backend:v1.0
docker tag windchill-frontend:latest windchill-frontend:v1.0
```

### Push to Registry (Docker Hub example):
```bash
# Login
docker login

# Tag
docker tag windchill-backend:latest yourusername/windchill-backend:v1.0
docker tag windchill-frontend:latest yourusername/windchill-frontend:v1.0

# Push
docker push yourusername/windchill-backend:v1.0
docker push yourusername/windchill-frontend:v1.0
```

### Production Environment Variables:
```bash
# Update .env for production
DB_PASSWORD=very-secure-production-password
JWT_SECRET=very-long-random-secret-at-least-32-characters
EMAIL_ENABLED=true
APP_BASE_URL=https://plm.yourcompany.com
```

---

## **📈 SCALING**

### Scale Backend Instances:
```bash
# Run 3 backend instances
docker-compose up --scale backend=3 -d
```

### Load Balancer:
Add nginx or HAProxy in front of multiple backend instances.

---

## **✅ HEALTH CHECK ENDPOINTS**

### Backend:
```bash
# Spring Boot Actuator
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/info
curl http://localhost:8080/actuator/metrics
```

### Frontend:
```bash
curl http://localhost:3000/
```

### Database:
```bash
docker-compose exec postgres pg_isready -U windchill
```

---

## **🎯 COMPLETE WORKFLOW EXAMPLE**

```bash
# 1. Start fresh
cd windchill-plm-app
git pull origin feature/ai-impact-engine

# 2. Configure
copy .env.example .env
# Edit .env with your settings

# 3. Build and start
docker-compose up --build -d

# 4. Check status
docker-compose ps
docker-compose logs -f

# 5. Access application
# Open browser: http://localhost:3000

# 6. View logs while developing
docker-compose logs -f backend

# 7. Make changes and rebuild
docker-compose up --build backend

# 8. Stop when done
docker-compose down
```

---

## **💡 TIPS & BEST PRACTICES**

1. **Always use `-d` for background mode in production**
2. **Check logs regularly:** `docker-compose logs -f`
3. **Backup database before major changes**
4. **Use `.env` file for secrets, never commit it**
5. **Monitor resource usage:** `docker stats`
6. **Clean up regularly:** `docker system prune`
7. **Use health checks in production**
8. **Keep images updated:** `docker-compose pull && docker-compose up -d`

---

## **🆘 GETTING HELP**

### Check Container Status:
```bash
docker-compose ps
```

### Debug Failed Container:
```bash
# View logs
docker-compose logs <service-name>

# Inspect container
docker inspect windchill-backend

# Execute commands inside
docker-compose exec backend sh
```

---

## **📞 SUPPORT**

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify `.env` configuration
3. Ensure ports are not in use
4. Check Docker Desktop is running
5. Try `docker-compose down && docker-compose up --build`

---

**Built with ❤️ by Subhash**
**Version: 2.0**
**Date: February 2026**
