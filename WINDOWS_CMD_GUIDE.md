# Windows Command Prompt (CMD) vs PowerShell Guide

## ⚠️ ISSUE: You're Using Command Prompt (cmd.exe)

The deployment script and commands require **PowerShell**, not Command Prompt.

### How to Switch to PowerShell

**Option 1: Open PowerShell from Current Location**
```cmd
# In Command Prompt, type:
powershell
```

**Option 2: Open PowerShell Directly**
1. Press `Win + X`
2. Click "Windows PowerShell" or "Windows Terminal"
3. Navigate to your project: `cd C:\Users\subha\windchill-plm-app`

**Option 3: Right-Click in File Explorer**
1. Open File Explorer
2. Navigate to: `C:\Users\subha\windchill-plm-app`
3. Right-click → "Open in Terminal" or "Open PowerShell here"

---

## ✅ Status of Your Setup

### What You Already Completed ✓

**Step 1: Clean Up** ✓
```
Successfully removed:
- All containers
- All volumes
- All networks
```

**Step 2: Pull Latest Changes** ✓
```
Successfully pulled:
- BACKEND_FIX_DEPLOYMENT.md (deployed)
- FIX_SUMMARY.md (deployed)
- QUICK_REFERENCE.md (deployed)
- TESTING_VERIFICATION.md (deployed)
- deploy-fixed.ps1 (deployed)
- docker-compose.yml (FIXED)
- application.yml (FIXED)
```

### What's Left to Do ✓

**Step 3: Run Deployment Script**
```powershell
# ✓ NEXT: Open PowerShell and run this
.\deploy-fixed.ps1
```

**Step 4: Verify Backend** ✓
```powershell
# After script completes:
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing
```

---

## ✅ Correct Steps in PowerShell

### Step 1: Clean Up (Already Done ✓)
You already ran:
```powershell
docker-compose down -v
```
✓ This worked!

### Step 2: Pull Latest (Already Done ✓)
You already ran:
```powershell
git pull origin fix/generic-type-errors
```
✓ This worked! Files were updated.

### Step 3: Run Deployment Script

**Open PowerShell first!** Then run:

```powershell
# Navigate to project (if not already there)
cd C:\Users\subha\windchill-plm-app

# Run the deployment script
.\deploy-fixed.ps1
```

### Step 4: Wait and Verify

After the script completes, wait ~60 seconds and verify:

```powershell
# Check service status
docker-compose ps

# Check backend health
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing
```

---

## 🔧 PowerShell vs Command Prompt Commands

| Action | Command Prompt ❌ | PowerShell ✅ |
|--------|-----------------|-------------||
| Navigate | `cd path` | `cd path` |
| List files | `dir` | `ls` |
| Run script | `script.bat` | `.\script.ps1` |
| Web request | `curl` (if installed) | `Invoke-WebRequest` |
| Sleep | N/A | `Start-Sleep -Seconds 60` |
| Comments | `REM` | `#` |

---

## 🐛 What Went Wrong

You typed these in **Command Prompt**, which doesn't recognize them:

```cmd
# These don't work in cmd.exe:
.\deploy-fixed.ps1                                    ❌
Invoke-WebRequest -Uri '...'                          ❌
# Comments with # instead of REM                     ❌
```

---

## ✅ What to Do Now

1. **Open PowerShell**
   - Press `Win + X` and click "Windows PowerShell"
   - OR type `powershell` in Command Prompt and press Enter

2. **Navigate to project**
   ```powershell
   cd C:\Users\subha\windchill-plm-app
   ```

3. **Run deployment**
   ```powershell
   .\deploy-fixed.ps1
   ```

4. **Monitor and verify**
   ```powershell
   docker-compose ps
   docker-compose logs -f backend
   ```

---

## 📋 Common Issues & Solutions

### Issue: "PowerShell is disabled"

**Solution: Enable PowerShell execution**
1. Open Command Prompt as Administrator
2. Run:
   ```cmd
   powershell -ExecutionPolicy RemoteSigned -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"
   ```
3. Type `Y` and press Enter
4. Now PowerShell scripts will work

### Issue: "Script cannot be loaded because running scripts is disabled"

**Solution: Set execution policy**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: PowerShell says "permission denied"

**Solution: Run as Administrator**
1. Right-click PowerShell
2. Click "Run as administrator"
3. Run the deployment script

---

## 🚀 Quick Start in PowerShell (CORRECT WAY)

Copy and paste this entire block into **PowerShell** (not Command Prompt):

```powershell
# Navigate to project
cd C:\Users\subha\windchill-plm-app

# Run automated deployment
.\deploy-fixed.ps1

# After script completes, wait 60 seconds
Start-Sleep -Seconds 60

# Check status
docker-compose ps

# Test backend
Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing
```

---

## 📌 Remember

- **Command Prompt (cmd.exe)**: Traditional Windows shell, basic commands
- **PowerShell**: Modern Windows shell, object-oriented, better for scripts
- **Our script**: Written for PowerShell, won't work in Command Prompt

**Always use PowerShell for this project!**

---

## Verify Installation

Check if you have PowerShell installed:

```cmd
# In Command Prompt, run:
powershell -Version
```

Should show: `PowerShell 5.1` or higher (usually comes with Windows 10+)

---

## ✅ QUICK DEPLOY CHECKLIST

- [ ] Open PowerShell (Win + X → PowerShell)
- [ ] Navigate: `cd C:\Users\subha\windchill-plm-app`
- [ ] Deploy: `.\deploy-fixed.ps1`
- [ ] Wait: ~60-90 seconds for services to start
- [ ] Check status: `docker-compose ps`
- [ ] Test backend: `Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing`
- [ ] View logs: `docker-compose logs -f backend`
- [ ] Access frontend: http://localhost
- [ ] Access Swagger: http://localhost:8080/swagger-ui.html

---

## 📖 What Happens When You Run deploy-fixed.ps1

The script will:
1. ✅ Clean up previous containers
2. ✅ Rebuild backend Docker image
3. ✅ Start all services (MySQL, Redis, Backend, Frontend)
4. ✅ Wait for initialization (60+ seconds)
5. ✅ Check health status
6. ✅ Run connectivity tests
7. ✅ Display logs
8. ✅ Show service URLs

---

## 🎯 Next Steps RIGHT NOW

1. **Open PowerShell**
   ```
   Press Win + X
   Click "Windows PowerShell" or "Windows Terminal"
   ```

2. **Navigate to project**
   ```powershell
   cd C:\Users\subha\windchill-plm-app
   ```

3. **Run deployment script**
   ```powershell
   .\deploy-fixed.ps1
   ```

4. **Wait for completion** (~90 seconds)

5. **Verify backend is running**
   ```powershell
   Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing
   ```

**Then your backend will be up and running!** 🚀

---

## Still Having Issues?

Read these in order:
1. **QUICK_REFERENCE.md** - Quick commands
2. **BACKEND_FIX_DEPLOYMENT.md** - Detailed guide
3. **TESTING_VERIFICATION.md** - Troubleshooting
4. **FIX_SUMMARY.md** - Complete overview

All files are in the repository: `fix/generic-type-errors` branch
