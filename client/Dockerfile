# Frontend Dockerfile (client-only)
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY client/package*.json ./
RUN npm ci

# Copy source
COPY client/ ./
# Copy shared (for @shared alias during build)
COPY shared/ /app/shared/
COPY attached_assets/ /app/attached_assets/

# Build
RUN npm run build

# Runtime image
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
