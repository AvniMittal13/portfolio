/* Shared behaviour for fun.html + travel.html:
   night-reading toggle, reveal-on-scroll and the bookworm cursor buddy. */
(function () {
  var root = document.documentElement;
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- night reading ----------
  var saved = store('fun-theme');
  if (saved) root.setAttribute('data-theme', saved);
  var themeBtn = document.getElementById('themeBtn');
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function themeLabel() { if (themeBtn) themeBtn.textContent = isDark() ? '☀ day reading' : '☾ night reading'; }
  themeLabel();
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store('fun-theme', next);
    themeLabel();
  });

  // ---------- reveal on scroll ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- bookworm ----------
  var wormBtn = document.getElementById('wormBtn');
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!finePointer || reduce) { if (wormBtn) wormBtn.style.display = 'none'; return; }

  var N = 11, layer = document.createElement('div');
  layer.className = 'worm';
  layer.setAttribute('aria-hidden', 'true');
  var segs = [], pts = [], sizes = [];
  for (var i = N - 1; i >= 1; i--) {
    var s = document.createElement('div');
    s.className = 'worm-seg';
    var size = Math.round(22 - i * 0.9);
    s.style.width = s.style.height = size + 'px';
    segs[i] = s; sizes[i] = size;
    layer.appendChild(s);
  }
  var head = document.createElement('div');
  head.className = 'worm-head';
  head.innerHTML =
    '<svg viewBox="-17 -17 34 34" width="34" height="34">' +
    '<path d="M-5 -13 Q-8 -20 -11 -19 M5 -13 Q8 -20 11 -19" stroke="#2f2433" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<circle cx="-11" cy="-19" r="2.2" fill="#ffbfd6" stroke="#2f2433" stroke-width="1.4"/>' +
    '<circle cx="11" cy="-19" r="2.2" fill="#ffbfd6" stroke="#2f2433" stroke-width="1.4"/>' +
    '<circle r="14" fill="#9fe0b4" stroke="#2f2433" stroke-width="2"/>' +
    '<circle cx="-8.5" cy="5" r="2.6" fill="#ffbfd6"/><circle cx="8.5" cy="5" r="2.6" fill="#ffbfd6"/>' +
    '<g class="eyes"><circle cx="-5" cy="-2" r="1.9" fill="#2f2433"/><circle cx="5" cy="-2" r="1.9" fill="#2f2433"/></g>' +
    '<circle cx="-5" cy="-2" r="4.6" fill="rgba(255,255,255,.35)" stroke="#2f2433" stroke-width="1.6"/>' +
    '<circle cx="5" cy="-2" r="4.6" fill="rgba(255,255,255,.35)" stroke="#2f2433" stroke-width="1.6"/>' +
    '<path d="M-0.6 -2 h1.2" stroke="#2f2433" stroke-width="1.6"/>' +
    '<path d="M-3 5.5 Q0 8.5 3 5.5" stroke="#2f2433" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '</svg>';
  layer.appendChild(head);
  var eyes = head.querySelector('.eyes');
  var bubble = document.createElement('div');
  bubble.className = 'worm-bubble';
  layer.appendChild(bubble);
  document.body.appendChild(layer);

  for (i = 0; i < N; i++) pts.push({ x: -80, y: -80 });
  var mouse = { x: -80, y: -80 }, lastMove = 0, greeted = false, idleSaid = false, bubbleTimer = null;
  var on = store('fun-worm') !== 'off';

  var IDLE = [
    'psst, read anything good lately?',
    'I live in books. obviously.',
    'keep scrolling!',
    'zzz… oh, hi!',
    'side quest, anyone?'
  ];
  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, ms || 2400);
  }

  function setOn(v) {
    on = v;
    store('fun-worm', v ? 'on' : 'off');
    if (wormBtn) wormBtn.textContent = v ? '🐛 bookworm: on' : '🐛 bookworm: off';
    if (!v) layer.classList.remove('show');
  }
  setOn(on);
  if (wormBtn) wormBtn.addEventListener('click', function () {
    setOn(!on);
    if (on) say('I\'m back!');
  });

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    lastMove = performance.now(); idleSaid = false;
    if (on) {
      layer.classList.add('show');
      if (!greeted) { greeted = true; say('hi! I\'m the bookworm', 2600); }
    }
  });
  document.documentElement.addEventListener('mouseleave', function () { layer.classList.remove('show'); });
  document.addEventListener('mouseover', function (e) {
    if (!on) return;
    var t = e.target.closest && e.target.closest('[data-worm]');
    if (t) say(t.getAttribute('data-worm'));
  });

  var lastHead = { x: -80, y: -80 };
  function tick(t) {
    if (on) {
      var hx = mouse.x + 26, hy = mouse.y + 24;
      pts[0].x += (hx - pts[0].x) * 0.15;
      pts[0].y += (hy - pts[0].y) * 0.15;
      var vx = pts[0].x - lastHead.x, vy = pts[0].y - lastHead.y;
      var speed = Math.min(6, Math.hypot(vx, vy));
      lastHead.x = pts[0].x; lastHead.y = pts[0].y;

      for (var i = 1; i < N; i++) {
        var dx = pts[i - 1].x - pts[i].x, dy = pts[i - 1].y - pts[i].y;
        var d = Math.hypot(dx, dy), gap = 8.5;
        if (d > gap) { pts[i].x += dx * (1 - gap / d); pts[i].y += dy * (1 - gap / d); }
        var wave = Math.sin(t / 110 - i * 0.8) * speed * 0.7;
        segs[i].style.transform = 'translate(' + (pts[i].x - sizes[i] / 2) + 'px,' + (pts[i].y - sizes[i] / 2 + wave) + 'px)';
      }
      head.style.transform = 'translate(' + (pts[0].x - 17) + 'px,' + (pts[0].y - 17) + 'px)';
      var lx = Math.max(-1.6, Math.min(1.6, (mouse.x - pts[0].x) / 20));
      var ly = Math.max(-1.6, Math.min(1.6, (mouse.y - pts[0].y) / 20));
      eyes.setAttribute('transform', 'translate(' + lx + ' ' + ly + ')');
      bubble.style.transform = 'translate(' + (pts[0].x + 16) + 'px,' + (pts[0].y - 46) + 'px)';

      if (!idleSaid && lastMove && t - lastMove > 6000) {
        idleSaid = true;
        say(IDLE[Math.floor(Math.random() * IDLE.length)], 3000);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
