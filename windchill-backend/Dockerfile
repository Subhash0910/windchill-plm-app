# Multi-stage build for Spring Boot backend (multi-module Maven project)

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# -------------------------------------------------------
# Copy ALL pom.xml files first for optimal Docker caching.
# Maven needs the full module tree to resolve the parent POM.
# -------------------------------------------------------
COPY pom.xml .
COPY backend-common/pom.xml backend-common/pom.xml
COPY backend-domain/pom.xml backend-domain/pom.xml
COPY backend-repository/pom.xml backend-repository/pom.xml
COPY backend-service/pom.xml backend-service/pom.xml
COPY backend-api/pom.xml backend-api/pom.xml

# Download all dependencies (this layer is cached as long as pom files don't change)
RUN mvn dependency:go-offline -B

# Copy all source code (full project tree including all submodule src folders)
COPY . .

# Build the runnable API module and all modules it depends on (-am)
RUN mvn clean package -pl backend-api -am -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 appuser && \
    adduser -D -u 1001 -G appuser appuser

# Create directories for file storage
RUN mkdir -p /opt/windchill/files && \
    chown -R appuser:appuser /opt/windchill/files

# Copy JAR from the backend-api module target
COPY --from=build /app/backend-api/target/*.jar app.jar

# Change ownership
RUN chown appuser:appuser app.jar

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=docker", "app.jar"]
