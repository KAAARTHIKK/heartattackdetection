import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { predict, updatePrediction } from '../lib/api';
import QuestionCard from '../components/QuestionCard';

const QUESTIONS = [
  {
    key: 'age', category: 'Demographics', question: 'How old are you?',
    helper: 'Your age is one of the most important factors in cardiac risk assessment.',
    type: 'number', min: 1, max: 120, step: 1, placeholder: '52',
  },
  {
    key: 'sex', category: 'Demographics', question: 'What is your biological sex?',
    helper: 'Biological sex affects hormone levels and cardiac risk patterns.',
    type: 'select', options: [{ value: '1', label: 'Male' }, { value: '0', label: 'Female' }],
  },
  {
    key: 'cp', category: 'Symptoms', question: 'Do you experience chest pain?',
    helper: 'Chest pain type is a key indicator. Asymptomatic means no chest pain.',
    type: 'select', options: [
      { value: '1', label: 'Typical Angina — chest tightness during exertion' },
      { value: '2', label: 'Atypical Angina — chest discomfort, not classic' },
      { value: '3', label: 'Non-Anginal Pain — chest pain unrelated to heart' },
      { value: '4', label: 'Asymptomatic — no chest pain' },
    ],
  },
  {
    key: 'trestbps', category: 'Vitals', question: 'What is your resting blood pressure?',
    helper: 'Your blood pressure when at rest, measured in mmHg. Normal is around 120.',
    type: 'number', min: 80, max: 200, step: 1, placeholder: '120',
  },
  {
    key: 'chol', category: 'Lab Results', question: 'What is your cholesterol level?',
    helper: 'Total serum cholesterol in mg/dl. Healthy levels are below 200.',
    type: 'number', min: 100, max: 600, step: 1, placeholder: '200',
  },
  {
    key: 'fbs', category: 'Lab Results', question: 'Is your fasting blood sugar above 120 mg/dl?',
    helper: 'High fasting blood sugar can indicate diabetes, which increases cardiac risk.',
    type: 'select', options: [
      { value: '0', label: 'No — 120 mg/dl or below' },
      { value: '1', label: 'Yes — above 120 mg/dl' },
    ],
  },
  {
    key: 'restecg', category: 'Diagnostics', question: 'What does your resting ECG show?',
    helper: "An electrocardiogram measures your heart's electrical activity at rest.",
    type: 'select', options: [
      { value: '0', label: 'Normal' },
      { value: '1', label: 'ST-T Wave Abnormality' },
      { value: '2', label: 'Left Ventricular Hypertrophy' },
    ],
  },
  {
    key: 'thalach', category: 'Vitals', question: 'What is your maximum heart rate?',
    helper: 'The highest heart rate achieved during exercise testing, in beats per minute.',
    type: 'number', min: 60, max: 220, step: 1, placeholder: '150',
  },
  {
    key: 'exang', category: 'Symptoms', question: 'Do you get chest pain during exercise?',
    helper: 'Exercise-induced angina is chest pain or discomfort triggered by physical activity.',
    type: 'select', options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
  },
  {
    key: 'oldpeak', category: 'Diagnostics', question: 'What is your ST depression value?',
    helper: 'ST depression induced by exercise relative to rest. Higher values indicate more stress on the heart.',
    type: 'number', min: 0, max: 6.2, step: 0.1, placeholder: '1.0',
  },
  {
    key: 'slope', category: 'Diagnostics', question: 'What is the slope of your ST segment?',
    helper: 'The slope of the peak exercise ST segment on your ECG.',
    type: 'select', options: [
      { value: '1', label: 'Upsloping — generally favourable' },
      { value: '2', label: 'Flat — moderate concern' },
      { value: '3', label: 'Downsloping — higher concern' },
    ],
  },
  {
    key: 'ca', category: 'Diagnostics', question: 'How many major vessels are coloured by fluoroscopy?',
    helper: 'Number of major blood vessels (0–3) visible on a fluoroscopy scan. More vessels = higher risk.',
    type: 'select', options: [
      { value: '0', label: '0 vessels' },
      { value: '1', label: '1 vessel' },
      { value: '2', label: '2 vessels' },
      { value: '3', label: '3 vessels' },
    ],
  },
  {
    key: 'thal', category: 'Diagnostics', question: 'What is your thalassemia status?',
    helper: 'A blood disorder affecting haemoglobin. Detected via a thallium stress test.',
    type: 'select', options: [
      { value: '3', label: 'Normal' },
      { value: '6', label: 'Fixed Defect — permanent abnormality' },
      { value: '7', label: 'Reversible Defect — abnormality under stress' },
    ],
  },
];

const OPTION_LABELS = Object.fromEntries(
  QUESTIONS.filter(q => q.type === 'select').map(q => [
    q.key,
    Object.fromEntries(q.options.map(o => [o.value, o.label]))
  ])
);

const EMPTY = Object.fromEntries(QUESTIONS.map(q => [q.key, '']));

function NumberStepper({ value, onChange, min, max, step = 1, placeholder }) {
  const num = parseFloat(value);

  function increment() {
    const next = isNaN(num) ? parseFloat(placeholder || min) : Math.min(max, +(num + step).toFixed(2));
    onChange(String(next));
  }
  function decrement() {
    const next = isNaN(num) ? parseFloat(placeholder || min) : Math.max(min, +(num - step).toFixed(2));
    onChange(String(next));
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={decrement}
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all hover:opacity-80 active:scale-95"
        style={{ background: '#eceef0', color: '#131b2e' }}
      >
        −
      </button>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-32 text-center text-3xl font-extrabold border-0 outline-none bg-transparent"
        style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}
      />
      <button
        type="button"
        onClick={increment}
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all hover:opacity-80 active:scale-95"
        style={{ background: '#131b2e', color: '#fff' }}
      >
        +
      </button>
    </div>
  );
}

export default function Assessment({ user }) {
  const navigate = useNavigate();
  const { id: predictionId } = useParams();

  const [step, setStep]           = useState(1);
  const [direction, setDirection] = useState('forward');
  const [values, setValues]       = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState('');
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!predictionId) return;
    supabase
      .from('predictions')
      .select('input_data')
      .eq('id', predictionId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Assessment fetch error:', error);
          return;
        }
        if (data?.input_data) {
          setValues(Object.fromEntries(
            Object.entries(data.input_data).map(([k, v]) => [k, String(v)])
          ));
        }
      });
  }, [predictionId]);

  const q = QUESTIONS[step - 1];

  function validateStep() {
    const val = values[q.key];
    if (val === '' || val === null || val === undefined) {
      setErrors(e => ({ ...e, [q.key]: 'Please answer this question' }));
      return false;
    }
    if (q.type === 'number') {
      const n = parseFloat(val);
      if (isNaN(n) || n < q.min || n > q.max) {
        setErrors(e => ({ ...e, [q.key]: `Must be between ${q.min} and ${q.max}` }));
        return false;
      }
    }
    setErrors(e => ({ ...e, [q.key]: '' }));
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step === QUESTIONS.length) {
      setShowSummary(true);
    } else {
      setDirection('forward');
      setStep(s => s + 1);
    }
  }

  function handleBack() {
    if (showSummary) { setShowSummary(false); return; }
    setDirection('backward');
    setStep(s => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    setLoading(true);
    setApiError('');
    try {
      const inputs = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, parseFloat(v)])
      );
      console.log('Submitting prediction:', inputs);
      console.log('API URL:', import.meta.env.VITE_API_URL);
      
      for (const [k, v] of Object.entries(inputs)) {
        if (isNaN(v)) throw new Error(`Invalid value for ${k}`);
      }
      
      const result = predictionId
        ? await updatePrediction(predictionId, inputs, user.id)
        : await predict(inputs, user.id);

      console.log('Prediction result:', result);
      
      if (!result?.prediction_id) throw new Error('No prediction ID returned');
      navigate(`/results/${result.prediction_id}`);
    } catch (err) {
      console.error('Prediction error:', err);
      setApiError(err.message || 'Prediction failed. Please check the backend is running.');
      setLoading(false);
    }
  }

  function setValue(key, val) {
    setValues(v => ({ ...v, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  }

  if (showSummary) {
    return (
      <div className="min-h-screen px-4 py-8 fade-in" style={{ background: '#f7f9fb' }}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white shadow-[0_20px_40px_rgba(15,23,42,0.06)] p-8" style={{ borderRadius: '2rem' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#131b2e' }}>
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Review Your Answers</h2>
                <p className="text-xs" style={{ color: '#7c839b' }}>Check everything looks right before we run your assessment.</p>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              {QUESTIONS.map(q => (
                <div key={q.key} className="flex justify-between py-2.5 border-b text-sm" style={{ borderColor: '#f2f4f6' }}>
                  <span style={{ color: '#7c839b' }}>{q.question.replace('?', '')}</span>
                  <span className="font-semibold ml-4 text-right" style={{ color: '#131b2e' }}>
                    {q.type === 'select'
                      ? (OPTION_LABELS[q.key]?.[values[q.key]] || values[q.key])
                      : values[q.key]}
                  </span>
                </div>
              ))}
            </div>

            {apiError && (
              <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{apiError}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-full text-sm font-bold transition-all hover:bg-slate-50 active:scale-95"
                style={{ border: '2px solid #eceef0', color: '#45464d', fontFamily: 'Plus Jakarta Sans' }}
              >
                ← Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
              >
                {loading ? 'Analysing…' : '🔍 Run Assessment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#f7f9fb' }}>
      <div className="text-center mb-8">
        <h1 className="text-xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>
          {predictionId ? 'Update Assessment' : 'New Assessment'}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#7c839b' }}>Answer each question to get your cardiac risk score</p>
      </div>

      <QuestionCard
        key={step}
        step={step}
        total={QUESTIONS.length}
        category={q.category}
        question={q.question}
        helper={q.helper}
        onNext={handleNext}
        onBack={handleBack}
        direction={direction}
      >
        {q.type === 'number' ? (
          <div>
            <NumberStepper
              value={values[q.key]}
              onChange={val => setValue(q.key, val)}
              min={q.min}
              max={q.max}
              step={q.step || 1}
              placeholder={q.placeholder}
            />
            {errors[q.key] && (
              <p className="text-xs text-center mt-2" style={{ color: '#dc2626' }}>{errors[q.key]}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {q.options.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all"
                style={{
                  borderColor: values[q.key] === opt.value ? '#006c49' : '#eceef0',
                  background: values[q.key] === opt.value ? '#f0fdf4' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name={q.key}
                  value={opt.value}
                  checked={values[q.key] === opt.value}
                  onChange={() => setValue(q.key, opt.value)}
                  className="accent-[#006c49]"
                />
                <span className="text-sm" style={{ color: '#191c1e' }}>{opt.label}</span>
              </label>
            ))}
            {errors[q.key] && (
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors[q.key]}</p>
            )}
          </div>
        )}
      </QuestionCard>
    </div>
  );
}
