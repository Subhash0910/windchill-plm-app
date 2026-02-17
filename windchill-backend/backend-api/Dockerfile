# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Build context is set to ./windchill-backend in docker-compose.yml
# Copy parent pom first for better layer caching
COPY pom.xml .

# Copy module POMs (improves cache when only sources change)
COPY backend-common/pom.xml backend-common/
COPY backend-domain/pom.xml backend-domain/
COPY backend-repository/pom.xml backend-repository/
COPY backend-service/pom.xml backend-service/
COPY backend-api/pom.xml backend-api/

# Copy sources
COPY backend-common backend-common/
COPY backend-domain backend-domain/
COPY backend-repository backend-repository/
COPY backend-service backend-service/
COPY backend-api backend-api/

# Build the application
RUN mvn clean package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Needed for Docker HEALTHCHECK and docker-compose healthcheck
RUN apk add --no-cache wget

# Copy the jar from builder
COPY --from=builder /build/backend-api/target/*.jar app.jar

# Create non-root user
RUN addgroup -g 1001 appuser && adduser -D -u 1001 -G appuser appuser
USER appuser

# Expose port
EXPOSE 8080

# Health check - increased timeout and retries
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=10 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
CMD ["java", "-Xmx512m", "-Xms256m", "-XX:+UseG1GC", "-XX:MaxGCPauseMillis=200", "-jar", "app.jar"]
