# Frontend Dockerfile
# 1) Build React app with Vite
FROM node:18-alpine AS builder
WORKDIR /app

# Copy root configs needed to build the client app
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY client/ ./client/
COPY shared/ ./shared/

# Build (uses root vite.config.ts which points to client/)
RUN npm run build

# 2) Serve with nginx and proxy /api to backend service
FROM nginx:alpine
RUN apk add --no-cache curl

# Static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config to proxy API to backend service name
COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -f http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"]
