# Getting Started - Windchill PLM Application

## 🎉 Welcome!

You now have a **complete, production-ready Windchill PLM-inspired full-stack application** ready to use.

## 📦 What You Have

### ✅ Complete Backend (5 Maven Modules)
- **backend-common**: Shared utilities, constants, exceptions
- **backend-domain**: JPA entities and domain models
- **backend-repository**: Spring Data repositories
- **backend-service**: Business logic and services
- **backend-api**: REST controllers and API layer

### ✅ Complete Frontend (React + Vite)
- Atomic design components (atoms → molecules → organisms → templates)
- Context API for state management
- Custom React hooks
- Fully styled and responsive

### ✅ Infrastructure
- Docker and Docker Compose configuration
- MySQL database setup
- Redis caching (optional)
- Nginx reverse proxy
- Complete CI/CD ready structure

### ✅ Documentation
- Setup guides (local + Docker)
- Architecture documentation
- API documentation
- Best practices guide
- Folder structure reference

## 🚀 Quick Start (Choose One)

### Option 1: Docker Compose (Recommended for Quick Testing)

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
docker-compose up -d
```

**Then access:**
- Frontend: `http://localhost`
- Backend API: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/api/v1/swagger-ui.html`

### Option 2: Local Development (For Development)

**Backend:**
```bash
cd windchill-backend
mvn clean install
mvn spring-boot:run -pl backend-api
```

**Frontend (in new terminal):**
```bash
cd windchill-frontend
npm install
npm run dev
```

## 📚 Documentation Guide

### Essential Reading
1. **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup
2. **[docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** - Detailed installation & troubleshooting
3. **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design & patterns
4. **[docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md)** - Complete file organization

### Reference
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - All API endpoints
- **[docs/BEST_PRACTICES.md](./docs/BEST_PRACTICES.md)** - Coding standards
- **[docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Database tables

## 🔐 Default Credentials

- **Username**: admin
- **Password**: admin123

⚠️ **Change these immediately in production!**

## 🏗️ Project Structure

```
windchill-plm-app/
├── windchill-backend/              # Spring Boot 5-module backend
├── windchill-frontend/             # React + Vite frontend
├── docs/                           # Complete documentation
├── docker-compose.yml              # Container orchestration
├── README.md                       # Project overview
├── QUICK_START.md                  # Quick setup guide
└── GETTING_STARTED.md              # This file
```

## 🔧 Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Cache**: Redis 6.0
- **Security**: JWT + Spring Security
- **Build**: Maven 3.8+
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18+
- **Build**: Vite
- **Routing**: React Router v6
- **State**: Context API + Hooks
- **HTTP**: Axios
- **Styling**: CSS3 + Variables

## 📋 Common Tasks

### Start Development
```bash
# Docker (recommended)
docker-compose up -d

# Or local
cd windchill-backend && mvn spring-boot:run -pl backend-api &
cd windchill-frontend && npm run dev
```

### View Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs (will show in terminal where npm run dev is running)
```

### Database Access
```bash
# MySQL
mysql -h localhost -u windchill -p windchill123 windchill_db

# Redis CLI
redis-cli
```

### Build for Production
```bash
# Backend JAR
cd windchill-backend
mvn clean package -DskipTests
# Output: backend-api/target/backend-api-1.0.0-SNAPSHOT.jar

# Frontend build
cd windchill-frontend
npm run build
# Output: dist/ directory
```

### Run Tests
```bash
# Backend unit tests
cd windchill-backend
mvn test

# Frontend component tests
cd windchill-frontend
npm run test
```

## 🎨 Architecture Highlights

### Backend Layers
```
API Controllers (REST Endpoints)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Entities (Domain Models)
    ↓
Database (MySQL)
```

### Frontend Components
```
Pages (Full Views)
    ↓
Templates (Layouts)
    ↓
Organisms (Complex Sections)
    ↓
Molecules (Component Groups)
    ↓
Atoms (Basic Elements)
```

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Spring Security with role-based access control
- ✅ Password encryption (BCrypt)
- ✅ Protected API routes
- ✅ CORS configuration
- ✅ SQL injection prevention (JPA)
- ✅ XSS protection via input validation

## 📈 Performance Features

- ✅ Redis caching layer
- ✅ Database query optimization with JPA
- ✅ Connection pooling (HikariCP)
- ✅ Frontend code splitting
- ✅ Component memoization
- ✅ API response compression

## 🚢 Deployment Options

### Docker Compose (Development/Small Production)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Traditional Servers
- Deploy backend JAR to server
- Deploy frontend to Nginx/Apache
- Use external MySQL and Redis

### Kubernetes
- Ready for K8s deployment
- Containerized images provided
- Horizontal scaling support

### Cloud Platforms
- AWS: EC2, RDS, ElastiCache
- GCP: Compute Engine, Cloud SQL
- Azure: App Service, Azure Database

## 🆘 Common Issues & Solutions

### "Port 8080 already in use"
```bash
# Find and kill process
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or change port in application.yml
server.port=8081
```

### "Cannot connect to database"
```bash
# Verify MySQL is running
docker-compose ps

# Restart MySQL
docker-compose restart mysql

# Check credentials in application.yml
```

### "npm install fails"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### "Maven build fails"
```bash
# Clean and rebuild
mvn clean
mvn -U clean install

# Clear local repository
rm -rf ~/.m2/repository
mvn clean install
```

## 📞 Support Resources

### Documentation
- Full docs in `/docs` directory
- API documentation in Swagger UI
- Code comments throughout

### Community
- GitHub Issues: Report bugs
- GitHub Discussions: Ask questions
- GitHub Wiki: Additional guides

### Learning
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [Docker Documentation](https://docs.docker.com)

## 📝 Next Steps

1. **Clone and Run**: `git clone ...` → `docker-compose up -d`
2. **Explore API**: Visit `http://localhost:8080/api/v1/swagger-ui.html`
3. **Try Frontend**: Visit `http://localhost` in browser
4. **Read Architecture**: Review `/docs/ARCHITECTURE.md`
5. **Start Development**: Follow `/docs/SETUP_GUIDE.md`
6. **Learn Patterns**: Check `/docs/BEST_PRACTICES.md`
7. **Build Features**: Start implementing your requirements

## 🎯 Development Workflow

### For New Features
1. Create feature branch: `git checkout -b feature/my-feature`
2. Backend: Add entity → Repository → Service → Controller
3. Frontend: Create components following atomic design
4. Test locally with `docker-compose`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Create Pull Request on GitHub

### For Bug Fixes
1. Create bug branch: `git checkout -b bugfix/my-bug`
2. Fix the issue
3. Test the fix
4. Commit: `git commit -m "Fix: my bug"`
5. Push and create PR

## 📜 License

MIT License - See LICENSE file for details

## 👤 Author

**Subhash0910**

---

## 🎉 You're All Set!

**Start building your PLM application now!**

```bash
# Clone
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app

# Run
docker-compose up -d

# Access
# Frontend: http://localhost
# Backend: http://localhost:8080/api/v1
# Swagger: http://localhost:8080/api/v1/swagger-ui.html
```

**Happy Coding! 🚀**
