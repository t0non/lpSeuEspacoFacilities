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
    
    // Dispara ViewContent específico se for Landing Page
    if (isLimpeza) {
      trackEvent('ViewContent', { 
        content_name: 'Limpeza Comercial',
        content_category: 'Serviços'
      });
    } else if (isCop) {
      trackEvent('ViewContent', { 
        content_name: 'Copeiragem Corporativa',
        content_category: 'Serviços'
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
  document.querySelectorAll('a').forEach(function(el) {
    var href = el.getAttribute('href') || '';
    if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
      // Set dynamic message for links that don't have text already? 
      // User requested not to change other things, so let's only append text if it's our original dynamic logic
      if (el.hasAttribute('data-track') && el.getAttribute('data-track') === 'whatsapp') {
          var baseWa = href.split('?')[0];
          el.setAttribute('href', baseWa + '?text=' + encodeURIComponent(dynamicMsg));
      }

      el.addEventListener('click', function() {
        // Disparo único e limpo exigido para WhatsApp
        trackEvent('Contact');
      });
    }
  });
})();

/* =============================================
   5. FORM → WHATSAPP
   ============================================= */
(function() {
  var WA_NUMBER = '5511988259447';
  var isLimpeza = window.location.pathname.indexOf('limpeza') !== -1;
  var isCop     = window.location.pathname.indexOf('copeiragem') !== -1;

  var forms = document.querySelectorAll('.contact-form');

  forms.forEach(function(form) {
    var formStarted = false;

    // Track form_start
    form.addEventListener('input', function() {
      if (!formStarted) {
        formStarted = true;
        trackEvent('form_start', { form_id: form.id });
      }
    }, { once: true });

    // Submit → WhatsApp
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Coleta os campos
      var nome       = (form.querySelector('[name="nome"]')          || {}).value || '';
      var whatsapp   = (form.querySelector('[name="whatsapp"]')      || {}).value || '';
      var empresa    = (form.querySelector('[name="empresa"]')       || {}).value || '';
      var tipo       = (form.querySelector('[name="tipo_empresa"]')  || {}).value || '';
      var regiao     = (form.querySelector('[name="regiao"]')        || {}).value || '';
      var servico    = (form.querySelector('[name="servico"]')       || {}).value || '';
      var necessidade= (form.querySelector('[name="necessidade"]')   || {}).value || '';
      var origem     = (form.querySelector('[name="origem"]')        || {}).value || 'Site';

      // Monta a mensagem
      var linhas = [];
      linhas.push('Olá! Vim pelo site e gostaria de solicitar uma proposta. Seguem minhas informações:');
      linhas.push('');
      if (nome)        linhas.push('👤 Nome: ' + nome);
      if (whatsapp)    linhas.push('📱 WhatsApp: ' + whatsapp);
      if (empresa)     linhas.push('🏢 Empresa: ' + empresa);
      if (tipo)        linhas.push('🏷️ Tipo: ' + tipo);
      if (regiao)      linhas.push('📍 Região: ' + regiao);
      if (servico)     linhas.push('🔧 Serviço: ' + servico);
      if (necessidade) linhas.push('📝 Necessidade: ' + necessidade);
      linhas.push('');
      linhas.push('Origem: ' + origem);

      var mensagem = linhas.join('\n');
      var waUrl = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(mensagem);

      // Tracking
      trackEvent('form_submit', { form_id: form.id }); // Evento customizado mantido
      trackEvent('Lead'); // Disparo limpo exigido pelo Meta
      // (Removidos lead_limpeza e lead_copeiragem duplicados)

      // Abre o WhatsApp
      window.open(waUrl, '_blank');
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

/* =============================================
   7. INSTITUTIONAL NAV — DROPDOWN + MOBILE SUBMENU
   ============================================= */
(function() {
  // Scroll shadow on header
  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function() {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // Mobile submenu toggles
  document.querySelectorAll('.mob-sub-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      var sub = this.nextElementSibling;
      if (sub) sub.classList.toggle('open', !expanded);
      // rotate chevron
      var icon = this.querySelector('.mob-sub-chevron');
      if (icon) icon.style.transform = expanded ? '' : 'rotate(180deg)';
    });
  });

  // Active nav link — highlight current page
  var path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-a, .mob-a').forEach(function(a) {
    var href = a.getAttribute('href');
    if (!href) return;
    var hPath = href.replace(/\/$/, '') || '/';
    if (hPath === path) a.classList.add('nav-active');
  });
})();
