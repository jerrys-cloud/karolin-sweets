/* =========================================================
   حلويات كارولين — تبديل اللغة (العربية · English · עברית)
   العربية هي اللغة الافتراضية. الاختيار يُحفظ في المتصفح،
   ويمكن فرضه عبر الرابط: ?lang=en أو ?lang=he
   ========================================================= */
(function () {
  'use strict';

  var DICT = window.KAROLIN_DICT || {};
  var LANGS = {
    ar: { dir: 'rtl', label: 'ع', name: 'العربية', idx: -1 },
    en: { dir: 'ltr', label: 'EN', name: 'English', idx: 0 },
    he: { dir: 'rtl', label: 'עב', name: 'עברית', idx: 1 }
  };
  var KEY = 'karolin-lang';
  var ATTRS = ['aria-label', 'alt', 'title', 'placeholder'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, svg: 1, SVG: 1 };
  var listeners = [];
  var current = 'ar';

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  // يعيد ترجمة نص عربي إلى اللغة الحالية (أو النص نفسه إن لم توجد ترجمة)
  function t(ar, lang) {
    lang = lang || current;
    var i = LANGS[lang] ? LANGS[lang].idx : -1;
    if (i < 0) return ar;
    var hit = DICT[norm(ar)];
    if (hit && hit[i]) return hit[i];
    // «تكبير: …» في المعرض
    var m = /^تكبير:\s*(.+)$/.exec(norm(ar));
    if (m) return (lang === 'en' ? 'Enlarge: ' : 'הגדלה: ') + t(m[1], lang);
    return ar;
  }

  /* ---------- ترجمة الصفحة ---------- */
  var textNodes = null;
  var attrEls = null;

  function collect() {
    textNodes = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        while (p && p !== document.body) {
          if (SKIP[p.nodeName] || (p.hasAttribute && p.hasAttribute('data-i18n-skip'))) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return /[؀-ۿ]/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n;
    while ((n = walker.nextNode())) { n.__ar = n.nodeValue; textNodes.push(n); }

    attrEls = [];
    var sel = ATTRS.map(function (a) { return '[' + a + ']'; }).join(',');
    document.querySelectorAll(sel).forEach(function (el) {
      var saved = {};
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && /[؀-ۿ]/.test(v)) saved[a] = v;
      });
      if (Object.keys(saved).length) { el.__ar = saved; attrEls.push(el); }
    });
    document.__arTitle = document.title;
  }

  function translatePage(lang) {
    if (!textNodes) collect();
    textNodes.forEach(function (n) {
      var src = n.__ar;
      if (lang === 'ar') { n.nodeValue = src; return; }
      var tr = t(src, lang);
      if (tr === src) return;
      var lead = /^\s*/.exec(src)[0], trail = /\s*$/.exec(src)[0];
      n.nodeValue = lead + tr + trail;
    });
    attrEls.forEach(function (el) {
      Object.keys(el.__ar).forEach(function (a) { el.setAttribute(a, lang === 'ar' ? el.__ar[a] : t(el.__ar[a], lang)); });
    });
    document.title = lang === 'ar' ? document.__arTitle : t(document.__arTitle, lang);
  }

  /* ---------- تطبيق اللغة ---------- */
  function apply(lang, save) {
    if (!LANGS[lang]) lang = 'ar';
    current = lang;
    var root = document.documentElement;
    root.lang = lang;
    root.dir = LANGS[lang].dir;
    translatePage(lang);
    document.querySelectorAll('.lang-switch__btn').forEach(function (b) {
      var on = b.dataset.lang === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (save) { try { localStorage.setItem(KEY, lang); } catch (e) {} }
    root.classList.remove('i18n-pending');
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) {} });
  }

  /* ---------- زر تبديل اللغة في الترويسة ---------- */
  function buildSwitch() {
    var nav = document.querySelector('.site-header .nav');
    if (!nav || nav.querySelector('.lang-switch')) return;
    var wrap = document.createElement('div');
    wrap.className = 'lang-switch';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language · اللغة · שפה');
    wrap.setAttribute('data-i18n-skip', '');
    Object.keys(LANGS).forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lang-switch__btn';
      b.dataset.lang = code;
      b.lang = code;
      b.textContent = LANGS[code].label;
      b.title = LANGS[code].name;
      b.setAttribute('aria-label', LANGS[code].name);
      b.addEventListener('click', function () {
        if (code === current) return;
        document.documentElement.classList.add('lang-fading');
        setTimeout(function () {
          apply(code, true);
          requestAnimationFrame(function () { document.documentElement.classList.remove('lang-fading'); });
        }, 180);
      });
      wrap.appendChild(b);
    });
    var burger = nav.querySelector('.nav__burger');
    nav.insertBefore(wrap, burger || null);
  }

  function initialLang() {
    var q = /[?&]lang=(ar|en|he)\b/.exec(location.search);
    if (q) return q[1];
    try { var s = localStorage.getItem(KEY); if (LANGS[s]) return s; } catch (e) {}
    return 'ar';
  }

  window.KarolinI18n = {
    t: function (ar) { return t(ar); },
    lang: function () { return current; },
    onChange: function (fn) { listeners.push(fn); },
    refresh: function () { textNodes = null; apply(current); }
  };

  function init() {
    buildSwitch();
    apply(initialLang(), false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
