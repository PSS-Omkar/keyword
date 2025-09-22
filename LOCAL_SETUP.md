# Local Development Setup for Traffid Projects

This guide will help you run the Traffid Projects application on your local machine using VS Code.

## Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   # Check your Node.js version
   node --version
   npm --version
   ```

2. **PostgreSQL** (v12 or higher)
   - Install PostgreSQL locally or use a cloud service like Neon, Supabase, or AWS RDS

3. **VS Code** with recommended extensions:
   - TypeScript and JavaScript Language Features
   - Prettier - Code formatter
   - ESLint
   - Auto Rename Tag
   - Bracket Pair Colorizer

## Setup Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd traffid-projects

# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb traffid_projects

# Or using psql
psql -U postgres
CREATE DATABASE traffid_projects;
\q
```

#### Option B: Cloud Database (Recommended)
Use services like:
- **Neon** (https://neon.tech) - Serverless PostgreSQL
- **Supabase** (https://supabase.com) - PostgreSQL with additional features
- **Railway** (https://railway.app) - Simple PostgreSQL hosting

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/traffid_projects

# Authentication Configuration  
SESSION_SECRET=generate-a-secure-random-string-here
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-replit-app-id-if-using-replit-auth
REPLIT_DOMAINS=localhost:5000,127.0.0.1:5000

# Environment
NODE_ENV=development

# API Configuration
API_KEY=traffid-api-key-2025
```

### 4. Database Schema Setup

Run the database push command to create tables:

```bash
npm run db:push
```

This will create all necessary tables based on the Drizzle schema.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

## Authentication Setup

### Option 1: Replit Authentication (Recommended for full features)
1. Create a Replit app at https://replit.com
2. Configure OAuth settings in your Replit app
3. Add your `REPL_ID` to the `.env` file
4. Set `REPLIT_DOMAINS=localhost:5000`

### Option 2: Bypass Authentication (Development Only)
For local development, you can temporarily bypass authentication by modifying the `isAuthenticated` middleware in `server/replitAuth.ts`:

```typescript
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Development bypass - REMOVE IN PRODUCTION
  if (process.env.NODE_ENV === 'development') {
    req.user = { 
      claims: { sub: 'dev-user-123' },
      access_token: 'dev-token',
      expires_at: Date.now() + 3600000
    };
    return next();
  }
  
  // ... rest of authentication logic
};
```

## Project Structure

```
traffid-projects/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── db.ts             # Database connection
│   ├── storage.ts        # Data access layer
│   └── replitAuth.ts     # Authentication logic
├── shared/               # Shared types and schemas
│   ├── schema.ts         # Database schema definitions
│   └── countries-languages.ts # Location/language mapping
└── package.json          # Dependencies and scripts
```

## Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)

# Production Build
npm run build           # Build for production
npm start              # Start production server
```

## API Testing

The application includes a built-in API testing interface at:
http://localhost:5000/api

Use the API key: `traffid-api-key-2025` for external API access.

## Common Issues & Solutions

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Verify database exists and user has proper permissions

### Port Already in Use
```bash
# Kill process using port 5000
npx kill-port 5000

# Or use a different port
PORT=3000 npm run dev
```

### TypeScript Errors
```bash
# Clear TypeScript cache
npx tsc --build --clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear all caches
npm run clean  # (if available)
rm -rf dist/
rm -rf node_modules/.cache/
```

## VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "tsx/cjs"]
    }
  ]
}
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a secure `SESSION_SECRET`
3. Configure proper `REPLIT_DOMAINS` for your domain
4. Use a production PostgreSQL database
5. Set up proper SSL certificates
6. Configure reverse proxy (nginx) if needed

## Support

For issues specific to the Traffid Projects application:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database schema is up to date with `npm run db:push`
4. Check that all required dependencies are installed

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique values for `SESSION_SECRET`
- Regularly update dependencies: `npm audit fix`
- Configure CORS properly for production
- Use HTTPS in production environments