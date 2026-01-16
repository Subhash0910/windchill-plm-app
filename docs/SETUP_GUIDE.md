# Setup Guide - Windchill PLM Application

## Prerequisites

- Java JDK 17+
- Maven 3.8+
- Node.js 18+
- npm 9+
- MySQL 8.0+
- Redis 6.0+ (optional, for caching)
- Git

## Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
```

### Step 2: Database Setup

#### Option A: Using Docker

```bash
docker run --name windchill-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=windchill_db -p 3306:3306 -d mysql:8.0
```

#### Option B: Manual MySQL Setup

```sql
CREATE DATABASE windchill_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'windchill'@'localhost' IDENTIFIED BY 'windchill123';
GRANT ALL PRIVILEGES ON windchill_db.* TO 'windchill'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3: Redis Setup (Optional)

```bash
# Docker
docker run --name windchill-redis -p 6379:6379 -d redis:7-alpine

# Or manually if installed
redis-server
```

### Step 4: Backend Setup

```bash
cd windchill-backend

# Build
mvn clean install

# Run
mvn spring-boot:run -pl backend-api
```

Backend starts on: `http://localhost:8080/api/v1`

**Swagger UI**: `http://localhost:8080/api/v1/swagger-ui.html`

### Step 5: Frontend Setup

```bash
cd ../windchill-frontend

# Install dependencies
npm install

# Development mode
npm run dev
```

Frontend starts on: `http://localhost:5173`

## Docker Compose Setup

For complete containerized setup:

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

## Troubleshooting

### Backend won't start

1. Check MySQL is running: `mysql -u root -p`
2. Verify Java version: `java -version` (should be 17+)
3. Check if port 8080 is free: `lsof -i :8080`
4. Clear Maven cache: `mvn clean`

### Frontend won't start

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear npm cache: `npm cache clean --force`
3. Check Node version: `node -v` (should be 18+)
4. Check if port 5173 is free: `lsof -i :5173`

### Database connection issues

1. Verify MySQL credentials in `application.yml`
2. Check MySQL is running: `mysql -u root -p`
3. Create database if missing:
   ```sql
   CREATE DATABASE windchill_db;
   ```

## Environment Variables

### Backend (.env or application.yml)

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/windchill_db
    username: root
    password: password
  redis:
    host: localhost
    port: 6379

jwt:
  secret: your-secret-key
  expiration: 86400000
```

### Frontend (.env.dev)

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_ENV=development
```

## Testing

### Backend Unit Tests

```bash
cd windchill-backend
mvn test
mvn test -pl backend-service
```

### Frontend Component Tests

```bash
cd windchill-frontend
npm run test
```

## Build for Production

### Backend

```bash
cd windchill-backend
mvn clean package -DskipTests
```

JAR file: `backend-api/target/backend-api-1.0.0-SNAPSHOT.jar`

### Frontend

```bash
cd windchill-frontend
npm run build
```

Build directory: `dist/`

## Deployment

### Docker Compose Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Server Deployment

```bash
# Copy backend JAR
scp backend-api/target/backend-api-1.0.0-SNAPSHOT.jar user@server:/app/

# Run backend
java -jar /app/backend-api-1.0.0-SNAPSHOT.jar

# Build and deploy frontend (Nginx)
npm run build
# Copy dist/ to Nginx html directory
```

## Default Credentials

After migration, use:

- **Username**: admin
- **Password**: admin123

⚠️ **Change default credentials in production!**

## API Documentation

Swagger UI automatically available at:
`http://localhost:8080/api/v1/swagger-ui.html`

OpenAPI JSON: `http://localhost:8080/api/v1/api-docs`

## IDE Setup

### IntelliJ IDEA

1. Open project
2. Mark `windchill-backend` as Maven project root
3. Install Lombok plugin: Settings → Plugins → Search "Lombok"
4. Enable annotation processing: Settings → Build → Compiler → Annotation Processors → Enable

### VS Code

1. Install extensions:
   - ES7+ React/Redux/React-Native snippets
   - Prettier
   - ESLint
2. Format on save: Settings → Editor: Format On Save

## Common Commands

```bash
# Backend
mvn clean install              # Build all modules
mvn spring-boot:run -pl backend-api  # Run backend
mvn test                       # Run tests
mvn clean                      # Clean build

# Frontend
npm install                    # Install dependencies
npm run dev                    # Development server
npm run build                  # Production build
npm run lint                   # Lint code
npm run test                   # Run tests

# Docker
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f backend # View backend logs
```

## Support

For issues or questions:
1. Check documentation
2. Review error logs
3. Create GitHub issue
4. Contact team

---

**Happy coding! 🚀**
