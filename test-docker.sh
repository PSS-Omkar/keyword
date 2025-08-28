#!/bin/bash

# Docker Setup Test Script
echo "🐳 Testing Docker Setup for Keyword Generator"
echo "============================================="

# Check if Docker is installed
echo "📋 Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed: $(docker --version)"
else
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
echo "📋 Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is installed: $(docker-compose --version)"
elif docker compose version &> /dev/null; then
    echo "✅ Docker Compose (v2) is installed: $(docker compose version)"
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Docker daemon is running
echo "📋 Checking Docker daemon..."
if docker info &> /dev/null; then
    echo "✅ Docker daemon is running"
else
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi

# Check available ports
echo "📋 Checking port availability..."
check_port() {
    local port=$1
    local service=$2
    if lsof -i :$port &> /dev/null; then
        echo "⚠️  Port $port is in use (needed for $service)"
        return 1
    else
        echo "✅ Port $port is available ($service)"
        return 0
    fi
}

ports_ok=true
check_port 80 "Frontend" || ports_ok=false
check_port 5000 "Backend" || ports_ok=false
check_port 5432 "PostgreSQL" || ports_ok=false

if [ "$ports_ok" = false ]; then
    echo "⚠️  Some ports are in use. You may need to stop other services or modify docker-compose.yml"
fi

# Test Docker Compose file validity
echo "📋 Validating Docker Compose configuration..."
if docker-compose -f docker-compose.yml config &> /dev/null || docker compose -f docker-compose.yml config &> /dev/null; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors"
    exit 1
fi

# Check environment file
echo "📋 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file not found. Copying from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "❌ .env.example not found"
    fi
fi

echo ""
echo "🎯 Docker Setup Test Complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run docker:build"
echo "   npm run docker:up"
echo "   npm run docker:db:push"
echo ""
echo "🌐 Access the application at:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:5000"
echo "   Health:   http://localhost:5000/api/health"
echo ""
echo "📚 For more information, see DOCKER_SETUP.md"
