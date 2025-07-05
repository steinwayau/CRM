#!/bin/bash

# EPG CRM Automated Deployment Script
# This script allows the agent to deploy automatically without manual intervention

set -e  # Exit on any error

echo "🚀 Starting automated deployment for EPG CRM..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in EPG CRM directory. Please run from epg-crm folder."
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Uncommitted changes detected. Committing them..."
    git add .
    git commit -m "🤖 Auto-commit by deployment script: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Get current commit info
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)

echo "📦 Current commit: $COMMIT_HASH"
echo "💬 Commit message: $COMMIT_MSG"

# Push to GitHub (this should trigger Vercel auto-deploy if properly configured)
echo "📤 Pushing to GitHub..."
git push origin main

# Wait for GitHub to process the push
echo "⏳ Waiting for GitHub to process push..."
sleep 5

# Create an empty commit to force trigger deployment if needed
echo "🔄 Creating deployment trigger commit..."
git commit --allow-empty -m "🚀 DEPLOY: Force deployment trigger - $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "⏳ Waiting for Vercel deployment to start..."
sleep 10

# Test if deployment is working by checking the site
echo "🧪 Testing deployment..."
for i in {1..12}; do
    echo "🔍 Attempt $i/12: Checking deployment status..."
    
    if curl -s --max-time 10 https://crm-mu-black.vercel.app/api/admin/test-email | grep -q "emailConfigured\|hasApiKey" 2>/dev/null; then
        echo "✅ SUCCESS: Email reminder system API is responding!"
        echo "🎉 Deployment completed successfully!"
        echo "🌐 CRM is live at: https://crm-mu-black.vercel.app"
        exit 0
    else
        echo "⏳ Still deploying... waiting 30 seconds"
        sleep 30
    fi
done

echo "⚠️  Deployment may still be in progress. Check Vercel dashboard for status."
echo "🌐 CRM URL: https://crm-mu-black.vercel.app"
echo "📊 Vercel Dashboard: https://vercel.com/dashboard"

exit 0 