# Quick Start

## Option A: Docker (recommended)

The full stack — Spring Boot, MySQL, Redis, ML service, React — runs in 3 commands.

### Prerequisites
- Docker Desktop installed and running
- Git

### Steps

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
cp .env.example .env        # Windows: copy .env.example .env
docker-compose up -d --build
```

First build takes ~3 minutes (Maven downloads dependencies and the ML model trains). Subsequent starts are fast.

Open [http://localhost:3000](http://localhost:3000)

**Default credentials**
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

---

## Option B: Manual (no Docker)

### Prerequisites
- Java 17+
- Node.js 18+
- Maven 3.9+
- MySQL 8 running locally
- Redis running locally

### 1. Configure environment

Create a local config override at `windchill-backend/backend-api/src/main/resources/application-dev.yml` and set your local MySQL and Redis connection details, or export them as environment variables matching the names in `.env.example`.

### 2. Run the backend

```bash
cd windchill-backend
mvn spring-boot:run -pl backend-api -am
```

Backend starts on `http://localhost:8080`. Spring Boot will auto-create all tables on first run (profile: `dev`, `ddl-auto: update`).

### 3. Run the frontend

```bash
cd windchill-frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:5173` (Vite dev server).

---

## Verify the stack is up

```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend (Docker)
curl -I http://localhost:3000
```

All services should report healthy. If the backend shows `DOWN`, check `docker-compose logs backend` for the startup error.

---

## Common issues

**Port 8080 already in use**
```bash
# Windows PowerShell
netstat -ano | findstr :8080
Stop-Process -Id <PID> -Force
```

**Frontend module not found**
```bash
cd windchill-frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

**MySQL connection refused (manual mode)**
Make sure MySQL is running and the `windchill_db` database exists. The app does not create the database automatically — only the tables.
```sql
CREATE DATABASE windchill_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Backend takes too long to start on Render free tier**
Render free instances sleep after 15 minutes of inactivity. The first request wakes them up and may take 30–60 seconds. This is expected behavior.

---

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Docker Compose, Vercel + Railway, HTTPS, security checklist
- [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) — full setup reference
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — backend module and frontend layer map
- [CONTRIBUTING.md](./CONTRIBUTING.md) — contribution guidelines
