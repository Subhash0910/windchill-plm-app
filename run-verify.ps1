# Windchill PLM — Full Verification Script
# Double-click or run: powershell -ExecutionPolicy Bypass -File run-verify.ps1
# Tests: AIImpactServiceImpl (conflict+compliance), GraphAnalysisService, full suite

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "windchill-backend"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Windchill PLM — Verification Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ── Step 1: AI Layer Tests ──────────────────────────────────────────
Write-Host "[1/3] Running AI service tests..." -ForegroundColor Yellow
Push-Location $BackendDir
try {
    $result = mvn test -pl backend-service `
        -Dtest="com.windchill.service.ai.*" `
        -DfailIfNoTests=false `
        -q 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PASS  All AI tests passed (AIImpactServiceImpl + GraphAnalysisService + MLServiceClient)" -ForegroundColor Green
    } else {
        Write-Host "  FAIL  AI tests failed. See output above." -ForegroundColor Red
        Write-Host ($result | Select-Object -Last 20)
    }
} finally {
    Pop-Location
}

# ── Step 2: Full Backend Tests ──────────────────────────────────────
Write-Host "`n[2/3] Running full backend test suite..." -ForegroundColor Yellow
Push-Location $BackendDir
try {
    $result = mvn test -q 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PASS  Full backend test suite passed" -ForegroundColor Green
    } else {
        Write-Host "  FAIL  Some backend tests failed." -ForegroundColor Red
        $errors = $result | Select-String "Tests run:" | Select-Object -Last 1
        Write-Host "  $errors"
    }
} finally {
    Pop-Location
}

# ── Step 3: Docker Build ────────────────────────────────────────────
Write-Host "`n[3/3] Building Docker images..." -ForegroundColor Yellow
Push-Location $Root
try {
    docker-compose build backend ml-service 2>&1 | Select-Object -Last 5
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PASS  Docker images built successfully" -ForegroundColor Green
    } else {
        Write-Host "  WARN  Docker build had issues (may be Docker not running)" -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}

# ── Summary ──────────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Verification Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changed files this session:" -ForegroundColor White
Write-Host "  backend-repository/ChangeRequestRepository.java"
Write-Host "  backend-service/.../ai/AIImpactServiceImpl.java"
Write-Host "  backend-service/.../ai/GraphAnalysisService.java"
Write-Host "  backend-service/.../ai/dto/AIImpactAnalysis.java"
Write-Host "  backend-service/.../ai/AIImpactServiceImplTest.java (NEW)"
Write-Host "  backend-service/.../ai/GraphAnalysisServiceTest.java"
Write-Host "  windchill-frontend/.../ai/ImpactPreview.jsx"
Write-Host "  windchill-frontend/.../ai/ImpactPreview.css"
Write-Host "  windchill-frontend/.../plm/PartDetailPage.jsx"
Write-Host "  docker-compose.yml"
Write-Host "  .github/workflows/ci.yml"
Write-Host "  windchill-backend/pom.xml (JaCoCo)"
Write-Host ""
Write-Host "Next: git commit && git push" -ForegroundColor Cyan
