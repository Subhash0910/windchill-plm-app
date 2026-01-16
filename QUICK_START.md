# Quick Start Guide

**Get the application running in 5 minutes!**

## Option 1: Docker Compose (Easiest)

```bash
# Clone repository
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app

# Start everything
docker-compose up -d

# Wait 30 seconds for services to start
sleep 30

# Open in browser
# Frontend: http://localhost
# Backend API: http://localhost:8080/api/v1
# Swagger UI: http://localhost:8080/api/v1/swagger-ui.html
```

## Option 2: Local Development

### Prerequisites
- Java 17+
- Node.js 18+
- Maven 3.8+
- MySQL 8.0
- Redis 6+ (optional)

### Backend

```bash
cd windchill-backend
mvn clean install
mvn spring-boot:run -pl backend-api
# Runs on http://localhost:8080/api/v1
```

### Frontend

```bash
cd windchill-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Default Login

- **Username**: admin
- **Password**: admin123

## Common Commands

```bash
# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Access MySQL
mysql -h localhost -u windchill -p windchill123 windchill_db
```

## API Examples

### Get Products
```bash
curl http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Product
```bash
curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product 1",
    "projectId": 1,
    "status": "DRAFT"
  }'
```

## Troubleshooting

**Port already in use?**
```bash
# Change ports in docker-compose.yml
# or kill existing process
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Database connection failed?**
```bash
# Check if MySQL is running
docker ps | grep mysql

# Restart MySQL
docker-compose restart mysql
```

**Redis connection failed?**
```bash
# Redis is optional, you can disable caching
# in application.yml: spring.cache.type=none
```

## Next Steps

1. Read [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) for detailed setup
2. Check [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design
3. Review [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for endpoints
4. Follow [BEST_PRACTICES.md](./docs/BEST_PRACTICES.md) for coding standards

## Support

- 📖 [Full Documentation](./docs/)
- 🐛 [Report Issues](https://github.com/Subhash0910/windchill-plm-app/issues)
- 💬 [Discussions](https://github.com/Subhash0910/windchill-plm-app/discussions)

---

**Happy Coding! 🚀**
