import { reactive } from 'vue';
import { api } from './services/api.js';

const AUTH_KEY = 'auth';
const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');

// Shared auth state, persisted to localStorage so a refresh keeps the session.
export const auth = reactive({
  token: saved?.token || null,
  user: saved?.user || null,

  get isAuthenticated() {
    return !!this.token;
  },

  _persist() {
    if (this.token) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token: this.token, user: this.user }));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  },

  async login(username, password) {
    const data = await api.login({ username, password });
    this.token = data.token;
    this.user = data.user;
    this._persist();
  },

  // Register a new account without touching the current session. Used by an
  // already-authenticated user to create additional accounts from inside the
  // app, so the creator stays logged in. Returns the created user.
  async registerUser(username, password) {
    const data = await api.register({ username, password });
    return data.user;
  },

  logout() {
    this.token = null;
    this.user = null;
    this._persist();
  },
});
