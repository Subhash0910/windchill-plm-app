# 📄 Windchill PLM - Quick Reference Card

## One-Minute Deployment

```powershell
# Copy and paste this entire block
cd C:\Users\subha\windchill-plm-app
docker-compose down -v
git pull origin fix/generic-type-errors
docker-compose build --no-cache backend
docker-compose up -d
Start-Sleep -Seconds 60
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing
```

---

## Service URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost | 80 |
| Backend API | http://localhost:8080 | 8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html | 8080 |
| Health Check | http://localhost:8080/actuator/health | 8080 |
| MySQL | localhost:3306 | 3306 |
| Redis | localhost:6379 | 6379 |

---

## Essential Commands

### View Status
```powershell
# All containers
docker-compose ps

# Backend only
docker-compose ps backend

# Real-time stats
docker stats windchill-backend windchill-mysql windchill-redis --no-stream
```

### View Logs
```powershell
# Real-time backend logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs backend --tail=100

# Last 50 lines with timestamps
docker-compose logs backend --tail=50 --timestamps

# Search for errors
docker-compose logs backend | Select-String -Pattern "error|ERROR|exception"
```

### Restart Services
```powershell
# Restart backend only
docker-compose restart backend

# Restart all services
docker-compose restart

# Stop only (keep data)
docker-compose stop

# Start only
docker-compose start

# Complete reset (removes everything)
docker-compose down -v
```

### Database Access
```powershell
# Connect to MySQL
mysql -h 127.0.0.1 -u windchill -p windchill123

# Or through Docker
docker exec -it windchill-mysql mysql -u windchill -pwindchill123

# List databases
mysql -h 127.0.0.1 -u windchill -pwindchill123 -e "SHOW DATABASES;"

# List tables
mysql -h 127.0.0.1 -u windchill -pwindchill123 windchill_db -e "SHOW TABLES;"
```

### Backend Operations
```powershell
# Enter container shell
docker exec -it windchill-backend bash

# View logs inside container
docker exec windchill-backend tail -f logs/windchill.log

# Check connectivity
docker exec windchill-backend bash -c "nc -zv mysql 3306"
docker exec windchill-backend bash -c "nc -zv redis 6379"
```

### Testing
```powershell
# Health check
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing

# Health details
$response = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3

# Swagger API docs
Invoke-WebRequest -Uri 'http://localhost:8080/v3/api-docs' -UseBasicParsing

# CORS test
$headers = @{'Origin' = 'http://localhost:3000'}
Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/health' -Headers $headers -UseBasicParsing
```

---

## Health Check Status

### ✅ Healthy
```
NAME              STATUS
windchill-mysql   Up (healthy)
windchill-redis   Up (healthy)
windchill-backend Up (health: healthy)
```

### ⚠️  Starting
```
windchill-backend Up (health: starting)  <- Wait 30+ more seconds
```

### ❌ Unhealthy
```
windchill-backend Unhealthy               <- Check logs, restart
windchill-backend exited with code 1      <- Rebuild needed
```

---

## Common Issues & Quick Fixes

### Issue: "Connection refused"
```powershell
# Solution 1: Wait for MySQL
docker-compose logs mysql | Select-String -Pattern "ready for connections"

# Solution 2: Check if port is in use
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue

# Solution 3: Full reset
docker-compose down -v
docker-compose up -d
```

### Issue: "Unknown database 'windchill_db'"
```powershell
# Check MySQL is initialized
docker-compose logs mysql --tail=20

# Verify credentials
docker exec windchill-mysql mysql -u root -ppassword -e "SHOW DATABASES;"

# Solution: Wait 30+ seconds and restart
Start-Sleep -Seconds 30
docker-compose restart backend
```

### Issue: "Health check failing"
```powershell
# Check current logs
docker-compose logs backend --tail=50

# Look for startup errors
docker-compose logs backend | Select-String -Pattern "Started"

# Solution: Increase start-period in docker-compose.yml to 90s
```

### Issue: "Cannot connect to Docker daemon"
```powershell
# Check if Docker is running
docker version

# Start Docker Desktop (if not running)
# OR check Docker service status on your system
```

### Issue: "Out of memory"
```powershell
# Check memory usage
docker stats --no-stream

# Solution: Increase JVM heap in docker-compose.yml
# JAVA_OPTS: "-Xmx1024m -Xms512m"

# Then rebuild:
docker-compose build --no-cache backend
docker-compose up -d
```

---

## Diagnostic Scripts

### Complete Health Check
```powershell
# Paste entire script
Write-Host "=== Docker Status ===" -ForegroundColor Cyan
docker-compose ps

Write-Host "`n=== Backend Health ===" -ForegroundColor Cyan
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing -ErrorAction SilentlyContinue | ForEach-Object { $_.Content }

Write-Host "`n=== Database Status ===" -ForegroundColor Cyan
docker exec windchill-mysql mysql -u windchill -pwindchill123 -e "SELECT COUNT(*) as tables FROM information_schema.TABLES WHERE TABLE_SCHEMA='windchill_db';" 2>/dev/null

Write-Host "`n=== Redis Status ===" -ForegroundColor Cyan
docker exec windchill-redis redis-cli ping 2>/dev/null

Write-Host "`n=== Memory Usage ===" -ForegroundColor Cyan
docker stats --no-stream
```

### Error Log Search
```powershell
Write-Host "Searching for errors in last 200 lines..." -ForegroundColor Yellow
docker-compose logs backend --tail=200 | Select-String -Pattern "error|ERROR|Exception|FATAL" -Context 2,2
```

---

## Configuration Quick Reference

### MySQL Credentials
```
Host: mysql (Docker) or 127.0.0.1 (local)
Port: 3306
Username: windchill
Password: windchill123
Database: windchill_db
```

### Redis Credentials
```
Host: redis (Docker) or 127.0.0.1 (local)
Port: 6379
No authentication (default)
```

### JVM Settings
```
Memory (Default):  -Xms256m -Xmx512m
Memory (Production): -Xms512m -Xmx1024m
GC: -XX:+UseG1GC -XX:MaxGCPauseMillis=200
```

### Database Connection Pool
```yaml
Max Connections: 20
Min Idle: 5
Connection Timeout: 20 seconds
Idle Timeout: 5 minutes
```

---

## Environment Variables

### Backend Environment
```yaml
SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/windchill_db?serverTimezone=UTC&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME: windchill
SPRING_DATASOURCE_PASSWORD: windchill123
SPRING_REDIS_HOST: redis
SPRING_REDIS_PORT: 6379
SPRING_JPA_HIBERNATE_DDL_AUTO: update
JAVA_OPTS: -Xmx512m -Xms256m -XX:+UseG1GC
```

### Frontend Environment
```yaml
VITE_API_BASE_URL: http://backend:8080/api/v1
```

---

## File Locations

### Project Root
```
C:\Users\subha\windchill-plm-app
```

### Configuration
```
windchill-backend/backend-api/src/main/resources/application.yml
```

### Docker Compose
```
C:\Users\subha\windchill-plm-app\docker-compose.yml
```

### Logs (Inside Container)
```
/app/logs/windchill.log
```

### Database (Volume)
```
Docker named volume: windchill-plm-app_mysql_data
```

---

## Git Operations

### Pull Latest
```powershell
cd C:\Users\subha\windchill-plm-app
git pull origin fix/generic-type-errors
```

### Check Branch
```powershell
git branch
# Should show:
# * fix/generic-type-errors
#   main
```

### View Recent Commits
```powershell
git log --oneline -10
```

### View Changes
```powershell
git diff main fix/generic-type-errors -- docker-compose.yml
```

---

## Performance Monitoring

### CPU & Memory
```powershell
# Continuous monitoring (Ctrl+C to stop)
docker stats windchill-backend windchill-mysql windchill-redis

# Snapshot
docker stats --no-stream
```

### Disk Usage
```powershell
# Docker volumes
docker volume ls

# Volume size
docker system df
```

### Container Logs Size
```powershell
# Check log size
docker inspect windchill-backend | Select-String -Pattern "LogPath"
```

---

## Documentation Files

For more detailed information, refer to:

1. **FIX_SUMMARY.md** - Complete fix overview and changes
2. **BACKEND_FIX_DEPLOYMENT.md** - Detailed deployment guide
3. **TESTING_VERIFICATION.md** - Testing and troubleshooting
4. **deploy-fixed.ps1** - Automated deployment script
5. **QUICK_REFERENCE.md** - This file

---

## Support Checklist

If experiencing issues:

- [ ] Read **FIX_SUMMARY.md** for overview
- [ ] Check **BACKEND_FIX_DEPLOYMENT.md** for root causes
- [ ] Follow **TESTING_VERIFICATION.md** troubleshooting
- [ ] Run diagnostic scripts above
- [ ] Check `docker-compose logs backend` for errors
- [ ] Verify services are healthy: `docker-compose ps`
- [ ] Test connectivity: Health check URLs above
- [ ] Rebuild if needed: `docker-compose build --no-cache backend`

---

## Emergency Commands

### Complete Reset (Use Only If Necessary)
```powershell
# CAREFUL: This removes ALL data
docker-compose down -v
docker system prune -f --volumes

# Then redeploy
git pull origin fix/generic-type-errors
docker-compose build --no-cache backend
docker-compose up -d
```

### Quick Restart
```powershell
# Fastest way to restart backend
docker-compose restart backend

# Wait for health check
Start-Sleep -Seconds 10
docker-compose ps backend
```

---

**Last Updated:** January 24, 2026  
**Branch:** fix/generic-type-errors  
**Status:** ✅ All Issues Fixed
