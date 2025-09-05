#!/bin/sh
set -e

echo "🚀 Starting SuperMock Backend..."

# Check if Prisma client exists
if [ ! -d "node_modules/.prisma" ]; then
    echo "⚠️  Prisma client not found, generating..."
    npx prisma generate --schema prisma/schema.prisma
    echo "✅ Prisma client generated successfully"
else
    echo "✅ Prisma client already exists"
fi

# Check database connection
echo "🔍 Checking database connection..."
if npx prisma db push --schema prisma/schema.prisma --accept-data-loss; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection failed, but continuing..."
fi

echo "🎯 Starting application..."
exec "$@"
