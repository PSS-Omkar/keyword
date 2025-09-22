# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy root-level files needed to run the server
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install deps (root contains all deps incl. server)
RUN npm ci

# Copy backend source code
COPY server/ ./server/
COPY shared/ ./shared/

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production
EXPOSE 5000

# Healthcheck against an always-available API endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -f http://localhost:5000/api/auth/user || exit 1

# Run directly with tsx (avoids separate build step)
CMD ["npx", "tsx", "server/index.ts"]
