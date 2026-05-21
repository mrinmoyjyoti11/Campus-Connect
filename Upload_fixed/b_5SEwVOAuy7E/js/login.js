// js/login.js
// Connects your login form to the C++ backend at localhost:8080

const BASE_URL = 'http://localhost:8080/api';

// ---- Role card selection ----
const roleCards = document.querySelectorAll('.role-card');
roleCards.forEach(card => {
  card.addEventListener('click', () => {
    roleCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
});

// ---- Login form submit ----
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.querySelector('.login-btn');

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  // Show loading state
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  clearError();

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Invalid email or password.');
      return;
    }

    // Save session to sessionStorage
    sessionStorage.setItem('campus_token',  data.token);
    sessionStorage.setItem('campus_role',   data.role);
    sessionStorage.setItem('campus_userId', data.userId);

    // Optionally save to localStorage if "Remember me" is checked
    if (document.getElementById('remember').checked) {
      localStorage.setItem('campus_token',  data.token);
      localStorage.setItem('campus_role',   data.role);
      localStorage.setItem('campus_userId', data.userId);
    }

    // Redirect based on role
    switch (data.role) {
      case 'admin':
        window.location.href = 'admin.html';
        break;
      case 'teacher':
        window.location.href = 'teacher.html';
        break;
      case 'student':
        window.location.href = 'student.html';
        break;
      default:
        showError('Unknown role. Contact administrator.');
    }

  } catch (err) {
    // This fires if the server is not running
    showError('Cannot connect to server. Make sure campus_api.exe is running.');
  } finally {
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
});

// ---- Helper: show/clear error message ----
function showError(msg) {
  clearError();
  const err = document.createElement('p');
  err.id = 'login-error';
  err.textContent = msg;
  err.style.cssText = `
    color: #ef4444;
    font-size: 14px;
    margin: 8px 0 0;
    text-align: center;
    animation: fadeIn 0.2s ease;
  `;
  document.querySelector('.login-btn').before(err);
}

function clearError() {
  const existing = document.getElementById('login-error');
  if (existing) existing.remove();
}

// ---- Auto-restore session if already logged in ----
(function checkExistingSession() {
  const token = sessionStorage.getItem('campus_token')
             || localStorage.getItem('campus_token');
  const role  = sessionStorage.getItem('campus_role')
             || localStorage.getItem('campus_role');

  if (token && role) {
    // Already logged in — redirect straight to dashboard
    switch (role) {
      case 'admin':   window.location.href = 'admin.html';   break;
      case 'teacher': window.location.href = 'teacher.html'; break;
      case 'student': window.location.href = 'student.html'; break;
    }
  }
})();
