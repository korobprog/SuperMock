#!/bin/bash

echo "🔍 Checking Super Mock dev environment..."

# Проверяем наличие необходимых файлов
echo "📁 Checking required files..."

if [ ! -f "dev.env" ]; then
    echo "❌ dev.env file not found! Please copy dev.env.example to dev.env"
    exit 1
fi

if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ docker-compose.dev.yml not found!"
    exit 1
fi

if [ ! -f "backend/prisma/schema.prisma" ]; then
    echo "❌ Prisma schema not found!"
    exit 1
fi

echo "✅ Required files found"

# Проверяем Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed!"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker not running!"
    exit 1
fi

echo "✅ Docker is running"

# Проверяем Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed!"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18 (current: $(node -v))"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Проверяем pnpm
echo "📦 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not installed!"
    exit 1
fi

echo "✅ pnpm version: $(pnpm --version)"

# Проверяем зависимости
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed! Run: pnpm install"
    exit 1
fi

echo "✅ Dependencies installed"

# Проверяем порты
echo "🔌 Checking ports..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 is in use"
else
    echo "✅ Port 3000 is free"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 5173 is in use"
else
    echo "✅ Port 5173 is free"
fi

echo "🎉 Dev environment check completed!"
echo ""
echo "🚀 To start dev environment, run:"
echo "   pnpm run dev:setup"
