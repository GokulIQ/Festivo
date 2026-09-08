/* ============================================================
   FESTIVO — validation.js
   Form validation for contact, checkout, auth, bulk enquiry
   ============================================================ */

'use strict';

/* ============================================================
   CORE VALIDATOR
   ============================================================ */
const Validators = {
  required: (val) => val.trim().length > 0,
  email:    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
  phone:    (val) => /^[+]?[\d\s\-\(\)]{7,15}$/.test(val.trim()),
  minLen:   (val, n) => val.trim().length >= n,
  maxLen:   (val, n) => val.trim().length <= n,
  match:    (val, other) => val === other,
  checked:  (el) => el.checked,
};

function validateField(input) {
  const rules   = (input.dataset.validate || '').split('|').filter(Boolean);
  const label   = input.dataset.label || input.name || 'Field';
  let   valid   = true;
  let   message = '';

  for (const rule of rules) {
    const [name, arg] = rule.split(':');
    switch (name) {
      case 'required':
        if (!Validators.required(input.value)) { valid = false; message = `${label} is required.`; }
        break;
      case 'email':
        if (input.value.trim() && !Validators.email(input.value)) { valid = false; message = 'Please enter a valid email address.'; }
        break;
      case 'phone':
        if (input.value.trim() && !Validators.phone(input.value)) { valid = false; message = 'Please enter a valid phone number.'; }
        break;
      case 'min':
        if (!Validators.minLen(input.value, parseInt(arg))) { valid = false; message = `${label} must be at least ${arg} characters.`; }
        break;
      case 'max':
        if (!Validators.maxLen(input.value, parseInt(arg))) { valid = false; message = `${label} must not exceed ${arg} characters.`; }
        break;
      case 'match':
        const other = document.getElementById(arg) || document.querySelector(`[name="${arg}"]`);
        if (other && !Validators.match(input.value, other.value)) { valid = false; message = 'Passwords do not match.'; }
        break;
      case 'checked':
        if (!Validators.checked(input)) { valid = false; message = `Please agree to ${label}.`; }
        break;
    }
    if (!valid) break;
  }

  setFieldState(input, valid, message);
  return valid;
}

function setFieldState(input, valid, message = '') {
  input.classList.toggle('is-valid',   valid);
  input.classList.toggle('is-invalid', !valid);

  // Messages must go outside the field wrapper (which may be a flex row)
  // so they render on a new line. Walk up to the nearest .form-group.
  const msgContainer = input.closest('.form-group') || input.parentElement;

  // Remove old message
  msgContainer.querySelector('.form-error, .form-success')?.remove();

  if (!valid && message) {
    const err = document.createElement('div');
    err.className = 'form-error';
    err.textContent = message;
    msgContainer.appendChild(err);
  } else if (valid && input.dataset.validate?.includes('required') && input.type !== 'password') {
    const ok = document.createElement('div');
    ok.className = 'form-success';
    ok.innerHTML = '<i class="bi bi-check-circle-fill"></i> Looks good!';
    msgContainer.appendChild(ok);
  }
}

function validateForm(form) {
  let allValid = true;
  form.querySelectorAll('[data-validate]').forEach(input => {
    if (!validateField(input)) allValid = false;
  });
  return allValid;
}

/* ============================================================
   REAL-TIME VALIDATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // On blur validation
  document.querySelectorAll('[data-validate]').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) validateField(input);
    });
  });

  /* -----------------------------------------------------------
     CONTACT FORM
     ----------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(contactForm)) {
      window.showToast?.('error', 'Check Your Input', 'Please fill in all required fields correctly.');
      return;
    }
    const btn = contactForm.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Sending…';
    setTimeout(() => {
      btn.disabled = false; btn.textContent = 'Send Message';
      contactForm.reset();
      contactForm.querySelectorAll('[data-validate]').forEach(el => { el.classList.remove('is-valid','is-invalid'); });
      document.querySelectorAll('.form-error,.form-success').forEach(el => el.remove());
      window.showToast?.('success', 'Message Sent!', "We'll get back to you within 24 hours.");
      window.openModal?.('thankYouModal');
    }, 1200);
  });

  /* -----------------------------------------------------------
     BULK ENQUIRY FORM
     ----------------------------------------------------------- */
  const bulkForm = document.getElementById('bulkEnquiryForm');
  bulkForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(bulkForm)) {
      window.showToast?.('error', 'Check Your Input', 'Please fill in all required fields.');
      return;
    }
    const btn = bulkForm.querySelector('[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Submitting…';
    setTimeout(() => {
      btn.disabled = false; btn.innerHTML = '<i class="bi bi-send-fill"></i> Request Bulk Quote';
      bulkForm.reset();
      window.showToast?.('success', 'Enquiry Submitted!', "Our team will contact you within 2 business hours.");
    }, 1500);
  });

  /* -----------------------------------------------------------
     LOGIN FORM  — real credential check via FestivoAuth
     ----------------------------------------------------------- */
  const loginForm = document.getElementById('loginForm');
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(loginForm)) return;

    const identifier = loginForm.querySelector('[name="email"]')?.value.trim() || '';
    const password   = loginForm.querySelector('[name="password"]')?.value     || '';
    const remember   = loginForm.querySelector('[name="remember"]')?.checked   || false;
    const btn        = loginForm.querySelector('[type="submit"]');

    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass"></i> Signing in…';

    // Small artificial delay for UX — remove if you want instant login
    setTimeout(() => {
      const result = window.FestivoAuth?.loginUser(identifier, password);

      if (!result) {
        // auth.js not loaded yet — should not happen in normal flow
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In';
        window.showToast?.('error', 'Auth Error', 'Authentication module not loaded.');
        return;
      }

      if (!result.ok) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In';
        // Show error under the email/identifier field
        const emailInput = loginForm.querySelector('[name="email"]');
        if (emailInput) setFieldState(emailInput, false, result.message);
        window.showToast?.('error', 'Sign In Failed', result.message);
        return;
      }

      window.FestivoAuth.setSession(result.user, remember);
      window.showToast?.('success', `Welcome back, ${result.user.name.split(' ')[0]}!`, 'You have been signed in successfully.');
      setTimeout(() => { window.location.href = 'customer-dashboard.html'; }, 800);
    }, 600);
  });

  /* -----------------------------------------------------------
     REGISTER FORM  — full validation + duplicate check + storage
     ----------------------------------------------------------- */
  const registerForm = document.getElementById('registerForm');
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(registerForm)) return;

    const name     = registerForm.querySelector('[name="name"]')?.value.trim()             || '';
    const email    = registerForm.querySelector('[name="email"]')?.value.trim()            || '';
    const phone    = registerForm.querySelector('[name="phone"]')?.value.trim()            || '';
    const password = registerForm.querySelector('[name="password"]')?.value                || '';
    const confirm  = registerForm.querySelector('[name="confirm_password"]')?.value        || '';
    const btn      = registerForm.querySelector('[type="submit"]');

    // Confirm password guard (belt-and-suspenders beyond data-validate)
    if (password !== confirm) {
      const confInput = registerForm.querySelector('[name="confirm_password"]');
      if (confInput) setFieldState(confInput, false, 'Passwords do not match.');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass"></i> Creating account…';

    const result = window.FestivoAuth?.registerUser({ name, email, phone, password });

    if (!result) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Create Account';
      window.showToast?.('error', 'Auth Error', 'Authentication module not loaded.');
      return;
    }

    if (!result.ok) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Create Account';
      // Highlight the offending field
      const offender = registerForm.querySelector(`[name="${result.field}"]`);
      if (offender) setFieldState(offender, false, result.message);
      window.showToast?.('error', 'Registration Failed', result.message);
      return;
    }

    window.showToast?.('success', 'Account Created!', `Welcome to Festivo, ${result.user.firstName}! Please sign in.`);
    setTimeout(() => { window.location.href = 'login.html'; }, 1200);
  });

  /* -----------------------------------------------------------
     REGISTER — real-time duplicate hints on blur
     ----------------------------------------------------------- */
  const regEmail = document.getElementById('regEmail');
  regEmail?.addEventListener('blur', () => {
    const val = regEmail.value.trim();
    if (val && window.FestivoAuth?.isEmailTaken(val)) {
      setFieldState(regEmail, false, 'An account with this email already exists.');
    }
  });
  const regPhone = document.getElementById('regPhone');
  regPhone?.addEventListener('blur', () => {
    const val = regPhone.value.trim();
    if (val && window.FestivoAuth?.isPhoneTaken(val)) {
      setFieldState(regPhone, false, 'An account with this phone number already exists.');
    }
  });

  /* -----------------------------------------------------------
     CHECKOUT FORM
     ----------------------------------------------------------- */
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(checkoutForm)) {
      window.showToast?.('error', 'Incomplete Details', 'Please fill in all required fields.');
      return;
    }
    const btn = checkoutForm.querySelector('[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processing…';
    setTimeout(() => {
      const orderId = 'FV' + Date.now();
      localStorage.setItem('festivo_last_order', orderId);
      // Clear cart
      localStorage.removeItem('festivo_cart');
      window.showToast?.('success', 'Order Placed!', `Order ${orderId} confirmed. Thank you!`);
      setTimeout(() => {
        window.location.href = `customer-dashboard.html?order=${orderId}`;
      }, 1000);
    }, 2000);
  });

  /* -----------------------------------------------------------
     NEWSLETTER FORMS
     ----------------------------------------------------------- */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input?.value.trim() || !Validators.email(input.value)) {
        window.showToast?.('error', 'Invalid Email', 'Please enter a valid email address.');
        return;
      }
      window.showToast?.('success', 'Subscribed!', 'Thank you for subscribing to our newsletter.');
      input.value = '';
    });
  });

  /* -----------------------------------------------------------
     PASSWORD STRENGTH
     ----------------------------------------------------------- */
  const passInput = document.querySelector('[name="password"][data-show-strength]');
  if (passInput) {
    const strengthEl = document.createElement('div');
    strengthEl.className = 'password-strength';
    strengthEl.style.cssText = 'margin-top:0.5rem;height:4px;border-radius:99px;background:var(--border);overflow:hidden;';
    const bar = document.createElement('div');
    bar.style.cssText = 'height:100%;width:0;transition:all 0.3s;border-radius:99px;';
    strengthEl.appendChild(bar);
    passInput.parentElement.appendChild(strengthEl);

    passInput.addEventListener('input', () => {
      const val = passInput.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      const colors = ['#ef4444','#f59e0b','#10b981','#10b981'];
      const widths  = ['25%','50%','75%','100%'];
      bar.style.width     = val ? widths[score-1] || '10%' : '0';
      bar.style.background = val ? colors[score-1] || '#ef4444' : 'transparent';
    });
  }

  /* -----------------------------------------------------------
     PASSWORD VISIBILITY TOGGLE
     ----------------------------------------------------------- */
  document.querySelectorAll('[data-action="toggle-password"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input    = targetId ? document.getElementById(targetId) : btn.previousElementSibling;
      if (!input) return;
      const isHidden = input.type === 'password';
      input.type     = isHidden ? 'text' : 'password';
      btn.querySelector('i')?.classList.toggle('bi-eye',     !isHidden);
      btn.querySelector('i')?.classList.toggle('bi-eye-slash', isHidden);
    });
  });
});
