// Gmail Require-To: block sending when the To (收件者) field is empty,
// even if CC (副本) / BCC (密件副本) have recipients.
(() => {
  'use strict';

  const MSG =
    (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage('blockedMessage')) ||
    '收件者欄位是空的，請先填寫收件者再傳送。';
  const BLOCKED_CLASS = 'gmrt-blocked';

  // Send button: primary blue button (.aoO) or any button whose tooltip
  // mentions the Ctrl/Cmd+Enter shortcut. Schedule-send arrow is .hG.
  const SEND_SELECTOR = [
    'div[role="button"].aoO',
    'div[role="button"][data-tooltip*="Enter"]',
    'div[role="button"][aria-label*="Enter"]',
  ].join(',');
  const SCHEDULE_SELECTOR = 'div[role="button"].hG';
  const TO_SELECTOR = '[name="to"]';
  const CC_BCC_SELECTOR = '[name="cc"], [name="bcc"]';
  const STOP_SELECTOR =
    'input[name="subjectbox"], [contenteditable="true"][role="textbox"], div[aria-label][g_editable="true"]';
  const CHIP_SELECTOR = '[data-hovercard-id], [email], [data-name][data-email]';

  // ---- Compose discovery ---------------------------------------------------

  // Smallest ancestor of a send button that also contains a To field.
  function composeRootOf(el) {
    let node = el;
    while (node && node !== document.body) {
      if (node.querySelector && node.querySelector(TO_SELECTOR)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function isSendButton(el) {
    return !!el && el.matches && (el.matches(SEND_SELECTOR) || el.matches(SCHEDULE_SELECTOR));
  }

  function sendButtonFromTarget(target) {
    if (!(target instanceof Element)) return null;
    const btn = target.closest(SEND_SELECTOR + ',' + SCHEDULE_SELECTOR);
    if (!btn) return null;
    // Make sure it really belongs to a compose window.
    return composeRootOf(btn) ? btn : null;
  }

  // ---- Recipient check -----------------------------------------------------

  // The "To" row: walk up from the To element as long as we don't swallow
  // the CC/BCC fields, the subject, or the body.
  function toRowOf(toEl, root) {
    let row = toEl;
    let parent = row.parentElement;
    while (parent && parent !== root) {
      if (parent.querySelector(CC_BCC_SELECTOR) || parent.querySelector(STOP_SELECTOR)) break;
      row = parent;
      parent = parent.parentElement;
    }
    return row;
  }

  function hasToRecipient(root) {
    const toEls = root.querySelectorAll(TO_SELECTOR);
    if (toEls.length === 0) return null; // unknown layout -> don't block

    for (const toEl of toEls) {
      // Hidden input / textarea holding addresses (older Gmail layouts) or
      // text typed but not yet turned into a chip.
      if ('value' in toEl && /\S+@\S+/.test(toEl.value || '')) return true;

      const row = toRowOf(toEl, root);
      if (row.querySelector(CHIP_SELECTOR)) return true;
      for (const inp of row.querySelectorAll('input, textarea')) {
        if (/\S+@\S+/.test(inp.value || '')) return true;
      }
    }
    return false;
  }

  // true = must block
  function shouldBlock(root) {
    return root ? hasToRecipient(root) === false : false;
  }

  // ---- UI ------------------------------------------------------------------

  let toastTimer = null;
  function toast() {
    let el = document.querySelector('.gmrt-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'gmrt-toast';
      el.setAttribute('role', 'alert');
      document.body.appendChild(el);
    }
    el.textContent = MSG;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.opacity = '0';
    }, 3000);
  }

  function refresh() {
    const buttons = document.querySelectorAll(SEND_SELECTOR + ',' + SCHEDULE_SELECTOR);
    for (const btn of buttons) {
      const root = composeRootOf(btn);
      if (!root) continue;
      const block = shouldBlock(root);
      btn.classList.toggle(BLOCKED_CLASS, block);
      if (block) {
        if (!btn.hasAttribute('data-gmrt-title')) {
          btn.setAttribute('data-gmrt-title', btn.getAttribute('title') || '');
        }
        btn.setAttribute('title', MSG);
        btn.setAttribute('aria-disabled', 'true');
      } else if (btn.hasAttribute('data-gmrt-title')) {
        btn.setAttribute('title', btn.getAttribute('data-gmrt-title'));
        btn.removeAttribute('data-gmrt-title');
        btn.removeAttribute('aria-disabled');
      }
    }
  }

  // ---- Event interception (capture phase, before Gmail sees it) -----------

  function stop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function onPointer(e) {
    const btn = sendButtonFromTarget(e.target);
    if (!btn) return;
    if (shouldBlock(composeRootOf(btn))) {
      stop(e);
      if (e.type === 'click') toast();
      refresh();
    }
  }

  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    // Enter / Space while the send button itself is focused.
    const btn = sendButtonFromTarget(target);
    if (btn) {
      if (shouldBlock(composeRootOf(btn))) {
        stop(e);
        toast();
      }
      return;
    }

    // Ctrl+Enter / Cmd+Enter anywhere inside a compose window.
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter')) {
      let node = target;
      while (node && node !== document.body) {
        const send = node.querySelector && node.querySelector(SEND_SELECTOR);
        if (send && node.querySelector(TO_SELECTOR)) {
          if (shouldBlock(node)) {
            stop(e);
            toast();
          }
          return;
        }
        node = node.parentElement;
      }
    }
  }

  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click']) {
    window.addEventListener(type, onPointer, true);
  }
  for (const type of ['keydown', 'keypress', 'keyup']) {
    window.addEventListener(type, onKey, true);
  }

  // ---- Keep the visual state in sync with Gmail's dynamic DOM -------------

  let scheduled = false;
  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      refresh();
    });
  }

  new MutationObserver(scheduleRefresh).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['email', 'data-hovercard-id', 'value'],
  });
  document.addEventListener('input', scheduleRefresh, true);
  document.addEventListener('focusout', scheduleRefresh, true);
  refresh();
})();
