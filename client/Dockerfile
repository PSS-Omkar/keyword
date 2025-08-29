# Frontend Dockerfile
FROM node:18-alpine as base

WORKDIR /app

# Copy root config files
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY tsconfig.json ./

# Copy client package files and install dependencies
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci

# Go back to root and copy source files
WORKDIR /app
COPY client/ ./client/

# Development stage
FROM base as development
WORKDIR /app
EXPOSE 3000
CMD ["npm", "run", "dev", "--prefix", "client"]

# Builder stage
FROM base as builder
WORKDIR /app
# Build the frontend
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
