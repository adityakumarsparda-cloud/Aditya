(() => {
  const root = document.documentElement;
  // Animations always run (site owner's choice), even when the device asks to reduce motion.
  const reduce = false;

  // Theme toggle (remembered per browser)
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  document.getElementById('themeToggle').addEventListener('click', () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });

  // Nav border on scroll
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Count-up numbers
  const fmt = (n, d) => n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  const countUp = (el) => {
    const end = parseFloat(el.dataset.count), d = +(el.dataset.decimals || 0);
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = pre + fmt(end, d) + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(end * e, d) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Reveal + animate on view
  const targets = document.querySelectorAll('.section-head, .tile, .case, .timeline > li:not(.rail), .skill-group, .edu li, .paper, .contact h2');
  targets.forEach(el => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('in');
        if (el.dataset.count) countUp(el);
        io.unobserve(el);
      });
    }, { threshold: 0.2 });
    targets.forEach(el => io.observe(el));
    document.querySelectorAll('[data-animate], [data-count]').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal, [data-animate]').forEach(el => el.classList.add('in'));
  }

  const $ = (id) => document.getElementById(id);

  // Particle constellation with cursor parallax, adapted from VibeKit (MIT)
  const cv = document.getElementById('particles');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, raf = 0, mx = 0, my = 0, visible = true;
    const pts = [];
    const accent = () => getComputedStyle(root).getPropertyValue('--accent').trim() || '#d9480f';
    const resize = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(Math.floor(w * h / 14000), 90);
      pts.length = 0;
      for (let i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
        r: .6 + Math.random() * 1.4, d: Math.random(), hue: Math.random() > .7 });
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const a = accent();
      for (const p of pts) {
        p.x += p.vx + mx * p.d * .0008; p.y += p.vy + my * p.d * .0008;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        const al = .25 + p.d * .55;
        ctx.globalAlpha = p.hue ? al : al * .5;
        ctx.fillStyle = p.hue ? a : '#9a968c';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (.5 + p.d * .7), 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = a; ctx.lineWidth = .4;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dist = Math.hypot(dx, dy);
        if (dist < 90) { ctx.globalAlpha = (1 - dist / 90) * .2; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      raf = visible ? requestAnimationFrame(draw) : 0;
    };
    resize(); addEventListener('resize', resize);
    addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left - w / 2; my = e.clientY - r.top - h / 2; }, { passive: true });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
    raf = requestAnimationFrame(draw);
  }

  // Headline: staggered word reveal (keeps <em> intact)
  const h1 = document.querySelector('.hero h1');
  if (h1 && !reduce) {
    let i = 0;
    const wrap = (node) => { const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); return s; };
    [...h1.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = wrap(); s.textContent = part; frag.appendChild(s);
        });
        h1.replaceChild(frag, n);
      } else { const s = wrap(); h1.replaceChild(s, n); s.appendChild(n); }
    });
  }

  // Scroll progress + timeline rail
  const bar = document.getElementById('progress');
  const rail = document.getElementById('railFill');
  const items = [...document.querySelectorAll('.timeline > li:not(.rail)')];
  const onScrollFx = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (rail) {
      const r = rail.parentElement.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * 0.6 - r.top) / r.height, 0), 1);
      rail.style.setProperty('--p', p.toFixed(3));
      items.forEach(li => li.classList.toggle('lit', li.getBoundingClientRect().top + 45 < innerHeight * 0.6));
    }
  };
  addEventListener('scroll', onScrollFx, { passive: true }); addEventListener('resize', onScrollFx); onScrollFx();

  // Cursor glow on cards
  document.querySelectorAll('.tile, .skill-group, .case-visual, .paper').forEach(el => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Hide the floating WhatsApp button while the contact section (which has its own) is on screen
  const waFloat = document.querySelector('.wa-float');
  const contact = document.getElementById('contact');
  if (waFloat && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => waFloat.classList.toggle('hide', en.isIntersecting), { threshold: 0.3 }).observe(contact);
  }

  // Startup store mock: cart count ticks up in time with the "New order" toast
  const cart = document.getElementById('cartCount');
  const store = document.querySelector('.store');
  if (cart && store) {
    let n = 0, timer = 0;
    const add = store.querySelector('.store-add'), toast = store.querySelector('.store-toast');
    const replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    // press "Add to cart" -> cart count goes up -> "New order" toast
    const tick = () => {
      replay(add, 'press');
      setTimeout(() => { n += 1; cart.textContent = n; replay(cart, 'bump'); replay(toast, 'show'); }, 260);
    };
    new IntersectionObserver(([en]) => {
      clearInterval(timer);
      if (en.isIntersecting) { setTimeout(tick, 900); timer = setInterval(tick, 2600); }
    }).observe(store);
  }

  $('yr').textContent = new Date().getFullYear();
})();
