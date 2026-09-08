/* ============================================================
   FESTIVO — dashboard.js
   Admin & customer dashboard interactions, charts
   ============================================================ */

'use strict';

/* ============================================================
   MINI SPARKLINE CHARTS (pure CSS/SVG, no dependencies)
   ============================================================ */
function renderSparkline(canvasId, data, color = '#e8384f') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const w      = canvas.width;
  const h      = canvas.height;
  const max    = Math.max(...data);
  const min    = Math.min(...data);
  const range  = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h * 0.85) - h * 0.05
  }));

  ctx.clearRect(0, 0, w, h);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '40');
  grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(w, h); ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

/* ============================================================
   BAR CHART
   ============================================================ */
function renderBarChart(canvasId, labels, data, color = '#e8384f') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx   = canvas.getContext('2d');
  const w     = canvas.width;
  const h     = canvas.height;
  const max   = Math.max(...data) * 1.2;
  const pad   = 40;
  const barW  = (w - pad * 2) / labels.length * 0.6;
  const gap   = (w - pad * 2) / labels.length;

  ctx.clearRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + ((h - pad * 2) / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
  }

  // Bars
  data.forEach((v, i) => {
    const x   = pad + gap * i + gap * 0.2;
    const bh  = ((v / max) * (h - pad * 2));
    const y   = h - pad - bh;
    const grad = ctx.createLinearGradient(0, y, 0, h - pad);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '80');
    ctx.fillStyle   = grad;
    ctx.beginPath();
    ctx.roundRect?.(x, y, barW, bh, 4);
    if (!ctx.roundRect) ctx.fillRect(x, y, barW, bh);
    ctx.fill();

    // Label
    ctx.fillStyle   = '#6b7280';
    ctx.font        = '11px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText(labels[i], x + barW / 2, h - pad + 14);
  });
}

/* ============================================================
   LINE CHART
   ============================================================ */
function renderLineChart(canvasId, labels, datasets, colors = ['#e8384f', '#f59e0b']) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx   = canvas.getContext('2d');
  const w     = canvas.width;
  const h     = canvas.height;
  const allV  = datasets.flat();
  const max   = Math.max(...allV) * 1.15;
  const pad   = 48;

  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad + ((h - pad * 2) / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    const val = Math.round((max * (5 - i)) / 5);
    ctx.fillStyle = '#9ca3af'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(val >= 1000 ? (val/1000).toFixed(0)+'k' : val, pad - 4, y + 4);
  }

  // Each dataset
  datasets.forEach((data, di) => {
    const color  = colors[di % colors.length];
    const points = data.map((v, i) => ({
      x: pad + (i / (labels.length - 1)) * (w - pad * 2),
      y: h - pad - (v / max) * (h - pad * 2)
    }));

    // Fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '30');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length-1].x, h - pad);
    ctx.lineTo(points[0].x, h - pad);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

    // Dots
    points.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    });
  });

  // X labels
  labels.forEach((label, i) => {
    const x = pad + (i / (labels.length - 1)) * (w - pad * 2);
    ctx.fillStyle = '#9ca3af'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x, h - pad + 16);
  });
}

/* ============================================================
   DONUT CHART
   ============================================================ */
function renderDonutChart(canvasId, data, colors, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const w      = canvas.width;
  const h      = canvas.height;
  const cx     = w / 2;
  const cy     = h / 2;
  const radius = Math.min(w, h) / 2 - 20;
  const inner  = radius * 0.55;
  const total  = data.reduce((s, v) => s + v, 0);

  ctx.clearRect(0, 0, w, h);

  let startAngle = -Math.PI / 2;
  data.forEach((v, i) => {
    const slice = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    startAngle += slice;
  });

  // Inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--white').trim() || '#ffffff';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#1f2937'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(total.toLocaleString(), cx, cy + 4);
  ctx.fillStyle = '#6b7280'; ctx.font = '11px sans-serif';
  ctx.fillText('Total', cx, cy + 18);
}

/* ============================================================
   INIT ALL DASHBOARD CHARTS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Revenue line chart
  renderLineChart('revenueChart',
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    [[42000,55000,38000,67000,72000,59000,84000,91000,78000,95000,102000,125000]],
    ['#e8384f']
  );

  // Orders bar chart
  renderBarChart('ordersChart',
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    [120, 145, 98, 167, 189, 143, 211, 234, 198, 245, 267, 312],
    '#f59e0b'
  );

  // Orders by occasion donut
  renderDonutChart('occasionChart',
    [35, 25, 20, 12, 8],
    ['#e8384f','#f59e0b','#8b5cf6','#10b981','#3b82f6'],
    ['Birthdays','Weddings','Festivals','Baby Showers','Other']
  );

  // Customer growth
  renderLineChart('customerChart',
    ['Jan','Feb','Mar','Apr','May','Jun'],
    [[210,280,340,390,460,520]],
    ['#8b5cf6']
  );

  // Sparklines for analytics cards
  renderSparkline('sparkRevenue',  [45,52,38,67,72,59,84,91], '#e8384f');
  renderSparkline('sparkOrders',   [120,145,98,167,189,143,211,234], '#f59e0b');
  renderSparkline('sparkCustomers',[210,230,280,310,340,370,410,460], '#8b5cf6');
  renderSparkline('sparkProducts', [89,92,96,101,110,115,118,124], '#10b981');
});

/* ============================================================
   ADMIN TABLE ACTIONS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Select all checkbox
  const selectAll = document.getElementById('selectAll');
  selectAll?.addEventListener('change', () => {
    document.querySelectorAll('.row-check').forEach(cb => cb.checked = selectAll.checked);
  });

  // Delete confirmation
  document.querySelectorAll('[data-action="delete-row"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this item?')) {
        btn.closest('tr')?.remove();
        window.showToast?.('success', 'Deleted', 'Item successfully deleted.');
      }
    });
  });

  // Status change
  document.querySelectorAll('[data-action="change-status"]').forEach(sel => {
    sel.addEventListener('change', () => {
      window.showToast?.('success', 'Status Updated', `Order status changed to ${sel.value}.`);
    });
  });
});

/* ============================================================
   CUSTOMER DASHBOARD
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const orders = JSON.parse(localStorage.getItem('festivo_orders') || '[]');
  const orderCount = document.getElementById('totalOrderCount');
  if (orderCount) orderCount.textContent = orders.length || 3; // Demo default
});
