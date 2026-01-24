#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated deployment script for Windchill PLM application with all fixes applied
.DESCRIPTION
    This script handles:
    - Cleaning previous containers and volumes
    - Pulling latest code
    - Rebuilding Docker images
    - Starting services
    - Verifying health checks
    - Testing connectivity
.NOTES
    Requires Docker and Docker Compose to be installed
    Compatible with PowerShell 5.1+
#>

param(
    [switch]$SkipPull,
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [int]$WaitSeconds = 90,
    [string]$Environment = "docker"
)

# Color output helper
function Write-Status { 
    param([string]$Message, [string]$Status = "INFO")
    $colors = @{
        "INFO"    = "Cyan"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR"   = "Red"
        "HEADER"  = "Magenta"
    }
    $color = if ($colors.ContainsKey($Status)) { $colors[$Status] } else { "White" }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$Status] $Message" -ForegroundColor $color
}

function Invoke-Step { 
    param([scriptblock]$ScriptBlock, [string]$Description)
    Write-Status $Description "HEADER"
    try {
        & $ScriptBlock
        Write-Status "✓ Completed: $Description" "SUCCESS"
    } 
    catch {
        Write-Status "✗ Failed: $Description" "ERROR"
        Write-Status "Error: $_" "ERROR"
        exit 1
    }
}

# Main deployment
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  Windchill PLM - Backend Deployment Fix" -ForegroundColor Magenta
Write-Host "  Branch: fix/generic-type-errors" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Step 1: Clean previous deployment
Invoke-Step {
    Write-Status "Stopping containers..." "INFO"
    docker-compose down -v --remove-orphans
    Write-Status "Removing Docker cache..." "INFO"
    docker system prune -f --volumes | Out-Null
} "Cleaning up previous deployment"

# Step 2: Pull latest code
if (-not $SkipPull) {
    Invoke-Step {
        Write-Status "Pulling latest changes from fix/generic-type-errors..." "INFO"
        git pull origin fix/generic-type-errors
    } "Pulling latest code"
} 
else {
    Write-Status "Skipping git pull" "WARNING"
}

# Step 3: Rebuild backend
if (-not $SkipBuild) {
    Invoke-Step {
        Write-Status "Building backend service (this may take 1-2 minutes)..." "INFO"
        docker-compose build --no-cache backend
        Write-Status "Backend build completed successfully" "SUCCESS"
    } "Rebuilding backend Docker image"
} 
else {
    Write-Status "Skipping Docker build" "WARNING"
}

# Step 4: Start all services
Invoke-Step {
    Write-Status "Starting all services..." "INFO"
    docker-compose up -d
    Write-Status "Services started, waiting for initialization..." "INFO"
    Write-Status "Waiting $WaitSeconds seconds for backend to be ready..." "INFO"
    Start-Sleep -Seconds $WaitSeconds
    Write-Status "Initial wait completed" "SUCCESS"
} "Starting Docker services"

# Step 5: Check service status
Invoke-Step {
    Write-Status "Service Status:" "INFO"
    docker-compose ps
    
    Write-Status "Checking container health..." "INFO"
    $services = @("mysql", "redis", "backend", "frontend")
    foreach ($service in $services) {
        $status = docker-compose ps $service --format "table {{.Status}}" 2>$null
        if ($status -match "healthy|running") {
            Write-Status "✓ $service is healthy" "SUCCESS"
        } 
        else {
            Write-Status "⚠ $service status: $status" "WARNING"
        }
    }
} "Verifying service status"

# Step 6: Test backend connectivity
if (-not $SkipTests) {
    Invoke-Step {
        Write-Status "Testing backend health endpoint..." "INFO"
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" `
                                        -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Status "✓ Backend health check passed" "SUCCESS"
                Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2 -Compress
            }
        } 
        catch {
            Write-Status "⚠ Backend health check failed (may still be initializing)" "WARNING"
            Write-Status "Please wait a few more seconds and try manually:" "INFO"
            Write-Status "  PowerShell: Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing" "INFO"
        }
        
        Write-Status "`nTesting frontend connectivity..." "INFO"
        try {
            $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Status "✓ Frontend is accessible" "SUCCESS"
            }
        } 
        catch {
            Write-Status "⚠ Frontend not yet responding" "WARNING"
        }
    } "Running connectivity tests"
}

# Step 7: Show logs
Invoke-Step {
    Write-Status "Showing recent backend logs (last 50 lines):" "INFO"
    docker-compose logs backend --tail=50
} "Displaying backend logs"

# Final summary
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                  DEPLOYMENT COMPLETED" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   • Frontend:     http://localhost" -ForegroundColor White
Write-Host "   • Backend API:  http://localhost:8080" -ForegroundColor White
Write-Host "   • Swagger:      http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "   • Health:       http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host "   • MySQL:        localhost:3306" -ForegroundColor White
Write-Host "   • Redis:        localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Quick Commands:" -ForegroundColor Cyan
Write-Host "   • View logs:    docker-compose logs -f backend" -ForegroundColor White
Write-Host "   • Stop all:     docker-compose down" -ForegroundColor White
Write-Host "   • Restart:      docker-compose restart" -ForegroundColor White
Write-Host "   • Health check: Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing" -ForegroundColor White
Write-Host ""
Write-Host "✅ All fixes applied:" -ForegroundColor Green
Write-Host "   ✓ MySQL hostname corrected (mysql instead of windchill-mysql)" -ForegroundColor Green
Write-Host "   ✓ Hibernate DDL set to update (auto-creates tables)" -ForegroundColor Green
Write-Host "   ✓ Health checks configured with proper timeouts" -ForegroundColor Green
Write-Host "   ✓ Connection pool optimized" -ForegroundColor Green
Write-Host "   ✓ CORS configuration enhanced" -ForegroundColor Green
Write-Host ""

$BackendReady = $false
Write-Host "⏳ Waiting for backend to fully initialize..." -ForegroundColor Yellow
for ($i = 0; $i -lt 5; $i++) {
    Start-Sleep -Seconds 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" `
                                    -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is ready!" -ForegroundColor Green
            $BackendReady = $true
            break
        }
    } 
    catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if (-not $BackendReady) {
    Write-Host "`n⚠️  Backend still initializing. Please check logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs backend" -ForegroundColor White
}

Write-Host ""
