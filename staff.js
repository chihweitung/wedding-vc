(() => {
  'use strict';

  const STAFF_SESSION_KEY = 'te_wedding_staff_auth_v2';
  const STAFF_CREDENTIAL_HASH = '6a49d425846a4d91e07e1ed9ea784e28a9a51381f53189bae64cbd53491e37b4';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 30000;
  let failedAttempts = 0;
  let lockoutUntil = 0;

  function constantTimeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }

  let isAuthenticated = false;
  try {
    const savedProof = sessionStorage.getItem(STAFF_SESSION_KEY) || '';
    if (savedProof && constantTimeEqual(savedProof, STAFF_CREDENTIAL_HASH)) {
      isAuthenticated = true;
    } else if (savedProof) {
      sessionStorage.removeItem(STAFF_SESSION_KEY);
    }
  } catch (_e) {
    isAuthenticated = false;
  }

  Object.defineProperty(window, '__TE_STAFF_AUTH__', {
    get: () => isAuthenticated,
    configurable: false,
    enumerable: false,
  });

  async function sha256Hex(str) {
    const data = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function unlockStaffUi(verifiedDigest) {
    isAuthenticated = true;
    failedAttempts = 0;
    lockoutUntil = 0;
    try {
      if (verifiedDigest && constantTimeEqual(verifiedDigest, STAFF_CREDENTIAL_HASH)) {
        sessionStorage.setItem(STAFF_SESSION_KEY, verifiedDigest);
      }
    } catch (_e) {
      // Ignore storage failures in private browsing
    }
    document.body.classList.remove('debug-locked');
    const gate = document.getElementById('staff-auth-gate');
    if (gate) gate.classList.add('hidden');
    if (typeof window.__TE_ON_STAFF_UNLOCK__ === 'function') {
      window.__TE_ON_STAFF_UNLOCK__();
    }
  }

  function initStaffGate() {
    const gate = document.getElementById('staff-auth-gate');
    if (isAuthenticated) {
      unlockStaffUi(STAFF_CREDENTIAL_HASH);
      return;
    }

    document.body.classList.add('debug-locked');
    if (gate) gate.classList.remove('hidden');

    const form = document.getElementById('staff-auth-form');
    const userInput = document.getElementById('staff-username');
    const passInput = document.getElementById('staff-password');
    const errEl = document.getElementById('staff-auth-error');

    if (userInput) {
      setTimeout(() => userInput.focus(), 50);
    }

    if (form) {
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (errEl) errEl.classList.add('hidden');

        const nowMs = Date.now();
        if (lockoutUntil > nowMs) {
          const waitSec = Math.ceil((lockoutUntil - nowMs) / 1000);
          if (errEl) {
            errEl.textContent = `嘗試次數過多，請於 ${waitSec} 秒後再試。`;
            errEl.classList.remove('hidden');
          }
          return;
        }

        const userVal = userInput ? userInput.value.trim() : '';
        const passVal = passInput ? passInput.value : '';
        if (!window.crypto || !window.crypto.subtle) {
          if (errEl) {
            errEl.textContent = '此瀏覽器環境不支援加密驗證，請改用 HTTPS 正式網址開啟。';
            errEl.classList.remove('hidden');
          }
          return;
        }
        try {
          const digest = await sha256Hex(`${userVal}:${passVal}`);
          if (constantTimeEqual(digest, STAFF_CREDENTIAL_HASH)) {
            unlockStaffUi(digest);
            return;
          }
        } catch (_err) {
          // Ignore crypto error and show invalid credentials message
        }
        failedAttempts += 1;
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
          failedAttempts = 0;
          if (errEl) {
            errEl.textContent = '連續輸入錯誤次數過多，已暫時鎖定 30 秒。';
            errEl.classList.remove('hidden');
          }
        } else if (errEl) {
          errEl.textContent = '帳號或密碼錯誤，請重新輸入。';
          errEl.classList.remove('hidden');
        }
        if (passInput) {
          passInput.value = '';
          passInput.focus();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStaffGate);
  } else {
    initStaffGate();
  }
})();
