'use strict';

/* =============================================
   1. UTMS E DADOS DE ORIGEM (META ADS)
   ============================================= */
(function() {
  var urlParams = new URLSearchParams(window.location.search);
  var trackingParams = [
    'utm_source', 
    'utm_medium', 
    'utm_campaign', 
    'utm_term', 
    'utm_content', 
    'fbclid'
  ];
  
  // Salva no sessionStorage se estiver na URL
  trackingParams.forEach(function(param) {
    if (urlParams.has(param)) {
      sessionStorage.setItem(param, urlParams.get(param));
    }
  });

  // Track Inicial da Página
  setTimeout(function() {
    var isLimpeza = window.location.pathname.indexOf('limpeza') !== -1;
    var isCop = window.location.pathname.indexOf('copeiragem') !== -1;
    
    // Dispara PageView genérico
    trackEvent('PageView');
    
    // Dispara ViewContent específico se for Landing Page
    if (isLimpeza || isCop) {
      trackEvent('ViewContent', { 
        content_name: isLimpeza ? 'LP Limpeza Comercial' : 'LP Copeiragem Corporativa' 
      });
    }
  }, 300);
})();

/* =============================================
   2. META CONVERSIONS API (CAPI) - PLACEHOLDERS
   ============================================= */
/*
  TODO: Quando a Conversions API for ativada no backend (Node/PHP/Python),
  os seguintes tokens devem ser configurados no servidor (NUNCA expor no frontend):
  
  [META_ACCESS_TOKEN] -> Token de acesso gerado no Gerenciador de Eventos
  [META_DATASET_ID]   -> ID do Pixel (Pixel ID)
  
  O frontend passará os dados (UTMs, fbp, fbc, user_data) via POST para o seu backend,
  que então fará a requisição oficial para a Graph API do Facebook.
*/

/* =============================================
   3. EVENT TRACKER ENGINE
   ============================================= */
function trackEvent(eventName, params) {
  params = params || {};
  
  // Injeta UTMs e fbclid preservados nos parâmetros do evento
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid'].forEach(function(param) {
    var val = sessionStorage.getItem(param);
    if (val) params[param] = val;
  });

  // Google Tag Manager / GA4 fallback
  if (typeof dataLayer !== 'undefined') {
    dataLayer.push(Object.assign({ event: eventName }, params));
  }
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }

  // Meta Pixel Base Tracking
  if (typeof fbq === 'function') {
    var standardEvents = ['PageView', 'Lead', 'ViewContent', 'Contact'];
    if (standardEvents.indexOf(eventName) !== -1) {
      fbq('track', eventName, params);
    } else {
      fbq('trackCustom', eventName, params);
    }
  }
  
  // Console log para ambiente local / debug
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('[Meta Ads Track] Evento:', eventName, params);
  }
}

/* =============================================
   4. WHATSAPP TRACKING & DYNAMIC MESSAGE
   ============================================= */
(function() {
  // Pega as variáveis para montar a mensagem dinâmica
  var campaign = sessionStorage.getItem('utm_campaign') || '';
  var content = sessionStorage.getItem('utm_content') || '';
  
  var isLimpeza = window.location.pathname.indexOf('limpeza') !== -1;
  var isCop = window.location.pathname.indexOf('copeiragem') !== -1;

  var dynamicMsg = "Olá! Vim pelo site e gostaria de conversar com a equipe.";
  
  if (isLimpeza) {
    dynamicMsg = "Olá! Vim pelo anúncio e gostaria de entender como funciona a terceirização de limpeza para minha empresa.";
    if (campaign.toLowerCase().indexOf('clinica') !== -1 || content.toLowerCase().indexOf('clinica') !== -1) {
      dynamicMsg = "Olá! Vim pelo anúncio e gostaria de saber sobre limpeza comercial para minha clínica.";
    } else if (campaign.toLowerCase().indexOf('escritorio') !== -1) {
      dynamicMsg = "Olá! Vim pelo anúncio e gostaria de saber sobre limpeza comercial para meu escritório.";
    }
  } else if (isCop) {
    dynamicMsg = "Olá! Vim pelo anúncio e gostaria de solicitar uma proposta de copeiragem corporativa para minha empresa.";
  }

  // Aplicar a mensagem em todos os links do WhatsApp
  document.querySelectorAll('[data-track="whatsapp"]').forEach(function(el) {
    var href = el.getAttribute('href');
    if (href && href.indexOf('wa.me') !== -1) {
      var baseWa = href.split('?')[0];
      el.setAttribute('href', baseWa + '?text=' + encodeURIComponent(dynamicMsg));
    }

    el.addEventListener('click', function() {
      // Evento genérico
      trackEvent('click_whatsapp', { location: el.getAttribute('data-loc') || 'unknown' });
      trackEvent('Contact', { method: 'whatsapp' });
      
      // Evento específico por LP
      if (isLimpeza) {
        trackEvent('whatsapp_limpeza', { location: el.getAttribute('data-loc') || 'unknown' });
      } else if (isCop) {
        trackEvent('whatsapp_copeiragem', { location: el.getAttribute('data-loc') || 'unknown' });
      }
    });
  });
})();

/* =============================================
   5. FORM TRACKING (START & SUBMIT)
   ============================================= */
(function() {
  var forms = document.querySelectorAll('.contact-form');
  var isLimpeza = window.location.pathname.indexOf('limpeza') !== -1;
  var isCop = window.location.pathname.indexOf('copeiragem') !== -1;

  forms.forEach(function(form) {
    var formStarted = false;
    
    // Track form_start
    form.addEventListener('input', function() {
      if (!formStarted) {
        formStarted = true;
        trackEvent('form_start', { form_id: form.id });
      }
    }, { once: true }); // Executa apenas uma vez

    // Track Submit / Lead
    form.addEventListener('submit', function(e) {
      if (!form.checkValidity()) return; // Não dispara se o HTML5 validation barrar

      // Evento de Lead Genérico
      trackEvent('form_submit', { form_id: form.id });
      trackEvent('Lead', { form_id: form.id });
      
      // Evento de Lead Específico
      if (isLimpeza) {
        trackEvent('lead_limpeza', { form_id: form.id });
      } else if (isCop) {
        trackEvent('lead_copeiragem', { form_id: form.id });
      }
      
      // NOTA: O form.submit() continua o envio normal e redireciona para a página de Obrigado.
    });
  });
})();

/* =============================================
   6. UI UTILS & MISC
   ============================================= */
// Footer Year
document.querySelectorAll('[data-year]').forEach(function(el) {
  el.textContent = new Date().getFullYear();
});

// Phone Mask
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

// Scroll animations
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
  }, { threshold: 0.1 });
  els.forEach(function(el) { obs.observe(el); });
})();

// FAQ Accordion
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
