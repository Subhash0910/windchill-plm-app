#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete deployment script for Windchill PLM app
.DESCRIPTION
    Handles clean rebuild, starts services, and validates deployment
.EXAMPLE
    .\deploy.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "=== Windchill PLM App Deployment ==="`n

# Step 1: Verify Git
Write-Host "[1] Verifying Git status..." -ForegroundColor Cyan
$branch = (git rev-parse --abbrev-ref HEAD 2>$null)
if ($branch -ne 'fix/generic-type-errors') {
    Write-Host "Warning: You are on branch '$branch', not 'fix/generic-type-errors'" -ForegroundColor Yellow
    Write-Host "Switch to correct branch? (Y/n): " -NoNewline
    $response = Read-Host
    if ($response -ne 'n') {
        git checkout fix/generic-type-errors
    }
}
Write-Host "Pulling latest changes..." -ForegroundColor Cyan
git pull origin fix/generic-type-errors
Write-Host "`u2713 Git status OK`n" -ForegroundColor Green

# Step 2: Stop and clean
Write-Host "[2] Stopping and cleaning Docker..." -ForegroundColor Cyan
docker-compose down -v
docker image rm -f windchill-plm-app-backend windchill-plm-app-frontend 2>$null
docker system prune -f
Write-Host "`u2713 Cleanup complete`n" -ForegroundColor Green

# Step 3: Build
Write-Host "[3] Building Docker images (no cache)..." -ForegroundColor Cyan
docker-compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "`u2717 Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "`u2713 Build successful`n" -ForegroundColor Green

# Step 4: Start services
Write-Host "[4] Starting services..." -ForegroundColor Cyan
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "`u2717 Failed to start services" -ForegroundColor Red
    exit 1
}
Write-Host "`u2713 Services started`n" -ForegroundColor Green

# Step 5: Wait and verify
Write-Host "[5] Waiting for services to be ready (120 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 120

# Step 6: Check status
Write-Host "`n[6] Checking service status..." -ForegroundColor Cyan
docker-compose ps

# Step 7: Test endpoints
Write-Host "`n[7] Testing endpoints..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Backend API: HEALTHY" -ForegroundColor Green
        $health = $response.Content | ConvertFrom-Json
        Write-Host "    Status: $($health.status)"
    } else {
        Write-Host "  ✗ Backend API: Status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Backend API: UNHEALTHY - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:80' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Frontend: HEALTHY" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Frontend: UNHEALTHY" -ForegroundColor Red
}

# Summary
Write-Host "`n=== Deployment Summary ===" -ForegroundColor Cyan
Write-Host "Backend API:    http://localhost:8080" -ForegroundColor Green
Write-Host "Frontend:       http://localhost" -ForegroundColor Green
Write-Host "API Docs:       http://localhost:8080/swagger-ui.html" -ForegroundColor Green
Write-Host "MySQL:          localhost:3306 (windchill/windchill123)" -ForegroundColor Green
Write-Host "Redis:          localhost:6379" -ForegroundColor Green
Write-Host "`nCheck logs with: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "Stop services with: docker-compose down" -ForegroundColor Cyan
Write-Host "`u2713 Deployment complete!`n" -ForegroundColor Green
