# Client (React + Vite) - Development Dockerfile
FROM node:20-alpine

# Ensure dependencies for watchers work well inside containers
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

WORKDIR /app

# Install deps first (uses cached layer when only src changes)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app
COPY . .

EXPOSE 5173

# Run Vite in dev mode and listen on all interfaces for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
