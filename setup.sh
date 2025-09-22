#!/bin/bash

# Traffid Projects - Local Setup Script
# This script helps set up the project for local development

set -e

echo "🚀 Setting up Traffid Projects for local development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then 
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo "🔧 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database URL and other settings"
else
    echo "✅ Environment file already exists"
fi

# Check if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "⚠️  PostgreSQL client not found. You may need to install PostgreSQL or use Docker."
fi

# Setup VS Code workspace if not exists
if [ ! -d .vscode ]; then
    echo "🔧 VS Code configuration already created"
else
    echo "✅ VS Code configuration found"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Edit .env file with your database configuration:"
echo "   DATABASE_URL=postgresql://username:password@localhost:5432/traffid_projects"
echo ""
echo "2. Start PostgreSQL database:"
echo "   Option A: docker-compose up -d postgres"
echo "   Option B: Start your local PostgreSQL service"
echo ""
echo "3. Push database schema:"
echo "   npm run db:push"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "5. Open http://localhost:5000"
echo ""
echo "For detailed setup instructions, see LOCAL_SETUP.md"