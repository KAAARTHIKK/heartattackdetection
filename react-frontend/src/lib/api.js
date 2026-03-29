import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getAuthHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** POST /predict — run new prediction */
export async function predict(inputs, userId) {
  return request('POST', '/predict', { ...inputs, user_id: userId });
}

/** PUT /predict/:id — update existing prediction */
export async function updatePrediction(predictionId, inputs, userId) {
  return request('PUT', `/predict/${predictionId}`, { ...inputs, user_id: userId });
}

/** GET /health */
export async function healthCheck() {
  return request('GET', '/health');
}
