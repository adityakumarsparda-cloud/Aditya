(() => {
  const root = document.documentElement;
  // Animations always run (site owner's choice), even when the device asks to reduce motion.
  const reduce = false;

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
  const targets = document.querySelectorAll('.section-head, .tile, .case, .timeline > li:not(.rail), .skill-group, .edu li, .paper, .contact h2, .beyond-card');
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
  // skipped on phone-sized screens: it's the heaviest effect and made scrolling choppy on phones
  if (cv && !reduce && innerWidth >= 700) {
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
  document.querySelectorAll('.tile, .skill-group, .case-visual, .paper, .beyond-card').forEach(el => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Floating WhatsApp button
  const waFloat = document.querySelector('.wa-float');
  // hide it while the hero's own buttons are on screen (no duplicate WhatsApp buttons)
  const heroCta = document.querySelector('.hero .cta');
  if (waFloat && heroCta && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => waFloat.classList.toggle('hide', en.isIntersecting), { threshold: 0.1 }).observe(heroCta);
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

  // Terminal in "Life Beyond Work": types its lines once it's on screen
  const term = document.querySelector('.term');
  if (term) new IntersectionObserver(([en], o) => { if (en.isIntersecting) { term.classList.add('play'); o.disconnect(); } }, { threshold: 0.4 }).observe(term);

  // Toolkit skill map: cycles through the six areas; click a node or tab to choose one
  const tkData = document.getElementById('tkData');
  if (tkData) {
    const areas = JSON.parse(tkData.textContent);
    // one icon per skill
    const P = {
      box: '<path d="M3 8l9-5 9 5-9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
      trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
      cycle: '<path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3"/><path d="M5 3v5h5M19 21v-5h-5"/>',
      truck: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
      bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
      stack: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
      heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
      cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.4 11h11l2-8H6.2"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
      chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
      audit: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="M9 13l2 2 4-4"/>',
      table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
      spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
      doc: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h8M9 17h6"/>',
      list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
      cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
      users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.6 3.5 6"/>',
      tasks: '<path d="M4 6l2 2 3-3M4 13l2 2 3-3M12 7h8M12 14h8M12 20h8"/>',
      hands: '<path d="M2 12l4-4 4 2 4-3 4 2 4 3"/><path d="M6 8v6l4 4 2-2 2 2 4-4v-6"/>',
      alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
      home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
      chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
      smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14.5c1 1.3 2.4 2 4 2s3-.7 4-2"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    };
    const MAP = [
      [/inventory management|warehouse|reconciliation/i, 'box'], [/forecast/i, 'trend'], [/reorder/i, 'cycle'],
      [/shiprocket/i, 'truck'], [/dhl|international/i, 'globe'], [/sla|tat/i, 'clock'], [/quick commerce/i, 'bolt'],
      [/d2c/i, 'bag'], [/zoho inventory/i, 'stack'], [/zoconut/i, 'heart'], [/shopify/i, 'cart'], [/unicommerce/i, 'grid'],
      [/oracle/i, 'server'], [/mis/i, 'chart'], [/audit/i, 'audit'], [/excel/i, 'table'], [/documentation/i, 'doc'], [/ai-assisted|automation/i, 'spark'],
      [/sop/i, 'list'], [/process/i, 'cog'], [/team/i, 'users'], [/task/i, 'tasks'],
      [/vendor/i, 'hands'], [/escalation/i, 'alert'], [/last-mile|delivery/i, 'home'], [/follow/i, 'chat'], [/csat/i, 'smile'],
    ];
    const skillIcon = (name) => { const hit = MAP.find(([re]) => re.test(name)); return P[hit ? hit[1] : 'spark']; };
    const nodes = [...document.querySelectorAll('.tk-node')], spokes = [...document.querySelectorAll('.tk-spoke')], tabs = [...document.querySelectorAll('.tk-tab')];
    const panel = document.querySelector('.tk-panel'), bar = document.getElementById('tkBar'), runner = document.querySelector('.tk-runner');
    let cur = 0, timer = 0, paused = false, visible = false;
    const show = (k) => {
      cur = k; const a = areas[k];
      nodes.forEach((n, i) => n.classList.toggle('on', i === k));
      spokes.forEach((sp, i) => sp.classList.toggle('on', i === k));
      tabs.forEach((t, i) => { t.classList.toggle('on', i === k); t.setAttribute('aria-selected', i === k); });
      document.getElementById('tkNum').textContent = String(k + 1).padStart(2, '0');
      document.getElementById('tkTitle').innerHTML = a.title;
      document.getElementById('tkDesc').textContent = a.desc;
      document.getElementById('tkChips').innerHTML = a.chips.map((c, i) => `<li style="--i:${i}"><span class="sk-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${skillIcon(c)}</svg></span>${c}</li>`).join('');
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
      const sp = spokes[k];
      runner.style.offsetPath = `path("M${sp.getAttribute('x1')} ${sp.getAttribute('y1')} L${sp.getAttribute('x2')} ${sp.getAttribute('y2')}")`;
      runner.animate([{ offsetDistance: '0%', opacity: 0 }, { opacity: 1, offset: .2 }, { offsetDistance: '100%', opacity: 1 }], { duration: 700, easing: 'ease-out', fill: 'forwards' });
      bar.classList.remove('run'); void bar.offsetWidth; if (!paused) bar.classList.add('run');
    };
    const loop = () => { clearInterval(timer); timer = setInterval(() => { if (visible && !paused) show((cur + 1) % areas.length); }, 3600); };
    const pick = (k) => { paused = true; show(k); clearTimeout(pick.t); pick.t = setTimeout(() => { paused = false; show(cur); loop(); }, 12000); };
    nodes.forEach((n, i) => { n.addEventListener('click', () => pick(i)); n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(i); } }); });
    tabs.forEach((t, i) => t.addEventListener('click', () => pick(i)));
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !paused) { show(cur); loop(); } }, { threshold: 0.3 }).observe(document.querySelector('.tk'));
    show(0);
  }

  // Back-to-top arrow: appears after scrolling, ring shows how far down the page you are
  const toTop = document.getElementById('toTop');
  if (toTop) {
    const prog = toTop.querySelector('.tt-prog');
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      toTop.classList.toggle('show', scrollY > innerHeight * 0.6);
      prog.style.strokeDashoffset = String(100 - (max > 0 ? (scrollY / max) * 100 : 0));
    };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Menu: highlight the section you're reading, with a sliding pill
  const navEl = document.querySelector('.nav nav'), ind = document.querySelector('.nav-ind');
  if (navEl && ind) {
    const links = [...navEl.querySelectorAll('a[data-sec]')];
    const secs = links.map(a => document.getElementById(a.dataset.sec));
    let active = null;
    const place = (a) => {
      if (!a) { ind.style.opacity = '0'; return; }
      ind.style.opacity = '1';
      ind.style.width = a.offsetWidth + 'px';
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    const spy = () => {
      let cur = null;
      secs.forEach((sec, i) => { if (sec && sec.getBoundingClientRect().top < innerHeight * 0.35) cur = links[i]; });
      if (cur !== active) { links.forEach(l => l.classList.toggle('active', l === cur)); active = cur; }
      place(active);
    };
    addEventListener('scroll', spy, { passive: true }); addEventListener('resize', spy); spy();
  }

  $('yr').textContent = new Date().getFullYear();
})();
