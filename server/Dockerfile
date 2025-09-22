# Backend Dockerfile
FROM node:18-alpine as base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm ci

# Copy server source code and shared files
COPY server/ ./server/
COPY server/shared/ ./shared/

# Development stage
FROM base as development
ENV NODE_ENV=development
EXPOSE 5000 9229
CMD ["npx", "tsx", "watch", "server/index.ts"]

# Production stage  
FROM base as production

# Install curl for health checks
RUN apk add --no-cache curl

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npx", "tsx", "server/index.ts"]
