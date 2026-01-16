FROM node:18-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm config set legacy-peer-deps true && npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
