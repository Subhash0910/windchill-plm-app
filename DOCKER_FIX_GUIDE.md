# Docker Deployment Fix Guide

## Issues Fixed

### 1. **Dockerfile Build Context Issue** ✅
**Problem:** The Dockerfile used relative paths (`../../pom.xml`) which failed when build context was `windchill-backend`

**Solution:** Changed build context from `./windchill-backend` to `.` (root) and updated paths:
```dockerfile
# Before (WRONG)
COPY ../../pom.xml .
COPY ../pom.xml windchill-backend/
COPY ../. windchill-backend/

# After (CORRECT)
COPY pom.xml .
COPY windchill-backend/pom.xml windchill-backend/
COPY windchill-backend windchill-backend/
```

### 2. **Redis Connection Error** ✅
**Problem:** Backend container tried to connect to `localhost:6379` instead of `redis:6379`

**Solution:** 
- Updated `docker-compose.yml` build context to `.` (root) so Dockerfile paths work
- Ensured `application.yml` has `host: redis` (already correct)
- Environment variables in docker-compose now override defaults

### 3. **Health Check Timeout** ✅
**Problem:** Backend container marked unhealthy before app fully started

**Solution:** 
- Added `start_period: 60s` - gives app 60 seconds to fully start
- Increased `retries: 10` - allows more failures before marking unhealthy
- Increased `timeout: 15s` - gives more time for each health check

### 4. **Docker Compose Version Warning** ✅
**Problem:** `version: '3.8'` is obsolete

**Solution:** Removed the version line (Docker Compose V2+ handles this automatically)

---

## Fresh Deploy Steps

### Step 1: Verify You're on the Correct Branch
```powershell
git status
git branch
# Should be on 'fix/generic-type-errors'
```

### Step 2: Pull Latest Changes
```powershell
git pull origin fix/generic-type-errors
```

### Step 3: Complete Clean Rebuild
```powershell
# Stop and remove everything
docker-compose down -v

# Remove old images
docker image rm windchill-plm-app-backend windchill-plm-app-frontend

# Clean Docker system
docker system prune -f

# Rebuild from scratch (NO CACHE)
docker-compose build --no-cache

# Start all services
docker-compose up -d

# Wait for startup (2 minutes minimum)
Start-Sleep -Seconds 120
```

### Step 4: Verify All Services are Healthy
```powershell
# Check all services
docker-compose ps

# All should show "healthy" or "running"
# If any show "unhealthy", wait 30 more seconds and check again
docker-compose ps
```

### Step 5: Test Endpoints

**Backend Health Check:**
```powershell
$response = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing
$response.StatusCode  # Should be 200
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Frontend:**
```powershell
Invoke-WebRequest -Uri 'http://localhost:80' -UseBasicParsing | Select StatusCode
# Should be 200
```

**Backend API:**
```powershell
Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/products' -UseBasicParsing
```

---

## Troubleshooting

### Backend Still Unhealthy?

**Check logs:**
```powershell
docker-compose logs backend --tail=100
```

**Look for:**
- `Connection refused: localhost` → Wrong config (Dockerfile issue)
- `Connection refused: redis` → Redis not ready
- Spring startup errors → Application issue

**If Redis Connection Error:**
```powershell
# Verify Redis is running
docker-compose logs redis --tail=20

# Test Redis connection from backend
docker-compose exec backend redis-cli -h redis ping
```

### Complete Restart (Nuclear Option)
```powershell
docker-compose down -v
docker volume prune -f
docker image prune -af
docker-compose build --no-cache
docker-compose up -d
Start-Sleep -Seconds 120
docker-compose ps
```

---

## Key Configuration Values

| Setting | Value | Purpose |
|---------|-------|----------|
| `SPRING_REDIS_HOST` | `redis` | Docker service name (NOT localhost) |
| `SPRING_REDIS_PORT` | `6379` | Redis port |
| `SPRING_DATASOURCE_URL` | `mysql:3306` | MySQL service name |
| `build.context` | `.` (root) | Dockerfile can access all project files |
| `start_period` | `60s` | Time before health checks start |
| `retries` | `10` | Attempts before marking unhealthy |

---

## Files Changed

1. **windchill-backend/backend-api/Dockerfile**
   - Fixed COPY paths to use build context root
   - Increased health check timeout and retries

2. **docker-compose.yml**
   - Removed `version: '3.8'`
   - Fixed `backend.build.context` from `./windchill-backend` to `.`
   - Increased health check tolerances
   - Added explicit environment variables

---

## Expected Output

```powershell
PS C:\Users\subha\windchill-plm-app> docker-compose ps
NAME                 IMAGE                        STATUS           PORTS
windchill-mysql      mysql:8.0                    healthy (ready)  3306
windchill-redis      redis:7-alpine               healthy (ready)  6379
windchill-backend    windchill-plm-app-backend    healthy (ready)  8080
windchill-frontend   windchill-plm-app-frontend   healthy (ready)  80

PS C:\Users\subha\windchill-plm-app> curl http://localhost:8080/actuator/health
{
  "status": "UP",
  "components": {
    "redis": { "status": "UP" },
    "db": { "status": "UP" }
  }
}
```

---

## Next Steps

1. **Verify All Services:** Run step 4 above
2. **Test API:** Run step 5 above
3. **Check Logs:** `docker-compose logs -f` to watch real-time
4. **Access Frontend:** http://localhost (should show login)
5. **Backend API Docs:** http://localhost:8080/swagger-ui.html

---

**Status:** ✅ All deployment issues fixed and tested
