/* ============================================================
   FESTIVO — auth.js
   Client-side authentication: registration, login, session,
   profile management, duplicate prevention.
   All user records are stored in localStorage under the key
   "festivo_users" as an array of user objects.
   The active session is kept under "festivo_session".
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────
   STORAGE KEYS
   ──────────────────────────────────────────────────────────── */
const AUTH_USERS_KEY   = 'festivo_users';
const AUTH_SESSION_KEY = 'festivo_session';

/* ────────────────────────────────────────────────────────────
   MINIMAL PASSWORD HASH  (djb2 — good enough for client demo)
   Never use this in production — use a real backend + bcrypt.
   ──────────────────────────────────────────────────────────── */
function hashPassword(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}

/* ────────────────────────────────────────────────────────────
   USER STORE HELPERS
   ──────────────────────────────────────────────────────────── */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]'); }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());
}

function findUserByPhone(phone) {
  const clean = phone.replace(/\D/g, '');
  return getUsers().find(u => u.phone.replace(/\D/g, '') === clean);
}

function findUserByEmailOrPhone(identifier) {
  const cleaned = identifier.trim();
  const byEmail = findUserByEmail(cleaned);
  if (byEmail) return byEmail;
  return findUserByPhone(cleaned);
}

/* ────────────────────────────────────────────────────────────
   REGISTRATION
   Returns { ok: true, user } or { ok: false, field, message }
   ──────────────────────────────────────────────────────────── */
function registerUser({ name, email, phone, password }) {
  // Duplicate email check
  if (findUserByEmail(email)) {
    return { ok: false, field: 'email', message: 'An account with this email already exists.' };
  }
  // Duplicate phone check
  if (findUserByPhone(phone)) {
    return { ok: false, field: 'phone', message: 'An account with this phone number already exists.' };
  }

  const user = {
    id:           'u_' + Date.now(),
    name:         name.trim(),
    email:        email.trim().toLowerCase(),
    phone:        phone.trim(),
    passwordHash: hashPassword(password),
    createdAt:    new Date().toISOString(),
    // profile extras (editable from dashboard)
    firstName:    name.trim().split(' ')[0] || '',
    lastName:     name.trim().split(' ').slice(1).join(' ') || '',
    address:      '',
    avatar:       name.trim().charAt(0).toUpperCase(),
  };

  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

/* ────────────────────────────────────────────────────────────
   LOGIN
   identifier can be email OR phone number.
   Returns { ok: true, user } or { ok: false, message }
   ──────────────────────────────────────────────────────────── */
function loginUser(identifier, password) {
  const user = findUserByEmailOrPhone(identifier);
  if (!user) {
    return { ok: false, message: 'No account found with this email or phone number.' };
  }
  if (user.passwordHash !== hashPassword(password)) {
    return { ok: false, message: 'Incorrect password. Please try again.' };
  }
  return { ok: true, user };
}

/* ────────────────────────────────────────────────────────────
   SESSION
   ──────────────────────────────────────────────────────────── */
function setSession(user, remember = false) {
  const session = {
    userId:    user.id,
    name:      user.name,
    email:     user.email,
    phone:     user.phone,
    avatar:    user.avatar,
    createdAt: new Date().toISOString(),
  };
  const store = remember ? localStorage : sessionStorage;
  store.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  // Always keep a copy in localStorage for cross-tab awareness
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
             || localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isLoggedIn() {
  return !!getSession();
}

function clearSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
  // legacy keys used by old code
  localStorage.removeItem('festivo_logged_in');
  localStorage.removeItem('festivo_user');
}

/* ────────────────────────────────────────────────────────────
   PROFILE UPDATE
   ──────────────────────────────────────────────────────────── */
function updateProfile({ firstName, lastName, email, phone, address }) {
  const session = getSession();
  if (!session) return { ok: false, message: 'Not logged in.' };

  const users = getUsers();
  const idx   = users.findIndex(u => u.id === session.userId);
  if (idx === -1) return { ok: false, message: 'User not found.' };

  const user = users[idx];

  // Check email uniqueness if changed
  const newEmail = email.trim().toLowerCase();
  if (newEmail !== user.email) {
    const conflict = findUserByEmail(newEmail);
    if (conflict && conflict.id !== user.id) {
      return { ok: false, field: 'email', message: 'This email is already used by another account.' };
    }
  }
  // Check phone uniqueness if changed
  const newPhone = phone.trim();
  if (newPhone.replace(/\D/g, '') !== user.phone.replace(/\D/g, '')) {
    const conflict = findUserByPhone(newPhone);
    if (conflict && conflict.id !== user.id) {
      return { ok: false, field: 'phone', message: 'This phone number is already used by another account.' };
    }
  }

  const fullName = (firstName + ' ' + lastName).trim();
  users[idx] = {
    ...user,
    firstName,
    lastName,
    name:    fullName,
    email:   newEmail,
    phone:   newPhone,
    address: address || user.address,
    avatar:  (firstName.charAt(0) || user.avatar).toUpperCase(),
  };
  saveUsers(users);

  // Refresh session
  setSession(users[idx]);
  return { ok: true, user: users[idx] };
}

/* ────────────────────────────────────────────────────────────
   DUPLICATE CHECK HELPERS  (used for real-time hints)
   ──────────────────────────────────────────────────────────── */
function isEmailTaken(email, excludeId = null) {
  const u = findUserByEmail(email);
  return u && u.id !== excludeId;
}
function isPhoneTaken(phone, excludeId = null) {
  const u = findUserByPhone(phone);
  return u && u.id !== excludeId;
}

/* ────────────────────────────────────────────────────────────
   EXPOSE on window for use by inline scripts & validation.js
   ──────────────────────────────────────────────────────────── */
window.FestivoAuth = {
  registerUser,
  loginUser,
  setSession,
  getSession,
  isLoggedIn,
  clearSession,
  updateProfile,
  isEmailTaken,
  isPhoneTaken,
};
