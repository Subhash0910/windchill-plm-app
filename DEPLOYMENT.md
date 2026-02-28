# Deployment Guide

Two options depending on your infrastructure. **Option A is recommended** — it uses the Docker Compose setup already in the repo.

---

## Option A — Single Server (Docker Compose)

Best for: a VPS, a Railway Docker Compose deployment, or a DigitalOcean Droplet.

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

## Option B — Split Deploy (Vercel + Railway)

Best for: free tier hosting, no VPS available.

### Frontend → Vercel
1. Push code to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set **Root Directory** to `windchill-frontend`
4. Add environment variable:
   - `VITE_API_BASE_URL` = `https://your-backend.up.railway.app`
5. Deploy

### Backend + MySQL + Redis → Railway
1. Go to [railway.app](https://railway.app) → New Project
2. Add **MySQL** plugin → copy the `MYSQL_URL` from Railway
3. Add **Redis** plugin → copy the `REDIS_URL` from Railway
4. Add a new Service → Deploy from GitHub repo
   - Set **Root Directory** to `windchill-backend`
   - Set **Start Command** to let Railway detect the Dockerfile
5. Set these environment variables in Railway:

```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:mysql://YOUR_RAILWAY_MYSQL_HOST:PORT/windchill_db?serverTimezone=UTC&useSSL=true&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your-railway-mysql-password
SPRING_DATA_REDIS_HOST=your-redis-host.railway.internal
SPRING_DATA_REDIS_PORT=6379
APP_JWTSECRET=your-64-char-secret-from-openssl
APP_BASE_URL=https://your-app.vercel.app
```

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
