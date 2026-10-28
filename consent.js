/* Living Scroll Studios — cookie consent + tracking loader.
 *
 * Nothing in this file loads Google Analytics or the Meta Pixel until the
 * visitor opts in. Each tool has its own choice, and each stays off entirely
 * until its ID is filled in below.
 *
 * SETUP: paste the real IDs from your own accounts. Leave '' to keep a tool off.
 */
(function () {
  'use strict';

  var CONFIG = {
    GA4_MEASUREMENT_ID: 'G-W9CYXQJ501',   // e.g. 'G-XXXXXXXXXX'  (Google Analytics → Admin → Data streams)
    META_PIXEL_ID: '',        // e.g. '123456789012345' (Meta Events Manager → Data sources)
    PRIVACY_URL: '/privacy.html',
    STORAGE_KEY: 'lss_consent_v1',
    MAX_AGE_DAYS: 180         // ask again after about 6 months
  };

  var GA_ID = /^G-[A-Z0-9]{4,}$/.test(CONFIG.GA4_MEASUREMENT_ID) ? CONFIG.GA4_MEASUREMENT_ID : '';
  var PIXEL_ID = /^\d{10,20}$/.test(CONFIG.META_PIXEL_ID) ? CONFIG.META_PIXEL_ID : '';
  var tools = { analytics: !!GA_ID, ads: !!PIXEL_ID };
  var loaded = { analytics: false, ads: false };

  /* ---------- stored choice ---------- */
  function readChoice() {
    try {
      var c = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || 'null');
      if (!c || typeof c.ts !== 'number') return null;
      if (Date.now() - c.ts > CONFIG.MAX_AGE_DAYS * 864e5) return null;
      var offered = c.offered || {};
      // A tool switched on after the visitor chose: ask again rather than assume.
      if ((tools.analytics && !offered.analytics) || (tools.ads && !offered.ads)) return null;
      return { analytics: !!c.analytics && tools.analytics, ads: !!c.ads && tools.ads, ts: c.ts };
    } catch (e) { return null; }
  }
  function saveChoice(c) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
        analytics: !!c.analytics, ads: !!c.ads, ts: Date.now(),
        offered: { analytics: tools.analytics, ads: tools.ads }
      }));
    } catch (e) {}
  }

  /* ---------- loaders (only called after consent) ---------- */
  function loadGA4() {
    if (loaded.analytics || !GA_ID) return;
    loaded.analytics = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { cookie_expires: 34128000 }); // about 13 months
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }
  function loadPixel() {
    if (loaded.ads || !PIXEL_ID) return;
    loaded.ads = true;
    /* Standard Meta Pixel base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function apply(c) {
    if (c.analytics) loadGA4();
    if (c.ads) loadPixel();
  }

  /* Remove first-party tracking cookies when consent is withdrawn */
  function clearTrackingCookies() {
    var host = location.hostname, parts = host.split('.'), domains = ['', host];
    if (parts.length > 1) { domains.push('.' + parts.slice(-2).join('.')); }
    document.cookie.split(';').forEach(function (raw) {
      var name = raw.split('=')[0].trim();
      if (/^(_ga|_ga_.*|_gid|_gat.*|_fbp|_fbc)$/.test(name)) {
        domains.forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  /* ---------- banner UI ---------- */
  var css = '' +
    '#lss-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:640px;margin:0 auto;background:#1d1810;color:#efe6d6;border:1px solid #3a2f1e;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.55);padding:18px 20px;font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '#lss-cc h2{font:600 1.05rem/1.3 Georgia,"Times New Roman",serif;color:#e3c68a;margin:0 0 .4rem}' +
    '#lss-cc p{margin:0 0 .8rem;color:#ddd3c1}#lss-cc a{color:#e3c68a}' +
    '#lss-cc .lss-row{display:flex;gap:10px;flex-wrap:wrap}' +
    '#lss-cc button{flex:1 1 140px;min-height:44px;border-radius:999px;font:600 .95rem/1 inherit;font-family:inherit;cursor:pointer;padding:.7rem 1rem;border:1px solid #c9a45c;background:#c9a45c;color:#1a140a}' +
    '#lss-cc button.lss-sec{background:transparent;color:#efe6d6;border-color:#c9a45c}' +
    '#lss-cc button:focus-visible{outline:2px solid #e3c68a;outline-offset:2px}' +
    '#lss-cc .lss-opts{margin:.2rem 0 .9rem;display:none}#lss-cc.lss-open .lss-opts{display:block}' +
    '#lss-cc label{display:flex;gap:10px;align-items:flex-start;margin:.55rem 0;color:#ddd3c1;cursor:pointer}' +
    '#lss-cc label input{width:18px;height:18px;margin-top:3px;accent-color:#c9a45c;flex:none}' +
    '#lss-cc small{display:block;color:#b5a88f}';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function showBanner(prefill) {
    if (document.getElementById('lss-cc')) return;
    if (!document.getElementById('lss-cc-style')) document.head.appendChild(el('style', { id: 'lss-cc-style' }, css));
    var opts = '';
    if (tools.analytics) opts += '<label><input type="checkbox" id="lss-cc-analytics"' + (prefill && prefill.analytics ? ' checked' : '') + '><span>Analytics (Google Analytics)<small>Counts visits and which pages and links people use, so we can improve the site.</small></span></label>';
    if (tools.ads) opts += '<label><input type="checkbox" id="lss-cc-ads"' + (prefill && prefill.ads ? ' checked' : '') + '><span>Advertising (Meta Pixel)<small>Lets Meta measure which Facebook and Instagram adverts lead to visits and enquiries.</small></span></label>';
    var box = el('div', { id: 'lss-cc', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'lss-cc-title' },
      '<h2 id="lss-cc-title">Cookies on this site</h2>' +
      '<p>We use optional cookies to understand visits' + (tools.ads ? ' and measure our adverts' : '') + '. They\'re off unless you allow them. See our <a href="' + CONFIG.PRIVACY_URL + '#cookies">privacy notice</a>.</p>' +
      '<div class="lss-opts" id="lss-cc-opts">' + opts + '</div>' +
      '<div class="lss-row">' +
        '<button type="button" id="lss-cc-accept">Accept all</button>' +
        '<button type="button" class="lss-sec" id="lss-cc-reject">Reject all</button>' +
        '<button type="button" class="lss-sec" id="lss-cc-choose">Choose</button>' +
      '</div>');
    document.body.appendChild(box);

    function close(c) {
      var prev = readChoice();
      saveChoice(c);
      box.parentNode.removeChild(box);
      var withdrew = prev && ((prev.analytics && !c.analytics) || (prev.ads && !c.ads));
      if (withdrew || ((loaded.analytics && !c.analytics) || (loaded.ads && !c.ads))) {
        clearTrackingCookies();
        location.reload(); // stop scripts that were already running
        return;
      }
      apply(c);
    }
    document.getElementById('lss-cc-accept').onclick = function () { close({ analytics: tools.analytics, ads: tools.ads }); };
    document.getElementById('lss-cc-reject').onclick = function () { close({ analytics: false, ads: false }); };
    var chooseBtn = document.getElementById('lss-cc-choose');
    chooseBtn.onclick = function () {
      if (!box.classList.contains('lss-open')) { box.classList.add('lss-open'); chooseBtn.textContent = 'Save choices'; return; }
      var a = document.getElementById('lss-cc-analytics'), d = document.getElementById('lss-cc-ads');
      close({ analytics: !!(a && a.checked), ads: !!(d && d.checked) });
    };
    if (prefill) { box.classList.add('lss-open'); chooseBtn.textContent = 'Save choices'; }
  }

  /* ---------- public API ---------- */
  window.lssConsent = {
    open: function () { if (tools.analytics || tools.ads) showBanner(readChoice() || { analytics: false, ads: false }); },
    get: readChoice,
    enabledTools: function () { return { analytics: tools.analytics, ads: tools.ads }; }
  };
  window.lssTrack = {
    /* Call ONLY after the enquiry provider confirms success. Sends no personal data. */
    lead: function (formName) {
      var c = readChoice() || {};
      if (c.analytics && loaded.analytics && window.gtag) {
        window.gtag('event', 'generate_lead', { form_name: formName || 'enquiry' });
      }
      if (c.ads && loaded.ads && window.fbq) {
        window.fbq('track', 'Lead', { content_name: formName || 'enquiry' });
      }
    }
  };

  /* Any element with data-cookie-settings reopens the choices */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (t) { e.preventDefault(); window.lssConsent.open(); }
  });

  /* ---------- start ---------- */
  function init() {
    if (!tools.analytics && !tools.ads) return; // nothing configured: no banner, no tracking
    var c = readChoice();
    if (c) apply(c); else showBanner(null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
