#!/bin/bash

echo "🚀 Starting SuperMock development environment..."

# Kill existing processes
echo "🔄 Stopping existing processes..."
pkill -f "vite" 2>/dev/null
pkill -f "node server/index.mjs" 2>/dev/null

# Wait a moment
sleep 2

# Start backend
echo "🔧 Starting backend server..."
cd backend && NODE_ENV=development PORT=3000 USE_MONGODB=false USE_REDIS=false node server/index.mjs &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:3000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend && NODE_ENV=development VITE_API_URL=http://localhost:3000 pnpm exec vite --config frontend/vite.config.ts &
FRONTEND_PID=$!

echo "✅ Development environment started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
