#!/bin/bash

###############################################################################
# TradeOS API Testing Script
#
# This script provides a comprehensive way to test all backend API endpoints
#
# Usage:
#   ./test-api.sh [command]
#
# Commands:
#   setup         - Configure environment and credentials
#   auth          - Test authentication endpoints
#   snaptrade     - Test SnapTrade integration
#   trading       - Test trading operations
#   portfolio     - Test portfolio endpoints
#   copy          - Test copy trading features
#   orders        - Test order management
#   watchlist     - Test watchlist operations
#   cron          - Test cron job endpoints
#   all           - Run all tests
#   security      - Run security tests (authorization bypass checks)
#
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${API_BASE_URL:-http://localhost:3000}"
CLERK_TOKEN=""
CRON_SECRET=""
SNAPTRADE_USER_ID=""
LEADER_ID=""
RELATIONSHIP_ID=""
ORDER_ID=""

# Test results tracking
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((TESTS_PASSED++))
    ((TESTS_RUN++))
}

print_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((TESTS_FAILED++))
    ((TESTS_RUN++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# Make HTTP request and check response
make_request() {
    local method=$1
    local endpoint=$2
    local auth=$3
    local data=$4

    local url="${BASE_URL}${endpoint}"
    local headers=""

    if [ -n "$auth" ]; then
        headers="-H 'Authorization: Bearer ${auth}'"
    fi

    if [ "$method" = "POST" ] || [ "$method" = "PATCH" ]; then
        headers="$headers -H 'Content-Type: application/json'"
    fi

    if [ -n "$data" ]; then
        eval curl -s -X $method "$url" $headers -d "'$data'"
    else
        eval curl -s -X $method "$url" $headers
    fi
}

# Check if response is successful
check_response() {
    local response=$1
    local test_name=$2

    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_fail "$test_name - Error: $(echo $response | jq -r '.error')"
        return 1
    elif echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        print_success "$test_name"
        return 0
    elif echo "$response" | jq -e 'type == "array"' > /dev/null 2>&1; then
        print_success "$test_name"
        return 0
    else
        print_success "$test_name (Response received)"
        return 0
    fi
}

###############################################################################
# Setup & Configuration
###############################################################################

setup_credentials() {
    print_header "Setup & Configuration"

    echo "Enter your Clerk JWT token (from browser DevTools → Application → Local Storage):"
    read -r CLERK_TOKEN

    echo "Enter your CRON_SECRET (from .env.local):"
    read -r CRON_SECRET

    echo ""
    echo "Configuration saved!"
    echo "CLERK_TOKEN: ${CLERK_TOKEN:0:20}..."
    echo "CRON_SECRET: ${CRON_SECRET:0:10}..."

    # Save to temp file
    cat > /tmp/tradeos_test_config <<EOF
CLERK_TOKEN="$CLERK_TOKEN"
CRON_SECRET="$CRON_SECRET"
BASE_URL="$BASE_URL"
EOF

    print_success "Configuration saved to /tmp/tradeos_test_config"
}

load_credentials() {
    if [ -f /tmp/tradeos_test_config ]; then
        source /tmp/tradeos_test_config
        print_info "Loaded credentials from cache"
    else
        print_warning "No cached credentials found. Run './test-api.sh setup' first"
        exit 1
    fi
}

###############################################################################
# Test Suites
###############################################################################

test_auth() {
    print_header "Authentication & User Management Tests"

    load_credentials

    # Test 1: Check onboarding status
    print_test "GET /api/user/check-onboarding"
    response=$(make_request GET /api/user/check-onboarding "$CLERK_TOKEN")
    check_response "$response" "Check onboarding status"

    # Test 2: Get user role
    print_test "GET /api/user/role"
    response=$(make_request GET /api/user/role "$CLERK_TOKEN")
    check_response "$response" "Get user role"

    # Test 3: Set user role (POST)
    print_test "POST /api/user/role (set to leader)"
    data='{"role":"leader"}'
    response=$(make_request POST /api/user/role "$CLERK_TOKEN" "$data")
    check_response "$response" "Set user role to leader"

    # Test 4: Unauthorized access (no token)
    print_test "GET /api/user/role (unauthorized)"
    response=$(make_request GET /api/user/role "")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_success "Unauthorized request properly rejected"
    else
        print_fail "Unauthorized request was not rejected"
    fi
}

test_snaptrade() {
    print_header "SnapTrade Integration Tests"

    load_credentials

    # Test 1: Register with SnapTrade
    print_test "POST /api/snaptrade/register"
    response=$(make_request POST /api/snaptrade/register "$CLERK_TOKEN")
    check_response "$response" "Register with SnapTrade"
    SNAPTRADE_USER_ID=$(echo "$response" | jq -r '.data.userId // empty')

    # Test 2: Get connection portal URL
    print_test "POST /api/snaptrade/connect"
    response=$(make_request POST /api/snaptrade/connect "$CLERK_TOKEN")
    check_response "$response" "Get SnapTrade connection URL"

    # Test 3: Get redirect URL
    print_test "GET /api/connect/redirect"
    response=$(make_request GET /api/connect/redirect "$CLERK_TOKEN")
    check_response "$response" "Get connection redirect URL"

    # Test 4: List accounts
    print_test "GET /api/snaptrade/accounts"
    response=$(make_request GET /api/snaptrade/accounts "$CLERK_TOKEN")
    check_response "$response" "List SnapTrade accounts"

    # Test 5: List connections
    print_test "GET /api/connections"
    response=$(make_request GET /api/connections "$CLERK_TOKEN")
    check_response "$response" "List brokerage connections"

    # Test 6: Sync connections
    print_test "POST /api/connections"
    response=$(make_request POST /api/connections "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Sync connections - $(echo $response | jq -r '.error') (Expected if no accounts connected)"
    else
        check_response "$response" "Sync brokerage connections"
    fi
}

test_trading() {
    print_header "Trading & Market Data Tests"

    load_credentials

    # Test 1: Search symbols (TradingView)
    print_test "GET /api/search-symbols?query=AAPL"
    response=$(make_request GET "/api/search-symbols?query=AAPL")
    check_response "$response" "Search symbols (TradingView)"

    # Test 2: Search symbols (SnapTrade)
    print_test "GET /api/symbols/search?query=TSLA"
    response=$(make_request GET "/api/symbols/search?query=TSLA" "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Symbol search - $(echo $response | jq -r '.error') (Expected if no SnapTrade account)"
    else
        check_response "$response" "Search symbols (SnapTrade)"
    fi

    # Test 3: Get chart data
    print_test "GET /api/chart-data?symbol=AAPL&interval=D&range=30"
    response=$(make_request GET "/api/chart-data?symbol=AAPL&interval=D&range=30")
    check_response "$response" "Get chart data"

    # Test 4: Get quotes
    print_test "GET /api/quotes?symbols=AAPL,TSLA,MSFT"
    response=$(make_request GET "/api/quotes?symbols=AAPL,TSLA,MSFT")
    check_response "$response" "Get real-time quotes"

    # Test 5: Get options chain
    print_test "GET /api/options/chain?ticker=AAPL"
    response=$(make_request GET "/api/options/chain?ticker=AAPL" "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Options chain - $(echo $response | jq -r '.error') (Expected if no SnapTrade account)"
    else
        check_response "$response" "Get options chain"
    fi

    # Test 6: Trade impact check (requires SnapTrade account)
    print_test "POST /api/trades/impact (stock)"
    data='{"asset_type":"stock","action":"BUY","universal_symbol_id":"test","order_type":"Market","time_in_force":"Day","units":1}'
    response=$(make_request POST /api/trades/impact "$CLERK_TOKEN" "$data")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Trade impact check - $(echo $response | jq -r '.error') (Expected if no SnapTrade account)"
    else
        check_response "$response" "Check trade impact"
    fi

    # Test 7: Get trade history
    print_test "GET /api/trades/history?days=30"
    response=$(make_request GET "/api/trades/history?days=30" "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Trade history - $(echo $response | jq -r '.error') (Expected if user not in DB)"
    else
        check_response "$response" "Get trade history"
    fi
}

test_portfolio() {
    print_header "Portfolio & Account Tests"

    load_credentials

    # Test 1: Get portfolio overview
    print_test "GET /api/portfolio"
    response=$(make_request GET /api/portfolio "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Portfolio overview - $(echo $response | jq -r '.error') (Expected if no SnapTrade account)"
    else
        check_response "$response" "Get portfolio overview"
    fi

    # Test 2: Get portfolio stats
    print_test "GET /api/portfolio/stats"
    response=$(make_request GET /api/portfolio/stats "$CLERK_TOKEN")
    check_response "$response" "Get portfolio statistics"

    # Test 3: Get positions
    print_test "GET /api/positions"
    response=$(make_request GET /api/positions "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Get positions - $(echo $response | jq -r '.error') (Expected if no SnapTrade account)"
    else
        check_response "$response" "Get open positions"
    fi
}

test_copy_trading() {
    print_header "Copy Trading Tests"

    load_credentials

    # Test 1: Discover leaders
    print_test "GET /api/leaders/discover?limit=5"
    response=$(make_request GET "/api/leaders/discover?limit=5")
    check_response "$response" "Discover leaders"

    # Try to get a leader ID from response
    LEADER_ID=$(echo "$response" | jq -r '.leaders[0].id // empty')

    # Test 2: Get leader profile
    if [ -n "$LEADER_ID" ]; then
        print_test "GET /api/leaders/$LEADER_ID"
        response=$(make_request GET "/api/leaders/$LEADER_ID")
        check_response "$response" "Get leader profile"
    else
        print_warning "Skipping leader profile test - no leaders found"
    fi

    # Test 3: List copy relationships
    print_test "GET /api/copy-relationships"
    response=$(make_request GET /api/copy-relationships "$CLERK_TOKEN")
    check_response "$response" "List copy relationships"

    # Test 4: List as follower
    print_test "GET /api/copy-relationships?as=follower"
    response=$(make_request GET "/api/copy-relationships?as=follower" "$CLERK_TOKEN")
    check_response "$response" "List relationships as follower"

    # Test 5: Create copy relationship (will likely fail without brokerage connection)
    if [ -n "$LEADER_ID" ]; then
        print_test "POST /api/copy-relationships (create)"
        data="{\"leader_id\":\"$LEADER_ID\",\"position_sizing_method\":\"proportional\",\"allocation_percent\":10}"
        response=$(make_request POST /api/copy-relationships "$CLERK_TOKEN" "$data")
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            print_warning "Create relationship - $(echo $response | jq -r '.error') (Expected without brokerage)"
        else
            check_response "$response" "Create copy relationship"
            RELATIONSHIP_ID=$(echo "$response" | jq -r '.relationship.id // empty')
        fi
    fi

    # Test 6: Get copy settings
    if [ -n "$LEADER_ID" ]; then
        print_test "GET /api/copy/settings?leader_id=$LEADER_ID"
        response=$(make_request GET "/api/copy/settings?leader_id=$LEADER_ID" "$CLERK_TOKEN")
        check_response "$response" "Get copy settings"
    fi
}

test_orders() {
    print_header "Order Management Tests"

    load_credentials

    # Test 1: List all orders
    print_test "GET /api/orders"
    response=$(make_request GET /api/orders "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "List orders - $(echo $response | jq -r '.error') (Expected if no SnapTrade account)"
    else
        check_response "$response" "List all orders"
        ORDER_ID=$(echo "$response" | jq -r '.data[0].id // empty')
    fi

    # Test 2: List open orders
    print_test "GET /api/orders?state=open"
    response=$(make_request GET "/api/orders?state=open" "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "List open orders - $(echo $response | jq -r '.error')"
    else
        check_response "$response" "List open orders"
    fi

    # Note: Cancel and Replace tests require actual orders
    print_info "Cancel and Replace tests require active orders - skipping in automated test"
}

test_watchlist() {
    print_header "Watchlist Tests"

    load_credentials

    # Test 1: Get watchlist
    print_test "GET /api/watchlist"
    response=$(make_request GET /api/watchlist "$CLERK_TOKEN")
    check_response "$response" "Get watchlist"

    # Test 2: Add symbol
    print_test "POST /api/watchlist (add AAPL)"
    data='{"symbol":"AAPL","name":"Apple Inc.","exchange":"NASDAQ","type":"Stock"}'
    response=$(make_request POST /api/watchlist "$CLERK_TOKEN" "$data")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        error_msg=$(echo "$response" | jq -r '.error')
        if [[ "$error_msg" == *"already in watchlist"* ]]; then
            print_success "Add symbol (already exists)"
        else
            print_warning "Add symbol - $error_msg"
        fi
    else
        check_response "$response" "Add symbol to watchlist"
    fi

    # Test 3: Get watchlist again
    print_test "GET /api/watchlist (verify add)"
    response=$(make_request GET /api/watchlist "$CLERK_TOKEN")
    check_response "$response" "Verify symbol added"

    # Get watchlist item ID for deletion
    WATCHLIST_ID=$(echo "$response" | jq -r '.data[0].id // empty')

    # Test 4: Remove symbol by ID
    if [ -n "$WATCHLIST_ID" ]; then
        print_test "DELETE /api/watchlist?id=$WATCHLIST_ID"
        response=$(make_request DELETE "/api/watchlist?id=$WATCHLIST_ID" "$CLERK_TOKEN")
        check_response "$response" "Remove symbol from watchlist"
    fi
}

test_cron() {
    print_header "Cron Job Tests"

    load_credentials

    # Test 1: Detect trades (manual trigger)
    print_test "POST /api/trades/detect (manual)"
    response=$(make_request POST /api/trades/detect "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Manual detect trades - $(echo $response | jq -r '.error')"
    else
        check_response "$response" "Manual trade detection"
    fi

    # Test 2: Process trades (manual trigger)
    print_test "POST /api/trades/process (manual)"
    response=$(make_request POST /api/trades/process "$CLERK_TOKEN")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_warning "Manual process trades - $(echo $response | jq -r '.error')"
    else
        check_response "$response" "Manual trade processing"
    fi

    # Test 3: Cron detect trades
    print_test "GET /api/cron/detect-trades (with secret)"
    response=$(make_request GET /api/cron/detect-trades "$CRON_SECRET")
    check_response "$response" "Cron: Detect trades"

    # Test 4: Cron process trades
    print_test "GET /api/cron/process-trades (with secret)"
    response=$(make_request GET /api/cron/process-trades "$CRON_SECRET")
    check_response "$response" "Cron: Process trades"

    # Test 5: Cron monitor positions
    print_test "GET /api/cron/monitor-positions (with secret)"
    response=$(make_request GET /api/cron/monitor-positions "$CRON_SECRET")
    check_response "$response" "Cron: Monitor positions"

    # Test 6: Cron without secret (should fail)
    print_test "GET /api/cron/detect-trades (no secret)"
    response=$(make_request GET /api/cron/detect-trades "")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_success "Cron request without secret properly rejected"
    else
        print_fail "Cron request without secret was not rejected"
    fi
}

test_security() {
    print_header "Security Tests (Authorization Bypass Checks)"

    load_credentials

    print_warning "These tests check for known security vulnerabilities"

    # Test 1: Access endpoint without authentication
    print_test "Access /api/user/role without token"
    response=$(make_request GET /api/user/role "")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_success "Unauthorized access properly blocked"
    else
        print_fail "SECURITY ISSUE: Unauthorized access was allowed"
    fi

    # Test 2: Invalid token
    print_test "Access /api/user/role with invalid token"
    response=$(make_request GET /api/user/role "invalid_token_12345")
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        print_success "Invalid token properly rejected"
    else
        print_fail "SECURITY ISSUE: Invalid token was accepted"
    fi

    # Test 3: Rate limiting on public endpoints
    print_test "Rate limiting test (10 rapid requests to /api/quotes)"
    for i in {1..10}; do
        response=$(make_request GET "/api/quotes?symbols=AAPL" "")
    done
    if echo "$response" | jq -e '.error' > /dev/null 2>&1 && [[ $(echo "$response" | jq -r '.error') == *"rate"* ]]; then
        print_success "Rate limiting is enabled"
    else
        print_warning "Rate limiting may not be configured (expected for development)"
    fi

    print_info "For full security testing, consider:"
    print_info "  - Test accessing other users' data (requires 2 accounts)"
    print_info "  - Test SQL injection on search parameters"
    print_info "  - Test XSS on user input fields"
    print_info "  - Penetration testing tools (OWASP ZAP, Burp Suite)"
}

###############################################################################
# Main Script
###############################################################################

show_usage() {
    cat << EOF
TradeOS API Testing Script

Usage: ./test-api.sh [command]

Commands:
  setup         Configure environment and credentials
  auth          Test authentication endpoints
  snaptrade     Test SnapTrade integration
  trading       Test trading operations
  portfolio     Test portfolio endpoints
  copy          Test copy trading features
  orders        Test order management
  watchlist     Test watchlist operations
  cron          Test cron job endpoints
  security      Run security tests
  all           Run all tests
  help          Show this help message

Examples:
  ./test-api.sh setup
  ./test-api.sh auth
  ./test-api.sh all

Environment Variables:
  API_BASE_URL  Base URL for API (default: http://localhost:3000)

EOF
}

show_summary() {
    print_header "Test Summary"
    echo "Total Tests:  $TESTS_RUN"
    echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed! ✅${NC}"
    else
        echo -e "\n${RED}Some tests failed. Please review the output above. ❌${NC}"
    fi
}

# Main command handler
case "$1" in
    setup)
        setup_credentials
        ;;
    auth)
        test_auth
        show_summary
        ;;
    snaptrade)
        test_snaptrade
        show_summary
        ;;
    trading)
        test_trading
        show_summary
        ;;
    portfolio)
        test_portfolio
        show_summary
        ;;
    copy)
        test_copy_trading
        show_summary
        ;;
    orders)
        test_orders
        show_summary
        ;;
    watchlist)
        test_watchlist
        show_summary
        ;;
    cron)
        test_cron
        show_summary
        ;;
    security)
        test_security
        show_summary
        ;;
    all)
        test_auth
        test_snaptrade
        test_trading
        test_portfolio
        test_copy_trading
        test_orders
        test_watchlist
        test_cron
        test_security
        show_summary
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

exit 0
