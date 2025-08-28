# Project Structure Overview

This document outlines the new separated structure of the Keyword Generator application.

## 📁 Directory Structure

```
keyword-generator/
├── client/                      # Frontend Application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom hooks
│   │   └── lib/                # Utilities
│   ├── shared/                 # Shared schemas (client copy)
│   │   ├── schema.ts
│   │   └── countries-languages.ts
│   ├── public/                 # Static assets
│   ├── Dockerfile              # Frontend container config
│   ├── docker-compose.yml      # Frontend services
│   ├── nginx.conf              # Nginx configuration
│   ├── package.json            # Frontend dependencies
│   ├── .env                    # Frontend environment
│   └── README.md               # Frontend documentation
├── server/                      # Backend Application
│   ├── shared/                 # Shared schemas (server copy)
│   │   ├── schema.ts
│   │   └── countries-languages.ts
│   ├── init-db/                # Database initialization
│   │   └── 01-init.sql
│   ├── logs/                   # Application logs
│   ├── routes.ts               # API routes
│   ├── storage.ts              # Database operations
│   ├── db.ts                   # Database connection
│   ├── index.ts                # Server entry point
│   ├── projectStatusMonitor.ts # Project monitoring
│   ├── googleKeywordPlanner.ts # Google API integration
│   ├── replitAuth.ts           # Authentication
│   ├── vite.ts                 # Vite middleware
│   ├── Dockerfile              # Backend container config
│   ├── docker-compose.yml      # Backend services + PostgreSQL
│   ├── drizzle.config.ts       # Database configuration
│   ├── package.json            # Backend dependencies
│   ├── .env                    # Backend environment
│   └── README.md               # Backend documentation
├── README.md                   # Main project documentation
├── LICENSE                     # MIT License
├── .gitignore                  # Git ignore rules
└── STRUCTURE.md               # This file
```

## 🔧 Key Changes from Previous Structure

### Before (Monolithic)
- Single `docker-compose.yml` in root
- Shared `frontend.Dockerfile` and `backend.Dockerfile` in root
- Single `package.json` with all dependencies
- Shared `shared/` folder for both client and server

### After (Separated)
- Independent `client/` and `server/` folders
- Each folder has its own:
  - `Dockerfile`
  - `docker-compose.yml`
  - `package.json`
  - `README.md`
  - `.env` configuration
  - Copy of `shared/` schemas

## 🚀 Benefits of New Structure

### 1. **Independent Development**
- Frontend and backend can be developed separately
- Different teams can work on different parts
- Independent dependency management
- Separate CI/CD pipelines possible

### 2. **Simplified Deployment**
- Each service can be deployed independently
- Frontend can be deployed to CDN/static hosting
- Backend can be deployed to different infrastructure
- Easier horizontal scaling

### 3. **Better Organization**
- Clear separation of concerns
- Easier to navigate codebase
- Service-specific documentation
- Reduced cognitive load

### 4. **Docker Benefits**
- Smaller container images (only necessary files)
- Independent service scaling
- Better resource allocation
- Simplified debugging

## 🔄 Migration Commands

### For existing projects, to migrate:

```bash
# 1. Backup your current project
cp -r . ../keyword-generator-backup

# 2. Create new structure (already done)
# 3. Move your existing client files to client/src/
# 4. Move your existing server files (already in server/)
# 5. Update imports in server files (already done)

# 6. Test new structure
cd client && docker-compose up -d
cd ../server && docker-compose up -d

# 7. Verify everything works
curl http://localhost:3001  # Frontend
curl http://localhost:5000/api/health  # Backend
```

## 🛠️ Development Workflow

### Frontend Development
```bash
cd client
npm install
npm run dev              # Development server
npm run docker:up        # Docker development
```

### Backend Development
```bash
cd server
npm install
npm run dev              # Development server
npm run docker:up        # Docker development (includes DB)
```

### Full Stack Development
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd client && npm run dev

# Or with Docker
cd server && docker-compose up -d
cd ../client && docker-compose up -d
```

## 📦 Service Communication

### Development Mode
- Frontend (Vite): `http://localhost:5173` → Backend: `http://localhost:5000`
- API calls proxied through Vite configuration

### Docker Mode
- Frontend (Nginx): `http://localhost:3001` → Backend: `http://host.docker.internal:5000`
- API calls proxied through Nginx configuration

### Production Mode
- Frontend: Served by CDN or web server
- Backend: API server
- Communication via configured API URL

## 🔧 Configuration Files

### Client Configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `nginx.conf` - Nginx configuration for Docker

### Server Configuration
- `drizzle.config.ts` - Database ORM configuration
- `tsconfig.json` - TypeScript configuration
- Docker configurations for PostgreSQL

## 📋 Shared Schema Management

Both `client/shared/` and `server/shared/` contain identical copies of:
- `schema.ts` - Database and validation schemas
- `countries-languages.ts` - Static data

**Important**: When updating schemas, update both copies to maintain consistency.

## 🚀 Deployment Options

### Option 1: Separate Deployment
- Deploy `client/` to CDN (Netlify, Vercel, S3)
- Deploy `server/` to cloud provider (AWS, GCP, Heroku)
- Use external database service

### Option 2: Docker Deployment
- Build and deploy both services with Docker
- Use orchestration (Docker Compose, Kubernetes)
- Include PostgreSQL container or external DB

### Option 3: Hybrid Deployment
- Frontend on CDN for performance
- Backend on container platform
- Managed database service

## 🔍 Troubleshooting

### Common Issues
1. **Schema mismatch**: Ensure both `client/shared/` and `server/shared/` are identical
2. **Port conflicts**: Check ports 3001, 5000, 5432 are available
3. **Environment variables**: Each service has its own `.env` file
4. **Docker networking**: Ensure services can communicate

### Debug Commands
```bash
# Check if services are running
docker ps

# Check logs
docker-compose -f server/docker-compose.yml logs -f
docker-compose -f client/docker-compose.yml logs -f

# Test connectivity
curl http://localhost:3001
curl http://localhost:5000/api/health
```

This structure provides better separation of concerns, easier maintenance, and more flexible deployment options while maintaining the same functionality.
