# Backend - Keyword Generator Server

Node.js/Express backend API server for the Keyword Generator platform.

## 🚀 Features

- RESTful API with Express.js
- PostgreSQL database with Drizzle ORM
- Google Keyword Planner integration
- Session-based authentication
- TypeScript for type safety
- Docker containerization

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Push database schema
npm run db:push

# Build for production
npm run build
```

## 🐳 Docker Setup

### Quick Start
```bash
# Build and run with Docker Compose (includes PostgreSQL)
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Push database schema to running container
docker-compose exec backend npm run db:push

# Stop services
docker-compose down
```

### Configuration

#### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/keyword_generator

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Application Configuration
NODE_ENV=development
PORT=5000
USD_RATE=87.67
```

#### Docker Commands
```bash
# Build image
docker build -t keyword-generator-backend .

# Run container
docker run -p 5000:5000 keyword-generator-backend

# Run with environment file
docker run --env-file .env -p 5000:5000 keyword-generator-backend
```

## 📁 Project Structure

```
server/
├── shared/               # Shared schemas and types
│   ├── schema.ts        # Database schema definitions
│   └── countries-languages.ts
├── init-db/             # Database initialization scripts
├── logs/                # Application logs
├── routes.ts            # API route definitions
├── storage.ts           # Database operations
├── db.ts                # Database connection
├── index.ts             # Server entry point
├── projectStatusMonitor.ts  # Project status monitoring
├── googleKeywordPlanner.ts  # Google Ads API integration
├── replitAuth.ts        # Authentication logic
├── vite.ts              # Vite middleware (development)
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
├── drizzle.config.ts    # Drizzle ORM configuration
└── package.json         # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
npm run dev              # Start development server
npm run start            # Start production server
npm run build            # Build for production
npm run check            # TypeScript type checking
npm run db:push          # Push database schema
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
```

## 📦 Dependencies

### Core
- Express.js (web framework)
- TypeScript (type safety)
- Drizzle ORM (database toolkit)
- PostgreSQL (pg driver)

### Authentication & Session
- Passport.js (authentication)
- Express Session (session management)
- Google Auth Library (OAuth)

### External APIs
- Axios (HTTP client)
- Google Ads API (keyword research)
- CoinGecko API (currency conversion)

### Development
- tsx (TypeScript execution)
- esbuild (bundling)
- Drizzle Kit (migrations)

## 🌐 API Endpoints

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

### System
- `GET /api/health` - Health check
- `GET /api/stats` - Dashboard statistics
- `POST /api/init` - Initialize default data

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and profiles
- **projects** - Keyword research projects
- **campaigns** - Advertising campaigns
- **keywords** - Generated keywords with metrics
- **advertisers** - Advertiser information
- **traffic_sources** - Campaign traffic sources
- **campaign_groups** - Campaign groupings

## 🔐 Authentication

- Session-based authentication with Express Session
- Google OAuth 2.0 integration (optional)
- Hardcoded test user for development

## 🚢 Production Deployment

### Using Docker
1. Build the image: `docker build -t keyword-generator-backend .`
2. Run with proper environment variables
3. Ensure PostgreSQL is available
4. Run database migrations

### Manual Deployment
1. Build: `npm run build`
2. Set production environment variables
3. Start: `npm run start:prod`

## 🔍 Troubleshooting

### Common Issues

**Database connection failed:**
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Check connection string
echo $DATABASE_URL
```

**Build fails:**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API calls fail:**
- Check if server is running on correct port
- Verify environment variables are set
- Check database connectivity
- Review server logs

### Development Tips

- Use `/api/health` endpoint to verify server status
- Check logs with `docker-compose logs -f backend`
- Use database client to inspect data
- Monitor server console for detailed error messages

## 📄 License

MIT License - see root LICENSE file for details.
