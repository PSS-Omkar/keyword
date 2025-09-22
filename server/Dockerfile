# Backend Dockerfile (server-only)
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY server/package*.json ./
RUN npm ci

# Copy sources
COPY server/ ./server/
COPY shared/ ./shared/

# Build
RUN npm run --prefix server build || true

# Runtime image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules and built files
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/server ./server
COPY --from=builder /app/shared ./shared

EXPOSE 5000

# Default to memory mode unless DATABASE_URL is provided
ENV STORAGE_MODE=memory

CMD ["node", "dist/index.js"]
