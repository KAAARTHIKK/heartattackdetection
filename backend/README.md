---
title: Heartify Backend
emoji: ❤️
colorFrom: red
colorTo: pink
sdk: docker
pinned: false
---

# Heartify Backend API

FastAPI backend for cardiac risk prediction using XGBoost ensemble models.

## Features

- XGBoost ensemble prediction
- SHAP explainability
- NLP report generation (Groq)
- Supabase integration

## Environment Variables

Set these in Hugging Face Space settings:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key
- `GROQ_API_KEY`: Your Groq API key

## Model Files

Upload these files to the Space:
- model.joblib
- calibrated_models.joblib
- scaler.joblib
- feature_columns.joblib
- threshold_low.joblib
- threshold_high.joblib
- X_train_background.joblib

## API Endpoints

- `GET /health` - Health check
- `POST /predict` - Run prediction
- `PUT /predict/{id}` - Update prediction
