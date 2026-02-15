# Windchill PLM - Testing & Verification Guide

## Quick Verification Checklist

### 1. Container Status
```powershell
# Check all containers are running
docker-compose ps

# Expected output:
# NAME                 IMAGE                        STATUS
# windchill-backend    windchill-plm-app-backend    Up X seconds (health: starting) → (health: healthy)
# windchill-frontend   windchill-plm-app-frontend   Up X seconds
# windchill-mysql      mysql:8.0                    Up X seconds (healthy)
# windchill-redis      redis:7-alpine               Up X seconds (healthy)
```

### 2. Backend Health
```powershell
# Check health endpoint (wait 60+ seconds after starting)
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing

# Expected response: {"status":"UP","components":{...}}
```

### 3. Database Connection
```powershell
# Test MySQL connection
mysql -h 127.0.0.1 -u windchill -p windchill123 -e "SELECT 1;"

# Or with Docker:
docker exec windchill-mysql mysql -u windchill -pwindchill123 -e "USE windchill_db; SHOW TABLES;"
```

### 4. Redis Connection
```powershell
# Test Redis connection
docker exec windchill-redis redis-cli ping
# Expected response: PONG
```

### 5. Frontend Accessibility
```powershell
# Test frontend
Invoke-WebRequest -Uri 'http://localhost' -UseBasicParsing
# Check browser: http://localhost
```

---

## Detailed Testing Guide

### Test 1: Backend Startup Verification

**Check logs for successful initialization:**
```powershell
docker-compose logs backend | Select-String -Pattern "Started WindchillApplication|Tomcat started|health check passed"

# Look for:
# - "Started WindchillApplication"
# - "Tomcat started on port(s)"
# - "Database initialized successfully"
```

**Wait for proper initialization:**
```powershell
# Check current status
docker-compose ps backend

# If "health: starting" - wait longer
# If "health: healthy" - proceed
# If "Unhealthy" or "exited" - check logs
```

### Test 2: Database Connectivity

**Check MySQL is accessible from backend:**
```powershell
# Enter backend container
docker exec -it windchill-backend bash

# Test connection
mysql -h mysql -u windchill -pwindchill123 -e "SELECT 1;"

# Exit
exit
```

**Verify tables created:**
```powershell
docker exec windchill-mysql mysql -u windchill -pwindchill123 windchill_db -e "SHOW TABLES;"

# Should show tables like:
# - users
# - projects
# - documents
# - roles
```

### Test 3: API Endpoints

**Health Check (always available):**
```powershell
$response = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing
Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
```

**API Info:**
```powershell
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/info' -UseBasicParsing
```

**Swagger UI (if enabled):**
```powershell
# Open in browser: http://localhost:8080/swagger-ui.html
```

### Test 4: CORS Configuration

**Test CORS headers:**
```powershell
$headers = @{
    'Origin' = 'http://localhost:3000'
    'Access-Control-Request-Method' = 'GET'
}

$response = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/health' `
                             -Method OPTIONS `
                             -Headers $headers `
                             -UseBasicParsing

# Check response headers
$response.Headers

# Should contain:
# Access-Control-Allow-Origin: http://localhost:3000 (or *)
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
# Access-Control-Allow-Headers: *
```

### Test 5: Frontend to Backend Communication

**Check browser console:**
1. Open http://localhost in browser
2. Open Developer Tools (F12)
3. Check Console tab for errors
4. Check Network tab for API calls

**Test API call from frontend (using browser console):**
```javascript
// In browser console:
fetch('http://localhost:8080/api/v1/health')
  .then(r => r.json())
  .then(d => console.log('API Connected:', d))
  .catch(e => console.error('API Error:', e))
```

### Test 6: Load Testing

**Simulate multiple requests:**
```powershell
# PowerShell load test
$ErrorActionPreference = 'SilentlyContinue'
for ($i = 1; $i -le 10; $i++) {
    $response = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' `
                                 -UseBasicParsing
    Write-Host "Request $i - Status: $($response.StatusCode)"
}
```

### Test 7: Memory and Performance

**Check container resource usage:**
```powershell
docker stats windchill-backend windchill-mysql windchill-redis --no-stream

# Look for:
# - Backend: Should use <500MB memory
# - MySQL: Should use <300MB memory
# - Redis: Should use <50MB memory
```

**Check logs for performance issues:**
```powershell
# Look for slow queries
docker-compose logs backend | Select-String -Pattern "slow query|exceeded|timeout"

# Look for memory issues
docker-compose logs backend | Select-String -Pattern "OutOfMemory|GC|heap"
```

### Test 8: Network Connectivity

**Backend can reach MySQL:**
```powershell
docker exec windchill-backend bash -c "nc -zv mysql 3306"
# Expected: Connection to mysql 3306 port [tcp/mysql] succeeded!
```

**Backend can reach Redis:**
```powershell
docker exec windchill-backend bash -c "nc -zv redis 6379"
# Expected: Connection to redis 6379 port [tcp/redis] succeeded!
```

**Frontend can reach Backend:**
```powershell
docker exec windchill-frontend bash -c "curl -s -o /dev/null -w '%{http_code}' http://backend:8080/actuator/health"
# Expected: 200
```

---

## Troubleshooting Scenarios

### Scenario 1: "Connection Refused" Error

**Symptoms:**
- Backend won't start
- Error: "Connection refused"
- Error: "The underlying connection was closed"

**Diagnosis:**
```powershell
# Check if containers are running
docker-compose ps

# Check backend logs
docker-compose logs backend --tail=100 | Select-String -Pattern "error|Exception"

# Check if ports are free
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
```

**Solutions:**
1. Wait 60+ seconds for MySQL to be ready (check health status)
2. Ensure MySQL is healthy: `docker-compose ps mysql`
3. Rebuild containers: `docker-compose build --no-cache backend`
4. Check port conflicts: `lsof -i :8080` (on Linux/Mac)
5. Full reset: `docker-compose down -v && docker-compose up -d`

### Scenario 2: "Unknown Database" Error

**Symptoms:**
- Error: "Unknown database 'windchill_db'"
- Error: "Access denied for user 'windchill'@'mysql'"

**Diagnosis:**
```powershell
# Check MySQL is initialized
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql --tail=50

# Check credentials
docker exec windchill-mysql mysql -u root -ppassword -e "SHOW DATABASES;"
```

**Solutions:**
1. MySQL needs more time to initialize (wait 30+ seconds)
2. Check environment variables match:
   - docker-compose.yml: `MYSQL_USER: windchill`, `MYSQL_PASSWORD: windchill123`
   - application.yml: `username: windchill`, `password: windchill123`
3. Remove volumes and restart: `docker-compose down -v && docker-compose up -d`

### Scenario 3: "Health Check Failing" Error

**Symptoms:**
- Container shows "Unhealthy"
- Backend container keeps restarting

**Diagnosis:**
```powershell
# Check health check URL
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing

# Check container logs
docker-compose logs backend --tail=50
```

**Solutions:**
1. Backend needs more time to initialize (60s start-period)
2. Check if Actuator endpoint is enabled in application.yml
3. Look for Spring Boot startup errors in logs
4. Rebuild with: `docker-compose build --no-cache backend`

### Scenario 4: "CORS Error" in Frontend

**Symptoms:**
- Browser console shows CORS error
- Frontend can't connect to API

**Diagnosis:**
```powershell
# Test CORS headers
$headers = @{'Origin' = 'http://localhost:3000'}
$response = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/health' `
                             -Headers $headers `
                             -UseBasicParsing
$response.Headers | Select-String -Pattern "Access-Control"
```

**Solutions:**
1. Update CORS origins in application.yml to include frontend URL
2. Verify CORS is enabled: `spring.mvc.cors.allowed-origins`
3. Rebuild backend after CORS changes
4. Clear browser cache (Ctrl+Shift+Delete)

### Scenario 5: "Out of Memory" Error

**Symptoms:**
- Backend container crashes
- Error in logs: "OutOfMemoryError"

**Diagnosis:**
```powershell
# Check memory usage
docker stats windchill-backend

# Check JVM settings in docker-compose.yml
docker-compose config | Select-String -Pattern "JAVA_OPTS"
```

**Solutions:**
1. Increase JVM memory in docker-compose.yml:
   ```yaml
   JAVA_OPTS: "-Xmx1024m -Xms512m -XX:+UseG1GC"
   ```
2. Rebuild and restart: `docker-compose build --no-cache backend && docker-compose up -d`
3. Monitor with: `docker stats windchill-backend`

### Scenario 6: "Hibernate Validation Error"

**Symptoms:**
- Error: "Column 'xxx' not found"
- Error: "Unable to validate schema"

**Diagnosis:**
```powershell
# Check Hibernate DDL setting
docker-compose config | Select-String -Pattern "DDL_AUTO"

# Check if tables exist
docker exec windchill-mysql mysql -u windchill -pwindchill123 windchill_db -e "SHOW TABLES;"
```

**Solutions:**
1. Ensure `SPRING_JPA_HIBERNATE_DDL_AUTO: update` in docker-compose.yml
2. Clear database and restart: `docker-compose down -v && docker-compose up -d`
3. Check application.yml for conflicting settings

---

## Performance Optimization Tips

### 1. Connection Pool Tuning
If experiencing slow queries:
```yaml
# In application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 30  # Increase for high load
      minimum-idle: 10
```

### 2. Redis Cache Configuration
```yaml
# Optimize Redis connection
spring:
  redis:
    jedis:
      pool:
        max-active: 16  # Increase if needed
        max-idle: 16
```

### 3. JVM Garbage Collection
```yaml
# In docker-compose.yml
JAVA_OPTS: "-Xmx1024m -Xms512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### 4. Database Query Optimization
```yaml
# Enable query logging
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql: TRACE
```

---

## Log Inspection Guide

**View all logs:**
```powershell
docker-compose logs
```

**View backend logs with filtering:**
```powershell
# Show last 100 lines
docker-compose logs backend --tail=100

# Show logs with timestamps
docker-compose logs backend --timestamps

# Follow logs in real-time
docker-compose logs -f backend

# Search for errors
docker-compose logs backend | Select-String -Pattern "error|exception|failed"
```

**Key log messages to look for:**
- ✅ "Started WindchillApplication" - Backend started successfully
- ✅ "Tomcat started on port" - Tomcat web server started
- ✅ "HikariPool-1 - Connection is valid" - Database connection valid
- ❌ "Connection refused" - Can't connect to database
- ❌ "Access denied" - Database credentials wrong
- ❌ "OutOfMemoryError" - Not enough JVM memory

---

## Final Verification

Run this complete verification sequence:

```powershell
# 1. Check all services
Write-Host "Checking services..." -ForegroundColor Cyan
docker-compose ps

# 2. Test backend health
Write-Host "\nTesting backend health..." -ForegroundColor Cyan
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing | ForEach-Object {$_.Content}

# 3. Test database
Write-Host "\nTesting database..." -ForegroundColor Cyan
docker exec windchill-mysql mysql -u windchill -pwindchill123 windchill_db -e "SELECT COUNT(*) as table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA='windchill_db';"

# 4. Test Redis
Write-Host "\nTesting Redis..." -ForegroundColor Cyan
docker exec windchill-redis redis-cli ping

# 5. Test frontend
Write-Host "\nTesting frontend..." -ForegroundColor Cyan
Invoke-WebRequest -Uri 'http://localhost' -UseBasicParsing | ForEach-Object {$_.StatusCode}

Write-Host "\n✅ All systems operational!" -ForegroundColor Green
```

---

## Still Having Issues?

1. **Check BACKEND_FIX_DEPLOYMENT.md** - Comprehensive deployment guide
2. **Run deploy-fixed.ps1** - Automated deployment script
3. **Check recent commits** - All fixes are in `fix/generic-type-errors` branch
4. **Enable DEBUG logging** - See `logging.level.com.windchill: DEBUG` in application.yml
5. **Review docker-compose.yml** - All services configured with proper health checks

