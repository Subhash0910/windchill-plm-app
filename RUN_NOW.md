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
docker-compose up -d
```

This will start:
- ✅ MySQL database (port 3306)
- ✅ Backend Spring Boot API (port 8080)
- ✅ Frontend React app (port 80)

### Step 3: Wait for Services
```bash
sleep 30
```

### Step 4: Access the App

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost | Username: `admin` Password: `admin123` |
| **Backend API** | http://localhost:8080/api/v1 | Use JWT token from login |
| **Swagger UI** | http://localhost:8080/api/v1/swagger-ui.html | Auto-generated API docs |
| **MySQL** | localhost:3306 | User: `windchill` Pass: `windchill123` |

---

## 💻 Option 2: Local Development

### Prerequisites
```bash
# Check versions
java -version          # Should be 17+
mvn -v                 # Should be 3.8+
node -v                # Should be 18+
npm -v                 # Should be 9+
```

### Step 1: Clone Repository
```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
```

### Step 2: Start MySQL
```bash
# Using Docker
docker run -d \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=windchill_db \
  -e MYSQL_USER=windchill \
  -e MYSQL_PASSWORD=windchill123 \
  -p 3306:3306 \
  mysql:8.0

# Wait 10 seconds for MySQL to start
sleep 10
```

### Step 3: Start Backend (Terminal 1)
```bash
cd windchill-backend
mvn clean install
mvn spring-boot:run -pl backend-api
```

Wait for output like:
```
2026-01-16 19:30:00.123  INFO ... Application started
```

### Step 4: Start Frontend (Terminal 2)
```bash
cd windchill-frontend
npm install
npm run dev
```

### Step 5: Access the App

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8080/api/v1 |
| **Swagger** | http://localhost:8080/api/v1/swagger-ui.html |

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

1. **Open Frontend**: http://localhost (or http://localhost:5173 for local dev)
2. **Login**: Use admin / admin123
3. **See Dashboard**: Stats for Users, Products, Documents, Projects

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

Response:
```json
{
  "message": "Login successful",
  "data": {
    "userId": 1,
    "username": "admin",
    "email": "admin@windchill.local",
    "fullName": "Admin User",
    "role": "ADMIN",
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "expiresIn": 86400000
  },
  "success": true
}
```

**2. Get All Users (Use token from above)**
```bash
curl http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**3. Create Product**
```bash
curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productCode": "PROD-001",
    "productName": "Sample Product",
    "category": "Electronics",
    "manufacturer": "Acme Corp"
  }'
```

**4. Get All Products**
```bash
curl http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Verify Everything Works

### Backend Check
```bash
# Login endpoint
curl http://localhost:8080/api/v1/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq .

# Response should have token and success: true
```

### Frontend Check
1. Visit http://localhost in browser
2. See Windchill PLM login form
3. Login with admin/admin123
4. See dashboard with stats

### Database Check
```bash
# Connect to MySQL
mysql -h localhost -u windchill -p windchill123 windchill_db

# Check tables
SHOW TABLES;

# Check admin user
SELECT id, username, email, role FROM users WHERE username='admin';

# Should show: 1, admin, admin@windchill.local, ADMIN
```

---

## 📊 API Endpoints Overview

### Authentication
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/validate` - Validate token

### Users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/{id}` - Get product
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

### Documents
- `POST /api/v1/documents` - Create document
- `GET /api/v1/documents` - List all documents
- `GET /api/v1/documents/{id}` - Get document
- `PUT /api/v1/documents/{id}` - Update document
- `DELETE /api/v1/documents/{id}` - Delete document

### Projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects` - List all projects
- `GET /api/v1/projects/{id}` - Get project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

---

## 🚨 Troubleshooting

### "Connection refused" on http://localhost
```bash
# Wait a bit more
sleep 30

# Check Docker status
docker-compose ps

# View logs
docker-compose logs -f
```

### "Port 8080 already in use"
```bash
# Kill existing process
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or change port in application.yml
server.port=8081
```

### "Cannot connect to database"
```bash
# Restart MySQL
docker-compose restart mysql

# Wait 10 seconds
sleep 10

# Restart backend
mvn spring-boot:run -pl backend-api
```

### "npm install fails"
```bash
cd windchill-frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### "Maven build fails"
```bash
cd windchill-backend
rm -rf ~/.m2/repository
mvn clean install
```

---

## 📚 Next Steps (After Verifying)

1. ✅ **Login works** → Try creating products via API
2. ✅ **Products work** → Try uploading documents
3. ✅ **Everything works** → Add more features:
   - Workflow/approval system
   - Document versioning
   - Project templates
   - Advanced search
   - Notifications

---

## 📞 Support

- 📖 Full docs: See `/docs/` directory
- 🐛 Report issues: GitHub Issues
- 💬 Questions: GitHub Discussions

---

## ✨ Summary

```
✅ Complete User + Auth system
✅ Product, Document, Project entities
✅ Login page with JWT
✅ Protected dashboard
✅ Full REST API
✅ Database with migrations
✅ Docker ready
✅ Local dev ready

You can now START BUILDING! 🚀
```

---

**Choose your option and run now!** 🎉
