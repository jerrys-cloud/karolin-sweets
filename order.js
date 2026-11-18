/* =========================================================
   حلويات كارولين — «اطلبوا كيكة مثل هذه»
   الضغط على صورة أي كيكة يفتح نافذة أنيقة فيها معاينة الصورة،
   وزر واتساب برسالة جاهزة تتضمّن رابط الصورة نفسها،
   وزر لمشاركة الصورة ذاتها (على الهواتف التي تدعم ذلك).
   ========================================================= */
(function () {
  'use strict';

  var PHONE = '972527958983';
  // الصور القابلة للطلب في كل الصفحات
  var TARGETS = [
    '.card__media',            // تشكيلة الصفحة الرئيسية
    '.gallery__item',          // المعرض المختصر في الصفحة الرئيسية
    '.hero__card-media',       // صنف الموسم (إن وُجد)
    '.xcard__media',           // كيك الأعياد
    '.kit__media'              // بوكسات الورشات
  ];

  var I = window.KarolinI18n || { t: function (s) { return s; }, lang: function () { return 'ar'; }, onChange: function () {} };
  var MSG = window.KAROLIN_ORDER_MSG || {};
  var dialog, els = {}, state = null, closeTimer = 0;

  function T(s) { return I.t(s); }

  function absUrl(src) {
    try { return new URL(src, location.href).href; } catch (e) { return src; }
  }

  // اسم التصميم: عنوان البطاقة إن وُجد، وإلا التعليق، وإلا النص البديل للصورة
  function titleFor(fig, img) {
    var card = fig.closest('.card, .xcard, .kit, .album__item');
    var h = card && card.querySelector('.card__title, .xcard__title, h3, .album__cap');
    if (h) {
      var clone = h.cloneNode(true);
      var tag = clone.querySelector('span'); if (tag && clone.classList.contains('album__cap')) tag.remove();
      return clone.textContent.replace(/\s+/g, ' ').trim();
    }
    var cap = fig.querySelector('figcaption');
    if (cap) return cap.textContent.trim();
    return (img.getAttribute('alt') || '').trim();
  }

  function waLink(title, url) {
    var tpl = MSG[I.lang()] || MSG.ar || '{title}\n{url}';
    var text = tpl.replace('{title}', title).replace('{url}', url);
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text);
  }

  /* ---------- بناء النافذة ---------- */
  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'order-modal';
    dialog.setAttribute('aria-labelledby', 'order-modal-title');
    dialog.setAttribute('data-i18n-skip', '');
    dialog.innerHTML =
      '<div class="order-modal__card">' +
        '<button type="button" class="order-modal__close" data-close>✕</button>' +
        '<figure class="order-modal__media"><img alt=""></figure>' +
        '<div class="order-modal__body">' +
          '<p class="order-modal__eyebrow"></p>' +
          '<h2 class="order-modal__title" id="order-modal-title"></h2>' +
          '<p class="order-modal__name"></p>' +
          '<p class="order-modal__text"></p>' +
          '<div class="order-modal__actions">' +
            '<a class="btn btn--gold order-modal__wa" target="_blank" rel="noopener">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg>' +
              '<span></span></a>' +
            '<button type="button" class="btn btn--ghost order-modal__share" hidden><span></span></button>' +
            '<button type="button" class="order-modal__copy"><span></span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dialog);
    ['media', 'eyebrow', 'title', 'name', 'text', 'wa', 'share', 'copy', 'close'].forEach(function (k) {
      els[k] = dialog.querySelector('.order-modal__' + k);
    });
    els.img = els.media.querySelector('img');

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.closest('[data-close]')) close();
    });
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    els.share.addEventListener('click', shareImage);
    els.copy.addEventListener('click', copyLink);
    I.onChange(function () { if (dialog.open) render(); });
  }

  function render() {
    els.close.setAttribute('aria-label', T('إغلاق'));
    els.eyebrow.textContent = T('✦ تصميم مستوحى من أعمالنا');
    els.title.textContent = T('اطلبوا كيكة مثل هذه');
    els.text.textContent = T('سنرسل لكارولين رابط هذه الصورة مع رسالتكم، وتتواصل معكم لتأكيد التفاصيل والموعد والسعر.');
    els.wa.querySelector('span').textContent = T('اطلبوا عبر واتساب');
    els.share.querySelector('span').textContent = T('أرسلوا الصورة نفسها');
    els.copy.querySelector('span').textContent = T('نسخ رابط الصورة');
    state.title = titleFor(state.fig, state.srcImg);
    els.name.textContent = I.lang() === 'en' ? '“' + state.title + '”' : '«' + state.title + '»';
    els.img.alt = state.title;
    els.wa.href = waLink(state.title, state.url);
  }

  /* ---------- فتح وإغلاق ---------- */
  function open(fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    if (!dialog) build();
    state = { fig: fig, srcImg: img, url: absUrl(img.getAttribute('src')) };
    els.img.src = img.currentSrc || img.src;
    els.share.hidden = !canShareFiles();
    render();
    clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');
    if (!dialog.open) dialog.showModal();
    els.wa.focus({ preventScroll: true });
  }

  function close() {
    if (!dialog || !dialog.open || dialog.classList.contains('is-closing')) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    var done = function () {
      clearTimeout(closeTimer);
      dialog.removeEventListener('animationend', onEnd);
      if (!dialog.classList.contains('is-closing')) return;
      dialog.classList.remove('is-closing');
      if (dialog.open) dialog.close();
    };
    var onEnd = function (e) { if (e.target === dialog && e.animationName === 'promo-out') done(); };
    dialog.addEventListener('animationend', onEnd);
    closeTimer = setTimeout(done, 450);
  }

  /* ---------- مشاركة الصورة نفسها (الهواتف) ---------- */
  function canShareFiles() {
    try {
      return !!(navigator.canShare && navigator.share &&
        navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] }));
    } catch (e) { return false; }
  }

  function shareImage() {
    var tpl = MSG[I.lang()] || MSG.ar;
    var text = tpl.replace('{title}', state.title).replace('{url}', state.url);
    fetch(state.url).then(function (r) { return r.blob(); }).then(function (blob) {
      var name = state.url.split('/').pop().split('?')[0] || 'karolin-cake.jpg';
      var file = new File([blob], name, { type: blob.type || 'image/jpeg' });
      return navigator.share({ files: [file], text: text });
    }).catch(function () { window.open(els.wa.href, '_blank', 'noopener'); });
  }

  function copyLink() {
    var label = els.copy.querySelector('span');
    var ok = function () {
      label.textContent = T('تم النسخ ✓');
      setTimeout(function () { label.textContent = T('نسخ رابط الصورة'); }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(state.url).then(ok, function () {});
    else {
      var ta = document.createElement('textarea'); ta.value = state.url; document.body.appendChild(ta);
      ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} ta.remove();
    }
  }

  /* ---------- تفعيل الصور ---------- */
  function hintLabel() { return T('✦ اطلبوا مثلها'); }

  function arm(fig) {
    if (fig.__orderArmed || !fig.querySelector('img')) return;
    fig.__orderArmed = true;
    fig.classList.add('is-orderable');
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    var hint = document.createElement('span');
    hint.className = 'order-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.setAttribute('data-i18n-skip', '');
    hint.textContent = hintLabel();
    fig.appendChild(hint);
    var label = function () {
      fig.setAttribute('aria-label', T('اطلبوا كيكة مثل هذه الصورة') + ': ' + titleFor(fig, fig.querySelector('img')));
      hint.textContent = hintLabel();
    };
    label();
    I.onChange(label);
    fig.addEventListener('click', function (e) { e.preventDefault(); open(fig); });
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(fig); }
    });
  }

  /* ---------- زر الطلب داخل عارض صور المعرض ---------- */
  function lightboxButton() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var fig = lb.querySelector('.lightbox__figure');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--gold btn--sm lightbox__order';
    btn.setAttribute('data-i18n-skip', '');
    var setText = function () { btn.textContent = T('اطلبوا كيكة مثل هذه'); };
    setText(); I.onChange(setText);
    fig.appendChild(btn);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var img = document.getElementById('lb-img');
      // نبحث عن عنصر المعرض الأصلي لنأخذ اسمه الصحيح
      var src = img.getAttribute('src');
      var item = Array.prototype.find.call(document.querySelectorAll('.album__item'), function (it) {
        var i = it.querySelector('img'); return i && (i.src === img.src || i.getAttribute('src') === src);
      });
      lb.close();
      open(item ? item.querySelector('.album__btn') : fig);
    });
  }

  function init() {
    document.querySelectorAll(TARGETS.join(',')).forEach(arm);
    lightboxButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
