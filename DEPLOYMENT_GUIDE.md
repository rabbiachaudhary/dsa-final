# 🚀 Free Deployment Guide

## Overview
This guide will help you deploy your full-stack application for FREE using:
- **Backend**: Render.com (Free tier)
- **Frontend**: Vercel.com (Free tier)
- **Database**: MongoDB Atlas (Already set up - Free tier)

---

## 📋 Prerequisites
1. GitHub account (free)
2. Render.com account (free)
3. Vercel.com account (free)
4. MongoDB Atlas account (already have)

---

## 🔧 Step 1: Prepare Your Code

### 1.1 Update Frontend API URL
Update `frontend/src/lib/api.ts` to use environment variable:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### 1.2 Create .env.example files
Create these files to document required environment variables.

### 1.3 Ensure .gitignore is set up
Make sure `.env` files are in `.gitignore` (don't commit secrets!)

---

## 🌐 Step 2: Deploy Backend to Render

### 2.1 Push to GitHub
1. Create a new GitHub repository
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2.2 Deploy on Render
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `deskmate-backend` (or any name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     MONGO_URI=your_mongodb_atlas_connection_string
     JWT_SECRET=your_secret_key_here
     PORT=5000
     NODE_ENV=production
     ```

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://deskmate-backend.onrender.com`)

### 2.3 Important Notes for Render
- Free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- For always-on, upgrade to paid ($7/month)

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Update API URL
1. In `frontend/src/lib/api.ts`, update:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

2. Create `frontend/.env.production`:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 3.2 Deploy on Vercel
1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com/api
     ```

6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Your app will be live at `https://your-app.vercel.app`

---

## 🔐 Step 4: Update MongoDB Atlas Network Access

1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (allows all IPs)
   - Or add Render's IP ranges if you want to be more secure

---

## ✅ Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Try signing up/signing in
3. Test all features

---

## 🆓 Alternative Free Options

### Backend Alternatives:
1. **Railway.app** - $5 free credits/month (better than Render)
2. **Fly.io** - Free tier with 3 shared VMs
3. **Cyclic.sh** - Free tier for Node.js apps

### Frontend Alternatives:
1. **Netlify** - Free tier (similar to Vercel)
2. **GitHub Pages** - Free but needs build setup

---

## 🐛 Troubleshooting

### Backend Issues:
- **CORS Error**: Add your Vercel URL to CORS in backend
- **MongoDB Connection**: Check Network Access in Atlas
- **Environment Variables**: Double-check all are set correctly

### Frontend Issues:
- **API Not Working**: Check `VITE_API_URL` is correct
- **Build Fails**: Check Node version compatibility

---

## 📝 Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables set
- [ ] MongoDB Atlas Network Access updated
- [ ] CORS configured in backend
- [ ] Tested signup/login
- [ ] Tested all features

---

## 🔄 Updating Your App

1. Make changes locally
2. Push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push
```
3. Render and Vercel will auto-deploy!

---

## 💡 Pro Tips

1. **Use Environment Variables**: Never hardcode URLs or secrets
2. **Monitor Logs**: Check Render/Vercel logs for errors
3. **Test Locally First**: Always test before deploying
4. **Keep Backend Awake**: Use a service like UptimeRobot (free) to ping your backend every 5 minutes to prevent spin-down

---

Good luck with your deployment! 🎉

