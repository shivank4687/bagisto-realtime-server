#!/bin/bash

echo "🚀 Starting Bagisto Real-Time Server..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
echo ""

# Start server
echo "✨ Starting server in development mode..."
echo ""
npm run dev
