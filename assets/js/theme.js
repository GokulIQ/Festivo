/* ============================================================
   FESTIVO — theme.js
   Dark mode + RTL toggle with localStorage persistence
   Runs before DOMContentLoaded to prevent flash.
   ============================================================ */

'use strict';

const THEME_KEY = 'festivo_theme';
const RTL_KEY   = 'festivo_dir';

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ── RTL ──────────────────────────────────────────────────────
function getStoredDir() {
  return localStorage.getItem(RTL_KEY) || 'ltr';
}
function applyDir(dir) {
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', dir === 'rtl' ? 'ar' : 'en');
  localStorage.setItem(RTL_KEY, dir);
}

// Apply on load (before DOMContentLoaded to prevent flash)
applyTheme(getStoredTheme());
applyDir(getStoredDir());

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.theme-toggle, [data-action="toggle-theme"]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
    btn.setAttribute('aria-label', 'Toggle dark mode');
  });
});

window.applyDir      = applyDir;
window.getStoredDir  = getStoredDir;

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
});

window.toggleTheme = toggleTheme;
