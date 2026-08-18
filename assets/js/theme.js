/* ============================================================
   FESTIVO — theme.js
   Dark mode toggle with localStorage persistence
   ============================================================ */

'use strict';

const THEME_KEY = 'festivo_theme';

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

// Apply on load (before DOMContentLoaded to prevent flash)
applyTheme(getStoredTheme());

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.theme-toggle, [data-action="toggle-theme"]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
    btn.setAttribute('aria-label', 'Toggle dark mode');
  });
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
});

window.toggleTheme = toggleTheme;
