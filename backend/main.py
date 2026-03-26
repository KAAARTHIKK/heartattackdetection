"""
Heart Attack Risk Prediction API
FastAPI backend serving calibrated ML predictions with three-zone output and SHAP explanations.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.base import BaseEstimator, ClassifierMixin
from xgboost import XGBClassifier


# Must be defined here so joblib can unpickle model.joblib (which was saved
# from the notebook's __main__ scope and references this class by name).
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
            verbosity=self.verbosity
        )
        self._xgb.fit(X, y)
        self.classes_ = self._xgb.classes_
        return self

    def predict(self, X):
        return self._xgb.predict(X)

    def predict_proba(self, X):
        return self._xgb.predict_proba(X)


# Patch sys.modules['__main__'] so pickle can resolve XGBClassifierWrapper
# when loading joblib files saved from a Jupyter notebook (__main__ context).
import sys as _sys
import types as _types
_fake_main = _types.ModuleType('__main__')
_fake_main.XGBClassifierWrapper = XGBClassifierWrapper
_sys.modules['__main__'] = _fake_main

def _safe_load(path):
    return joblib.load(path)


app = FastAPI(title="Heart Attack Risk Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Globals
model             = None   # best calibrated model
calibrated_models = None   # all three calibrated models
scaler            = None
feature_columns   = None   # 14 features including risk_score
low_threshold     = None
high_threshold    = None
explainer         = None

CONTINUOUS_FEATURES = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak', 'risk_score']


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


@app.on_event("startup")
async def load_artifacts():
    global model, calibrated_models, scaler, feature_columns
    global low_threshold, high_threshold, explainer

    print("Loading model artifacts...")

    model             = _safe_load('model.joblib')
    calibrated_models = _safe_load('calibrated_models.joblib')
    scaler            = _safe_load('scaler.joblib')
    feature_columns   = _safe_load('feature_columns.joblib')
    low_threshold     = _safe_load('threshold_low.joblib')
    high_threshold    = _safe_load('threshold_high.joblib')

    print(f"  model:           {type(model).__name__}")
    print(f"  feature_columns: {feature_columns}")
    print(f"  low_threshold:   {low_threshold:.4f}")
    print(f"  high_threshold:  {high_threshold:.4f}")

    # SHAP — unwrap the calibrated classifier to get the base estimator
    try:
        wrapped = model.calibrated_classifiers_[0].estimator
        # Handle XGBClassifierWrapper — unwrap to the inner XGBClassifier
        base_estimator = getattr(wrapped, '_xgb', wrapped)
        model_type = type(base_estimator).__name__

        if model_type in ('RandomForestClassifier', 'XGBClassifier'):
            explainer = shap.TreeExplainer(base_estimator)
        elif model_type == 'LogisticRegression':
            try:
                X_bg = _safe_load('X_train_background.joblib')
            except FileNotFoundError:
                X_bg = pd.DataFrame(
                    np.zeros((1, len(feature_columns))), columns=feature_columns
                )
            explainer = shap.LinearExplainer(base_estimator, X_bg)
        else:
            explainer = shap.Explainer(model.predict_proba)

        print(f"  SHAP explainer:  {type(explainer).__name__} for {model_type}")
    except Exception as e:
        print(f"  SHAP init warning: {e} — SHAP disabled")
        explainer = None

    print("Backend ready.")


def add_risk_score(df: pd.DataFrame) -> pd.DataFrame:
    """Replicate the clinical risk score feature from the notebook."""
    df = df.copy()
    df['risk_score'] = (
        (df['thalach'] < 150).astype(float) * 1.5 +
        (df['oldpeak'] > 1.0).astype(float) * 2.0 +
        (df['cp'] == 0).astype(float)        * 1.5 +
        (df['ca'] > 0).astype(float)         * 2.0 +
        (df['exang'] == 1).astype(float)     * 1.0
    )
    return df


def preprocess_input(data: PatientData) -> pd.DataFrame:
    df = pd.DataFrame([data.dict()])
    df = add_risk_score(df)
    df = df[feature_columns]
    df[CONTINUOUS_FEATURES] = scaler.transform(df[CONTINUOUS_FEATURES])
    return df


@app.get("/")
@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(data: PatientData):
    """
    Returns:
      risk_probability  – mean probability across all 3 calibrated models
      risk_level        – 'Low Risk' | 'Uncertain – Further Tests Advised' | 'High Risk'
      zone              – 'low_risk' | 'uncertain' | 'high_risk'
      model_agreement   – std dev across models (low = models agree)
      predicted_class   – 0 or 1 (uncertain cases resolved by ensemble vote)
      shap_values       – per-feature SHAP dict
      top_factors       – top 3 features by |SHAP|
    """
    try:
        input_df = preprocess_input(data)

        # Ensemble probability from all 3 calibrated models
        proba_matrix = np.column_stack([
            m.predict_proba(input_df)[:, 1]
            for m in calibrated_models.values()
        ])
        mean_prob = float(proba_matrix.mean())
        std_prob  = float(proba_matrix.std())

        # Three-zone classification
        if mean_prob < low_threshold:
            zone       = 'low_risk'
            risk_level = 'Low Risk'
            pred_class = 0
        elif mean_prob > high_threshold:
            zone       = 'high_risk'
            risk_level = 'High Risk'
            pred_class = 1
        else:
            zone       = 'uncertain'
            risk_level = 'Uncertain – Further Tests Advised'
            pred_class = 1 if mean_prob >= 0.50 else 0

        # SHAP values from best model's base estimator
        shap_dict   = {}
        top_factors = []

        if explainer is not None:
            raw_shap = explainer.shap_values(input_df)
            if isinstance(raw_shap, list):
                shap_vals = raw_shap[1][0]
            else:
                shap_vals = raw_shap[0]

            shap_dict = {
                feat: round(float(v), 4)
                for feat, v in zip(feature_columns, shap_vals)
            }

            sorted_feats = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
            top_factors = [
                {
                    'feature':   feat,
                    'shap':      val,
                    'direction': 'increases risk' if val > 0 else 'decreases risk'
                }
                for feat, val in sorted_feats[:3]
            ]

        return {
            'risk_probability': round(mean_prob, 4),
            'risk_level':       risk_level,
            'zone':             zone,
            'model_agreement':  round(1.0 - std_prob, 4),  # higher = more agreement
            'predicted_class':  pred_class,
            'shap_values':      shap_dict,
            'top_factors':      top_factors,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
