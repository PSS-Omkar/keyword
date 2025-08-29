# Frontend/Backend Build Separation

This project now has properly separated frontend and backend builds to avoid conflicts and ensure clean container builds.

## Project Structure

```
├── client/                  # Frontend React application
│   ├── package.json        # Frontend-only dependencies
│   ├── Dockerfile          # Frontend container build
│   └── src/                # React source code
├── server/                  # Backend Express application  
│   ├── package.json        # Backend-only dependencies
│   ├── Dockerfile          # Backend container build
│   └── *.ts                # Server source code
├── package.json            # Root package with build scripts only
├── docker-compose.yml      # Production containers
└── docker-compose.dev.yml  # Development containers
```

## Key Changes Made

1. **Root package.json cleaned**: Removed mixed dependencies, kept only build orchestration scripts
2. **Separate Dockerfiles**: Each service builds only its required dependencies
3. **Docker Compose**: Proper container orchestration for both dev and production
4. **Build Scripts**: Root scripts delegate to appropriate client/server scripts

## Development

### Local Development
```bash
# Install all dependencies
npm run install:all

# Run development servers separately
npm run dev:client  # Frontend on port 3000
npm run dev:server  # Backend on port 5000

# Or run both with Docker
npm run docker:dev
```

### Building

```bash
# Build both applications
npm run build

# Build separately
npm run build:client
npm run build:server

# Build with Docker
npm run docker:build
```

## Production Deployment

```bash
# Start production containers
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

## Container Benefits

- **Faster builds**: Each container only installs its required dependencies
- **Smaller images**: No unnecessary packages in production containers
- **Better caching**: Docker layer caching works more efficiently
- **Cleaner separation**: Frontend and backend completely isolated
- **No conflicts**: React and Express dependencies don't interfere

## Troubleshooting

If you encounter issues:

1. **Clean install**: `npm run docker:clean && npm run install:all`
2. **Check logs**: `npm run docker:logs`
3. **Restart containers**: `npm run docker:restart`

The separated build system ensures that frontend containers only contain client-side code and backend containers only contain server-side code, eliminating the previous mixed build conflicts.
