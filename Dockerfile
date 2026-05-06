FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache wget
WORKDIR /app
RUN mkdir -p /app/data
RUN wget -q -O app.jar "https://github.com/Subhash0910/windchill-plm-app/releases/download/v1.0.0/windchill-backend.jar"
EXPOSE 8080
ENTRYPOINT ["java","-jar","-Xms128m","-Xmx384m","app.jar"]
