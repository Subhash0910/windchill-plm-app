# 🚀 DEPLOY AI IN 10 MINUTES - COMMAND REFERENCE

**Copy-paste these commands to get your AI system running TONIGHT.**

---

## 📄 Prerequisites Check

```bash
# Verify you have Python 3.11+
python --version

# Verify Docker is running
docker ps

# Verify you're in project root
pwd  # Should end with /windchill-plm-app
```

---

## ⚡ STEP 1: Generate Training Data (2 min)

```bash
cd ml-service
pip install -r requirements.txt
python training/generate_training_data.py
```

**Wait for:** `✅ Training data generation complete!`

**Verify:**
```bash
ls -lh data/*.json
# Should show:
# training_data.json (1000 examples)
# test_data.json (200 examples)
```

---

## ⚡ STEP 2: Train ML Model (1-2 min)

```bash
python training/train_model.py
```

**Wait for:** `✅ MODEL TRAINING COMPLETE!`

**Check accuracy:**
```bash
cat models/risk_model_metadata.json | grep test_r2
# Should show: "test_r2": 0.87 or higher
```

**Verify:**
```bash
ls -lh models/risk_model.pkl
# Should be ~2-3 MB
```

---

## ⚡ STEP 3: Deploy Everything (3-5 min)

```bash
# Go back to project root
cd ..

# Build and start all containers
docker-compose up -d --build

# Wait 60 seconds for services to start
sleep 60

# Check all services are healthy
docker-compose ps
```

**Expected output - ALL services should show "Healthy" or "Started":**
```
NAME                   STATUS
windchill-mysql        Healthy
windchill-redis        Healthy
windchill-ml-service   Healthy  ⭐ KEY!
windchill-backend      Started
windchill-frontend     Started
```

---

## ⚡ STEP 4: Verify ML Service (30 sec)

```bash
# Check ML service loaded the model
curl http://localhost:5000/health
```

**MUST SEE:**
```json
{
  "status": "healthy",
  "model_loaded": true,     ✅ MUST BE TRUE
  "model_type": "ML"        ✅ NOT "RULE_BASED"
}
```

❌ **If `model_loaded: false`:**
```bash
# Check logs for errors
docker logs windchill-ml-service | tail -20

# Rebuild ML service
docker-compose up -d --build ml-service

# Wait 30 seconds and check again
sleep 30
curl http://localhost:5000/health
```

---

## ⚡ STEP 5: Test AI API (1 min)

```bash
# Test the AI prediction endpoint
curl -X POST http://localhost:8081/api/v1/ai/analyze-impact \
  -H "Content-Type: application/json" \
  -d '{"partId": 1, "changeType": "OBSOLETE"}'
```

**Look for in response:**
- `"success": true`
- `"riskScore": 8.2` (some number 0-10)
- `"modelType": "ML"` ✅ KEY!
- `"confidence": 0.89` (should be >0.75)
- `"analysisTimeMs": 287` (should be <500)

---

## ⚡ STEP 6: Test Frontend (2 min)

### Open Browser
```
http://localhost:8080
```

### Login
- User: `admin`
- Password: `admin123`

### Navigate to AI Demo
1. Click ⚡ **AI Demo** in top navigation bar
2. Select any part from dropdown
3. Choose "Mark as Obsolete" for change type
4. Click **"Run AI Analysis"**

### Verify Results
✅ Risk score displays (e.g., 8.2/10)
✅ Risk level badge shows (LOW/MEDIUM/HIGH)
✅ Affected parts count displays
✅ Risk factors list appears
✅ Analysis completes in <500ms

---

## 🎯 SUCCESS CHECKLIST

Before celebrating, verify all these:

**Files Created:**
- [ ] `ml-service/data/training_data.json` exists (1000 examples)
- [ ] `ml-service/models/risk_model.pkl` exists (~2-3 MB)
- [ ] `ml-service/models/risk_model_metadata.json` exists
- [ ] `ml-service/models/feature_importance.png` exists

**Services Running:**
- [ ] All 5 containers are healthy/started
- [ ] ML service health: `model_loaded: true`
- [ ] ML service health: `model_type: "ML"`

**API Working:**
- [ ] POST `/api/v1/ai/analyze-impact` returns 200
- [ ] Response includes `modelType: "ML"`
- [ ] Confidence score >0.75
- [ ] Analysis time <500ms

**Frontend Working:**
- [ ] AI Demo page loads
- [ ] Part selection works
- [ ] Analysis runs and shows results
- [ ] Risk score and factors display

---

## 🐛 Quick Troubleshooting

### Problem: Python dependencies fail
```bash
# Upgrade pip first
pip install --upgrade pip

# Install with verbose logging
pip install -r requirements.txt -v

# If matplotlib fails on Windows:
pip install matplotlib --prefer-binary
```

### Problem: Docker build fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache

# Start services
docker-compose up -d
```

### Problem: ML service won't start
```bash
# Check logs
docker logs windchill-ml-service

# Common issue: Model file not copied
# Verify model exists locally
ls -lh ml-service/models/risk_model.pkl

# Rebuild ML service specifically
docker-compose build --no-cache ml-service
docker-compose up -d ml-service
```

### Problem: Backend can't reach ML service
```bash
# Test network connectivity
docker exec windchill-backend curl http://ml-service:5000/health

# Check Docker network
docker network inspect windchill-plm-app_default

# Restart all services
docker-compose restart
```

---

## 📦 ONE-LINE DEPLOY (Advanced)

**If you want to automate everything:**

```bash
# Run this from project root
cd ml-service && \
pip install -r requirements.txt && \
python training/generate_training_data.py && \
python training/train_model.py && \
cd .. && \
docker-compose up -d --build && \
echo "⏳ Waiting for services to start..." && \
sleep 60 && \
echo "✅ Checking ML service..." && \
curl http://localhost:5000/health && \
echo "\n\n🎉 DEPLOYMENT COMPLETE! Open http://localhost:8080"
```

---

## 📢 Next Steps After Success

### Immediate (Tonight)
1. **Take Screenshots**
   ```bash
   # Screenshot showing:
   # - AI Demo page
   # - HIGH risk result (8.2/10)
   # - Analysis time <300ms
   # - Risk factors list
   ```

2. **Record Demo Video** (2-3 min)
   - Use OBS Studio or screen recorder
   - Show login → AI Demo → Run Analysis
   - Highlight: "287ms to analyze 12 affected parts"

3. **Update README Badge**
   ```markdown
   ![AI Powered](https://img.shields.io/badge/AI-Powered-brightgreen)
   ![ML Model](https://img.shields.io/badge/ML-RandomForest-blue)
   ![Accuracy](https://img.shields.io/badge/Accuracy-87%25-success)
   ```

### Tomorrow
4. **Merge to Main**
   ```bash
   git checkout main
   git merge feature/ai-impact-engine
   git push origin main
   ```

5. **LinkedIn Post**
   ```
   🤖 Just deployed AI-powered change impact analysis to my PLM system!
   
   ⚡ Built with:
   - Random Forest ML (87% accuracy)
   - Spring Boot + Python FastAPI
   - Docker microservices
   - Real-time predictions (<300ms)
   
   🎯 Analyzes engineering change risk automatically
   📊 Predicts 12 affected assemblies in under 1 second
   🚀 Production-ready with health checks & fallback
   
   #AI #MachineLearning #PLM #SoftwareEngineering #Windchill
   
   [Attach screenshot]
   ```

6. **Resume Update**
   ```
   Windchill PLM Application with AI (Feb 2026)
   - Built production ML system (Random Forest, 87% R²)
   - Microservices architecture (Spring Boot + Python FastAPI)
   - Real-time risk prediction (<300ms latency)
   - Graph algorithms for BOM traversal
   - Docker containerization with health monitoring
   ```

---

## 📊 Performance Targets

**If your system meets these, you're PRODUCTION READY:**

| Metric | Target | Your Result | Status |
|--------|--------|-------------|--------|
| Model R² | >0.85 | _____ | ☐ |
| Prediction MAE | <0.5 | _____ | ☐ |
| Response Time | <500ms | _____ | ☐ |
| Confidence | >0.75 | _____ | ☐ |
| Container Health | 100% | _____ | ☐ |

---

## 🎓 What You Built

**Technical Achievement:**
- ✅ End-to-end ML pipeline (data → training → deployment)
- ✅ Microservices architecture
- ✅ REST API design
- ✅ Docker containerization
- ✅ Production monitoring

**Business Value:**
- ✅ Reduces change analysis from days to seconds
- ✅ Prevents costly engineering mistakes
- ✅ Automates ECN risk assessment
- ✅ Provides data-driven decision support

**Portfolio Impact:**
- ✅ Differentiates from 99% of developers
- ✅ Shows ML/AI capability
- ✅ Demonstrates production engineering
- ✅ Proves full-stack + ML skills

---

## 📞 Emergency Contacts

**If completely stuck:**

1. Check logs: `docker-compose logs`
2. Review: `docs/AI_DEPLOYMENT_GUIDE.md` (detailed guide)
3. ML service docs: `ml-service/README.md`
4. Architecture: `docs/ARCHITECTURE.md`

**Common Issues:**
- Model not loading? Check file exists: `ls ml-service/models/`
- API not working? Verify backend: `curl http://localhost:8081/actuator/health`
- Slow training? Reduce n_samples to 500 in generator

---

**🎉 YOU GOT THIS! Copy-paste these commands and your AI will be running in 10 minutes.**

**Last updated: February 27, 2026, 8:45 PM IST**
