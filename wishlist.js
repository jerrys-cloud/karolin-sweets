/* =========================================================
   حلويات كارولين — المفضّلة / قائمة الأمنيات
   • قلب صغير على كل كيكة ومنتج (يصبح ذهبيًا عند الحفظ)
   • عدّاد في شريط التنقل
   • درج جانبي يعرض التصاميم المحفوظة مع زر إرسالها عبر واتساب
   القائمة تُحفظ في متصفح الزائر فقط (localStorage).
   ========================================================= */
(function () {
  'use strict';

  var PHONE = '972527958983';
  var KEY = 'karolin-wishlist';
  var I = window.KarolinI18n || { t: function (s) { return s; }, lang: function () { return 'ar'; }, onChange: function () {} };
  function T(s) { return I.t(s); }

  // الصور التي يُضاف إليها قلب: [محدد الصورة، الحاوية التي يوضع فيها القلب]
  var TARGETS = [
    ['.card__media', '.card'],
    ['.gallery__item', null],
    ['.xcard__media', null],
    ['.kit__media', '.kit'],
    ['.album__btn', '.album__item']
  ];

  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.6s-7.6-4.6-9.6-9.3C1 7.9 3.1 4.4 6.6 4.1c2.1-.2 3.9 1 5.4 2.9 1.5-1.9 3.3-3.1 5.4-2.9 3.5.3 5.6 3.8 4.2 7.2-2 4.7-9.6 9.3-9.6 9.3z"/></svg>';

  /* ---------- التخزين ---------- */
  var items = load();
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  function has(id) { return items.some(function (x) { return x.id === id; }); }

  /* ---------- أدوات ---------- */
  function absUrl(src) { try { return new URL(src, location.href).href; } catch (e) { return src; } }
  function idFor(img) { return img.getAttribute('src').split('?')[0].replace(/^\.?\//, ''); }

  // النص العربي الأصلي لعنصر (حتى لو كانت الصفحة معروضة بلغة أخرى)
  function arText(el) {
    var out = '', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      if (n.parentNode.closest && n.parentNode.closest('.order-hint, .wish-heart')) continue;
      out += (n.__ar != null ? n.__ar : n.nodeValue);
    }
    return out.replace(/\s+/g, ' ').trim();
  }
  function titleFor(fig, img) {
    var card = fig.closest('.card, .xcard, .kit, .album__item');
    if (card) {
      var cap = card.querySelector('.album__cap');
      if (cap) { var c = cap.cloneNode(true); var s = c.querySelector('span'); if (s) s.remove(); return arText(c) || arText(cap); }
      var h = card.querySelector('.card__title, .xcard__title, h3');
      if (h) return arText(h);
    }
    var fc = fig.querySelector('figcaption');
    if (fc) return arText(fc);
    return (img.__ar && img.__ar.alt) || img.getAttribute('alt') || '';
  }

  /* ---------- أزرار القلب ---------- */
  var hearts = [];
  function armAll() {
    TARGETS.forEach(function (pair) {
      document.querySelectorAll(pair[0]).forEach(function (fig) {
        var img = fig.querySelector('img');
        if (!img || fig.__wishArmed) return;
        fig.__wishArmed = true;
        var host = (pair[1] && fig.closest(pair[1])) || fig;
        host.classList.add('wish-host');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wish-heart';
        btn.setAttribute('data-i18n-skip', '');
        btn.innerHTML = HEART;
        btn.__fig = fig; btn.__img = img; btn.__id = idFor(img);
        btn.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          toggle(btn);
        });
        btn.addEventListener('keydown', function (e) { e.stopPropagation(); });
        host.appendChild(btn);
        hearts.push(btn);
      });
    });
    syncHearts();
  }

  function syncHearts() {
    hearts.forEach(function (b) {
      var on = has(b.__id);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', T(on ? 'إزالة من المفضّلة' : 'إضافة إلى المفضّلة'));
    });
  }

  function toggle(btn) {
    if (has(btn.__id)) {
      items = items.filter(function (x) { return x.id !== btn.__id; });
      toast(T('أُزيل من المفضّلة'));
    } else {
      items.push({ id: btn.__id, src: btn.__img.getAttribute('src'), url: absUrl(btn.__img.getAttribute('src')), title: titleFor(btn.__fig, btn.__img) });
      btn.classList.remove('is-pop'); void btn.offsetWidth; btn.classList.add('is-pop');
      toast(T('أُضيف إلى المفضّلة ♥'));
      bump();
    }
    save(); update();
  }

  /* ---------- زر العدّاد في الترويسة ---------- */
  var navBtn, badge;
  function buildNav() {
    var nav = document.querySelector('.site-header .nav');
    if (!nav) return;
    navBtn = document.createElement('button');
    navBtn.type = 'button';
    navBtn.className = 'wish-nav';
    navBtn.setAttribute('data-i18n-skip', '');
    navBtn.innerHTML = HEART + '<span class="wish-nav__badge" aria-hidden="true">0</span>';
    badge = navBtn.querySelector('.wish-nav__badge');
    navBtn.addEventListener('click', openDrawer);
    var anchor = nav.querySelector('.lang-switch') || nav.querySelector('.nav__burger');
    nav.insertBefore(navBtn, anchor || null);
  }
  function bump() {
    if (!navBtn) return;
    navBtn.classList.remove('is-bump'); void navBtn.offsetWidth; navBtn.classList.add('is-bump');
  }

  /* ---------- الدرج الجانبي ---------- */
  var drawer, list, countEl, sendBtn, clearBtn, emptyEl;
  function buildDrawer() {
    drawer = document.createElement('dialog');
    drawer.className = 'wish-drawer';
    drawer.setAttribute('aria-labelledby', 'wish-title');
    drawer.setAttribute('data-i18n-skip', '');
    drawer.innerHTML =
      '<div class="wish-drawer__panel">' +
        '<header class="wish-drawer__head">' +
          '<div><p class="wish-drawer__eyebrow"></p><h2 id="wish-title" class="wish-drawer__title"></h2><p class="wish-drawer__count"></p></div>' +
          '<button type="button" class="wish-drawer__close" data-close>✕</button>' +
        '</header>' +
        '<p class="wish-drawer__lead"></p>' +
        '<ul class="wish-drawer__list" role="list"></ul>' +
        '<div class="wish-drawer__empty">' + HEART + '<p class="wish-drawer__empty-title"></p><p class="wish-drawer__empty-text"></p><a class="btn btn--ghost btn--sm" href="gallery.html"></a></div>' +
        '<footer class="wish-drawer__foot">' +
          '<a class="btn btn--gold wish-drawer__send" target="_blank" rel="noopener">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg><span></span></a>' +
          '<button type="button" class="wish-drawer__clear"></button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(drawer);
    list = drawer.querySelector('.wish-drawer__list');
    countEl = drawer.querySelector('.wish-drawer__count');
    sendBtn = drawer.querySelector('.wish-drawer__send');
    clearBtn = drawer.querySelector('.wish-drawer__clear');
    emptyEl = drawer.querySelector('.wish-drawer__empty');

    drawer.addEventListener('click', function (e) {
      if (e.target === drawer || e.target.closest('[data-close]')) closeDrawer();
      var rm = e.target.closest('[data-remove]');
      if (rm) {
        var id = rm.getAttribute('data-remove');
        var li = rm.closest('li');
        li.classList.add('is-leaving');
        setTimeout(function () { items = items.filter(function (x) { return x.id !== id; }); save(); update(); }, 260);
      }
    });
    drawer.addEventListener('cancel', function (e) { e.preventDefault(); closeDrawer(); });
    clearBtn.addEventListener('click', function () { items = []; save(); update(); });
    sendBtn.addEventListener('click', function (e) { if (!items.length) e.preventDefault(); });
  }

  function countLabel(n) {
    var l = I.lang();
    if (l === 'en') return n === 1 ? '1 saved design' : n + ' saved designs';
    if (l === 'he') return n === 1 ? 'עיצוב שמור אחד' : n + ' עיצובים שמורים';
    if (n === 1) return 'تصميم واحد محفوظ';
    if (n === 2) return 'تصميمان محفوظان';
    if (n <= 10) return n + ' تصاميم محفوظة';
    return n + ' تصميمًا محفوظًا';
  }

  function waLink() {
    var MSG = window.KAROLIN_WISH_MSG || {};
    var tpl = MSG[I.lang()] || MSG.ar || '{list}';
    var lines = items.map(function (x, i) {
      var q = I.lang() === 'en' ? ['“', '”'] : ['«', '»'];
      return (i + 1) + '. ' + q[0] + T(x.title) + q[1] + '\n' + x.url;
    }).join('\n\n');
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(tpl.replace('{list}', lines));
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderDrawer() {
    if (!drawer) return;
    drawer.querySelector('.wish-drawer__eyebrow').textContent = T('✦ قائمة الأمنيات');
    drawer.querySelector('.wish-drawer__title').textContent = T('مفضّلتي');
    drawer.querySelector('.wish-drawer__lead').textContent = T('احفظوا التصاميم التي تعجبكم، ثم أرسلوها لكارولين دفعة واحدة.');
    drawer.querySelector('.wish-drawer__close').setAttribute('aria-label', T('إغلاق'));
    drawer.querySelector('.wish-drawer__empty-title').textContent = T('لم تحفظوا أي تصميم بعد');
    drawer.querySelector('.wish-drawer__empty-text').textContent = T('اضغطوا على القلب ♡ في أي صورة لإضافتها هنا.');
    drawer.querySelector('.wish-drawer__empty a').textContent = T('تصفّحوا المعرض');
    sendBtn.querySelector('span').textContent = T('أرسلوا قائمتي عبر واتساب');
    clearBtn.textContent = T('مسح الكل');
    countEl.textContent = countLabel(items.length);

    var removeLabel = T('إزالة');
    list.innerHTML = items.map(function (x) {
      return '<li class="wish-item">' +
        '<img src="' + esc(x.src) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
        '<div class="wish-item__text"><p class="wish-item__title">' + esc(T(x.title)) + '</p>' +
        '<a class="wish-item__link" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(T('عرض الصورة')) + '</a></div>' +
        '<button type="button" class="wish-item__remove" data-remove="' + esc(x.id) + '" aria-label="' + esc(removeLabel) + '">' + HEART + '</button>' +
        '</li>';
    }).join('');
    var empty = items.length === 0;
    drawer.classList.toggle('is-empty', empty);
    sendBtn.href = empty ? '#' : waLink();
    sendBtn.setAttribute('aria-disabled', empty ? 'true' : 'false');
  }

  function openDrawer() {
    if (!drawer) buildDrawer();
    renderDrawer();
    drawer.classList.remove('is-closing');
    if (!drawer.open) drawer.showModal();
    var c = drawer.querySelector('.wish-drawer__close'); if (c) c.focus({ preventScroll: true });
  }
  var closeTimer = 0;
  function closeDrawer() {
    if (!drawer || !drawer.open) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { drawer.close(); return; }
    drawer.classList.add('is-closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () { drawer.classList.remove('is-closing'); drawer.close(); }, 380);
  }

  /* ---------- رسالة قصيرة ---------- */
  var toastEl, toastTimer = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'wish-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('data-i18n-skip', '');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 1700);
  }

  /* ---------- تحديث كل شيء ---------- */
  function update() {
    syncHearts();
    if (navBtn) {
      var n = items.length;
      badge.textContent = n > 99 ? '99+' : String(n);
      navBtn.classList.toggle('has-items', n > 0);
      navBtn.setAttribute('aria-label', T('مفضّلتي') + ' (' + n + ')');
      navBtn.title = T('مفضّلتي');
    }
    if (drawer && drawer.open) renderDrawer();
  }

  function init() {
    buildNav();
    armAll();
    update();
    I.onChange(update);
    // مزامنة بين النوافذ المفتوحة
    window.addEventListener('storage', function (e) { if (e.key === KEY) { items = load(); update(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
