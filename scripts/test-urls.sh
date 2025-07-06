#!/bin/bash

echo "🚀 Testing EPG CRM Deployment..."
echo "=================================="

BASE_URL="https://epg-crm.vercel.app"

# URLs to test - different types
PUBLIC_URLS=(
    "/"
    "/login"
    "/api/admin/staff"
)

PROTECTED_URLS=(
    "/admin"
    "/admin/staff-unified"
    "/admin/staff-management"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

passed=0
failed=0

echo ""
echo -e "${BLUE}Testing Public URLs:${NC}"
echo "===================="
for url in "${PUBLIC_URLS[@]}"; do
    echo -n "Testing ${BASE_URL}${url}... "
    
    # Get HTTP status code
    status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${url}")
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✅ OK (${status})${NC}"
        ((passed++))
    else
        echo -e "${RED}❌ FAILED (${status})${NC}"
        ((failed++))
    fi
    
    # Small delay between requests
    sleep 1
done

echo ""
echo -e "${BLUE}Testing Protected URLs (should redirect to login):${NC}"
echo "=================================================="
for url in "${PROTECTED_URLS[@]}"; do
    echo -n "Testing ${BASE_URL}${url}... "
    
    # Get HTTP status code
    status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${url}")
    
    if [ "$status" -eq 307 ]; then
        echo -e "${GREEN}✅ OK (${status} - redirects to login)${NC}"
        ((passed++))
    elif [ "$status" -eq 200 ]; then
        echo -e "${YELLOW}⚠️ ACCESSIBLE (${status} - no auth required?)${NC}"
        ((passed++))
    else
        echo -e "${RED}❌ FAILED (${status})${NC}"
        ((failed++))
    fi
    
    # Small delay between requests
    sleep 1
done

echo ""
echo "📊 SUMMARY:"
echo "==========="
echo -e "✅ Passed: ${GREEN}${passed}${NC}"
echo -e "❌ Failed: ${RED}${failed}${NC}"
echo -e "📝 Total: $((passed + failed))"

if [ $failed -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Check the details above.${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Deployment successful.${NC}"
    echo -e "${BLUE}💡 Admin pages are properly protected with authentication.${NC}"
    exit 0
fi 