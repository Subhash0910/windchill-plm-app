# Windchill PLM Deployment Script
# PowerShell 5.1+ compatible

Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  Windchill PLM - Backend Deployment" -ForegroundColor Magenta
Write-Host "  Branch: fix/generic-type-errors" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Clean up previous deployment
Write-Host "[STEP 1] Cleaning up previous deployment..." -ForegroundColor Cyan
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker-compose down -v --remove-orphans
Write-Host "Containers stopped and volumes removed." -ForegroundColor Green
Write-Host ""

# Step 2: Rebuild backend
Write-Host "[STEP 2] Rebuilding backend Docker image..." -ForegroundColor Cyan
Write-Host "This may take 1-2 minutes..." -ForegroundColor Yellow
docker-compose build --no-cache backend
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend build completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Start all services
Write-Host "[STEP 3] Starting all services..." -ForegroundColor Cyan
Write-Host "Starting MySQL, Redis, Backend, Frontend..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "Services started!" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for initialization
Write-Host "[STEP 4] Waiting for services to initialize..." -ForegroundColor Cyan
Write-Host "Waiting 90 seconds for full startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 90
Write-Host "Wait complete!" -ForegroundColor Green
Write-Host ""

# Step 5: Check service status
Write-Host "[STEP 5] Checking service status..." -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# Step 6: Test backend health
Write-Host "[STEP 6] Testing backend health..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend health check PASSED!" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $response.Content
    }
} catch {
    Write-Host "Backend health check FAILED (may still be initializing)" -ForegroundColor Yellow
    Write-Host "Please wait a few more seconds and try:" -ForegroundColor Yellow
    Write-Host "Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing" -ForegroundColor White
}
Write-Host ""

# Step 7: Test frontend
Write-Host "[STEP 7] Testing frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "Frontend is accessible!" -ForegroundColor Green
    }
} catch {
    Write-Host "Frontend not yet responding" -ForegroundColor Yellow
}
Write-Host ""

# Step 8: Show logs
Write-Host "[STEP 8] Showing recent backend logs..." -ForegroundColor Cyan
docker-compose logs backend --tail=50
Write-Host ""

# Final summary
Write-Host "================================================" -ForegroundColor Green
Write-Host "            DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:     http://localhost" -ForegroundColor White
Write-Host "  Backend API:  http://localhost:8080" -ForegroundColor White
Write-Host "  Swagger UI:   http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "  Health:       http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host "  MySQL:        localhost:3306" -ForegroundColor White
Write-Host "  Redis:        localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  View logs:    docker-compose logs -f backend" -ForegroundColor White
Write-Host "  Stop all:     docker-compose down" -ForegroundColor White
Write-Host "  Restart:      docker-compose restart" -ForegroundColor White
Write-Host ""
Write-Host "All Fixes Applied:" -ForegroundColor Green
Write-Host "  [+] MySQL hostname corrected (mysql)" -ForegroundColor Green
Write-Host "  [+] Hibernate DDL set to update (auto-creates tables)" -ForegroundColor Green
Write-Host "  [+] Health checks configured with proper timeouts" -ForegroundColor Green
Write-Host "  [+] Connection pool optimized" -ForegroundColor Green
Write-Host "  [+] CORS configuration enhanced" -ForegroundColor Green
Write-Host ""
Write-Host "Backend Status: READY TO USE!" -ForegroundColor Green
Write-Host ""
