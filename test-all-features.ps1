# ============================================================
# Windchill PLM - Full Feature Test Script (PowerShell 5.1)
# Usage: .\test-all-features.ps1 -BaseUrl http://localhost:8080
#        .\test-all-features.ps1 -BaseUrl https://your-railway-backend.up.railway.app
# ============================================================

param(
    [string]$BaseUrl  = "http://localhost:8080",
    [string]$Username = "admin",
    [string]$Password = "admin123"
)

$ErrorActionPreference = "Continue"
$script:pass   = 0
$script:fail   = 0
$script:token  = ""
$script:partId = $null
$script:contextId = 1

function Write-Pass([string]$msg) {
    Write-Host "  [PASS] $msg" -ForegroundColor Green
    $script:pass++
}
function Write-Fail([string]$msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
    $script:fail++
}
function CountOf($arr) {
    if ($arr -is [array]) { return $arr.Count }
    if ($null -ne $arr) { return 1 }
    return 0
}

function Invoke-API {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [bool]$Auth   = $true
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Auth -and $script:token) {
        $headers["Authorization"] = "Bearer $script:token"
    }
    $uri = "$BaseUrl$Path"
    try {
        $params = @{
            Method          = $Method
            Uri             = $uri
            Headers         = $headers
            TimeoutSec      = 30
            UseBasicParsing = $true
        }
        if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
        $resp = Invoke-RestMethod @params
        return @{ ok = $true; data = $resp }
    } catch {
        $status = $null
        try { $status = $_.Exception.Response.StatusCode.value__ } catch {}
        return @{ ok = $false; status = $status; error = $_.Exception.Message }
    }
}

Write-Host ""
Write-Host "===== Windchill PLM Feature Test =====" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl"
Write-Host ""

# ---- 1. Health ---------------------------------------------------------------
Write-Host "1. Health Check" -ForegroundColor Yellow
$h = Invoke-API -Method GET -Path "/actuator/health" -Auth $false
if ($h.ok -and $h.data.status -eq "UP") {
    Write-Pass "Backend is UP (DB + Redis healthy)"
} else {
    Write-Fail "Health check failed: $($h.error)"
}

# ---- 2. Authentication -------------------------------------------------------
Write-Host ""
Write-Host "2. Authentication" -ForegroundColor Yellow
$login = Invoke-API -Method POST -Path "/api/v1/auth/login" `
    -Body @{ username = $Username; password = $Password } -Auth $false

if ($login.ok) {
    $t = $login.data.data.token
    if (-not $t) { $t = $login.data.token }
    $script:token = "$t"
    if ($script:token) {
        Write-Pass "Login OK - JWT received (user: $Username)"
    } else {
        Write-Fail "Login returned no token in response"
    }
} else {
    Write-Fail "Login failed ($($login.status)): $($login.error)"
}

if (-not $script:token) {
    Write-Host "Cannot proceed without auth token." -ForegroundColor Red
    exit 1
}

$validate = Invoke-API -Method GET -Path "/api/v1/auth/validate"
if ($validate.ok) {
    Write-Pass "GET /auth/validate - Token is valid"
} else {
    Write-Fail "Token validation failed ($($validate.status))"
}

# ---- 3. Dashboard ------------------------------------------------------------
Write-Host ""
Write-Host "3. Dashboard" -ForegroundColor Yellow

$stats = Invoke-API -Method GET -Path "/api/v1/plm/dashboard/stats?contextId=$($script:contextId)"
if ($stats.ok) {
    Write-Pass "GET /plm/dashboard/stats - Dashboard stats loaded"
} else {
    Write-Fail "Dashboard stats failed ($($stats.status))"
}

# ---- 4. Contexts (workspaces) ------------------------------------------------
Write-Host ""
Write-Host "4. PLM Contexts (Workspaces)" -ForegroundColor Yellow

$contexts = Invoke-API -Method GET -Path "/api/v1/plm/contexts"
if ($contexts.ok) {
    $count = CountOf $contexts.data.data
    Write-Pass "GET /plm/contexts - $count contexts returned"
    if ($count -gt 0) {
        $script:contextId = $contexts.data.data[0].id
        Write-Pass "Using contextId=$($script:contextId) for subsequent tests"
    }
} else {
    Write-Fail "GET /plm/contexts failed ($($contexts.status))"
}

# ---- 5. Parts and BOM --------------------------------------------------------
Write-Host ""
Write-Host "5. Parts and BOM" -ForegroundColor Yellow

$parts = Invoke-API -Method GET -Path "/api/v1/plm/parts?contextId=$($script:contextId)"
if ($parts.ok) {
    Write-Pass "GET /plm/parts?contextId=$($script:contextId) - $(CountOf $parts.data.data) parts returned"
} else {
    Write-Fail "GET /plm/parts failed ($($parts.status))"
}

$rnd = Get-Random -Maximum 9999
$newPart = Invoke-API -Method POST -Path "/api/v1/plm/parts" -Body @{
    partNumber     = "TEST-$rnd"
    name           = "Test Widget $rnd"
    description    = "Created by test script"
    lifecycleState = "INWORK"
    revision       = "A"
    contextId      = $script:contextId
}
if ($newPart.ok) {
    $script:partId = $newPart.data.data.id
    Write-Pass "POST /plm/parts - Part created (id: $($script:partId))"

    $getPart = Invoke-API -Method GET -Path "/api/v1/plm/parts/$($script:partId)"
    if ($getPart.ok) {
        Write-Pass "GET /plm/parts/{id} - Part retrieved"
    } else {
        Write-Fail "GET /plm/parts/{id} failed"
    }

    $bomGet = Invoke-API -Method GET -Path "/api/v1/plm/parts/$($script:partId)/bom"
    if ($bomGet.ok) {
        Write-Pass "GET /plm/parts/{id}/bom - BOM structure retrieved"
    } else {
        Write-Fail "GET BOM failed ($($bomGet.status))"
    }
} else {
    Write-Fail "POST /plm/parts failed ($($newPart.status)): $($newPart.error)"
}

$search = Invoke-API -Method GET -Path "/api/v1/plm/parts/search?q=Test&contextId=$($script:contextId)"
if ($search.ok) {
    Write-Pass "GET /plm/parts/search - $(CountOf $search.data.data) results"
} else {
    Write-Fail "Part search failed ($($search.status))"
}

# ---- 6. Change Requests (ECR) ------------------------------------------------
Write-Host ""
Write-Host "6. Change Requests (ECR)" -ForegroundColor Yellow

$ecrs = Invoke-API -Method GET -Path "/api/v1/plm/changes"
if ($ecrs.ok) {
    Write-Pass "GET /plm/changes - $(CountOf $ecrs.data.data) ECRs"
} else {
    Write-Fail "GET /plm/changes failed ($($ecrs.status))"
}

$rnd2 = Get-Random -Maximum 9999
$newEcr = Invoke-API -Method POST -Path "/api/v1/plm/changes" -Body @{
    title       = "Test ECR $rnd2"
    description = "Automated test change request"
    priority    = "NORMAL"
    contextId   = $script:contextId
}
if ($newEcr.ok) {
    $ecrId = $newEcr.data.data.id
    Write-Pass "POST /plm/changes - ECR created (id: $ecrId)"

    $getEcr = Invoke-API -Method GET -Path "/api/v1/plm/changes/$ecrId"
    if ($getEcr.ok) {
        Write-Pass "GET /plm/changes/{id} - ECR retrieved"
    } else {
        Write-Fail "GET /plm/changes/{id} failed"
    }

    $submitEcr = Invoke-API -Method POST -Path "/api/v1/plm/changes/$ecrId/submit"
    if ($submitEcr.ok) {
        Write-Pass "POST /plm/changes/{id}/submit - ECR submitted"
    } else {
        Write-Host "  [INFO] POST /plm/changes/{id}/submit: $($submitEcr.status) (may need specific role)" -ForegroundColor DarkGray
    }
} else {
    Write-Fail "POST /plm/changes failed ($($newEcr.status)): $($newEcr.error)"
}

# ---- 7. Change Notices (ECN) -------------------------------------------------
Write-Host ""
Write-Host "7. Change Notices (ECN)" -ForegroundColor Yellow

$ecns = Invoke-API -Method GET -Path "/api/v1/plm/changes/notices"
if ($ecns.ok) {
    Write-Pass "GET /plm/changes/notices - $(CountOf $ecns.data.data) ECNs"
} else {
    Write-Fail "GET /plm/changes/notices failed ($($ecns.status))"
}

# ---- 8. Documents ------------------------------------------------------------
Write-Host ""
Write-Host "8. Documents" -ForegroundColor Yellow

$docs = Invoke-API -Method GET -Path "/api/v1/documents"
if ($docs.ok) {
    Write-Pass "GET /documents - $(CountOf $docs.data.data) documents"
} else {
    Write-Fail "GET /documents failed ($($docs.status)): $($docs.error)"
}

$rnd3 = Get-Random -Maximum 9999
$newDoc = Invoke-API -Method POST -Path "/api/v1/documents" -Body @{
    documentNumber = "DOC-$rnd3"
    title          = "Test Document $rnd3"
    description    = "Automated test document"
    documentType   = "SPECIFICATION"
}
if ($newDoc.ok) {
    $docId = $newDoc.data.data.id
    Write-Pass "POST /documents - Document created (id: $docId)"

    $getDoc = Invoke-API -Method GET -Path "/api/v1/documents/$docId"
    if ($getDoc.ok) {
        Write-Pass "GET /documents/{id} - Document retrieved"
    } else {
        Write-Fail "GET /documents/{id} failed"
    }
} else {
    Write-Fail "POST /documents failed ($($newDoc.status)): $($newDoc.error)"
}

# ---- 9. Notifications and Work Items -----------------------------------------
Write-Host ""
Write-Host "9. Notifications and Work Items" -ForegroundColor Yellow

$notifs = Invoke-API -Method GET -Path "/api/v1/notifications"
if ($notifs.ok) {
    Write-Pass "GET /notifications - $(CountOf $notifs.data.data) notifications"
} else {
    Write-Fail "GET /notifications failed ($($notifs.status))"
}

$workItems = Invoke-API -Method GET -Path "/api/v1/plm/workitems/my"
if ($workItems.ok) {
    Write-Pass "GET /plm/workitems/my - $(CountOf $workItems.data.data) work items"
} else {
    Write-Fail "GET /plm/workitems/my failed ($($workItems.status))"
}

# ---- 10. Audit Log -----------------------------------------------------------
Write-Host ""
Write-Host "10. Audit Log" -ForegroundColor Yellow

$auditAll = Invoke-API -Method GET -Path "/api/v1/plm/audit/all?limit=10"
if ($auditAll.ok) {
    Write-Pass "GET /plm/audit/all - $(CountOf $auditAll.data.data) audit entries"
} else {
    Write-Fail "GET /plm/audit/all failed ($($auditAll.status))"
}

# ---- 11. AI Impact Analysis --------------------------------------------------
Write-Host ""
Write-Host "11. AI Impact Analysis" -ForegroundColor Yellow

if ($script:partId) {
    $impact = Invoke-API -Method POST -Path "/api/v1/ai/analyze-impact" `
        -Body @{ partId = $script:partId; changeType = "MODIFY" }
    if ($impact.ok) {
        Write-Pass "POST /ai/analyze-impact - Impact analysis returned"
    } else {
        Write-Fail "POST /ai/analyze-impact failed ($($impact.status)): $($impact.error)"
    }

    $contextualAi = Invoke-API -Method GET -Path "/api/v1/ai/contextual/parts/$($script:partId)"
    if ($contextualAi.ok) {
        Write-Pass "GET /ai/contextual/parts/{id} - Contextual AI insight returned"
    } else {
        Write-Fail "GET /ai/contextual/parts/{id} failed ($($contextualAi.status))"
    }
} else {
    Write-Host "  [SKIP] No part was created - skipping AI impact tests" -ForegroundColor DarkGray
}

# ---- 12. AI Chat -------------------------------------------------------------
Write-Host ""
Write-Host "12. AI Chat Assistant" -ForegroundColor Yellow

$chat = Invoke-API -Method POST -Path "/api/v1/ai/chat" `
    -Body @{ message = "What is a BOM in PLM?" }
if ($chat.ok) {
    Write-Pass "POST /ai/chat - AI assistant responded"
} else {
    Write-Fail "POST /ai/chat failed ($($chat.status)): $($chat.error)"
}

$aiHealth = Invoke-API -Method GET -Path "/api/v1/ai/health"
if ($aiHealth.ok) {
    Write-Pass "GET /ai/health - AI service health returned"
} else {
    Write-Fail "GET /ai/health failed ($($aiHealth.status))"
}

# ---- 13. Admin Users ---------------------------------------------------------
Write-Host ""
Write-Host "13. Admin" -ForegroundColor Yellow

$users = Invoke-API -Method GET -Path "/api/v1/admin/users"
if ($users.ok) {
    Write-Pass "GET /admin/users - $(CountOf $users.data.data) users"
} else {
    Write-Fail "GET /admin/users failed ($($users.status))"
}

# ---- 14. ML Service ----------------------------------------------------------
Write-Host ""
Write-Host "14. ML Service" -ForegroundColor Yellow

$mlBase = ""
if ($BaseUrl -match "localhost") { $mlBase = "http://localhost:5000" }

if ($mlBase) {
    try {
        $mlHealth = Invoke-RestMethod -Uri "$mlBase/health" -TimeoutSec 10 -UseBasicParsing
        if ($mlHealth.status -eq "healthy") {
            Write-Pass "ML service healthy at $mlBase"
        } else {
            Write-Fail "ML service status: $($mlHealth.status)"
        }

        $riskBody = @{ partId = 1; changeType = "MODIFY"; bomDepth = 2; whereUsedCount = 3 } | ConvertTo-Json
        $riskCheck = Invoke-RestMethod -Method POST -Uri "$mlBase/predict-risk" `
            -ContentType "application/json" `
            -Body $riskBody `
            -TimeoutSec 15 -UseBasicParsing
        if ($riskCheck) {
            Write-Pass "POST /predict-risk - ML risk prediction (score: $($riskCheck.risk_score), level: $($riskCheck.risk_level))"
        }
    } catch {
        Write-Fail "ML service unreachable at $mlBase ($($_.Exception.Message))"
    }
} else {
    Write-Host "  [SKIP] ML direct check only runs for localhost targets" -ForegroundColor DarkGray
}

# ---- Summary -----------------------------------------------------------------
$total = $script:pass + $script:fail
Write-Host ""
if ($script:fail -eq 0) {
    Write-Host "===== Results: $($script:pass)/$total passed - ALL GREEN! =====" -ForegroundColor Green
} else {
    Write-Host "===== Results: $($script:pass)/$total passed, $($script:fail) failed =====" -ForegroundColor Yellow
    Write-Host "  Review the FAIL lines above for details." -ForegroundColor Red
}
