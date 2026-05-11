/* ════════════════════════════════════════════════════════════════════
   DN-AirTecH GmbH · script.js
   Vanilla JS, zero dependencies. Mobile-first, DSGVO-aware.
   --------------------------------------------------------------------
    1. Helpers
    2. Sticky header (scroll state)
    3. Mobile menu (hamburger)
    4. Smooth scroll for anchor links
    5. Hero temperature animation
    6. Reveal-on-scroll
    7. FAQ accordion (single-open)
    8. Multi-step survey (lead magnet)
    9. Cookie banner (DSGVO)
   10. Footer year
   11. Init
   ════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ───── 1. Helpers ───── */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ───── 2. Sticky header scroll state ───── */
  const initStickyHeader = () => {
    const header = $('.header');
    if (!header) return;
    const THRESHOLD = 12;
    let ticking = false;
    const update = () => {
      header.classList.toggle('scrolled', window.scrollY > THRESHOLD);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  };

  /* ───── 3. Mobile menu ───── */
  const initMobileMenu = () => {
    const hamburger = $('#hamburger');
    const nav       = $('#nav');
    if (!hamburger || !nav) return;

    const close = () => {
      hamburger.classList.remove('active');
      nav.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Menü öffnen');
      document.body.style.overflow = '';
    };
    const open = () => {
      hamburger.classList.add('active');
      nav.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Menü schließen');
      if (window.innerWidth <= 1024) document.body.style.overflow = 'hidden';
    };

    hamburger.addEventListener('click', () => {
      hamburger.classList.contains('active') ? close() : open();
    });
    $$('.nav a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburger.classList.contains('active')) close();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) close();
    });
  };

  /* ───── 4. Smooth scroll ───── */
  const initSmoothScroll = () => {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        e.preventDefault();
        const header = $('.header');
        const offset = (header ? header.offsetHeight : 0) + 12;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        if (history.pushState) history.pushState(null, '', href);
      });
    });
  };

  /* ───── 5. Hero temperature animation ───── */
  const initTempAnim = () => {
    const tempEl = $('.hero__device-num[data-temp]');
    if (!tempEl || prefersReducedMotion) return;
    const values = [22, 21, 20, 21, 22, 23, 24, 23];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % values.length;
      tempEl.style.opacity = '0.4';
      setTimeout(() => {
        tempEl.textContent = values[idx];
        tempEl.style.opacity = '1';
      }, 220);
    }, 2400);
  };

  /* ───── 6. Reveal on scroll ───── */
  const initReveal = () => {
    const items = $$('.reveal');
    if (!items.length) return;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
  };

  /* ───── 7. FAQ accordion ───── */
  const initFAQ = () => {
    const items = $$('.faq-item');
    items.forEach(item => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          items.forEach(other => {
            if (other !== item && other.open) other.open = false;
          });
        }
      });
    });
  };

  /* ───── 8. Multi-step survey ───── */
  const initSurvey = () => {
    const form = $('#surveyForm');
    if (!form) return;

    const steps         = $$('.survey-step:not(.survey-step--success)', form);
    const successStep   = $('.survey-step--success', form);
    const nextBtn       = $('#nextBtn', form);
    const prevBtn       = $('#prevBtn', form);
    const progressFill  = $('#progressFill');
    const currentStepEl = $('#currentStep');
    const progressPct   = $('#progressPercent');
    const TOTAL = steps.length;
    let current = 1;

    const showStep = (n) => {
      steps.forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.step, 10) === n);
      });
      const pct = Math.round((n / TOTAL) * 100);
      if (progressFill)  progressFill.style.width = pct + '%';
      if (currentStepEl) currentStepEl.textContent = n;
      if (progressPct)   progressPct.textContent = pct + ' %';
      if (prevBtn) prevBtn.disabled = n === 1;
      if (nextBtn) nextBtn.textContent = (n === TOTAL) ? 'Anfrage absenden' : 'Weiter';

      // Focus first input für Accessibility
      const active = steps.find(s => parseInt(s.dataset.step, 10) === n);
      if (active && !prefersReducedMotion) {
        const focusable = active.querySelector('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
        if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 250);
      }
    };

    const showError = (stepEl, msg) => {
      let err = stepEl.querySelector('.survey-error');
      if (!err) {
        err = document.createElement('div');
        err.className = 'survey-error';
        err.setAttribute('role', 'alert');
        stepEl.appendChild(err);
      }
      err.textContent = msg;
      err.classList.add('show');
      stepEl.classList.remove('shake');
      void stepEl.offsetWidth;
      stepEl.classList.add('shake');
    };
    const clearError = (stepEl) => {
      const err = stepEl.querySelector('.survey-error');
      if (err) err.classList.remove('show');
    };

    const validateStep = (n) => {
      const stepEl = steps.find(s => parseInt(s.dataset.step, 10) === n);
      if (!stepEl) return false;
      clearError(stepEl);

      if (n === 1) {
        if (stepEl.querySelectorAll('input[name="service"]:checked').length === 0) {
          showError(stepEl, 'Bitte wählen Sie mindestens eine Leistung aus.');
          return false;
        }
        return true;
      }
      if (n === 2) {
        if (!stepEl.querySelector('input[name="building"]:checked')) {
          showError(stepEl, 'Bitte wählen Sie eine Gebäudeart aus.');
          return false;
        }
        return true;
      }
      if (n === 3) {
        if (!stepEl.querySelector('input[name="size"]:checked')) {
          showError(stepEl, 'Bitte wählen Sie eine ungefähre Fläche aus.');
          return false;
        }
        return true;
      }
      if (n === 4) {
        const fields = stepEl.querySelectorAll('[required]');
        for (const f of fields) {
          if (f.type === 'checkbox') {
            if (!f.checked) {
              showError(stepEl, 'Bitte stimmen Sie der Datenschutzerklärung zu.');
              f.focus(); return false;
            }
          } else if (!f.value.trim()) {
            showError(stepEl, 'Bitte füllen Sie alle Pflichtfelder aus.');
            f.focus(); return false;
          } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) {
            showError(stepEl, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            f.focus(); return false;
          } else if (f.pattern && !new RegExp('^' + f.pattern + '$').test(f.value)) {
            showError(stepEl, 'Bitte geben Sie eine gültige PLZ ein (5-stellig).');
            f.focus(); return false;
          }
        }
        return true;
      }
      return false;
    };

    const collectData = () => {
      const data = new FormData(form);
      return {
        services:    data.getAll('service'),
        building:    data.get('building'),
        size:        data.get('size'),
        timeline:    data.get('timeline'),
        vorname:     data.get('vorname'),
        nachname:    data.get('nachname'),
        email:       data.get('email'),
        telefon:     data.get('telefon'),
        plz:         data.get('plz'),
        nachricht:   data.get('nachricht'),
        datenschutz: data.get('datenschutz') === 'on',
        timestamp:   new Date().toISOString(),
        source:      'website-survey'
      };
    };

    const submitForm = async () => {
      const payload = collectData();

      // Sende die Daten an unser neues PHP-Skript
      const res = await fetch('send_mail.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      
      // Prüfen ob die Server-Antwort in Ordnung ist
      if (!res.ok) {
          throw new Error('Netzwerk-Antwort war nicht ok');
      }
      
      const result = await res.json();
      
      // Prüfen ob das PHP-Skript einen Erfolg meldet
      if (!result.success) {
          throw new Error(result.message || 'Submit failed');
      }

      // Erfolgs-State (Vielen Dank! Ansicht) anzeigen
      steps.forEach(s => s.classList.remove('active'));
      if (successStep) successStep.classList.add('active');
      if (progressFill)  progressFill.style.width = '100%';
      if (currentStepEl) currentStepEl.textContent = TOTAL;
      if (progressPct)   progressPct.textContent = '100 %';
      
      const actions  = $('.survey-form__actions', form);
      const progress = $('.survey-form__progress', form);
      if (actions)  actions.style.display = 'none';
      if (progress) progress.style.display = 'none';
    };

    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        if (!validateStep(current)) return;
        if (current < TOTAL) {
          current++;
          showStep(current);
        } else {
          nextBtn.disabled = true;
          nextBtn.textContent = 'Wird gesendet …';
          try {
            await submitForm();
          } catch (err) {
            console.error('[DN-AirTecH] Submit error:', err);
            const stepEl = steps.find(s => parseInt(s.dataset.step, 10) === current);
            if (stepEl) showError(stepEl, 'Es ist ein Fehler aufgetreten. Bitte rufen Sie uns direkt an: 069 6638 9524');
            nextBtn.disabled = false;
            nextBtn.textContent = 'Anfrage absenden';
          }
        }
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (current > 1) { current--; showStep(current); }
      });
    }

    form.addEventListener('change', (e) => {
      const stepEl = e.target.closest('.survey-step');
      if (stepEl) clearError(stepEl);
    });
    form.addEventListener('input', (e) => {
      const stepEl = e.target.closest('.survey-step');
      if (stepEl) clearError(stepEl);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (nextBtn) nextBtn.click();
    });

    showStep(1);
  };

  /* ───── 9. Cookie banner ───── */
  const COOKIE_KEY = 'dn-airtech.consent.v1';
  const initCookieBanner = () => {
    const banner   = $('#cookieBanner');
    const accept   = $('#cookieAccept');
    const reject   = $('#cookieReject');
    const settings = $('#cookieSettings');
    const reopen   = $('#cookieSettingsBtn');
    if (!banner) return;

    const showBanner = () => {
      banner.hidden = false;
      document.body.classList.add('cookie-visible');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => banner.classList.add('active'));
      });
    };
    const hideBanner = () => {
      banner.classList.remove('active');
      document.body.classList.remove('cookie-visible');
      setTimeout(() => { banner.hidden = true; }, 400);
    };
    const saveConsent = (consent) => {
      try {
        localStorage.setItem(COOKIE_KEY, JSON.stringify({
          ...consent, timestamp: new Date().toISOString()
        }));
      } catch (e) { /* localStorage blocked, no-op */ }
    };
    const readConsent = () => {
      try {
        const raw = localStorage.getItem(COOKIE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    };
    const applyConsent = (consent) => {
      // INTEGRATION POINT: Tags hier nachladen, z.B.:
      //   if (consent.analytics) loadAnalytics();
      //   if (consent.marketing) loadMarketingPixels();
      console.info('[DN-AirTecH] Consent applied:', consent);
    };

    if (accept) accept.addEventListener('click', () => {
      const c = { necessary: true, analytics: true, marketing: true };
      saveConsent(c); applyConsent(c); hideBanner();
    });
    if (reject) reject.addEventListener('click', () => {
      const c = { necessary: true, analytics: false, marketing: false };
      saveConsent(c); applyConsent(c); hideBanner();
    });
    if (settings) settings.addEventListener('click', () => {
      // Minimal Settings: nur notwendige (eine ausgebaute Variante wäre ein Modal mit Toggles)
      const c = { necessary: true, analytics: false, marketing: false };
      saveConsent(c); applyConsent(c); hideBanner();
    });
    if (reopen) reopen.addEventListener('click', (e) => {
      e.preventDefault();
      showBanner();
    });

    const stored = readConsent();
    if (!stored) setTimeout(showBanner, 900);
    else applyConsent(stored);
  };

  /* ───── 10. Footer year ───── */
  const initYear = () => {
    const el = $('#currentYear');
    if (el) el.textContent = String(new Date().getFullYear());
  };

  /* ───── 11. Init ───── */
  const init = () => {
    initStickyHeader();
    initMobileMenu();
    initSmoothScroll();
    initTempAnim();
    initReveal();
    initFAQ();
    initSurvey();
    initCookieBanner();
    initYear();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
