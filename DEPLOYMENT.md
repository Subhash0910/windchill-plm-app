# Deployment Guide

Two options depending on your infrastructure. **Option A is recommended** — it uses the Docker Compose setup already in the repo.

---

## Option A — Single Server (Docker Compose)

Best for: a VPS or a DigitalOcean Droplet where you control the full server.

### Prerequisites
- Server with Docker + Docker Compose v2 installed
- Domain name (optional but needed for HTTPS)
- Ports 3000 and 8080 open in firewall

### 1. Clone
```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
```

### 2. Create `.env`
```bash
cp .env.example .env
```
Edit `.env` and fill in **all four required values**:

| Variable | What to set |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_PASSWORD` | Strong unique password |
| `DB_ROOT_PASSWORD` | Strong unique password |
| `JWT_SECRET` | Output of `openssl rand -base64 64` |
| `APP_BASE_URL` | `https://yourdomain.com` or `http://YOUR_IP:3000` |

### 3. Build and start
```bash
docker-compose up -d --build
```

First build takes ~3 minutes (Maven downloads dependencies). Subsequent builds are cached.

### 4. Check health
```bash
# All three should show healthy
docker-compose ps

# Backend Spring Boot health
curl http://localhost:8080/actuator/health

# Frontend
curl -I http://localhost:3000
```

### 5. HTTPS with Caddy (easiest)
Install Caddy on the server, then create `/etc/caddy/Caddyfile`:
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```
Caddy auto-provisions a Let’s Encrypt certificate. Reload with `systemctl reload caddy`.

### 6. Update APP_BASE_URL
After setting up HTTPS, update your `.env`:
```bash
APP_BASE_URL=https://yourdomain.com
```
Then restart the backend:
```bash
docker-compose up -d --no-deps backend
```

---

## Option B — Split Deploy (Vercel + Render)

This is the live deployment setup for this project. Frontend on Vercel, backend on Render free tier.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `windchill-frontend`
3. Add one environment variable:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://windchill-backend.onrender.com`)
4. Deploy — Vercel auto-deploys on every push to `main`

### Backend → Render

The repo already includes `render.yaml` which Render reads automatically.

1. Go to [render.com](https://render.com) → New → Blueprint
2. Connect the GitHub repo — Render detects `render.yaml` and configures the service
3. The backend deploys with `SPRING_PROFILES_ACTIVE=demo` (H2 in-memory DB, no MySQL needed on Render free tier)
4. Render auto-generates `APP_JWTSECRET` — no manual secret needed

**Key Render environment variables (set in Render dashboard if overriding defaults):**

| Variable | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `demo` (free tier) or `prod` (paid tier with external MySQL) |
| `APP_BASE_URL` | Your Vercel frontend URL |
| `ML_SERVICE_URL` | Your Render ML service URL |

**Free tier note:** Render free instances sleep after 15 minutes of inactivity. The first request after sleep takes 30–60 seconds to wake up. This is expected — it is not a bug.

**ML service on Render:** The `windchill-ml` service is also configured in `render.yaml` and deploys alongside the backend. It runs the FastAPI risk model independently.

---

## Security Checklist Before Go-Live

- [ ] `JWT_SECRET` is a random 64+ character string (`openssl rand -base64 64`)
- [ ] `DB_PASSWORD` and `DB_ROOT_PASSWORD` are strong unique passwords
- [ ] `SPRING_PROFILES_ACTIVE=prod` is set (disables Swagger, stack traces, debug logs)
- [ ] `APP_BASE_URL` points to your real frontend URL (enables CORS for your domain)
- [ ] `.env` file is **not** committed to git (verify: `git status` should not show `.env`)
- [ ] HTTPS is configured on your domain
- [ ] Ports `3306` (MySQL) and `6379` (Redis) are **NOT** open to the public internet
- [ ] Swagger UI is unreachable at `/swagger-ui.html` (should 404 in prod)
- [ ] `curl https://yourdomain.com/actuator/health` returns `{"status":"UP"}`

---

## Useful Commands

```bash
# View live backend logs
docker-compose logs -f backend

# View all service logs
docker-compose logs -f

# Rebuild only the backend (after code change)
docker-compose up -d --no-deps --build backend

# Rebuild only the frontend
docker-compose up -d --no-deps --build frontend

# Stop everything
docker-compose down

# Stop and delete all data (fresh start)
docker-compose down -v

# Connect to MySQL
docker exec -it windchill-mysql mysql -u windchill -p windchill_db

# Connect to Redis
docker exec -it windchill-redis redis-cli
```
