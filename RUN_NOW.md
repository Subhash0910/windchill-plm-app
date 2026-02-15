# 🚀 RUN NOW - Complete Working User + Auth System

**Everything is ready! Follow these steps to run the complete working application.**

---

## ✅ What's Included (End-to-End)

### Backend ✅
- ✅ User entity with JWT authentication
- ✅ Product, Document, Project entities
- ✅ User service with login/auth logic
- ✅ All repositories
- ✅ REST API controllers
- ✅ Security configuration
- ✅ Database schema migration

### Frontend ✅
- ✅ Login page
- ✅ Dashboard
- ✅ React hooks (useAuth, useFetch)
- ✅ Context-based auth state
- ✅ Protected routes
- ✅ Fully styled UI
- ✅ API integration

---

## 🐳 Option 1: Docker Compose (Easiest - Recommended)

### Step 1: Clone Repository
```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
```

### Step 2: Start Everything
```bash
docker-compose up -d --build
```

This will start:
- ✅ MySQL database (port 3306)
- ✅ Backend Spring Boot API (port 8080)
- ✅ Frontend React app (port 80)

### Step 3: Wait for Services

Linux/Mac:
```bash
sleep 30
```

Windows CMD:
```bat
timeout /t 30
```

### Step 4: Access the App

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost | Username: `admin` Password: `admin123` |
| **Backend API** | http://localhost:8080/api/v1 | Use JWT token from login |
| **Swagger UI** | http://localhost:8080/swagger-ui/index.html | Auto-generated API docs |
| **OpenAPI JSON** | http://localhost:8080/v3/api-docs | OpenAPI document |
| **MySQL** | localhost:3306 | User: `windchill` Pass: `windchill123` |

---

## 🔑 Default Credentials

```
Username: admin
Password: admin123
Role: ADMIN
```

---

## 🧪 Testing the Application

### Via Browser

1. Open Frontend: http://localhost
2. Login: Use admin / admin123
3. See Dashboard: Stats for Users, Products, Documents, Projects

### Via Postman/cURL

**1. Login and Get Token**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**2. Get All Users (Use token from above)**
```bash
curl http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---
