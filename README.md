# Keyword Generator Application

A full-stack keyword research and campaign management application built with React, Node.js, and PostgreSQL.

## 🚀 Features

- **Keyword Research**: Generate keywords using Google Keyword Planner API
- **Campaign Management**: Create and manage advertising campaigns
- **Project Organization**: Organize campaigns by projects and advertisers
- **Multi-platform Support**: Support for various traffic sources
- **Currency Conversion**: Real-time currency conversion with CoinGecko integration
- **Dashboard Analytics**: Project statistics and performance tracking

## 🏗️ Architecture

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Docker + Docker Compose
- **Authentication**: Session-based authentication with Passport.js

## 🐳 Docker Setup (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB of available RAM
- Ports 80, 5000, and 5432 available

### Quick Start
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd keyword-generator

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration (optional for basic setup)

# 3. Build and start services
npm run docker:build
npm run docker:up

# 4. Initialize database
npm run docker:db:push

# 5. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:5000
# Health Check: http://localhost:5000/api/health
```

### Docker Commands
```bash
npm run docker:build          # Build all Docker images
npm run docker:up             # Start services in detached mode
npm run docker:down           # Stop all services
npm run docker:logs           # View service logs
npm run docker:restart        # Restart all services
npm run docker:clean          # Stop services and remove volumes
npm run docker:db:push        # Push database schema
npm run docker:dev            # Start in development mode with hot reload
```

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Configure your DATABASE_URL and other variables

# 3. Set up database
npm run db:push

# 4. Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server
npm run check                  # TypeScript type checking
npm run db:push                # Push database schema
```

## 📁 Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities and configurations
├── server/                    # Backend Express application
│   ├── routes.ts             # API routes
│   ├── storage.ts            # Database operations
│   ├── db.ts                 # Database connection
│   └── index.ts              # Server entry point
├── shared/                    # Shared types and schemas
│   ├── schema.ts             # Database schema
│   └── countries-languages.ts
├── frontend.Dockerfile        # Frontend container
├── backend.Dockerfile         # Backend container
├── docker-compose.yml         # Production Docker setup
├── docker-compose.dev.yml     # Development Docker setup
└── nginx.conf                # Nginx configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Optional |
| `USD_RATE` | Currency conversion rate | `87.67` |
| `PORT` | Backend service port | `5000` |

### Google Keyword Planner Setup (Optional)
1. Create a Google Cloud Project
2. Enable the Google Ads API
3. Create OAuth 2.0 credentials
4. Add credentials to your `.env` file

## 🚢 Production Deployment

### Using Docker (Recommended)
```bash
# 1. Set production environment variables
cp .env.docker .env
# Edit .env with production values

# 2. Deploy with Docker Compose
docker-compose up -d
docker-compose exec backend npm run db:push
```

### Manual Deployment
```bash
# 1. Build the application
npm run build

# 2. Set production environment
export NODE_ENV=production
export DATABASE_URL=your-production-db-url

# 3. Start the server
npm start
```

## 🔍 API Documentation

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Keywords
- `GET /api/keywords` - List keywords
- `POST /api/keywords/generate` - Generate keywords
- `POST /api/test-keywords` - Test keyword generation

### Health Check
- `GET /api/health` - Service health status

## 🧪 Testing

```bash
# Test Docker setup
./test-docker.sh

# Check application health
curl http://localhost:5000/api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Check the [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker setup instructions
- Create an issue for bug reports or feature requests
- Review the logs: `npm run docker:logs`

## 🔧 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :5000
# Stop the conflicting service or change ports in docker-compose.yml
```

**Database connection failed:**
```bash
# Check database health
docker-compose exec postgres pg_isready -U postgres
# Reset database
npm run docker:clean && npm run docker:up
```

**Build failures:**
```bash
# Clean Docker cache
docker system prune -f
npm run docker:build --no-cache
```

For more detailed troubleshooting, see [DOCKER_SETUP.md](DOCKER_SETUP.md).
