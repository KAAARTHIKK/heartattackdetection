# Vercel Deployment Guide for Heartify

## Overview

Your Heartify application has two parts:
1. **Frontend** (React) - Deploy to Vercel ✅
2. **Backend** (FastAPI) - Deploy to Render/Railway/Fly.io (Recommended) ⚠️

**Why separate deployments?**
- Vercel's Python runtime has limitations with ML libraries (scikit-learn, xgboost, shap)
- Model files (*.joblib) are too large for serverless functions
- Backend needs persistent storage for models

---

## Part 1: Deploy Frontend to Vercel (Easy)

### Step 1: Sign Up / Login to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your Repository

1. Click "Add New..." → "Project"
2. Find your repository: `KAAARTHIKK/heartattackdetection`
3. Click "Import"

### Step 3: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Vite
- **Root Directory**: Leave empty (we have vercel.json configured)
- **Build Command**: `cd react-frontend && npm install && npm run build`
- **Output Directory**: `react-frontend/dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

Click "Environment Variables" and add:

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key_here` | Supabase → Settings → API → anon public |
| `VITE_API_URL` | `https://your-backend.onrender.com` | Your backend URL (from Part 2) |
| `VITE_GOOGLE_MAPS_API_KEY` | `your_google_maps_api_key_here` | Google Cloud Console |

**Important**: 
- Add these for "Production", "Preview", and "Development" environments
- `VITE_API_URL` will be updated after you deploy the backend

### Step 5: Deploy Frontend

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://heartattackdetection.vercel.app`

### Step 6: Test Frontend

1. Visit your Vercel URL
2. You should see the landing page
3. Authentication should work (Supabase)
4. Assessment form should load

⚠️ **Note**: Predictions won't work yet (backend not deployed)

---

## Part 2: Deploy Backend to Render (Recommended)

### Why Render?
- ✅ Free tier available
- ✅ Supports Python with ML libraries
- ✅ Persistent storage for model files
- ✅ Easy deployment from GitHub

### Step 1: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub
4. Authorize Render

### Step 2: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `KAAARTHIKK/heartattackdetection`
3. Click "Connect"

### Step 3: Configure Service

**Basic Settings:**
- **Name**: `heartify-backend` (or your choice)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- Free tier (512 MB RAM) - Good for testing
- Starter ($7/month) - Recommended for production

### Step 4: Add Environment Variables

Click "Environment" and add:

| Variable Name | Value |
|---------------|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `your_supabase_service_key_here` (SERVICE key, not anon) |
| `GROQ_API_KEY` | `your_groq_api_key_here` |
| `PORT` | `10000` (Render default) |

### Step 5: Handle Model Files

⚠️ **Critical**: Model files (*.joblib) are NOT in Git.

**Option A: Upload to Render Disk (Recommended)**
1. After deployment, go to "Shell" tab
2. Upload model files via SFTP or use Render's file upload
3. Place in `/opt/render/project/src/backend/`

**Option B: Use Cloud Storage**
1. Upload models to AWS S3 / Google Cloud Storage
2. Update `backend/main.py` to download on startup:
```python
import boto3
s3 = boto3.client('s3')
s3.download_file('your-bucket', 'model.joblib', 'model.joblib')
```

**Option C: For Testing - Mock Predictions**
Comment out model loading and return mock data.

### Step 6: Deploy Backend

1. Click "Create Web Service"
2. Wait 5-10 minutes for build
3. You'll get a URL like: `https://heartify-backend.onrender.com`

### Step 7: Test Backend

Visit: `https://heartify-backend.onrender.com/health`

You should see:
```json
{"status":"ok","model_loaded":true}
```

---

## Part 3: Connect Frontend to Backend

### Step 1: Update Frontend Environment Variable

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Update `VITE_API_URL` to your Render backend URL:
   - `https://heartify-backend.onrender.com`

### Step 2: Redeploy Frontend

1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

OR just push a new commit to trigger auto-deploy.

### Step 3: Test Full Application

1. Visit your Vercel frontend URL
2. Sign up / Login
3. Fill assessment form
4. Click "Run Assessment"
5. ✅ Should see results!

---

## Alternative: Deploy Backend to Railway

Railway is another good option (similar to Render).

### Quick Setup:

1. Go to https://railway.app
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (same as Render)
7. Deploy

Railway provides:
- $5 free credit per month
- Automatic HTTPS
- Easy scaling

---

## Alternative: Deploy Backend to Fly.io

Fly.io is great for global deployment.

### Quick Setup:

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create app: `fly launch` (in backend directory)
4. Add secrets: `fly secrets set SUPABASE_URL=...`
5. Deploy: `fly deploy`

---

## Troubleshooting

### Frontend Issues

**Build fails:**
- Check build logs in Vercel
- Verify all dependencies in `package.json`
- Test locally: `npm run build`

**Environment variables not working:**
- Must start with `VITE_`
- Redeploy after adding variables
- Check browser console for errors

**CORS errors:**
- Backend must allow your frontend domain
- Already configured in `backend/main.py`

### Backend Issues

**Model files not found:**
- Upload models to Render disk
- OR use cloud storage
- OR use mock predictions for testing

**Build fails:**
- Check Python version (3.12)
- Verify all dependencies in `requirements.txt`
- Check build logs

**Timeout errors:**
- Model loading takes too long
- Use smaller models
- Upgrade to paid tier for more resources

**Memory errors:**
- Free tier has 512 MB RAM
- ML models need more memory
- Upgrade to Starter tier ($7/month)

---

## Cost Breakdown

### Free Tier (Testing)
- **Vercel Frontend**: Free (100 GB bandwidth)
- **Render Backend**: Free (512 MB RAM, sleeps after 15 min inactivity)
- **Supabase**: Free (500 MB database, 2 GB bandwidth)
- **Total**: $0/month

### Production (Recommended)
- **Vercel Frontend**: Free or Pro ($20/month for team)
- **Render Backend**: Starter ($7/month, 512 MB RAM, always on)
- **Supabase**: Free or Pro ($25/month)
- **Total**: $7-52/month

---

## Post-Deployment Checklist

### Frontend (Vercel)
- [ ] Deployment successful
- [ ] Landing page loads
- [ ] Can sign up / login
- [ ] Assessment form works
- [ ] Environment variables set

### Backend (Render/Railway/Fly.io)
- [ ] Deployment successful
- [ ] `/health` endpoint responds
- [ ] Model files uploaded
- [ ] Environment variables set
- [ ] CORS configured

### Integration
- [ ] Frontend can call backend API
- [ ] Predictions work
- [ ] Results display correctly
- [ ] Data saves to Supabase

---

## Custom Domain (Optional)

### For Frontend (Vercel)
1. Vercel Dashboard → Domains
2. Add your domain
3. Update DNS records (provided by Vercel)

### For Backend (Render)
1. Render Dashboard → Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records

---

## Monitoring & Logs

### Vercel
- Dashboard → Deployments → View Function Logs
- Real-time logs for debugging

### Render
- Dashboard → Logs tab
- Real-time logs
- Can download logs

### Supabase
- Dashboard → Logs
- Database queries
- API requests

---

## Summary

### Deployment Steps:
1. ✅ Deploy frontend to Vercel (5 minutes)
2. ✅ Deploy backend to Render/Railway (10 minutes)
3. ✅ Upload model files to backend
4. ✅ Connect frontend to backend
5. ✅ Test full application

### Your URLs:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **API Health**: `https://your-backend.onrender.com/health`

### Next Steps:
1. Monitor application performance
2. Set up custom domains
3. Configure analytics
4. Set up error tracking (Sentry)
5. Optimize model loading

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **Fly.io Docs**: https://fly.io/docs

Your Heartify app will be live and accessible worldwide! 🚀
