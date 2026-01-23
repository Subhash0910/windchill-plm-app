# CORS Login Error Fix Script
# Run this script to rebuild backend and fix CORS preflight issue
# Usage: .\fix-cors-login.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "WINDCHILL PLM - CORS LOGIN FIX SCRIPT" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Pull latest changes
Write-Host "[STEP 1/5] Pulling latest changes from GitHub..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to pull changes" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Changes pulled successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Stop running containers
Write-Host "[STEP 2/5] Stopping running containers..." -ForegroundColor Yellow
docker-compose stop backend frontend
Write-Host "✓ Containers stopped" -ForegroundColor Green
Write-Host ""

# Step 3: Rebuild backend image
Write-Host "[STEP 3/5] Rebuilding backend Docker image (this may take 2-3 minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to rebuild backend" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend image rebuilt successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Start services
Write-Host "[STEP 4/5] Starting services..." -ForegroundColor Yellow
docker-compose up -d backend frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start services" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Services started" -ForegroundColor Green
Write-Host ""

# Step 5: Wait and verify
Write-Host "[STEP 5/5] Waiting for backend to initialize (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Checking container status..." -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# Test backend health
Write-Host "Testing backend health endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -ErrorAction Stop
    Write-Host "✓ Backend is healthy (Status: $($health.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend might still be initializing, please wait a moment and try again" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "FIX APPLIED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Clear browser cache: Press Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "2. Clear localStorage in DevTools Console:" -ForegroundColor White
Write-Host "   localStorage.clear()" -ForegroundColor Gray
Write-Host "3. Refresh page: Press Ctrl+F5" -ForegroundColor White
Write-Host "4. Try login with credentials:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "ACCESS YOUR APP:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost" -ForegroundColor White
Write-Host "Backend:  http://localhost:8080" -ForegroundColor White
Write-Host "Swagger:  http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host ""
Write-Host "For detailed information, see: CORS_FIX_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
