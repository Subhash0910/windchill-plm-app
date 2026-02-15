# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Copy root pom.xml
COPY pom.xml .

# Copy windchill-backend parent pom.xml
COPY windchill-backend/pom.xml windchill-backend/

# Copy windchill-backend source code
COPY windchill-backend windchill-backend/

# Build the application from windchill-backend
RUN cd windchill-backend && mvn clean package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the jar from builder
COPY --from=builder /build/windchill-backend/backend-api/target/*.jar app.jar

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
