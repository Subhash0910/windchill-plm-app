# ── Build Frontend ─────────────────────────────────────────────
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY windchill-frontend/package*.json ./
RUN npm ci --silent
COPY windchill-frontend/ ./
RUN npm run build

# ── Production Nginx ───────────────────────────────────────────
FROM nginx:alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html
EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
