#!/bin/bash

# Production Deployment Script for Connect 4 Multiplayer Game

echo "🚀 Starting production deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend built successfully!"

# Deploy backend to Railway
echo "🚄 Deploying backend to Railway..."
cd backend

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Deploy to Railway
railway deploy

if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed!"
    exit 1
fi

echo "✅ Backend deployed successfully!"

cd ..

# Deploy frontend to Vercel (if vercel CLI is available)
if command -v vercel &> /dev/null; then
    echo "▲ Deploying frontend to Vercel..."
    vercel --prod
    echo "✅ Frontend deployed successfully!"
else
    echo "⚠️  Vercel CLI not found. Deploy manually:"
    echo "   1. Go to https://vercel.com"
    echo "   2. Import your GitHub repository"
    echo "   3. Set environment variables from .env.example"
    echo "   4. Deploy"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "   1. Update REACT_APP_BACKEND_URL in your Vercel environment variables"
echo "   2. Test the multiplayer functionality"
echo "   3. Test voice chat functionality"
echo "   4. Monitor logs for any errors"
echo ""
echo "🔗 Useful links:"
echo "   • Railway Dashboard: https://railway.app/dashboard"
echo "   • Vercel Dashboard: https://vercel.com/dashboard"
echo "   • Game URL: https://4tune.vercel.app"
echo ""
