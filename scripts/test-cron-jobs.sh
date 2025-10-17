#!/bin/bash

# Test Cron Jobs Script
# Tests all background jobs locally

BASE_URL="http://localhost:3000"
CRON_SECRET="${CRON_SECRET:-development}"

echo "================================"
echo "Testing CopyTrade Background Jobs"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local name=$1
  local endpoint=$2

  echo -e "${YELLOW}Testing: ${name}${NC}"
  echo "Endpoint: ${BASE_URL}${endpoint}"

  response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}${endpoint}" \
    -H "Authorization: Bearer ${CRON_SECRET}")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP ${http_code})${NC}"
    echo "Response: ${body}" | jq '.' 2>/dev/null || echo "${body}"
  else
    echo -e "${RED}✗ Failed (HTTP ${http_code})${NC}"
    echo "Response: ${body}"
  fi

  echo ""
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "${BASE_URL}" > /dev/null; then
  echo -e "${RED}✗ Server is not running at ${BASE_URL}${NC}"
  echo "Please start the server with: npm run dev"
  exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test all cron endpoints
test_endpoint "Trade Detection" "/api/cron/detect-trades"
test_endpoint "Trade Processing" "/api/cron/process-trades"
test_endpoint "Position Monitoring" "/api/cron/monitor-positions"

echo "================================"
echo "All tests completed!"
echo "================================"
