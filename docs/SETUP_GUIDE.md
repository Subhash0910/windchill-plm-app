# Setup Guide

## Recommended Local Setup

### Option A: Docker Compose

1. Copy `.env.example` to `.env`.
2. Fill in the values you care about for local development.
3. Run:

```bash
docker-compose up -d --build
```

4. Open `http://localhost:3000`.

This is the easiest way to run the full stack locally.

## Manual Setup

### Backend

From `windchill-backend`:

```bash
mvn clean package -pl backend-api -am
mvn spring-boot:run -pl backend-api
```

### Frontend

From `windchill-frontend`:

```bash
npm install
npm run build
```

### Local Services

If you are not using Docker Compose, you need:

- MySQL
- Redis
- the environment variables from `.env.example` or equivalent shell vars

## Environment Variables

The app is moving toward environment-driven configuration for all deployment-sensitive values:

- database URL and password
- Redis host
- JWT secret
- public app URL
- email settings

Do not commit real deployment credentials.

## Public Demo Guidance

For a hosted demo:

- use stable seed data
- use a clearly documented demo login or guided sample mode
- keep the branding positioned as a Windchill-inspired learning workspace
- keep Swagger and sensitive actuator surfaces disabled in production
