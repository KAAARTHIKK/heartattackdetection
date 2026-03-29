"""
Multi-provider NLP report generator for Heartify.
Supports: OpenAI (free $5 credit), Groq (free), Claude (paid)
Generates plain-English cardiac risk assessment reports.
"""

import os
from typing import Optional

FEATURE_LABELS = {
    'age':      'Age',
    'sex':      'Sex',
    'cp':       'Chest Pain Type',
    'trestbps': 'Resting Blood Pressure (mmHg)',
    'chol':     'Cholesterol (mg/dl)',
    'fbs':      'Fasting Blood Sugar',
    'restecg':  'Resting ECG',
    'thalach':  'Max Heart Rate (bpm)',
    'exang':    'Exercise-Induced Angina',
    'oldpeak':  'ST Depression',
    'slope':    'ST Slope',
    'ca':       'Major Vessels (0–3)',
    'thal':     'Thalassemia',
}

SEX_LABELS    = {0: 'female', 1: 'male'}
CP_LABELS     = {1: 'Typical Angina', 2: 'Atypical Angina', 3: 'Non-Anginal Pain', 4: 'Asymptomatic'}
FBS_LABELS    = {0: '≤120 mg/dl', 1: '>120 mg/dl'}
RESTECG_LABELS= {0: 'Normal', 1: 'ST-T Wave Abnormality', 2: 'Left Ventricular Hypertrophy'}
EXANG_LABELS  = {0: 'No', 1: 'Yes'}
SLOPE_LABELS  = {1: 'Upsloping', 2: 'Flat', 3: 'Downsloping'}
THAL_LABELS   = {3: 'Normal', 6: 'Fixed Defect', 7: 'Reversible Defect'}

SYSTEM_PROMPT = (
    "You are a compassionate medical communicator. You explain clinical cardiac risk assessment "
    "results in plain English to patients without medical backgrounds. You are never alarmist. "
    "You are clear, warm, and action-oriented. You always end with a disclaimer."
)


def _format_value(feature: str, value: float) -> str:
    """Return a human-readable string for a clinical feature value."""
    v = int(value)
    if feature == 'sex':      return SEX_LABELS.get(v, str(v))
    if feature == 'cp':       return CP_LABELS.get(v, str(v))
    if feature == 'fbs':      return FBS_LABELS.get(v, str(v))
    if feature == 'restecg':  return RESTECG_LABELS.get(v, str(v))
    if feature == 'exang':    return EXANG_LABELS.get(v, str(v))
    if feature == 'slope':    return SLOPE_LABELS.get(v, str(v))
    if feature == 'thal':     return THAL_LABELS.get(v, str(v))
    if feature == 'oldpeak':  return str(round(value, 1))
    return str(v)


def build_claude_prompt(inputs: dict, probability: float, risk_level: str, top_factors: list) -> str:
    """Build the user message for the Claude API call."""
    age = int(inputs.get('age', 0))
    sex = SEX_LABELS.get(int(inputs.get('sex', 0)), 'unknown')
    pct = round(probability * 100, 1)

    factor_lines = []
    for f in top_factors[:3]:
        label = FEATURE_LABELS.get(f['feature'], f['feature'])
        direction = f.get('direction', 'increases risk')
        shap_val = round(f['shap'], 3)
        factor_lines.append(f"- {label}: SHAP {shap_val:+.3f} ({direction})")

    clinical_lines = []
    for feat, label in FEATURE_LABELS.items():
        if feat in inputs:
            clinical_lines.append(f"- {label}: {_format_value(feat, inputs[feat])}")

    user_message = f"""A patient has completed a cardiac risk assessment.
Here are the results:
Patient: {age}-year-old {sex}
Risk probability: {pct}% ({risk_level})

Top contributing factors:
{chr(10).join(factor_lines)}

All clinical values:
{chr(10).join(clinical_lines)}

Write a report with exactly 3 paragraphs:
Paragraph 1 (2-3 sentences): What the overall risk score means in plain English. Do not use percentages — use language like 'moderate concern' or 'warrants attention'.
Paragraph 2 (3-4 sentences): Explain the top 3 contributing factors in terms the patient understands. Be specific about why each factor matters for heart health.
Paragraph 3 (2-3 sentences): Concrete next steps. What should they do this week, this month, this year.
End with one line: 'Disclaimer: This assessment is for educational purposes only and is not a medical diagnosis. Please consult a qualified cardiologist for clinical advice.'
Do not use medical jargon. Do not use bullet points."""

    return user_message


def generate_nlp_report(inputs: dict, probability: float, risk_level: str, top_factors: list) -> str:
    """
    Call AI API to generate a plain-English cardiac risk report.
    Tries providers in order: OpenAI → Groq → Claude → Fallback
    
    Returns the report string, or a fallback message if all APIs fail.
    """
    # Try OpenAI first (free $5 credit for new accounts)
    openai_key = os.environ.get('OPENAI_API_KEY', '')
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            user_message = build_claude_prompt(inputs, probability, risk_level, top_factors)
            
            response = client.chat.completions.create(
                model='gpt-4o-mini',  # Cheapest model, great quality
                messages=[
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': user_message}
                ],
                max_tokens=1024,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[NLP] OpenAI API error: {e} — trying next provider")
    
    # Try Groq (completely free!)
    groq_key = os.environ.get('GROQ_API_KEY', '')
    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            user_message = build_claude_prompt(inputs, probability, risk_level, top_factors)
            
            response = client.chat.completions.create(
                model='llama-3.3-70b-versatile',  # Free, fast, good quality
                messages=[
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': user_message}
                ],
                max_tokens=1024,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[NLP] Groq API error: {e} — trying next provider")
    
    # Try Claude (paid, but best quality)
    anthropic_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if anthropic_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            user_message = build_claude_prompt(inputs, probability, risk_level, top_factors)
            
            message = client.messages.create(
                model='claude-sonnet-4-5',
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{'role': 'user', 'content': user_message}]
            )
            return message.content[0].text.strip()
        except Exception as e:
            print(f"[NLP] Claude API error: {e} — using fallback")
    
    # Fallback if no API keys or all failed
    print("[NLP] No API keys configured — using fallback report")
    return "Your cardiac risk assessment has been completed. Please consult your doctor to discuss these results in detail.\n\nDisclaimer: This assessment is for educational purposes only and is not a medical diagnosis. Please consult a qualified cardiologist for clinical advice."
