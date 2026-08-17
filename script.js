'use strict';

/* =============================================
   UTM CAPTURE E INITIAL VIEW
   ============================================= */
(function() {
  var urlParams = new URLSearchParams(window.location.search);
  var utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  utms.forEach(function(utm) {
    if (urlParams.has(utm)) {
      sessionStorage.setItem(utm, urlParams.get(utm));
    }
  });
  // Track View
  setTimeout(function() {
    trackEvent('meta_lp_view');
  }, 100);
})();

/* =============================================
   TRACKING — Placeholders
   ============================================= */
function trackEvent(eventName, params) {
  params = params || {};
  
  // Inject stored UTMs into event params
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function(utm) {
    var val = sessionStorage.getItem(utm);
    if (val) params[utm] = val;
  });

  // Google Tag Manager / GA4
  if (typeof dataLayer !== 'undefined') {
    dataLayer.push(Object.assign({ event: eventName }, params));
  }
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
  // Meta Pixel
  if (typeof fbq === 'function') {
    if (eventName === 'meta_lp_view') fbq('track', 'PageView');
    else if (eventName.indexOf('lead_') === 0 || eventName === 'meta_form_submit') fbq('track', 'Lead', params);
    else fbq('trackCustom', eventName, params);
  }
}

/* =============================================
   FOOTER YEAR
   ============================================= */
document.querySelectorAll('[data-year]').forEach(function(el) {
  el.textContent = new Date().getFullYear();
});

/* =============================================
   STICKY HEADER SHADOW
   ============================================= */
(function() {
  var header = document.querySelector('.site-header, .lp-header');
  if (!header) return;
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* =============================================
   MOBILE MENU TOGGLE (Home only)
   ============================================= */
(function() {
  var btn  = document.getElementById('hamburger-btn');
  var menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', function() {
    var open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  });
  menu.querySelectorAll('.mob-a').forEach(function(a) {
    a.addEventListener('click', function() {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    });
  });
})();

/* =============================================
   SCROLL ANIMATIONS
   ============================================= */
(function() {
  var els = document.querySelectorAll('.fade-up, .fade-left, .fade-right');
  if (!els.length || !('IntersectionObserver' in window)) {
    els.forEach(function(el) { el.classList.add('vis'); });
    return;
  }
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('vis');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
  els.forEach(function(el) { obs.observe(el); });
})();

/* =============================================
   FAQ ACCORDION
   ============================================= */
(function() {
  var btns = document.querySelectorAll('.faq-btn');
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var answerId = btn.getAttribute('aria-controls');
      var answer   = answerId ? document.getElementById(answerId) : null;
      // Close all
      btns.forEach(function(b) {
        b.setAttribute('aria-expanded', 'false');
        var id = b.getAttribute('aria-controls');
        var a  = id ? document.getElementById(id) : null;
        if (a) a.hidden = true;
      });
      // Toggle current
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        if (answer) answer.hidden = false;
      }
    });
  });
})();

/* =============================================
   SMOOTH SCROLL (anchor links)
   ============================================= */
(function() {
  var HEADER_H = 70;
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - HEADER_H - 12;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();

/* =============================================
   CONTACT FORM HANDLER (shared)
   ============================================= */
(function() {
  var forms = document.querySelectorAll('.contact-form');
  forms.forEach(function(form) {
    var successEl = form.parentElement.querySelector('.form-success');
    var submitBtn = form.querySelector('[type="submit"]');

    // Track form start on first input
    var started = false;
    form.addEventListener('input', function() {
      if (!started) {
        started = true;
        trackEvent('meta_form_start', { form_id: form.id || 'contact' });
      }
    }, { once: false });

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      // Validate required fields
      var required = form.querySelectorAll('[required]');
      var valid = true;
      required.forEach(function(field) {
        field.classList.remove('error');
        if (!field.value.trim()) {
          field.classList.add('error');
          valid = false;
        }
      });

      if (!valid) {
        var firstError = form.querySelector('.error');
        if (firstError) firstError.focus();
        return;
      }

      // Track submit
      trackEvent('meta_form_submit', { form_id: form.id || 'contact' });
      var isLimpeza = form.id === 'form-limpeza';
      trackEvent(isLimpeza ? 'lead_limpeza' : 'lead_copeiragem', { form_id: form.id || 'contact' });

      // Disable submit
      var origHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviando<span style="letter-spacing:.05em">...</span>';

      // Simulate async (replace with real endpoint)
      setTimeout(function() {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHTML;
        if (successEl) {
          form.hidden = true;
          successEl.hidden = false;
          successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 900);
    });
  });
})();

/* =============================================
   PHONE MASK — WhatsApp fields
   ============================================= */
(function() {
  document.querySelectorAll('[data-mask="phone"]').forEach(function(field) {
    field.addEventListener('input', function() {
      var v = field.value.replace(/\D/g, '').slice(0, 11);
      if (v.length >= 7) {
        v = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
      } else if (v.length >= 3) {
        v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
      } else if (v.length > 0) {
        v = '(' + v;
      }
      field.value = v;
    });
  });
})();

/* =============================================
   TRACKING — CTA CLICK EVENTS & DYNAMIC WA
   ============================================= */
(function() {
  // Setup Dynamic WhatsApp Message based on UTM
  var campaign = (sessionStorage.getItem('utm_campaign') || '').toLowerCase();
  var defaultMsgLimpeza = "Olá! Vim pelo anúncio e gostaria de entender como funciona a terceirização de limpeza para minha empresa.";
  var defaultMsgCop = "Olá! Vim pelo anúncio e gostaria de solicitar uma proposta de copeiragem corporativa.";
  
  var dynamicMsg = defaultMsgLimpeza;
  if (campaign.indexOf('clinica') !== -1) {
    dynamicMsg = "Olá! Vim pelo anúncio e gostaria de saber sobre limpeza comercial para minha clínica.";
  } else if (campaign.indexOf('escritorio') !== -1) {
    dynamicMsg = "Olá! Vim pelo anúncio e gostaria de saber sobre limpeza comercial para meu escritório.";
  }

  // WhatsApp links
  document.querySelectorAll('[data-track="whatsapp"]').forEach(function(el) {
    var href = el.getAttribute('href');
    if (href && href.indexOf('wa.me') !== -1) {
      var baseWa = href.split('?')[0];
      var isCop = el.id.indexOf('cop') !== -1 || window.location.pathname.indexOf('copeiragem') !== -1;
      el.setAttribute('href', baseWa + '?text=' + encodeURIComponent(isCop ? defaultMsgCop : dynamicMsg));
    }

    el.addEventListener('click', function() {
      trackEvent('meta_click_whatsapp', { location: el.getAttribute('data-loc') || 'unknown' });
      var isCop = el.id.indexOf('cop') !== -1 || window.location.pathname.indexOf('copeiragem') !== -1;
      trackEvent(isCop ? 'whatsapp_copeiragem' : 'whatsapp_limpeza', { location: el.getAttribute('data-loc') || 'unknown' });
    });
  });
  // Orçamento CTAs
  document.querySelectorAll('[data-track="orcamento"]').forEach(function(el) {
    el.addEventListener('click', function() {
      trackEvent('click_orcamento', {
        location: el.getAttribute('data-loc') || 'unknown'
      });
    });
  });
  // Phone / email
  document.querySelectorAll('[data-track="phone"]').forEach(function(el) {
    el.addEventListener('click', function() {
      trackEvent('click_phone', {
        location: el.getAttribute('data-loc') || 'unknown'
      });
    });
  });
})();

/* =============================================
   ACTIVE NAV LINK ON SCROLL (Home)
   ============================================= */
(function() {
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-a');
  if (!sections.length || !navLinks.length) return;
  window.addEventListener('scroll', function() {
    var current = '';
    sections.forEach(function(s) {
      if (s.getBoundingClientRect().top <= 80) current = s.id;
    });
    navLinks.forEach(function(a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }, { passive: true });
})();

/* =============================================
   FAQ ACCORDION
   ============================================= */
(function() {
  document.querySelectorAll('.faq-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      var content = this.nextElementSibling;
      if (!expanded) {
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.style.maxHeight = null;
      }
    });
  });
})();
