const API = 'https://ashikin-website.onrender.com';

// ── Tab switching ──
function showTab(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabs = document.querySelectorAll('.tab');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
  }
  clearErrors();
}

function clearErrors() {
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('signup-error').classList.add('hidden');
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Login ──
async function handleLogin(e) {
  e.preventDefault();
  clearErrors();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    saveSession(data.token);
    loadDashboard();
  } catch (err) {
    showError('login-error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

// ── Signup ──
async function handleSignup(e) {
  e.preventDefault();
  clearErrors();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const btn = document.getElementById('signup-btn');

  if (password !== confirm) {
    showError('signup-error', 'Passwords do not match');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Signup failed');
    saveSession(data.token);
    loadDashboard();
  } catch (err) {
    showError('signup-error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

// ── Dashboard ──
async function loadDashboard() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { logout(); return; }
    const user = await res.json();

    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('nav-email').textContent = user.email;
    document.getElementById('welcome-msg').textContent = `Welcome to you, Mou! 👋`;
    document.getElementById('dash-email').textContent = user.email;
    document.getElementById('dash-created').textContent = new Date(user.created_at).toLocaleDateString('en-CA', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    logout();
  }
}

// ── Session helpers ──
function saveSession(token) { localStorage.setItem('auth_token', token); }
function getToken() { return localStorage.getItem('auth_token'); }

function logout() {
  localStorage.removeItem('auth_token');
  document.getElementById('dashboard-page').classList.add('hidden');
  document.getElementById('auth-page').classList.remove('hidden');
  showTab('login');
}

// ── Auto-login if token exists ──
if (getToken()) loadDashboard();
