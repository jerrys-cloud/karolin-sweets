/* =========================================================
   حلويات كارولين — ثيم الأعياد
   ١) ثلج ذهبي وأبيض يتساقط بهدوء
   ٢) نافذة "تشكيلة الأعياد" تظهر بعد ثانيتين
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- ١) الثلج ---------------- */
  function startSnow() {
    var canvas = document.querySelector('.snow');
    if (!canvas || reduceMotion || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var flakes = [];
    var W = 0, H = 0, dpr = 1, raf = 0, last = 0;

    // ذهبي بدرجات مختلفة + أبيض كريمي (يظهر أكثر فوق الأقسام الداكنة)
    var COLORS = ['230,207,154', '212,179,115', '193,154,85', '255,250,240', '245,237,225'];

    function rand(a, b) { return a + Math.random() * (b - a); }

    function makeFlake(atTop) {
      var crystal = Math.random() < 0.28;           // بعضها نجمة ثلج سداسية، والباقي نقاط ناعمة
      var r = crystal ? rand(4, 8) : rand(1.2, 3.2);
      return {
        x: rand(0, W),
        y: atTop ? rand(-H * 0.2, -10) : rand(0, H),
        r: r,
        crystal: crystal,
        vy: rand(14, 34) * (crystal ? 0.8 : 1),     // بكسل في الثانية — سقوط هادئ
        sway: rand(10, 28),
        phase: rand(0, Math.PI * 2),
        freq: rand(0.25, 0.6),
        rot: rand(0, Math.PI),
        vr: rand(-0.35, 0.35),
        alpha: crystal ? rand(0.45, 0.8) : rand(0.35, 0.75),
        color: COLORS[(Math.random() * COLORS.length) | 0]
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // عدد قليل وأنيق: نحو ٤٥ على الشاشة الكبيرة و١٨ على الهاتف
      var target = Math.round(Math.min(45, Math.max(18, (W * H) / 26000)));
      while (flakes.length < target) flakes.push(makeFlake(false));
      flakes.length = target;
    }

    function drawCrystal(f) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.strokeStyle = 'rgba(' + f.color + ',' + f.alpha + ')';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = (Math.PI / 3) * i;
        var cx = Math.cos(a), cy = Math.sin(a);
        ctx.moveTo(0, 0);
        ctx.lineTo(cx * f.r, cy * f.r);
        // فرعان صغيران على كل ذراع
        var bx = cx * f.r * 0.55, by = cy * f.r * 0.55;
        var b = f.r * 0.32;
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(a + 0.7) * b, by + Math.sin(a + 0.7) * b);
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(a - 0.7) * b, by + Math.sin(a - 0.7) * b);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawDot(f) {
      var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.2);
      g.addColorStop(0, 'rgba(' + f.color + ',' + f.alpha + ')');
      g.addColorStop(1, 'rgba(' + f.color + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame(now) {
      var dt = Math.min((now - last) / 1000 || 0, 0.05);
      last = now;
      ctx.clearRect(0, 0, W, H);
      var t = now / 1000;
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.vy * dt;
        f.x += Math.sin(t * f.freq + f.phase) * f.sway * dt;
        f.rot += f.vr * dt;
        if (f.y - f.r * 3 > H || f.x < -20 || f.x > W + 20) {
          flakes[i] = makeFlake(true);
          continue;
        }
        if (f.crystal) drawCrystal(f); else drawDot(f);
      }
      raf = requestAnimationFrame(frame);
    }

    function play() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function pause() { cancelAnimationFrame(raf); raf = 0; }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    // توفير البطارية: يتوقف الثلج عندما تكون الصفحة في الخلفية
    document.addEventListener('visibilitychange', function () { document.hidden ? pause() : play(); });
    play();
    canvas.classList.add('is-on');
  }

  /* ---------------- ٢) نافذة العرض ---------------- */
  function setupPromo() {
    var dialog = document.getElementById('season-promo');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var KEY = 'karolin-season-promo-seen';
    var seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
    if (seen) return;                                 // تظهر مرة واحدة في كل زيارة

    function close() {
      if (!dialog.open || dialog.classList.contains('is-closing')) return;
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      if (reduceMotion) { dialog.close(); return; }
      dialog.classList.add('is-closing');
      var done = function () {
        dialog.classList.remove('is-closing');
        dialog.close();
      };
      dialog.addEventListener('animationend', done, { once: true });
      setTimeout(function () { if (dialog.open) done(); }, 500); // احتياط
    }

    dialog.querySelectorAll('[data-promo-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    // زرّا الطلب والمعرض: يغلقان النافذة ثم ينتقلان إلى وجهتهما
    dialog.querySelectorAll('[data-promo-order]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    // مفتاح Esc
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    // النقر خارج النافذة
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });

    setTimeout(function () {
      if (!document.querySelector('dialog[open]')) dialog.showModal();
    }, 2000);
  }

  function init() { startSnow(); setupPromo(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
