# Docker Setup Guide

This guide explains how to run the Keyword Generator application using Docker with a local PostgreSQL database.

## Architecture

The application consists of three main services:
- **Frontend**: React/Vite application served by Nginx
- **Backend**: Node.js/Express API server
- **Database**: PostgreSQL database

## Prerequisites

- Docker and Docker Compose installed
- At least 2GB of available RAM
- Ports 80, 5000, and 5432 available on your system

## Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration (optional for basic setup):
```bash
# The app will work with default values
# Add Google OAuth credentials if you need Google Keyword Planner integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Build and Start Services

```bash
# Build all services
npm run docker:build

# Start all services in detached mode
npm run docker:up

# View logs
npm run docker:logs
```

### 3. Initialize Database

```bash
# Push database schema
npm run docker:db:push
```

### 4. Access Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Database**: localhost:5432 (postgres/postgres)

## Available Scripts

```bash
# Docker management
npm run docker:build          # Build all Docker images
npm run docker:up             # Start services in detached mode
npm run docker:down           # Stop all services
npm run docker:logs           # View service logs
npm run docker:restart        # Restart all services
npm run docker:clean          # Stop services and remove volumes
npm run docker:db:push        # Push database schema to running container

# Development
npm run docker:dev            # Start in development mode with hot reload
```

## Development Mode

For development with hot reload:

```bash
npm run docker:dev
```

This will:
- Mount your source code as volumes
- Enable hot reload for backend changes
- Expose debug port 9229 for Node.js debugging
- Use a separate development database

## Service Details

### Frontend Service
- **Image**: nginx:alpine
- **Port**: 80
- **Features**: Gzip compression, client-side routing support, API proxy to backend

### Backend Service
- **Image**: node:18-alpine
- **Port**: 5000
- **Features**: Health checks, automatic restart, log mounting

### Database Service
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Credentials**: postgres/postgres
- **Database**: keyword_generator

## Troubleshooting

### Services won't start
```bash
# Check service status
docker-compose ps

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Database connection issues
```bash
# Check database health
docker-compose exec postgres pg_isready -U postgres

# Connect to database directly
docker-compose exec postgres psql -U postgres -d keyword_generator
```

### Reset everything
```bash
# Complete cleanup
npm run docker:clean
docker-compose build --no-cache
npm run docker:up
npm run docker:db:push
```

### Performance Issues
- Ensure Docker has enough memory allocated (2GB minimum)
- Check available disk space
- Monitor resource usage: `docker stats`

## Production Deployment

For production deployment:

1. Update environment variables in `.env.docker`
2. Use a proper reverse proxy (nginx/traefik)
3. Set up SSL certificates
4. Configure backup strategies for PostgreSQL
5. Monitor resource usage and logs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@postgres:5432/keyword_generator` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `USD_RATE` | Currency conversion rate | `87.67` |
| `PORT` | Backend service port | `5000` |

## Data Persistence

- Database data is persisted in Docker volumes
- Logs are mounted to `./logs` directory
- Use `docker volume ls` to see created volumes

## Security Notes

- Default PostgreSQL credentials are for development only
- Change credentials for production deployment
- The application runs as non-root user in containers
- Network isolation between services
