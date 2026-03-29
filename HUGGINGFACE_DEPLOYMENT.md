# 🤗 Deploy Backend to Hugging Face Spaces (FREE!)

## Why Hugging Face Spaces?

- ✅ **Completely FREE** - No credit card required
- ✅ **Persistent storage** - Model files stay uploaded
- ✅ **Python ML support** - Perfect for scikit-learn, XGBoost, SHAP
- ✅ **Easy deployment** - Just upload files
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **No sleep** - Always on (unlike Render free tier)

---

## Step-by-Step Deployment

### Step 1: Sign Up for Hugging Face

1. Go to https://huggingface.co/join
2. Create a free account
3. Verify your email

### Step 2: Create a New Space

1. Click your profile picture → "New Space"
2. Fill in details:
   - **Space name**: `heartify-backend`
   - **License**: MIT
   - **Select the Space SDK**: Choose **"Docker"**
   - **Space hardware**: CPU basic (free)
   - **Visibility**: Public
3. Click "Create Space"

### Step 3: Upload Backend Files

You'll see a Git repository. You can either:

**Option A: Upload via Web Interface (Easiest)**

1. Click "Files" tab
2. Click "Add file" → "Upload files"
3. Upload these files from your `backend/` folder:
   - `main.py`
   - `nlp.py`
   - `requirements.txt`
   - `Dockerfile` (already created)
   - `README.md` (already created)
   - `.env.example`

**Option B: Use Git (Advanced)**

```bash
git clone https://huggingface.co/spaces/YOUR_USERNAME/heartify-backend
cd heartify-backend
cp -r ../backend/* .
git add .
git commit -m "Add backend files"
git push
```

### Step 4: Upload Model Files

**IMPORTANT**: Upload all your `*.joblib` files:

1. In the Space, click "Files" tab
2. Click "Add file" → "Upload files"
3. Upload these files from your local `backend/` folder:
   - `model.joblib`
   - `calibrated_models.joblib`
   - `scaler.joblib`
   - `feature_columns.joblib`
   - `threshold_low.joblib`
   - `threshold_high.joblib`
   - `X_train_background.joblib`

**Note**: These files are large, upload may take a few minutes.

### Step 5: Add Environment Variables (Secrets)

1. Go to your Space settings (gear icon)
2. Click "Repository secrets"
3. Add these secrets:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://shptnltbqrevbhqmficf.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your Supabase SERVICE key |
| `GROQ_API_KEY` | Your Groq API key |

**How to add**:
- Click "New secret"
- Enter name and value
- Click "Add"

### Step 6: Wait for Build

1. Hugging Face will automatically build your Docker container
2. Watch the "Logs" tab for build progress
3. Build takes 5-10 minutes
4. When done, you'll see "Running" status

### Step 7: Test Your Backend

Your backend will be available at:
```
https://YOUR_USERNAME-heartify-backend.hf.space
```

Test the health endpoint:
```
https://YOUR_USERNAME-heartify-backend.hf.space/health
```

You should see:
```json
{"status":"ok","model_loaded":true}
```

---

## Step 8: Connect Frontend to Backend

### Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Update `VITE_API_URL`:
   ```
   https://YOUR_USERNAME-heartify-backend.hf.space
   ```
4. Save and redeploy frontend

---

## Step 9: Update CORS (If Needed)

If you get CORS errors, update `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'https://your-frontend.vercel.app',
        'https://*.vercel.app',
        '*'  # For development
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
```

Then commit and push the change.

---

## Troubleshooting

### Build fails

**Check logs** in the "Logs" tab. Common issues:
- Missing dependencies in `requirements.txt`
- Python version mismatch
- Dockerfile errors

**Solution**: Fix the error and push again.

### Model files not found

**Check** that all `*.joblib` files are uploaded:
- Go to "Files" tab
- Verify all 7 model files are there

**Solution**: Upload missing files.

### API not responding

**Check** the "Logs" tab for errors.

**Common issues**:
- Environment variables not set
- Port mismatch (must be 7860 for Hugging Face)

### CORS errors

**Update** `main.py` to allow your Vercel domain (see Step 9 above).

---

## Advantages Over Render

| Feature | Hugging Face | Render Free |
|---------|--------------|-------------|
| Cost | FREE forever | FREE (with limits) |
| Sleep | Never sleeps | Sleeps after 15 min |
| Storage | Persistent | Ephemeral |
| ML Libraries | Optimized | Standard |
| Setup | Easy | Easy |
| Cold Start | Fast | Slow (30s) |

---

## Alternative: Streamlit Cloud

If you want to use Streamlit instead of FastAPI:

1. Convert your FastAPI app to Streamlit
2. Deploy to Streamlit Cloud (free)
3. Streamlit is better for demos, FastAPI is better for APIs

**For your use case**: Stick with FastAPI + Hugging Face since you already have a React frontend.

---

## Summary

**Deployment Steps**:
1. ✅ Create Hugging Face account
2. ✅ Create new Space (Docker SDK)
3. ✅ Upload backend files
4. ✅ Upload model files (*.joblib)
5. ✅ Add environment variables (secrets)
6. ✅ Wait for build (5-10 min)
7. ✅ Test backend API
8. ✅ Update Vercel VITE_API_URL
9. ✅ Test full application

**Your URLs**:
- Frontend: `https://your-project.vercel.app`
- Backend: `https://YOUR_USERNAME-heartify-backend.hf.space`

**Total Cost**: $0/month 🎉

---

## Need Help?

- Hugging Face Docs: https://huggingface.co/docs/hub/spaces
- Hugging Face Discord: https://discord.gg/hugging-face

Your backend will be live and free forever on Hugging Face! 🚀
