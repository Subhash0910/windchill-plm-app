#!/bin/bash
set -e
echo "=== Windchill PLM Deployment ==="

# Check for .env
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.template .env
    echo "Please edit .env with your production secrets, then re-run."
    exit 1
fi

# Build frontend
echo "[1/3] Building frontend..."
cd windchill-frontend && npm install --silent && npm run build && cd ..

# Build backend
echo "[2/3] Building backend..."
cd windchill-backend && mvn clean package -Dmaven.test.skip=true -DskipTests -q && cd ..

# Deploy with Docker Compose
echo "[3/3] Starting services..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Windchill PLM deployed!"
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost:8080"
echo "  Health:   http://localhost:8080/actuator/health"
echo ""
echo "  Logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop:     docker compose -f docker-compose.prod.yml down"
