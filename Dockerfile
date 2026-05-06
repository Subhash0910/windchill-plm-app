FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN mkdir -p /app/data
ADD https://github.com/Subhash0910/windchill-plm-app/releases/download/v1.0.0/windchill-backend.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","-Xms128m","-Xmx384m","app.jar"]
