# SkillAssess Pro - Deployment Guide

## 🚀 Deployment Options

### ⚠️ Important Note About Vercel

This application uses:
- Express.js backend
- Socket.IO for real-time features
- MongoDB database
- Long-running processes

**Vercel Limitations:**
- Serverless functions have 10-second timeout (Hobby) or 60-second timeout (Pro)
- Socket.IO doesn't work well with serverless
- No persistent connections to MongoDB

**Recommended Platforms:**

### 1. Railway (Recommended ⭐)

Railway is perfect for this full-stack app with real-time features.

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add MongoDB
railway add mongodb

# Deploy
railway up
```

**Environment Variables to Set:**
```
MONGODB_URI=(auto-set by Railway)
JWT_SECRET=your-secret-key
NODE_ENV=production
```

**Pricing:** Free tier with 500 hours/month

**URL:** https://railway.app

---

### 2. Render

Great alternative with free tier for both web service and MongoDB.

1. Create account at https://render.com
2. New Web Service → Connect Git repo
3. Build Command: `npm install`
4. Start Command: `node backend/server.js`
5. Add MongoDB from https://cloud.mongodb.com (free tier)

**Environment Variables:**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=production
```

**Pricing:** Free tier available

---

### 3. Heroku

Traditional PaaS, very reliable.

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create skillassess-pro

# Add MongoDB
heroku addons:create mongodb-atlas:sandbox

# Deploy
git push heroku main

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production
```

**Pricing:** $7/month minimum

---

### 4. DigitalOcean App Platform

Simple deployment with managed database.

1. Go to https://www.digitalocean.com/products/app-platform
2. Create new app from GitHub
3. Choose Node.js
4. Set build command: `npm install`
5. Set run command: `node backend/server.js`
6. Add MongoDB Managed Database

**Pricing:** $5/month for app, $15/month for database

---

### 5. AWS (Advanced)

For production-grade deployment:

1. **EC2** for the application
2. **MongoDB Atlas** for database
3. **CloudFront** for CDN
4. **Route 53** for DNS

**Estimated Cost:** $20-50/month

---

## 🔧 Vercel Workaround (Not Recommended)

If you must use Vercel, you'll need external services:

1. **Deploy API separately** to Railway/Render
2. **Use Vercel only for frontend**
3. **Use MongoDB Atlas** for database
4. **Remove Socket.IO** features

**Steps:**

1. Deploy backend to Railway:
```bash
# Deploy only backend
railway init
railway up
```

2. Update frontend config:
```javascript
// frontend/js/config.js
const CONFIG = {
    API_BASE_URL: 'https://your-railway-app.railway.app/api',
    // ... rest of config
};
```

3. Deploy frontend to Vercel:
```bash
vercel --prod
```

---

## 📋 Pre-Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure MongoDB connection string
- [ ] Set NODE_ENV=production
- [ ] Update FRONTEND_URL if needed
- [ ] Test all API endpoints
- [ ] Run database seeder
- [ ] Configure email service (optional)
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Enable HTTPS

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP (0.0.0.0/0 for all)
5. Get connection string
6. Set MONGODB_URI environment variable

**Connection String Example:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/skillassess?retryWrites=true&w=majority
```

---

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for your domain
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities

---

## 📊 Monitoring

**Recommended Tools:**
- **Uptime:** UptimeRobot, Pingdom
- **Errors:** Sentry, Rollbar
- **Logs:** Papertrail, Loggly
- **Performance:** New Relic, Datadog

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test MongoDB connection
mongosh "mongodb+srv://..."
```

### Port Issues
```bash
# Check if port is in use
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Quick Deploy to Railway (Fastest)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Create new project
railway init

# 4. Link to repo
railway link

# 5. Add MongoDB
railway add

# 6. Deploy
railway up

# 7. Add environment variables
railway variables set JWT_SECRET=your-secret-here

# 8. Get URL
railway domain
```

Done! Your app will be live in ~5 minutes.

---

**Need Help?** Check the main README.md or open an issue on GitHub.
