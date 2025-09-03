# Server (Node.js + Express + TypeScript) - Development Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies (including dev deps for tsx)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the server source
COPY . .

# The app listens internally on 5000; we map 8080->5000 in docker-compose
EXPOSE 5000

# Default command can be overridden by compose
CMD ["npm", "run", "dev"]
