'use strict';

// --- Config ------------------------------------------------------------------
const API_URL = 'http://localhost:8000';

// Gauge SVG constants (must match CSS --gauge-circ = 2 * pi * 50)
const GAUGE_CIRCUMFERENCE = 314.16;

// Sample patient values (hardcoded per spec)
const SAMPLE_PATIENT = {
  age: 52, sex: 1, cp: 0, trestbps: 125, chol: 212,
  fbs: 0, restecg: 1, thalach: 168, exang: 0,
  oldpeak: 1.0, slope: 2, ca: 2, thal: 3
};

// Numeric fields that need range validation
const NUMERIC_FIELDS = {
  age:      { min: 1,   max: 120 },
  trestbps: { min: 80,  max: 200 },
  chol:     { min: 100, max: 600 },
  thalach:  { min: 60,  max: 220 },
  oldpeak:  { min: 0.0, max: 6.2 }
};

// All 13 API field names (order matches backend)
const ALL_FIELDS = [
  'age', 'sex', 'cp', 'trestbps', 'chol',
  'fbs', 'restecg', 'thalach', 'exang',
  'oldpeak', 'slope', 'ca', 'thal'
];

// Human-readable feature name mapping
const FEATURE_LABELS = {
  age:      'Age',
  sex:      'Sex',
  cp:       'Chest Pain Type',
  trestbps: 'Resting Blood Pressure',
  chol:     'Cholesterol',
  fbs:      'Fasting Blood Sugar',
  restecg:  'Resting ECG',
  thalach:  'Max Heart Rate',
  exang:    'Exercise Induced Angina',
  oldpeak:  'ST Depression',
  slope:    'ST Slope',
  ca:       'Major Vessels (fluoroscopy)',
  thal:     'Thalassemia'
};

// --- DOM refs -----------------------------------------------------------------
const form         = document.getElementById('predictionForm');
const spinner      = document.getElementById('spinner');
const errorAlert   = document.getElementById('errorAlert');
const resultsCard  = document.getElementById('resultsCard');
const gaugeFill    = document.getElementById('gaugeFill');
const gaugePercent = document.getElementById('gaugePercent');
const riskBadge    = document.getElementById('riskBadge');
const factorsList  = document.getElementById('factorsList');
const sampleBtn    = document.getElementById('sampleBtn');
const resetBtn     = document.getElementById('resetBtn');

// --- Event listeners ----------------------------------------------------------
form.addEventListener('submit', handleSubmit);
sampleBtn.addEventListener('click', loadSample);
resetBtn.addEventListener('click', resetAll);

Object.keys(NUMERIC_FIELDS).forEach(function(name) {
  var el = document.getElementById(name);
  if (el) {
    el.addEventListener('input',  function() { validateNumeric(name); });
    el.addEventListener('blur',   function() { validateNumeric(name); });
  }
});

// --- Validation ---------------------------------------------------------------
function validateNumeric(name) {
  var el    = document.getElementById(name);
  var errEl = document.getElementById(name + '-error');
  var val   = el.value.trim();
  var range = NUMERIC_FIELDS[name];

  if (val === '') {
    clearFieldError(el, errEl);
    return true;
  }

  var num = parseFloat(val);
  if (isNaN(num) || num < range.min || num > range.max) {
    setFieldError(el, errEl, 'Must be between ' + range.min + ' and ' + range.max);
    return false;
  }

  clearFieldError(el, errEl);
  return true;
}

function setFieldError(el, errEl, msg) {
  el.classList.add('invalid');
  errEl.textContent = msg;
}

function clearFieldError(el, errEl) {
  el.classList.remove('invalid');
  errEl.textContent = '';
}

function validateAll() {
  var ok = true;

  ALL_FIELDS.forEach(function(name) {
    var el    = document.getElementById(name);
    var errEl = document.getElementById(name + '-error');
    var val   = el.value.trim();

    if (val === '') {
      setFieldError(el, errEl, 'This field is required');
      ok = false;
      return;
    }

    if (NUMERIC_FIELDS[name]) {
      if (!validateNumeric(name)) ok = false;
    }
  });

  return ok;
}

// --- Sample data --------------------------------------------------------------
function loadSample() {
  ALL_FIELDS.forEach(function(name) {
    var el = document.getElementById(name);
    if (el) {
      el.value = SAMPLE_PATIENT[name];
      var errEl = document.getElementById(name + '-error');
      if (errEl) clearFieldError(el, errEl);
    }
  });
}

// --- Form submit --------------------------------------------------------------
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateAll()) return;

  var payload = {};
  ALL_FIELDS.forEach(function(name) {
    payload[name] = parseFloat(document.getElementById(name).value);
  });

  setUIState('loading');

  try {
    var res = await fetch(API_URL + '/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    if (!res.ok) {
      var errData = await res.json().catch(function() { return {}; });
      throw new Error(errData.detail || ('Server error ' + res.status));
    }

    var data = await res.json();
    renderResults(data);
    setUIState('results');
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Prediction error:', err);
    setUIState('error');
  }
}

// --- Render results -----------------------------------------------------------
function renderResults(data) {
  var pct = Math.round(data.risk_probability * 100);

  animateGauge(pct, data.zone || data.risk_level);

  riskBadge.textContent = data.risk_level;
  riskBadge.className   = 'risk-badge ' + riskClass(data.zone || data.risk_level);

  // Model agreement badge
  var agreementEl = document.getElementById('modelAgreement');
  if (agreementEl && data.model_agreement !== undefined) {
    var agreePct = Math.round(data.model_agreement * 100);
    agreementEl.textContent = 'Model agreement: ' + agreePct + '%';
    agreementEl.className = 'agreement-badge ' + (agreePct >= 80 ? 'agree-high' : 'agree-low');
    agreementEl.classList.remove('hidden');
  }

  factorsList.innerHTML = '';
  var maxAbs = Math.max.apply(null, data.top_factors.map(function(f) { return Math.abs(f.shap); }));

  data.top_factors.forEach(function(factor) {
    var isRisk    = factor.shap > 0;
    var barPct    = maxAbs > 0 ? (Math.abs(factor.shap) / maxAbs) * 100 : 0;
    var label     = FEATURE_LABELS[factor.feature] || factor.feature;
    var barClass  = isRisk ? 'risk' : 'safe';
    var arrowChar = isRisk ? 'increases risk' : 'decreases risk';

    var row = document.createElement('div');
    row.className = 'factor-row';
    row.innerHTML =
      '<span class="factor-name" title="' + label + '">' + label + '</span>' +
      '<div class="factor-bar-track">' +
        '<div class="factor-bar-fill ' + barClass + '" data-width="' + barPct.toFixed(1) + '">' +
          '<span style="font-size:0.7rem;color:#fff;font-weight:600;">' + arrowChar + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="factor-shap">' + Math.abs(factor.shap).toFixed(3) + '</span>';

    factorsList.appendChild(row);
  });

  requestAnimationFrame(function() {
    document.querySelectorAll('.factor-bar-fill').forEach(function(bar) {
      bar.style.width = bar.dataset.width + '%';
    });
  });
}

// --- Gauge animation ----------------------------------------------------------
function animateGauge(targetPct, riskLevel) {
  gaugeFill.style.strokeDashoffset = GAUGE_CIRCUMFERENCE;
  gaugePercent.textContent = '0%';
  gaugeFill.style.stroke = gaugeColor(riskLevel);

  var current = 0;
  var step    = targetPct / 60;
  var timer   = setInterval(function() {
    current = Math.min(current + step, targetPct);
    var offset = GAUGE_CIRCUMFERENCE - (current / 100) * GAUGE_CIRCUMFERENCE;
    gaugeFill.style.strokeDashoffset = offset;
    gaugePercent.textContent = Math.round(current) + '%';
    if (current >= targetPct) clearInterval(timer);
  }, 16);
}

// --- Helpers ------------------------------------------------------------------
function riskClass(zoneOrLevel) {
  if (zoneOrLevel === 'high_risk'  || zoneOrLevel === 'High Risk')     return 'high';
  if (zoneOrLevel === 'uncertain'  || zoneOrLevel.startsWith('Uncertain')) return 'uncertain';
  return 'low';
}

function gaugeColor(zoneOrLevel) {
  var style = getComputedStyle(document.documentElement);
  if (zoneOrLevel === 'high_risk'  || zoneOrLevel === 'High Risk')     return style.getPropertyValue('--color-high').trim();
  if (zoneOrLevel === 'uncertain'  || zoneOrLevel.startsWith('Uncertain')) return style.getPropertyValue('--color-moderate').trim();
  return style.getPropertyValue('--color-low').trim();
}

function setUIState(state) {
  spinner.classList.add('hidden');
  errorAlert.classList.add('hidden');
  resultsCard.classList.add('hidden');

  if (state === 'loading') spinner.classList.remove('hidden');
  if (state === 'error')   errorAlert.classList.remove('hidden');
  if (state === 'results') resultsCard.classList.remove('hidden');
}

function resetAll() {
  form.reset();

  ALL_FIELDS.forEach(function(name) {
    var el    = document.getElementById(name);
    var errEl = document.getElementById(name + '-error');
    if (el && errEl) clearFieldError(el, errEl);
  });

  setUIState('idle');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
