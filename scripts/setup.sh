#!/bin/bash

# AirTrack Project Setup Script
# This script sets up the development environment

set -e

echo "🌟 Welcome to AirTrack Setup!"
echo "==============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detected"

# Check if Docker is installed (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker detected"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker not detected (optional for development)"
    DOCKER_AVAILABLE=false
fi

# Create environment files from examples
echo "📄 Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "⚠️  backend/.env already exists, skipping..."
fi

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✅ Created frontend/.env.local from template"
else
    echo "⚠️  frontend/.env.local already exists, skipping..."
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p frontend/public/images
echo "✅ Directories created"

echo ""
echo "🎉 Setup completed successfully!"
echo "==============================="
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your MongoDB URI and API keys"
echo "2. Update frontend/.env.local with your backend URL"
echo ""
echo "To start development:"
echo "• Backend: cd backend && npm run dev"
echo "• Frontend: cd frontend && npm run dev"
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "Or use Docker Compose:"
    echo "• docker-compose up -d"
    echo ""
fi

echo "📖 Check README.md for detailed setup instructions"
echo "🐛 Report issues at: https://github.com/yourusername/airtrack" 