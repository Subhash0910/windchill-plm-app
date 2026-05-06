FROM maven:3.9-eclipse-temurin-17 AS build
ENV MAVEN_OPTS="-Xmx384m -XX:MaxMetaspaceSize=128m"
WORKDIR /app
COPY windchill-backend/pom.xml .
COPY windchill-backend/backend-common/ backend-common/
COPY windchill-backend/backend-domain/ backend-domain/
COPY windchill-backend/backend-repository/ backend-repository/
COPY windchill-backend/backend-service/ backend-service/
COPY windchill-backend/backend-api/ backend-api/
RUN mvn package -DskipTests -Dmaven.test.skip=true -q -T 1C

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=build /app/backend-api/target/backend-api-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","-Xms128m","-Xmx384m","app.jar"]
