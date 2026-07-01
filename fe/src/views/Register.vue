<script setup>
import { ref } from 'vue';
import { auth } from '../auth.js';

const username = ref('');
const password = ref('');
const confirm = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,50}$/;

async function submit() {
  error.value = '';
  success.value = '';
  const name = username.value.trim();

  if (!USERNAME_RE.test(name)) {
    error.value = 'Username harus 3-50 karakter (huruf, angka, . _ -)';
    return;
  }
  if (password.value.length < 6) {
    error.value = 'Password minimal 6 karakter';
    return;
  }
  if (password.value !== confirm.value) {
    error.value = 'Konfirmasi password tidak cocok';
    return;
  }

  loading.value = true;
  try {
    const user = await auth.registerUser(name, password.value);
    success.value = `Akun "${user.username}" berhasil dibuat.`;
    username.value = '';
    password.value = '';
    confirm.value = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="main-content">
    <header class="header">
      <div class="header-title">
        <h1>Tambah User</h1>
        <p>Buat akun baru untuk mengakses dashboard</p>
      </div>
    </header>

    <section class="form-section">
      <div class="chart-card" style="max-width: 480px;">
        <form @submit.prevent="submit">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" v-model="username" class="form-control" placeholder="Username" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" v-model="password" class="form-control" placeholder="Minimal 6 karakter" required>
          </div>
          <div class="form-group">
            <label class="form-label">Konfirmasi Password</label>
            <input type="password" v-model="confirm" class="form-control" placeholder="Ulangi password" required>
          </div>

          <div v-if="error" class="auth-error">{{ error }}</div>
          <div v-if="success" class="auth-success">{{ success }}</div>

          <button type="submit" class="btn-primary" style="margin-top: 8px;" :disabled="loading">
            <i class="ph ph-user-plus"></i> {{ loading ? 'Memproses...' : 'Buat Akun' }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-error {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 16px;
}
.auth-success {
  background: rgba(34, 197, 94, 0.1);
  color: #16A34A;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 16px;
}
</style>
