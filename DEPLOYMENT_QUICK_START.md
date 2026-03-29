# 🚀 Quick Deployment Guide

## TL;DR - Deploy in 15 Minutes

### Part 1: Frontend to Vercel (5 min)

1. **Go to** https://vercel.com → Sign up with GitHub
2. **Import** your repository: `KAAARTHIKK/heartattackdetection`
3. **Add Environment Variables**:
   ```
   VITE_SUPABASE_URL = (your Supabase URL)
   VITE_SUPABASE_ANON_KEY = (your Supabase anon key)
   VITE_API_URL = https://your-backend.onrender.com
   VITE_GOOGLE_MAPS_API_KEY = (your Google Maps key)
   ```
4. **Click Deploy** → Wait 3 minutes
5. **Done!** Frontend is live at `https://your-project.vercel.app`

### Part 2: Backend to Render (10 min)

1. **Go to** https://render.com → Sign up with GitHub
2. **New Web Service** → Connect `KAAARTHIKK/heartattackdetection`
3. **Configure**:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Add Environment Variables**:
   ```
   SUPABASE_URL = (your Supabase URL)
   SUPABASE_SERVICE_KEY = (your Supabase SERVICE key)
   GROQ_API_KEY = (your Groq API key)
   ```
5. **Create Web Service** → Wait 10 minutes
6. **Upload Model Files** (see below)
7. **Done!** Backend is live at `https://your-backend.onrender.com`

### Part 3: Connect Them (2 min)

1. **Copy** your Render backend URL
2. **Go to** Vercel → Your Project → Settings → Environment Variables
3. **Update** `VITE_API_URL` to your Render URL
4. **Redeploy** frontend
5. **Test** at your Vercel URL

---

## ⚠️ Critical: Model Files

Your `*.joblib` model files are NOT in Git. You need to upload them to Render.

### Option A: Upload via Render Dashboard (Easiest)

1. Go to Render Dashboard → Your Service → Shell
2. Click "Upload Files"
3. Upload all `*.joblib` files from your `backend/` folder:
   - `model.joblib`
   - `calibrated_models.joblib`
   - `scaler.joblib`
   - `feature_columns.joblib`
   - `threshold_low.joblib`
   - `threshold_high.joblib`
   - `X_train_background.joblib`

### Option B: Use SFTP (Advanced)

Render provides SFTP access. Check their docs.

### Option C: For Testing Only

Comment out model loading in `backend/main.py` and return mock predictions.

---

## 📋 Checklist

### Before Deployment
- [ ] GitHub repository is up to date
- [ ] All model files are ready to upload
- [ ] Have all API keys ready (Supabase, Groq, Google Maps)

### After Frontend Deployment (Vercel)
- [ ] Frontend loads at Vercel URL
- [ ] Can see landing page
- [ ] Authentication works (sign up/login)

### After Backend Deployment (Render)
- [ ] Backend responds at `/health` endpoint
- [ ] Model files uploaded
- [ ] Environment variables set

### After Connecting
- [ ] Frontend can call backend
- [ ] Can fill assessment form
- [ ] Predictions work
- [ ] Results display correctly

---

## 🔑 Where to Find Your Keys

### Supabase Keys
1. Go to https://supabase.com → Your Project
2. Settings → API
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

### Groq API Key
1. Go to https://console.groq.com
2. API Keys → Create API Key
3. Copy → `GROQ_API_KEY`

### Google Maps API Key
1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Copy your API key → `VITE_GOOGLE_MAPS_API_KEY`

---

## 🆘 Common Issues

### "Model files not found"
→ Upload model files to Render (see above)

### "CORS error"
→ Already fixed in code, but verify backend URL is correct

### "Supabase connection failed"
→ Check you're using SERVICE_KEY for backend, not anon key

### "Build failed"
→ Check build logs, usually missing dependencies

### "Backend is slow"
→ Render free tier sleeps after 15 min. First request wakes it up (30 sec delay)

---

## 💰 Cost

### Free Tier (Good for Testing)
- Vercel: Free
- Render: Free (sleeps after 15 min)
- Supabase: Free
- **Total: $0/month**

### Production (Recommended)
- Vercel: Free
- Render: $7/month (always on, 512 MB RAM)
- Supabase: Free or $25/month
- **Total: $7-32/month**

---

## 📚 Full Guide

For detailed instructions, see `VERCEL_DEPLOYMENT_GUIDE.md`

---

## ✅ Success!

Once deployed, your app will be live at:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **API Health**: `https://your-backend.onrender.com/health`

Share your Vercel URL with anyone - your Heartify app is now accessible worldwide! 🌍
