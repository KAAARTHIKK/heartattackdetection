# Heartify

ML-powered cardiac risk prediction with SHAP explainability, Claude AI reports, and full-stack persistence.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React (Vite) + Tailwind CSS + Recharts |
| Auth + DB | Supabase (Auth, Postgres, RLS) |
| ML Backend | FastAPI + XGBoost + SHAP |
| NLP Reports | Claude API (claude-sonnet-4-5) |
| Maps | Leaflet.js + OpenStreetMap |
| Deploy | Vercel (frontend) + Railway (backend) |

## Project Structure

```
heartify/
├── backend/          FastAPI + ML model artifacts
├── react-frontend/   React Vite app
├── notebook/         Training notebook + plots
└── supabase/
    └── migrations/   SQL schema files
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_profiles.sql` in the SQL editor
3. Run `supabase/migrations/002_predictions.sql` in the SQL editor
4. Copy your project URL and anon key

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd react-frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (bypasses RLS for server writes) |

### Frontend (`react-frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_API_URL` | Backend URL (e.g. `https://your-app.railway.app`) |

## Deployment

### Frontend → Vercel

```bash
cd react-frontend
npx vercel --prod
# Set env vars in Vercel dashboard
```

### Backend → Railway

1. Connect your GitHub repo to Railway
2. Set root directory to `backend/`
3. Add environment variables in Railway dashboard
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/predict` | Run new prediction |
| PUT | `/predict/{id}` | Update existing prediction |

## Disclaimer

For educational purposes only. Not a substitute for professional medical advice.
