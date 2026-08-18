/* ============================================================
   FESTIVO — rtl.js
   RTL toggle with localStorage persistence
   ============================================================ */

'use strict';

const RTL_KEY = 'festivo_rtl';

function isRTL() { return localStorage.getItem(RTL_KEY) === 'rtl'; }

function applyRTL(enabled) {
  document.documentElement.setAttribute('dir', enabled ? 'rtl' : 'ltr');
  localStorage.setItem(RTL_KEY, enabled ? 'rtl' : 'ltr');
  document.querySelectorAll('.rtl-toggle-label').forEach(el => {
    el.textContent = enabled ? 'Switch to LTR' : 'Switch to RTL';
  });
}

function toggleRTL() { applyRTL(!isRTL()); }

// Apply persisted preference
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem(RTL_KEY);
  if (saved) applyRTL(saved === 'rtl');

  document.querySelectorAll('.rtl-toggle, [data-action="toggle-rtl"]').forEach(btn => {
    btn.addEventListener('click', toggleRTL);
  });
});

window.toggleRTL = toggleRTL;
window.isRTL     = isRTL;
