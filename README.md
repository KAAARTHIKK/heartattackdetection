# Heart Attack Risk Predictor

A full-stack machine learning application that predicts heart attack risk from 13 clinical parameters, explains predictions using SHAP values, and serves results through a FastAPI backend consumed by a plain HTML/JS frontend.

---

## Prerequisites

- Python 3.10+
- pip

---

## Run Instructions

### 1. Install dependencies

```bash
pip install ucimlrepo scikit-learn xgboost imbalanced-learn shap fastapi uvicorn pandas numpy joblib pydantic
```

### 2. Train the model

Open `notebook/training.ipynb` in Jupyter and run all cells top to bottom.

```bash
jupyter notebook notebook/training.ipynb
```

The final cell prints:

```
All artifacts saved!
Training pipeline complete! Ready to build the API.
```

This saves five files into `backend/`: `model.joblib`, `scaler.joblib`, `threshold.joblib`, `feature_columns.joblib`, `X_train_background.joblib`.

### 3. Start the backend

```bash
cd backend && python main.py
```

The terminal prints:

```
Backend ready!
```

The API is now listening at `http://localhost:8000`.

### 4. Open the frontend

Open `frontend/index.html` directly in your browser (no server needed -- double-click the file or use File > Open).

### 5. Make a prediction

Fill in the 13 clinical fields (or click Load Sample Patient) and click Analyse Risk. The gauge, risk level badge, and top contributing factors will appear below the form.

---

## Dataset

UCI Heart Disease Dataset -- Cleveland subset

- Source: UCI Machine Learning Repository, id=45, fetched automatically via ucimlrepo
- Subset: first 303 patients (Cleveland clinic records)
- Target: binary -- 0 = no disease, 1 = disease present (original multi-class target binarised as num > 0)
- Features: 13 clinical parameters

| Feature    | Description                                                   |
|------------|---------------------------------------------------------------|
| age        | Age in years                                                  |
| sex        | Sex (1 = male, 0 = female)                                    |
| cp         | Chest pain type (0-3)                                         |
| trestbps   | Resting blood pressure (mmHg)                                 |
| chol       | Serum cholesterol (mg/dl)                                     |
| fbs        | Fasting blood sugar > 120 mg/dl (1/0)                        |
| restecg    | Resting ECG results (0-2)                                     |
| thalach    | Maximum heart rate achieved (bpm)                             |
| exang      | Exercise-induced angina (1/0)                                 |
| oldpeak    | ST depression induced by exercise                             |
| slope      | Slope of peak exercise ST segment (0-2)                      |
| ca         | Number of major vessels coloured by fluoroscopy (0-3)        |
| thal       | Thalassemia type (1=fixed defect, 2=normal, 3=reversible)    |

Missing values in ca and thal are imputed with the column mode; all other missing values use the column median.

---

## Model

Three classifiers are trained on the same preprocessed data:

| Model               | Notes                                                    |
|---------------------|----------------------------------------------------------|
| Logistic Regression | Baseline linear model, max_iter=1000                     |
| Random Forest       | 100 estimators, captures non-linear interactions         |
| XGBoost             | Gradient-boosted trees, often strongest on tabular data  |

Preprocessing pipeline:

1. StandardScaler fitted on training data only, applied to the five continuous features (age, trestbps, chol, thalach, oldpeak). Categorical features are left as-is.
2. SMOTE oversampling applied to the training split only to address class imbalance. The test set is never touched by SMOTE.
3. 80/20 stratified train/test split (random_state=42).

Model selection: all three models are evaluated on the held-out test set. The model with the highest ROC-AUC score is selected and saved.

Threshold tuning: rather than using a fixed 0.5 cut-off, the optimal probability threshold is found by maximising recall while keeping precision >= 0.70 on the test set. This threshold is saved to threshold.joblib and loaded by the API at startup.

Explainability: SHAP values are computed per prediction using TreeExplainer (for Random Forest or XGBoost) or LinearExplainer (for Logistic Regression), matching whichever model was selected. The top 3 features by absolute SHAP value are returned alongside each prediction.

---

## Disclaimer

This project is for academic and educational purposes only. It is not validated for clinical use and must not be used to make real medical decisions. Always consult a qualified healthcare professional.
