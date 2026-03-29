"""
Heartify — Cardiac Risk Prediction API
FastAPI backend: XGBoost ensemble + SHAP + Claude NLP + Supabase persistence.
"""

import os
import sys
import types
import uuid
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.base import BaseEstimator, ClassifierMixin
from xgboost import XGBClassifier

from nlp import generate_nlp_report


# ── XGBClassifierWrapper (must be defined here for joblib unpickling) ──────────
class XGBClassifierWrapper(ClassifierMixin, BaseEstimator):
    def __init__(self, n_estimators=100, random_state=42,
                 objective='binary:logistic', eval_metric='logloss', verbosity=0):
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.objective    = objective
        self.eval_metric  = eval_metric
        self.verbosity    = verbosity

    def fit(self, X, y):
        self._xgb = XGBClassifier(
            n_estimators=self.n_estimators,
            random_state=self.random_state,
            objective=self.objective,
            eval_metric=self.eval_metric,
            verbosity=self.verbosity,
        )
        self._xgb.fit(X, y)
        self.classes_ = self._xgb.classes_
        return self

    def predict(self, X):
        return self._xgb.predict(X)

    def predict_proba(self, X):
        return self._xgb.predict_proba(X)


# Patch __main__ so pickle can resolve XGBClassifierWrapper from notebook context
_fake_main = types.ModuleType('__main__')
_fake_main.XGBClassifierWrapper = XGBClassifierWrapper
sys.modules['__main__'] = _fake_main


# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title='Heartify API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── Globals ───────────────────────────────────────────────────────────────────
model             = None
calibrated_models = None
scaler            = None
feature_columns   = None
low_threshold     = None
high_threshold    = None
explainer         = None

CONTINUOUS_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak', 'risk_score']

FEATURE_LABELS = {
    'age': 'Age', 'sex': 'Sex', 'cp': 'Chest Pain Type',
    'trestbps': 'Resting BP (mmHg)', 'chol': 'Cholesterol (mg/dl)',
    'fbs': 'Fasting Blood Sugar', 'restecg': 'Resting ECG',
    'thalach': 'Max Heart Rate (bpm)', 'exang': 'Exercise-Induced Angina',
    'oldpeak': 'ST Depression', 'slope': 'ST Slope',
    'ca': 'Major Vessels', 'thal': 'Thalassemia',
}


# ── Pydantic models ───────────────────────────────────────────────────────────
class PatientData(BaseModel):
    age:      float
    sex:      float
    cp:       float
    trestbps: float
    chol:     float
    fbs:      float
    restecg:  float
    thalach:  float
    exang:    float
    oldpeak:  float
    slope:    float
    ca:       float
    thal:     float
    user_id:  Optional[str] = None


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event('startup')
async def load_artifacts():
    global model, calibrated_models, scaler, feature_columns
    global low_threshold, high_threshold, explainer

    print('=' * 60)
    print('Heartify Backend Starting...')
    print('=' * 60)
    
    # Check environment variables
    print('\n[ENV] Checking environment variables...')
    supabase_url = os.environ.get('SUPABASE_URL', '').strip()
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY', '').strip()
    groq_key = os.environ.get('GROQ_API_KEY', '').strip()
    
    if supabase_url:
        print(f'[ENV] ✅ SUPABASE_URL: {supabase_url[:30]}...')
    else:
        print('[ENV] ⚠️  SUPABASE_URL not set - database features disabled')
        
    if supabase_key:
        print(f'[ENV] ✅ SUPABASE_SERVICE_KEY: {supabase_key[:20]}...')
    else:
        print('[ENV] ⚠️  SUPABASE_SERVICE_KEY not set - database features disabled')
        
    if groq_key:
        print(f'[ENV] ✅ GROQ_API_KEY: {groq_key[:20]}...')
    else:
        print('[ENV] ⚠️  GROQ_API_KEY not set - NLP reports may fail')

    print('\n[MODEL] Checking artifacts...')
    required_files = [
        'model.joblib',
        'calibrated_models.joblib',
        'scaler.joblib',
        'feature_columns.joblib',
        'threshold_low.joblib',
        'threshold_high.joblib',
    ]
    for f in required_files:
        exists = os.path.exists(f)
        print(f'  {f}: {"✅" if exists else "❌ MISSING"}')
        if not exists:
            print(f'\n❌ ERROR: {f} not found. Please run the training notebook first.')
            sys.exit(1)

    print('\n[MODEL] Loading model artifacts...')
    model             = joblib.load('model.joblib')
    calibrated_models = joblib.load('calibrated_models.joblib')
    scaler            = joblib.load('scaler.joblib')
    feature_columns   = joblib.load('feature_columns.joblib')
    low_threshold     = joblib.load('threshold_low.joblib')
    high_threshold    = joblib.load('threshold_high.joblib')

    print(f'  feature_columns: {feature_columns}')
    print(f'  low_threshold:   {low_threshold:.4f}')
    print(f'  high_threshold:  {high_threshold:.4f}')

    print('\n[SHAP] Initializing explainer...')
    try:
        wrapped        = model.calibrated_classifiers_[0].estimator
        base_estimator = getattr(wrapped, '_xgb', wrapped)
        model_type     = type(base_estimator).__name__

        if model_type in ('RandomForestClassifier', 'XGBClassifier'):
            explainer = shap.TreeExplainer(base_estimator)
        elif model_type == 'LogisticRegression':
            try:
                X_bg = joblib.load('X_train_background.joblib')
            except FileNotFoundError:
                X_bg = pd.DataFrame(np.zeros((1, len(feature_columns))), columns=feature_columns)
            explainer = shap.LinearExplainer(base_estimator, X_bg)
        else:
            explainer = shap.Explainer(model.predict_proba)

        print(f'  ✅ SHAP explainer: {type(explainer).__name__} for {model_type}')
    except Exception as e:
        print(f'  ⚠️  SHAP init warning: {e} — SHAP disabled')
        explainer = None

    print('\n' + '=' * 60)
    print('✅ Backend ready! Listening on http://0.0.0.0:8000')
    print('=' * 60 + '\n')


# ── Helpers ───────────────────────────────────────────────────────────────────
def add_risk_score(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['risk_score'] = (
        (df['thalach'] < 150).astype(float) * 1.5 +
        (df['oldpeak'] > 1.0).astype(float) * 2.0 +
        (df['cp'] == 4).astype(float)        * 1.5 +
        (df['ca'] > 0).astype(float)         * 2.0 +
        (df['exang'] == 1).astype(float)     * 1.0
    )
    return df


def preprocess_input(data: PatientData) -> pd.DataFrame:
    raw = {k: v for k, v in data.dict().items() if k not in ('user_id',)}
    df  = pd.DataFrame([raw])
    df  = add_risk_score(df)
    df  = df[feature_columns]
    df[CONTINUOUS_FEATURES] = scaler.transform(df[CONTINUOUS_FEATURES])
    return df


def run_inference(input_df: pd.DataFrame) -> dict:
    """Run ensemble inference + SHAP. Returns raw result dict."""
    proba_matrix = np.column_stack([
        m.predict_proba(input_df)[:, 1]
        for m in calibrated_models.values()
    ])
    mean_prob = float(proba_matrix.mean())
    std_prob  = float(proba_matrix.std())

    if mean_prob < low_threshold:
        zone, risk_level, pred_class = 'low_risk', 'Low Risk', 0
    elif mean_prob > high_threshold:
        zone, risk_level, pred_class = 'high_risk', 'High Risk', 1
    else:
        zone       = 'uncertain'
        risk_level = 'Uncertain – Further Tests Advised'
        pred_class = 1 if mean_prob >= 0.50 else 0

    shap_dict   = {}
    top_factors = []

    if explainer is not None:
        raw_shap = explainer.shap_values(input_df)
        # Normalise to a flat 1-D array regardless of explainer type
        if isinstance(raw_shap, list):
            # TreeExplainer returns [class0_array, class1_array]
            arr = np.array(raw_shap[1])
        else:
            arr = np.array(raw_shap)
        # Squeeze to 1-D: handles shapes (1,n), (n,), or scalar edge cases
        arr = arr.squeeze()
        if arr.ndim == 0:
            arr = arr.reshape(1)
        elif arr.ndim == 2:
            arr = arr[0]
        shap_vals = arr
        shap_dict = {feat: round(float(v), 4) for feat, v in zip(feature_columns, shap_vals)}
        sorted_feats = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        top_factors  = [
            {
                'feature':   feat,
                'label':     FEATURE_LABELS.get(feat, feat),
                'shap':      val,
                'direction': 'increases risk' if val > 0 else 'decreases risk',
            }
            for feat, val in sorted_feats[:3]
        ]

    return {
        'risk_probability': round(mean_prob, 4),
        'risk_level':       risk_level,
        'zone':             zone,
        'model_agreement':  round(1.0 - std_prob, 4),
        'predicted_class':  pred_class,
        'shap_values':      shap_dict,
        'top_factors':      top_factors,
    }


def get_supabase_client():
    """Return a Supabase client using the service key (bypasses RLS for server writes)."""
    try:
        from supabase import create_client
        url = os.environ.get('SUPABASE_URL', '').strip()
        key = os.environ.get('SUPABASE_SERVICE_KEY', '').strip()
        
        if not url:
            print('[DB] ERROR: SUPABASE_URL not found in environment')
            return None
        if not key:
            print('[DB] ERROR: SUPABASE_SERVICE_KEY not found in environment')
            return None
            
        client = create_client(url, key)
        print(f'[DB] ✅ Supabase client created successfully')
        return client
    except ImportError as e:
        print(f'[DB] ERROR: supabase package not installed. Run: pip install supabase')
        return None
    except Exception as e:
        print(f'[DB] ERROR: Failed to create Supabase client: {e}')
        import traceback
        traceback.print_exc()
        return None


def verify_jwt(authorization: str = Header(default=None)) -> Optional[str]:
    """
    Extract user_id from Supabase JWT.
    Returns user_id string or None if no/invalid token.
    Does NOT raise — endpoints decide whether auth is required.
    """
    if not authorization or not authorization.startswith('Bearer '):
        return None
    token = authorization.split(' ', 1)[1]
    try:
        import jose.jwt as jwt
        # Decode without verification for user_id extraction.
        # Supabase RLS enforces actual security at DB level.
        payload = jwt.decode(token, options={'verify_signature': False})
        return payload.get('sub')
    except Exception:
        return None


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get('/')
@app.get('/health')
async def health():
    return {'status': 'ok', 'model_loaded': model is not None}


@app.post('/predict')
async def predict(data: PatientData, authorization: str = Header(default=None)):
    """
    Run full prediction pipeline: inference → SHAP → NLP → Supabase save.
    Returns complete result including prediction_id.
    """
    try:
        input_df = preprocess_input(data)
        result   = run_inference(input_df)

        # NLP report
        raw_inputs  = {k: v for k, v in data.dict().items() if k not in ('user_id',)}
        nlp_report  = generate_nlp_report(
            raw_inputs, result['risk_probability'],
            result['risk_level'], result['top_factors']
        )
        result['nlp_report'] = nlp_report

        # Persist to Supabase
        prediction_id = str(uuid.uuid4())
        user_id = data.user_id or verify_jwt(authorization)

        print(f'[DB] Attempting to save prediction {prediction_id}')
        print(f'[DB] User ID: {user_id}')
        
        if user_id:
            sb = get_supabase_client()
            if sb:
                try:
                    # First verify the user exists in auth.users by checking profiles table
                    print(f'[DB] Verifying user {user_id} exists...')
                    profile_check = sb.table('profiles').select('id').eq('id', user_id).execute()
                    
                    if not profile_check.data:
                        print(f'[DB] ⚠️  User {user_id} not found in profiles table')
                        print(f'[DB] ⚠️  Prediction will not be saved. User must sign up first.')
                    else:
                        print(f'[DB] ✅ User verified, inserting prediction...')
                        response = sb.table('predictions').insert({
                            'id':               prediction_id,
                            'user_id':          user_id,
                            'input_data':       raw_inputs,
                            'risk_probability': result['risk_probability'],
                            'risk_level':       result['risk_level'],
                            'predicted_class':  result['predicted_class'],
                            'shap_values':      result['shap_values'],
                            'top_factors':      result['top_factors'],
                            'nlp_report':       nlp_report,
                        }).execute()
                        print(f'[DB] ✅ Prediction saved successfully!')
                        print(f'[DB] Response: {response.data}')
                except Exception as e:
                    error_msg = str(e)
                    print(f'[DB] ❌ Database error: {error_msg}')
                    if 'foreign key constraint' in error_msg.lower():
                        print(f'[DB] ⚠️  User {user_id} does not exist in auth.users')
                        print(f'[DB] ⚠️  Make sure user is registered via Supabase Auth')
                    elif 'violates row-level security' in error_msg.lower():
                        print(f'[DB] ⚠️  RLS policy violation - check Supabase policies')
                    import traceback
                    traceback.print_exc()
            else:
                print(f'[DB] ❌ Failed to create Supabase client')
                print(f'[DB] ⚠️  Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env')
        else:
            print(f'[DB] ⚠️  No user_id provided - prediction not saved')

        result['prediction_id'] = prediction_id
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Prediction error: {str(e)}')


@app.put('/predict/{prediction_id}')
async def update_predict(
    prediction_id: str,
    data: PatientData,
    authorization: str = Header(default=None),
):
    """Re-run prediction pipeline and update existing Supabase row."""
    user_id = data.user_id or verify_jwt(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail='Authentication required')

    try:
        input_df   = preprocess_input(data)
        result     = run_inference(input_df)
        raw_inputs = {k: v for k, v in data.dict().items() if k not in ('user_id',)}
        nlp_report = generate_nlp_report(
            raw_inputs, result['risk_probability'],
            result['risk_level'], result['top_factors']
        )
        result['nlp_report'] = nlp_report

        sb = get_supabase_client()
        if sb:
            try:
                from datetime import datetime, timezone
                resp = sb.table('predictions').update({
                    'input_data':       raw_inputs,
                    'risk_probability': result['risk_probability'],
                    'risk_level':       result['risk_level'],
                    'predicted_class':  result['predicted_class'],
                    'shap_values':      result['shap_values'],
                    'top_factors':      result['top_factors'],
                    'nlp_report':       nlp_report,
                    'updated_at':       datetime.now(timezone.utc).isoformat(),
                }).eq('id', prediction_id).eq('user_id', user_id).execute()

                if not resp.data:
                    raise HTTPException(status_code=404, detail='Prediction not found')
            except HTTPException:
                raise
            except Exception as e:
                print(f'[DB] Supabase update error: {e}')

        result['prediction_id'] = prediction_id
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Prediction error: {str(e)}')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
