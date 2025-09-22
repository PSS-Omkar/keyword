# Frontend - Keyword Generator Client

React frontend application for the Keyword Generator platform.

## 🚀 Features

- Modern React 18 with TypeScript
- Vite for fast development and optimized builds
- Tailwind CSS for styling
- Component library with Radix UI
- Responsive design

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐳 Docker Setup

### Quick Start
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Configuration

#### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Vite/Builder.io Configuration
VITE_PUBLIC_BUILDER_KEY=your-builder-key

# API Configuration  
VITE_API_URL=http://localhost:5000

# Development Configuration
NODE_ENV=development
```

#### Docker Commands
```bash
# Build image
docker build -t keyword-generator-frontend .

# Run container
docker run -p 3001:80 keyword-generator-frontend

# Run with environment file
docker run --env-file .env -p 3001:80 keyword-generator-frontend
```

## 📁 Project Structure

```
client/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (Radix)
│   │   └── *.tsx         # Feature components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and configurations
│   └── App.tsx           # Main application component
├── shared/               # Shared schemas and types
├── public/               # Static assets
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── nginx.conf           # Nginx configuration
└── package.json         # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

## 📦 Dependencies

### Core
- React 18 + TypeScript
- Vite (build tool)
- React Router (wouter)
- TanStack Query (data fetching)

### UI & Styling
- Tailwind CSS
- Radix UI components
- Lucide React (icons)
- Framer Motion (animations)

### Forms & Validation
- React Hook Form
- Zod validation

## 🌐 API Integration

The frontend communicates with the backend API:

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Session-based
- **Data Fetching**: TanStack Query

### API Endpoints Used
- `GET /api/auth/user` - Get current user
- `GET /api/projects` - List projects  
- `POST /api/projects` - Create project
- `GET /api/campaigns` - List campaigns
- `GET /api/keywords` - List keywords

## 🚢 Production Deployment

### Using Docker
1. Build the image: `docker build -t keyword-generator-frontend .`
2. Run with proper environment variables
3. Use reverse proxy (nginx/traefik) for SSL

### Manual Deployment
1. Build: `npm run build`
2. Serve `dist/` folder with web server
3. Configure API proxy or CORS

## 🔍 Troubleshooting

### Common Issues

**Build fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API calls fail:**
- Check `VITE_API_URL` environment variable
- Ensure backend is running on correct port
- Check network connectivity

**Docker build fails:**
```bash
# Check if all files exist
ls -la Dockerfile nginx.conf

# Build with no cache
docker build --no-cache -t keyword-generator-frontend .
```

### Development Tips

- Use browser dev tools for debugging
- Check network tab for API calls
- Use React DevTools extension
- Monitor console for errors

## 📄 License

MIT License - see root LICENSE file for details.
