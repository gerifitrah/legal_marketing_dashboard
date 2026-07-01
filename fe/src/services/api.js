// Normalize VITE_API_URL so a misconfigured value can't produce a broken URL:
// - default to the local backend when unset
// - prepend https:// when the protocol is missing (otherwise fetch treats it as
//   a relative path and glues it onto the site's own origin)
// - drop any trailing slash, then ensure the base ends with /api (the backend
//   mounts every route under /api)
function normalizeBase(raw) {
  let base = (raw || 'http://localhost:3000/api').trim();
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  base = base.replace(/\/+$/, '');
  if (!/\/api$/i.test(base)) base = `${base}/api`;
  return base;
}

const BASE = normalizeBase(import.meta.env.VITE_API_URL);
const AUTH_KEY = 'auth';

// Read the token straight from storage so this module stays free of circular
// imports with the auth store.
function authHeader() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    return saved?.token ? { Authorization: `Bearer ${saved.token}` } : {};
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeader(),
      ...(options.headers || {}),
    },
  });

  // Session expired / not authenticated on a protected route: clear and bounce
  // to login (but not for the auth endpoints themselves, where 401 = bad creds).
  if (res.status === 401 && !path.startsWith('/auth')) {
    localStorage.removeItem(AUTH_KEY);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  // Projects
  getProjects: () => request('/projects'),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) =>
    request(`/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateStages: (id, stages) =>
    request(`/projects/${id}/stages`, { method: 'PATCH', body: JSON.stringify({ stages }) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (month) => request(`/transactions${month ? `?month=${month}` : ''}`),
  createTransaction: (formData) => request('/transactions', { method: 'POST', body: formData }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: () => request('/dashboard'),
};
