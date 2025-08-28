# Keyword Generator - Full Stack Application

A comprehensive keyword research and campaign management platform built with modern web technologies.

## 🏗️ Project Structure

```
keyword-generator/
├── client/                    # Frontend React Application
│   ├── src/                  # React source code
│   ├── shared/               # Shared schemas (copy)
│   ├── Dockerfile            # Frontend container
│   ├── docker-compose.yml    # Frontend services
│   ├── package.json          # Frontend dependencies
│   └── README.md             # Frontend documentation
├── server/                    # Backend Node.js Application
│   ├── shared/               # Shared schemas (copy)
│   ├── init-db/              # Database initialization
│   ├── logs/                 # Application logs
│   ├── Dockerfile            # Backend container
│   ├── docker-compose.yml    # Backend services (includes PostgreSQL)
│   ├── package.json          # Backend dependencies
│   └── README.md             # Backend documentation
├── README.md                 # This file - project overview
├── LICENSE                   # MIT License
└── .gitignore               # Git ignore rules
```

## 🚀 Features

### Frontend (React)
- Modern React 18 with TypeScript
- Vite for fast development and optimized builds
- Tailwind CSS for styling
- Component library with Radix UI
- TanStack Query for data fetching
- Responsive design

### Backend (Node.js)
- RESTful API with Express.js
- PostgreSQL database with Drizzle ORM
- Google Keyword Planner integration
- Session-based authentication
- TypeScript for type safety
- Real-time currency conversion

### Infrastructure
- Docker containerization for both frontend and backend
- PostgreSQL database in container
- Nginx reverse proxy for frontend
- Health checks and logging
- Development and production configurations

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Option 1: Full Docker Setup (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd keyword-generator

# 2. Start backend services (includes PostgreSQL)
cd server
docker-compose up -d

# 3. Initialize database schema
docker-compose exec backend npm run db:push

# 4. Start frontend service
cd ../client
docker-compose up -d

# 5. Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:5000
# Health Check: http://localhost:5000/api/health
```

### Option 2: Local Development

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd keyword-generator

# 2. Start PostgreSQL database
cd server
docker-compose up postgres -d

# 3. Start backend server
npm install
cp .env.example .env
npm run dev

# 4. In another terminal, start frontend
cd ../client
npm install
cp .env.example .env
npm run dev

# 5. Access the application
# Frontend: http://localhost:5173 (Vite dev server)
# Backend API: http://localhost:5000
```

## 🐳 Docker Configuration

### Backend Services (server/docker-compose.yml)
- **PostgreSQL Database**: Port 5432
- **Backend API**: Port 5000
- **Volume**: Persistent database storage
- **Health Checks**: Automatic service monitoring

### Frontend Services (client/docker-compose.yml)
- **React App**: Port 3001
- **Nginx**: Static file serving and API proxy
- **Health Checks**: Service availability monitoring

## 🔧 Environment Configuration

### Backend (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/keyword_generator

# Google OAuth (Optional - for Google Keyword Planner)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Application Settings
NODE_ENV=development
PORT=5000
USD_RATE=87.67
```

### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000

# Builder.io Configuration
VITE_PUBLIC_BUILDER_KEY=5f94e1ffba2a40a0be80cbadd7806726

# Development Settings
NODE_ENV=development
```

## 🛠️ Development Workflow

### Backend Development
```bash
cd server

# Start development server with hot reload
npm run dev

# Database operations
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations

# Docker operations
npm run docker:up        # Start all services
npm run docker:logs      # View logs
npm run docker:down      # Stop services
```

### Frontend Development
```bash
cd client

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Docker operations
npm run docker:up        # Start frontend service
npm run docker:logs      # View logs
npm run docker:down      # Stop service
```

## 📦 Available Scripts

### Root Level Commands
```bash
# Start all services with Docker
docker-compose -f server/docker-compose.yml up -d
docker-compose -f client/docker-compose.yml up -d

# Stop all services
docker-compose -f server/docker-compose.yml down
docker-compose -f client/docker-compose.yml down

# View all logs
docker-compose -f server/docker-compose.yml logs -f
docker-compose -f client/docker-compose.yml logs -f
```

### Backend Commands (in server/)
```bash
npm run dev              # Development server
npm run start            # Production server
npm run build            # Build for production
npm run db:push          # Push database schema
npm run docker:up        # Start with Docker
npm run docker:logs      # View Docker logs
```

### Frontend Commands (in client/)
```bash
npm run dev              # Development server (Vite)
npm run build            # Build for production
npm run preview          # Preview production build
npm run docker:up        # Start with Docker
npm run docker:logs      # View Docker logs
```

## 🌐 API Documentation

### Base URL
- **Local Development**: `http://localhost:5000/api`
- **Docker**: `http://localhost:5000/api`

### Core Endpoints

#### Authentication
- `GET /api/auth/user` - Get current user information
- `POST /api/login` - User login
- `POST /api/logout` - User logout

#### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

#### Keywords
- `GET /api/keywords` - List keywords
- `POST /api/keywords/generate` - Generate keywords using Google Keyword Planner
- `POST /api/test-keywords` - Test keyword generation

#### System
- `GET /api/health` - Health check endpoint
- `GET /api/stats` - Dashboard statistics
- `POST /api/init` - Initialize default data

## 🗄️ Database Schema

The application uses PostgreSQL with these main entities:

- **Users**: User accounts and authentication
- **Projects**: Keyword research projects
- **Campaigns**: Advertising campaigns
- **Keywords**: Generated keywords with search volume and bid data
- **Advertisers**: Advertiser information and settings
- **Traffic Sources**: Campaign traffic sources configuration
- **Campaign Groups**: Campaign organization and grouping

## 🔐 Authentication & Security

- Session-based authentication with Express Session
- Google OAuth 2.0 integration (optional)
- CORS protection
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- Security headers and middleware

## 🚢 Production Deployment

### Docker Production Setup
```bash
# 1. Clone repository on production server
git clone <your-repo-url>
cd keyword-generator

# 2. Configure production environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit environment files with production values

# 3. Start backend services
cd server
docker-compose up -d

# 4. Initialize database
docker-compose exec backend npm run db:push

# 5. Start frontend services
cd ../client
docker-compose up -d

# 6. Configure reverse proxy (nginx/traefik) for SSL
```

### Manual Production Setup
```bash
# Backend
cd server
npm install --production
npm run build
npm run start:prod

# Frontend
cd client
npm install
npm run build
# Serve dist/ folder with web server
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose -f server/docker-compose.yml ps postgres

# Check database logs
docker-compose -f server/docker-compose.yml logs postgres

# Test connection
docker-compose -f server/docker-compose.yml exec postgres psql -U postgres -d keyword_generator
```

#### Frontend Build Errors
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json dist/
npm install
npm run build
```

#### API Connection Issues
```bash
# Check backend health
curl http://localhost:5000/api/health

# Check backend logs
docker-compose -f server/docker-compose.yml logs backend

# Verify environment variables
docker-compose -f server/docker-compose.yml exec backend env | grep -E "(DATABASE_URL|PORT|NODE_ENV)"
```

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3001  # Frontend
lsof -i :5000  # Backend
lsof -i :5432  # PostgreSQL

# Stop conflicting services or modify ports in docker-compose.yml
```

### Development Tips

1. **Use Health Checks**: Always verify services are healthy before debugging
2. **Check Logs**: Use `docker-compose logs -f` to monitor real-time logs
3. **Database Access**: Use database clients to inspect data directly
4. **Environment Variables**: Ensure all required env vars are set correctly
5. **Network Issues**: Verify Docker networks and port mappings

## 📊 Monitoring & Logging

### Health Checks
- Backend: `http://localhost:5000/api/health`
- Frontend: `http://localhost:3001` (should serve React app)
- Database: Built-in PostgreSQL health checks

### Logs
- Backend logs: `docker-compose -f server/docker-compose.yml logs -f backend`
- Frontend logs: `docker-compose -f client/docker-compose.yml logs -f frontend`
- Database logs: `docker-compose -f server/docker-compose.yml logs -f postgres`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (both frontend and backend)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write clear commit messages
- Test your changes locally with Docker
- Update documentation as needed
- Ensure both frontend and backend work together

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check individual README files in `client/` and `server/` folders
- **Issues**: Create GitHub issues for bugs or feature requests
- **Development**: See troubleshooting section above

## 🔄 Version History

- **v1.0.0**: Initial release with Docker containerization
  - Separate frontend and backend containers
  - PostgreSQL database integration
  - Google Keyword Planner API
  - Modern React + TypeScript frontend
  - Express.js + TypeScript backend

---

**Quick Commands Reference:**

```bash
# Start everything with Docker
cd server && docker-compose up -d
cd ../client && docker-compose up -d

# Initialize database
cd server && docker-compose exec backend npm run db:push

# Access application
# Frontend: http://localhost:3001
# Backend: http://localhost:5000/api/health

# Stop everything
cd server && docker-compose down
cd ../client && docker-compose down
```
