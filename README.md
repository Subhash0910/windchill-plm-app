# Windchill-like PLM Workspace

This repository contains a **Windchill-like PLM (Product Lifecycle Management) workspace** built with Spring Boot, React, and Docker.

It is a personal learning/demo project and not affiliated with or endorsed by PTC. "Windchill" is a registered trademark of PTC Inc.; this project only recreates similar UI/UX concepts for educational purposes.

## ✨ What Makes This Special

### 🤖 AI-Powered Change Impact Analysis

This project features a **production-grade machine learning system** for predicting engineering change risk:

- **Trained Random Forest model** (87% accuracy, R²=0.87)
- **Real-time risk prediction** in <300ms
- **Explainable AI** - shows risk factors and confidence
- **Microservices architecture** - Python ML service + Spring Boot backend
- **Intelligent fallback** - graceful degradation if ML unavailable
- **Graph algorithms** - BOM traversal with cycle detection

**Try it:** Click ⚡ **AI Demo** in the navigation bar after login!

---

## Features

### Core PLM Features

- Login + admin user provisioning
- PLM Workspace with:
  - Contexts (containers) and folder hierarchy
  - Parts with lifecycle (INWORK, UNDERREVIEW, RELEASED, OBSOLETE)
  - Revisioning (A, B, C...) and iterations
  - BOM editor (parent → child lines) with Find Number and quantities
  - Where Used: see parent assemblies that reference a part
  - Audit trail per part
- Context team management and ACL (who can see/edit)
- Docker-based local environment (backend + frontend + DB)

### 🤖 AI Features

#### Change Impact Analysis Engine

Intelligent risk assessment for engineering changes:

- **Machine Learning Model**
  - Algorithm: Random Forest Regressor (100 trees)
  - Training: 1000+ synthetic examples based on PLM domain knowledge
  - Performance: 87% R², ±0.3 MAE on 0-10 risk scale
  - Features: 19 engineered features from BOM structure, lifecycle, and change patterns

- **Real-Time Analysis**
  - Risk score: 0-10 scale with confidence interval
  - Risk level: LOW / MEDIUM / HIGH classification
  - Impact scope: Counts affected assemblies (including RELEASED parts)
  - Cycle time prediction: Estimated days to complete change
  - Cost estimation: Dollar impact based on affected components

- **Technical Architecture**
  - Graph-based BOM traversal (handles circular references)
  - RESTful API: `POST /api/v1/ai/analyze-impact`
  - Microservices: Java Spring Boot ↔ Python FastAPI
  - Containerized ML service with health checks
  - Automatic fallback to rule-based if ML service down

**Use Case Example:**
```
Change: OBSOLETE Motor-123 (RELEASED part)
BOM Depth: 3 levels
Where Used: 12 parent assemblies (3 RELEASED)

AI Analysis Result:
⚠️ Risk Score: 8.2/10 (HIGH)
📊 Confidence: 89%
🔍 Risk Factors:
  - 3 released parts require formal ECN process
  - Widely used component (12 parents)
  - Obsolescence requires supply chain validation
📅 Estimated Cycle: 13 days
💰 Estimated Cost: $3,600 - $7,200
```

---

## Quick start

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app

# Generate ML training data and train model
cd ml-service
python training/generate_training_data.py
python training/train_model.py
cd ..

# Run everything
docker-compose up -d --build
```

Then open `http://localhost:8080` and login with:

- **User**: `admin`
- **Password**: `admin123`

### Testing the AI Feature

1. Navigate to ⚡ **AI Demo** from the top navigation
2. Select a part with BOM structure
3. Choose change type (e.g., "Obsolete")
4. Click **"Run AI Analysis"**
5. View real-time risk prediction with explanations

---

## Architecture

### System Components

```
┌──────────────────────┐
│  React Frontend       │
│  (Port 8080)          │
└────────┬─────────────┘
         │
         │ HTTP/REST
         │
┌────────┴────────────────────────┐
│  Spring Boot Backend (Port 8081)  │
│  - PLM business logic             │
│  - BOM graph traversal            │
│  - AI orchestration               │
└──────┬─────────────┬────────────┘
       │               │
       │               │ HTTP/REST
       │               │
       │      ┌────────┴───────────────────┐
       │      │  Python ML Service (5000)  │
       │      │  - Random Forest model     │
       │      │  - Risk prediction API     │
       │      └───────────────────────────┘
       │
       │ JDBC
       │
┌──────┴───────────────────┐
│  MySQL Database (3306)  │
│  - PLM data storage     │
│  - Audit logs           │
└──────────────────────────┘
```

### Technology Stack

**Frontend:** React, CSS3, React Router

**Backend:** Spring Boot 3.2, Java 17, Multi-module Maven

**ML Service:** Python 3.11, FastAPI, scikit-learn, pandas

**Database:** MySQL 8.0

**DevOps:** Docker, Docker Compose

---

## Workspace walkthrough

1. Choose a **Context** on the left.
2. Use the **Folders** tree to organize parts.
3. In **Parts**, create parts and open a part to:
   - Edit details and lifecycle
   - Build a BOM structure in the **Structure** tab
   - See audit in **History**
   - Browse **Versions** and **Where Used** in **Related Objects**
4. Try the ⚡ **AI Demo** to analyze change impact

---

## ML Model Details

### Training the Model

```bash
cd ml-service

# 1. Generate synthetic training data (1000 examples)
python training/generate_training_data.py

# 2. Train Random Forest model
python training/train_model.py

# Output:
# ✅ models/risk_model.pkl (trained model)
# ✅ models/risk_model_metadata.json (metrics)
# ✅ models/feature_importance.png (visualization)
```

### Model Performance

| Metric | Value | Interpretation |
|--------|-------|----------------|
| R² Score | 0.87 | Model explains 87% of variance |
| MAE | 0.32 | Average error ±0.3 risk points |
| RMSE | 0.42 | Typical prediction within ±0.5 points |
| CV Score | 0.86 ± 0.03 | Consistent across data splits |

### Feature Importance (Top 5)

1. **Released parts affected** (32%) - Dominant factor
2. **Conflicting changes** (18%) - High impact
3. **Where-used count** (12%) - Usage scope
4. **Conflict density** (9%) - Interaction effect
5. **Lifecycle state** (7%) - RELEASED vs INWORK

**Insight:** The model correctly learned PLM domain knowledge - changing RELEASED parts requires formal ECN process and is inherently higher risk.

---

## Docs

More details live under [`docs/`](./docs):

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md)
- [`docs/PLM_CORE_SPINE.md`](./docs/PLM_CORE_SPINE.md)
- [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md)
- [`ml-service/README.md`](./ml-service/README.md) - ML service documentation

Troubleshooting and older fix logs are being consolidated into `docs/` from the root `*_FIX_*.md` files.

---

## Project Stats

- **Lines of Code:** ~15,000+ (Java backend + React frontend + Python ML)
- **Backend Services:** 3 microservices (Spring Boot + FastAPI + MySQL)
- **API Endpoints:** 40+ REST endpoints
- **ML Model:** Random Forest with 19 engineered features
- **Docker Containers:** 4 services (frontend, backend, ML, database)
- **Development Time:** Active development Feb 2026

---

## License

MIT License - Personal learning project, not for commercial use.

**Note:** "Windchill" is a registered trademark of PTC Inc. This project is not affiliated with, endorsed by, or sponsored by PTC.
