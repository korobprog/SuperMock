#!/bin/bash

echo "🧪 Testing SuperMock API Endpoints"
echo "=================================="

BASE_URL="https://localhost"
HOST_HEADER="supermock.ru"
USER_ID="1736594064"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-""}
    
    echo -n "Testing $method $endpoint... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -k -H "Host: $HOST_HEADER" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    else
        response=$(curl -s -k -H "Host: $HOST_HEADER" "$BASE_URL$endpoint")
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ OK${NC}"
        echo "Response: $response" | head -c 100
        echo "..."
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
    echo
}

# Test all endpoints
echo "1. Health Check"
test_endpoint "/api/health"

echo "2. User Settings"
test_endpoint "/api/user-settings/$USER_ID"

echo "3. User Tools"
test_endpoint "/api/user-tools?userId=$USER_ID&profession=frontend"

echo "4. User Init (POST)"
test_endpoint "/api/init" "POST" "{\"tg\":{\"id\":$USER_ID,\"first_name\":\"Test\",\"username\":\"testuser\"},\"language\":\"ru\",\"initData\":\"telegram_auth_hash\"}"

echo "5. Frontend (should return HTML)"
test_endpoint "/"

echo "✅ API Testing Complete!"

