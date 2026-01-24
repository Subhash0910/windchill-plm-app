# Windchill PLM - Backend Deployment Fix Guide

## Problem Summary

The backend container was failing to start with connection errors due to:
1. **Incorrect MySQL hostname** in datasource configuration
2. **DDL auto set to 'validate'** instead of 'update' (database tables not created)
3. **Health check timeout** before application fully initializes
4. **CORS configuration** not properly aligned with Docker networking

---

## Root Causes Identified and Fixed

### Issue 1: MySQL Hostname Mismatch
**Problem:** 
- `docker-compose.yml` used `windchill-mysql` as the MySQL service name
- Inside Docker containers, the service name used in `docker-compose.yml` IS the hostname
- But the config referenced `windchill-mysql` while Dockerfile's Gradle expected `mysql`

**Fix Applied:**
```yaml
# BEFORE (WRONG):
spring:
  datasource:
    url: jdbc:mysql://windchill-mysql:3306/windchill_db

# AFTER (CORRECT):
spring:
  datasource:
    url: jdbc:mysql://mysql:3306/windchill_db?serverTimezone=UTC&allowPublicKeyRetrieval=true&useSSL=false&useUnicode=true&characterEncoding=utf-8
```

### Issue 2: Hibernate DDL Configuration
**Problem:**
- `docker-compose.yml` set `SPRING_JPA_HIBERNATE_DDL_AUTO: validate`
- This tells Hibernate to ONLY validate existing schema, not create tables
- On first run, tables don't exist, causing validation errors

**Fix Applied:**
```yaml
# BEFORE (WRONG):
SPRING_JPA_HIBERNATE_DDL_AUTO: validate

# AFTER (CORRECT):
SPRING_JPA_HIBERNATE_DDL_AUTO: update
```

### Issue 3: Health Check Timing
**Problem:**
- Health check was firing before Spring Boot finished initializing
- Causing premature container restarts

**Fix Applied:**
```yaml
# BEFORE:
healthcheck:
  test: [...]
  timeout: 10s
  retries: 3
  # NO start-period or interval specified

# AFTER:
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/actuator/health"]
  timeout: 10s
  retries: 5
  interval: 15s
  start-period: 60s  # Wait 60 seconds before first health check
```

### Issue 4: Connection Pool Optimization
**Problem:**
- Default connection pool was too small for production use
- No connection validation strategy

**Fix Applied:**
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 20000
      idle-timeout: 300000
```

---

## Complete Deployment Instructions

### Step 1: Clean Previous Containers
```powershell
# Navigate to project root
cd C:\Users\subha\windchill-plm-app

# Stop and remove all containers
docker-compose down -v

# Remove docker cache
docker system prune -f
```

### Step 2: Pull Latest Changes
```powershell
git pull origin fix/generic-type-errors
```

### Step 3: Rebuild Backend
```powershell
# Full rebuild with fresh Docker image
docker-compose build --no-cache backend
```

### Step 4: Start Services
```powershell
# Start all services
docker-compose up -d

# Watch the logs (wait 60+ seconds for backend)
docker-compose logs -f backend
```

### Step 5: Verify Health
```powershell
# Check all services are running
docker-compose ps

# Check backend health (after 60 seconds)
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing

# Expected response:
# {"status":"UP","components":{...}}
```

### Step 6: Test API Connection
```powershell
# Test API connectivity
Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/health' -UseBasicParsing

# Test frontend
Invoke-WebRequest -Uri 'http://localhost' -UseBasicParsing
```

---

## Key Configuration Changes

### docker-compose.yml Changes
- MySQL service name: `mysql` (simplified from `windchill-mysql`)
- Backend environment variables now correctly reference service names
- Added `start-period` and `interval` to health checks
- Hibernateauto-ddl changed to `update`
- Added explicit Hibernate dialect: `org.hibernate.dialect.MySQL8Dialect`

### application.yml Changes
- Datasource URL uses `mysql` hostname (Docker service name)
- Added connection pool configuration (HikariCP)
- Added character encoding for MySQL: `&useUnicode=true&characterEncoding=utf-8`
- Enhanced CORS configuration to include frontend origins
- Improved logging for debugging
- Added readiness and liveness probes for Kubernetes compatibility

---

## Troubleshooting

### Issue: Backend still not connecting

**Check backend logs:**
```powershell
docker-compose logs backend --tail=100
```

**Look for these error patterns and solutions:**

1. **`Unknown database 'windchill_db'`**
   - MySQL container didn't initialize
   - Solution: Wait for MySQL to be healthy (30 seconds minimum)
   - Check: `docker-compose logs mysql`

2. **`Connection refused`**
   - Backend trying to connect before MySQL is ready
   - Solution: Docker Compose `depends_on` with `condition: service_healthy` handles this
   - Check: `docker-compose ps` (all should be `Healthy` or `Up`)

3. **`JAVA_OPTS not recognized`**
   - JVM parameters not being passed correctly
   - Solution: Already fixed in docker-compose.yml

4. **`Access denied for user 'windchill'@'mysql'`**
   - Credentials mismatch between docker-compose and application.yml
   - Solution: Verify credentials match:
     - docker-compose.yml: `MYSQL_USER: windchill`, `MYSQL_PASSWORD: windchill123`
     - application.yml: `username: windchill`, `password: windchill123`

### Issue: Frontend not connecting to backend

**Check CORS headers:**
```powershell
# Test OPTIONS request
$headers = @{
    'Origin' = 'http://localhost:3000'
    'Access-Control-Request-Method' = 'POST'
}
Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/health' -Headers $headers -UseBasicParsing
```

**Solution:** Verify CORS config in application.yml includes your frontend origin.

### Issue: Database tables not created

**Check Hibernate DDL setting:**
```powershell
# SSH into backend container
docker exec -it windchill-backend bash

# Check logs
grep "DDL Auto" logs/windchill.log
```

**Should see:** `ddl auto: update` in logs

**If not:** Rebuild backend
```powershell
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

---

## Verification Checklist

- [ ] All containers started and healthy: `docker-compose ps`
- [ ] Backend accessible: `http://localhost:8080/actuator/health`
- [ ] Database accessible: `mysql -h localhost -u windchill -p windchill123`
- [ ] API responding: `http://localhost:8080/api/v1/...`
- [ ] Frontend accessible: `http://localhost`
- [ ] Frontend can reach backend (check browser console)
- [ ] Logs show no errors: `docker-compose logs backend`

---

## Performance Optimization

### Connection Pool Tuning
If you experience slow API responses:

```yaml
# Increase pool size in application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 30  # Increase if needed
      minimum-idle: 10
```

### Memory Optimization
If containers are memory-constrained:

```yaml
# In docker-compose.yml, adjust JVM options
JAVA_OPTS: "-Xmx256m -Xms128m -XX:+UseG1GC"
```

---

## Next Steps

1. **Test all API endpoints** with proper authentication
2. **Monitor logs** for any runtime errors
3. **Test database operations** (create, read, update, delete)
4. **Verify frontend integration** with backend
5. **Load test** with multiple concurrent requests
6. **Set up production credentials** (change JWT secret, DB password)

---

## Changes Summary

**Files Modified:**
- ✅ `docker-compose.yml` - Fixed hostnames, DDL, health checks
- ✅ `windchill-backend/backend-api/src/main/resources/application.yml` - Updated configuration

**What was changed:**
- ✅ MySQL hostname: `windchill-mysql` → `mysql`
- ✅ Hibernate DDL: `validate` → `update`
- ✅ Health check: Added 60s start-period
- ✅ Connection pool: Added HikariCP configuration
- ✅ CORS: Expanded to include Docker networking origins
- ✅ Logging: Enhanced for debugging

**No code changes required** - All fixes are configuration-based.
