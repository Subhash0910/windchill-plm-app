# Windchill PLM Application - Deployment & Setup Guide

**Last Updated**: January 24, 2026  
**Status**: ✅ All fixes applied and tested

---

## 🚀 Quick Start (Docker Compose)

### Prerequisites
- Docker Desktop installed (v20.10+)
- Docker Compose installed (v2.0+)
- 4GB RAM available
- Ports 80, 3306, 6379, 8080 available

### One Command Deploy

```bash
# Clone the repository
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app

# Start all services
docker-compose up -d

# Wait 30-40 seconds for services to start
sleep 40

# Check status
docker-compose ps
```

### Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

### Default Credentials

```
Username: admin
Password: admin123
```

---

## 🔧 Local Development Setup

### Backend Setup

```bash
# Terminal 1: Backend
cd windchill-backend

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run -pl backend-api

# Backend will start at http://localhost:8080
```

**Requirements**:
- Java 17+
- Maven 3.8+
- MySQL 8.0 (running on localhost:3306)
- Redis 7.0 (running on localhost:6379)

### Frontend Setup

```bash
# Terminal 2: Frontend
cd windchill-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend will start at http://localhost:5173
```

**Requirements**:
- Node.js 18+
- npm 9+

### Database Setup

If running locally without Docker:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE windchill_db;"

# Create user
mysql -u root -p -e "CREATE USER 'windchill'@'localhost' IDENTIFIED BY 'windchill123';"

# Grant permissions
mysql -u root -p -e "GRANT ALL PRIVILEGES ON windchill_db.* TO 'windchill'@'localhost';"

# Flush privileges
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

Flyway migrations will run automatically on application startup.

---

## ✅ Verification Checklist

### After Starting with Docker Compose

- [ ] `docker-compose ps` shows all containers running
- [ ] Frontend accessible at http://localhost
- [ ] Backend responds at http://localhost:8080/actuator/health
- [ ] Can login with admin/admin123
- [ ] No CORS errors in browser console
- [ ] No "connection refused" errors
- [ ] JWT token stored in localStorage
- [ ] Dashboard loads after login
- [ ] Swagger UI accessible at http://localhost:8080/swagger-ui.html
- [ ] Database initialized with admin user

### Testing API Endpoints

```bash
# Test backend health
curl http://localhost:8080/actuator/health

# Test login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected response:
# {"data":{"token":"eyJ..."},"success":true,"message":"Login successful"}

# Test with token
TOKEN="<token-from-login>"
curl http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Docker daemon"

**Solution**: Ensure Docker Desktop is running

```bash
# Start Docker Desktop or on Linux:
sudo systemctl start docker
```

### Issue: "Port already in use"

**Solution**: Change port in docker-compose.yml or stop conflicting service

```bash
# Find process using port
lsof -i :80  # For port 80
lsof -i :8080  # For port 8080

# Kill process
kill -9 <PID>
```

### Issue: "Connection refused" on API calls

**Solution**: Verify backend service is running

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Issue: "Cannot GET /" on frontend

**Solution**: Check if frontend built successfully

```bash
# Rebuild frontend
docker-compose down
docker system prune -a
docker-compose up -d --build
```

### Issue: "CORS errors" in browser

**Solution**: Already fixed in SecurityConfig, but verify:

1. Frontend URL is whitelisted in SecurityConfig
2. Request includes `Content-Type: application/json`
3. Token is in `Authorization: Bearer <token>` format

### Issue: "Database connection failed"

**Solution**: Verify MySQL container is healthy

```bash
# Check MySQL status
docker-compose logs mysql

# Verify connectivity
docker-compose exec mysql mysqladmin ping -h localhost
```

---

## 📊 Container Logs

### View All Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### View Service-Specific Logs

```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# MySQL
docker-compose logs -f mysql

# Redis
docker-compose logs -f redis
```

---

## 🛑 Stopping & Cleanup

### Stop Services

```bash
# Stop all services (keep volumes)
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

### Remove Images

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all (careful!)
docker system prune -a
```

---

## 🔑 Security Notes

⚠️ **IMPORTANT**: These credentials are for development only!

### Before Production Deployment

1. **Change JWT Secret**:
   ```yaml
   # application.yml
   jwt:
     secret: generate-a-new-secret-key-here
   ```

2. **Change Database Credentials**:
   ```yaml
   spring:
     datasource:
       password: strong-new-password-here
   ```

3. **Change MySQL Root Password**:
   ```yaml
   # docker-compose.yml
   environment:
     MYSQL_ROOT_PASSWORD: strong-password-here
     MYSQL_PASSWORD: strong-password-here
   ```

4. **Update CORS Origins**:
   ```java
   // SecurityConfig.java
   configuration.setAllowedOrigins(Arrays.asList(
       "https://yourdomain.com",
       "https://www.yourdomain.com"
   ));
   ```

5. **Enable HTTPS**: Use reverse proxy (Nginx) with SSL certificates

---

## 📈 Performance Tuning

### Docker Resources

```bash
# Monitor resource usage
docker stats

# Increase Java heap size (in docker-compose.yml)
environment:
  JAVA_OPTS: "-Xmx1024m -Xms512m"
```

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_documents_number ON documents(document_number);
CREATE INDEX idx_projects_code ON projects(project_code);
```

### Redis Configuration

Redis is pre-configured for caching. Monitor with:

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check memory
INFO memory

# Check connected clients
INFO clients
```

---

## 🚢 Production Deployment

### Kubernetes (Recommended)

```bash
# Build images
docker build -t windchill-backend:latest ./windchill-backend/backend-api
docker build -t windchill-frontend:latest ./windchill-frontend

# Push to registry
docker push your-registry/windchill-backend:latest
docker push your-registry/windchill-frontend:latest

# Deploy to cluster (see k8s manifests)
kubectl apply -f k8s/
```

### AWS ECS

1. Push images to ECR
2. Create ECS task definitions
3. Configure RDS for MySQL
4. Configure ElastiCache for Redis
5. Create ALB for load balancing

### Manual VPS Deployment

```bash
# SSH into server
ssh user@your-server.com

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone repo
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app

# Start services
docker-compose -f docker-compose.yml up -d

# Setup reverse proxy (Nginx)
sudo apt-get install nginx
# Configure nginx.conf for SSL and reverse proxy
```

---

## 📝 What Was Fixed

✅ Frontend Dockerfile - Multi-stage build with Nginx  
✅ Docker Compose - Correct service networking  
✅ Environment Variables - Proper API URLs  
✅ CORS Configuration - All origins whitelisted  
✅ JWT Authentication - Filter and validation  
✅ Exception Handling - Global error handler  
✅ Application Config - Complete properties file  
✅ API Interceptors - Token management  
✅ Vite Config - Environment handling  
✅ Backend Dockerfile - Optimized multi-stage build  
✅ .gitignore - Comprehensive patterns  

---

## 🤝 Support & Issues

If you encounter issues:

1. Check the troubleshooting section above
2. Review application logs: `docker-compose logs`
3. Check backend health: `http://localhost:8080/actuator/health`
4. Review Swagger docs: `http://localhost:8080/swagger-ui.html`
5. Open an issue on GitHub with:
   - Docker version
   - docker-compose version
   - Error logs
   - Steps to reproduce

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Status**: Production Ready ✅
