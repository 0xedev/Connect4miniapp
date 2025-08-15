# Backend Production Deployment Guide

## Hosting Options for Socket.IO Backend

### 1. Railway (Recommended - Easy & Free Tier)

Railway is perfect for Node.js apps with WebSocket support:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from backend directory
cd backend
railway deploy
```

**Setup:**

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Select the `backend` folder as root
4. Add environment variables in Railway dashboard
5. Deploy automatically on git push

**Environment Variables to set in Railway:**

```
NODE_ENV=production
ALLOWED_ORIGINS=https://4tune.vercel.app
PORT=3001
```

### 2. Render (Great Free Tier)

```bash
# No CLI needed, just connect GitHub repo
```

**Setup:**

1. Go to [render.com](https://render.com)
2. Connect GitHub repo
3. Create new Web Service
4. Set Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`

### 3. Heroku (Classic Option)

```bash
# Install Heroku CLI
npm install -g heroku

# Create app
heroku create your-connect4-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://4tune.vercel.app

# Deploy
git subtree push --prefix backend heroku main
```

### 4. DigitalOcean App Platform

1. Connect GitHub repo in DigitalOcean dashboard
2. Select Node.js environment
3. Set source directory to `/backend`
4. Configure environment variables

### 5. AWS (Most Scalable)

Using AWS Elastic Beanstalk or ECS:

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Deploy
eb create production
eb deploy
```

## Quick Start with Railway (Recommended)

1. **Setup Railway Account:**

   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy Backend:**

   ```bash
   cd backend
   railway deploy
   ```

3. **Configure Environment:**

   - Add `ALLOWED_ORIGINS=https://4tune.vercel.app` in Railway dashboard
   - Note the generated URL (e.g., `https://your-app.railway.app`)

4. **Update Frontend:**
   Update your `.env` file:
   ```
   REACT_APP_BACKEND_URL=https://your-app.railway.app
   ```

## Auto-Deploy Setup

### GitHub Actions (for any provider)

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ["backend/**"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: cd backend && npm install
      - run: cd backend && npm test
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          cd backend
          railway deploy --token ${{ secrets.RAILWAY_TOKEN }}
```

## Production Checklist

- [ ] Environment variables configured
- [ ] CORS origins set correctly
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Health check endpoint working
- [ ] Error monitoring setup
- [ ] Log aggregation configured
- [ ] Database backup strategy
- [ ] Scaling plan in place

## Monitoring & Maintenance

1. **Health Checks:**

   - Endpoint: `GET /health`
   - Monitor uptime and response times

2. **Performance Monitoring:**

   - Track WebSocket connections
   - Monitor memory usage
   - Set up alerts for high CPU/memory

3. **Logs:**
   - Centralized logging with services like LogDNA
   - Error tracking with Sentry

## Cost Optimization

- **Free Tiers Available:**

  - Railway: Free tier with 500 hours/month
  - Render: Free tier with 750 hours/month
  - Heroku: 550-1000 free hours/month

- **Scaling Strategy:**
  - Start with free tier
  - Monitor usage and upgrade as needed
  - Consider Redis for horizontal scaling
