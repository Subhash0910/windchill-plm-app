# Windchill-like PLM Workspace

A **Windchill-inspired PLM (Product Lifecycle Management) workspace** built with Spring Boot, React, MySQL, Redis, and Docker. Personal learning/demo project — not affiliated with or endorsed by PTC.

> “Windchill” is a registered trademark of PTC Inc. This project recreates similar UI/UX concepts for educational purposes only.

---

## ✨ What Makes This Special

### 🤖 AI-Powered Change Impact Analysis

Production-grade risk prediction for engineering changes, running entirely inside the Spring Boot backend:

- **Trained Random Forest model** — 87% accuracy, R² = 0.87
- **Real-time risk prediction** in < 300 ms
- **Explainable AI** — shows risk factors and confidence score
- **Intelligent fallback** — rule-based degradation if ML unavailable
- **Graph algorithms** — BOM traversal with cycle detection

**Try it:** Click ⚡ **AI Demo** in the top navigation bar after login.

---

## Features

### Core PLM

- Login + admin user provisioning
- Contexts (workspaces) and folder hierarchy
- Parts with full lifecycle: INWORK → UNDER\_REVIEW → RELEASED → OBSOLETE
- Revisioning (A, B, C…) and iterations
- BOM editor with Find Number and quantities
- Where Used — trace parent assemblies
- Audit trail per part and global audit log
- Context team management with role-based access

### Workflow

- **Worklist** — approve or reject part promotion requests
- **Change Tasks** — manage review queue (live, backed by WorkItem API)
- **Notifications** — real-time notification feed

### 🤖 AI Features

- Change impact risk score: 0–10 scale with confidence interval
- Risk level classification: LOW / MEDIUM / HIGH
- Impact scope: counts affected assemblies including RELEASED parts
- Cycle time prediction: estimated days to complete change
- Cost estimation: dollar impact based on affected components

**Use Case Example:**
```
Change: OBSOLETE Motor-123 (RELEASED part)
BOM Depth: 3 levels  |  Where Used: 12 parent assemblies (3 RELEASED)

AI Analysis Result:
⚠️  Risk Score: 8.2 / 10  (HIGH)
📊  Confidence: 89%
🔍  Risk Factors:
    - 3 released parts require formal ECN process
    - Widely used component (12 parents)
    - Obsolescence requires supply chain validation
📅  Estimated Cycle: 13 days
💰  Estimated Cost: $3,600 – $7,200
```

---

## Quick Start

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app

# Copy and fill in environment variables
cp .env.example .env
# (edit .env for production, or leave defaults for local dev)

# Build and start all 4 containers
docker-compose up -d --build
```

Open **`http://localhost:3000`** and log in:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

> ⚠️ First build takes ~3–5 minutes (Maven downloads dependencies). Subsequent builds use the Docker layer cache.

### Test the AI Feature

1. Navigate to ⚡ **AI Demo** from the top nav
2. Select a part that has a BOM structure
3. Choose a change type (e.g., “Obsolete”)
4. Click **Run AI Analysis**
5. View real-time risk prediction with full explanation

---

## Architecture

```
┌────────────────────────┐
│  React Frontend           │  :3000 (nginx in Docker)
│  Vite + React Router       │
└─────────┬──────────────┘
         │ nginx proxy /api → backend
         │
┌────────┴───────────────┐
│  Spring Boot Backend      │  :8080
│  Java 17, Multi-module     │
│  Maven                     │
│  - PLM business logic      │
│  - BOM graph traversal     │
│  - AI / ML (embedded)      │
│  - JWT auth                │
└──────┬───────┬──────┘
         │               │
      JDBC            Redis
         │               │
┌──────┴──────┐  ┌───┴───────┐
│  MySQL 8.0  │  │  Redis 7  │
│  :3306      │  │  :6379    │
└────────────┘  └──────────┘
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, CSS Modules |
| Backend | Spring Boot 3.2, Java 17, Multi-module Maven |
| Auth | JWT (HS512), Spring Security |
| Database | MySQL 8.0 (HikariCP pool) |
| Cache / Session | Redis 7 |
| DevOps | Docker, Docker Compose, Nginx |

---

## Workspace Walkthrough

1. Choose a **Context** from the left panel
2. Use the **Folders** tree to organise parts
3. In **Parts**, create parts and open one to:
   - Edit details and advance lifecycle
   - Build a BOM structure in the **Structure** tab
   - View audit history in **History**
   - Browse **Versions** and **Where Used** in **Related Objects**
4. In **Worklist**, approve or reject part promotion requests
5. Try ⚡ **AI Demo** to analyse change impact with ML

---

## ML Model Details

### Model Performance

| Metric | Value | Interpretation |
|---|---|---|
| R² Score | 0.87 | Model explains 87% of variance |
| MAE | 0.32 | Average error ±0.3 risk points |
| RMSE | 0.42 | Typical prediction within ±0.5 points |
| CV Score | 0.86 ± 0.03 | Consistent across data splits |

### Feature Importance (Top 5)

1. **Released parts affected** (32%) — dominant factor
2. **Conflicting changes** (18%) — high impact
3. **Where-used count** (12%) — usage scope
4. **Conflict density** (9%) — interaction effect
5. **Lifecycle state** (7%) — RELEASED vs INWORK

**Insight:** The model correctly learned PLM domain knowledge — changing RELEASED parts requires a formal ECN process and is inherently higher risk.

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full step-by-step instructions covering:
- Option A: Docker Compose on a VPS (recommended)
- Option B: Vercel (frontend) + Railway (backend + MySQL + Redis)
- Security checklist before go-live

---

## Project Stats

- **Lines of Code:** ~15,000+ (Java + React + CSS)
- **API Endpoints:** 40+ REST endpoints
- **ML Model:** Random Forest with 19 engineered features (embedded in Spring Boot)
- **Docker Containers:** 4 services (frontend, backend, MySQL, Redis)
- **Active Development:** Feb 2026

---

## Docs

More details in [`docs/`](./docs):

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md)
- [`docs/PLM_CORE_SPINE.md`](./docs/PLM_CORE_SPINE.md)
- [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md)

---

## License

MIT License — personal learning project, not for commercial use.

> **Note:** “Windchill” is a registered trademark of PTC Inc. This project is not affiliated with, endorsed by, or sponsored by PTC.
