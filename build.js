/* Build mode — original animation written for this portfolio.
   1) Scroll mode (automatic): as each block below the hero scrolls into view, a labelled
      cursor flies to it, draws a measured box around it and reveals it.
   2) Full tour ("Watch this page build itself" / "Replay the build"): blanks the page and
      rebuilds everything from the hero down to Contact. Skip any time (button or Esc). */
(() => {
  const CREW = [
    { name: 'Inventory', color: '#d9480f' },
    { name: 'Dispatch',  color: '#2b8a3e' },
    { name: 'Vendors',   color: '#2e6bd9' },
    { name: 'MIS',       color: '#7a4bd1' },
  ];
  const HERO = ['.hero .eyebrow', '.hero h1', '.hero .lede', '.hero .cta', '.hero .small-link', '.hero .build-btn', '.hero-art', '.ticker'];
  const SECTIONS = [
    '#impact .section-head', '#impact .group-label', '#impact .tile',
    '#work .section-head', '#work .case-text', '#work .case-visual',
    '#startup .section-head', '#startup .store', '#startup .tile',
    '#experience .section-head', '#experience .timeline > li:not(.rail)',
    '#skills .section-head', '#skills .tk-hub', '#skills .tk-panel', '#skills .logic',
    '#beyond .section-head', '#beyond .pipeline', '#beyond .beyond-card', '#beyond .proof',
    '#education .kicker', '#education .edu li', '#education .paper',
    '#contact .kicker', '#contact h2', '#contact .lede', '#contact .cta', '#contact .small-link',
  ];
  const FOOTER = ['footer.footer'];

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const docOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
  const collect = (sels) => {
    const out = [];
    sels.forEach(sel => document.querySelectorAll(sel).forEach(el => { if (!out.includes(el)) out.push(el); }));
    return out.sort(docOrder);
  };
  const pagePos = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const svgArrow = (c) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="${c}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

  /* ---------- shared layer + cursors ---------- */
  let layer = null, cursors = [];
  function ensureLayer() {
    if (layer && layer.isConnected) { layer.style.height = document.documentElement.scrollHeight + 'px'; return; }
    layer = document.createElement('div');
    layer.className = 'sw-layer';
    layer.style.height = document.documentElement.scrollHeight + 'px';
    document.body.appendChild(layer);
    cursors = CREW.map((m, i) => {
      const el = document.createElement('div');
      el.className = 'sw-cursor idle';
      el.innerHTML = svgArrow(m.color) + `<span class="sw-tag" style="background:${m.color}">${m.name}</span>`;
      el.style.transform = `translate(${innerWidth - 60}px, ${scrollY + innerHeight * 0.3 + i * 40}px)`;
      layer.appendChild(el);
      return { el, busy: false, idleTimer: 0, ...m };
    });
  }
  function moveCursor(c, x, y, ms) {
    clearTimeout(c.idleTimer);
    c.el.classList.remove('idle');
    c.el.style.transitionDuration = ms + 'ms';
    c.el.style.transform = `translate(${x}px, ${y}px)`;
    return sleep(ms);
  }
  function parkLater(c) {
    clearTimeout(c.idleTimer);
    c.idleTimer = setTimeout(() => c.el.classList.add('idle'), 1400);
  }

  /* Every piece of text inside a block: headings, lines, list items, chips, numbers, buttons. */
  const TEXT_SEL = 'h2,h3,p,li,dt,dd,figcaption,a.btn,button.build-btn,.store-add,.df-src,.df-engine,.df-doc,.badge-now,.badge-before,.chips li,.cats li,.stack li,.ticker-track span,.tile-label,.big,footer a';
  function textsIn(block) {
    const all = [block, ...block.querySelectorAll(TEXT_SEL)].filter(el =>
      el.matches(TEXT_SEL) && !el.closest('svg') && !el.closest('.hero h1') && !el.matches('.hero h1') &&
      el.textContent.trim() && !el.querySelector(TEXT_SEL));
    return [...new Set(all)];
  }
  async function typeTexts(block, c, isAborted) {
    const items = textsIn(block);
    const max = 18;
    for (let k = 0; k < items.length; k++) {
      const t = items[k];
      if (isAborted() || k >= max) { t.classList.add('tx-on'); continue; }
      const n = t.textContent.trim().length;
      const d = Math.max(120, Math.min(n * 7, 420));
      t.style.transition = `clip-path ${d}ms steps(${Math.max(4, Math.min(n, 36))}, end)`;
      t.classList.add('tx-on');
      const r = t.getBoundingClientRect();
      if (r.width) moveCursor(c, r.right + scrollX + 2, r.top + scrollY + r.height * 0.6, Math.min(d, 220));
      await sleep(d * 0.55);
    }
  }

  /* Draw a measured box around one element with one cursor, then reveal it. */
  async function build(el, c, speed, isAborted) {
    const p = pagePos(el);
    await moveCursor(c, p.x - 4, p.y - 4, speed.move);
    if (isAborted()) return;
    const box = document.createElement('div');
    box.className = 'sw-box';
    box.style.cssText = `left:${p.x}px;top:${p.y}px;--c:${c.color};transition-duration:${speed.draw}ms,${speed.draw}ms,350ms`;
    box.innerHTML = `<span class="sw-dim" style="background:${c.color}">${Math.round(p.w)} × ${Math.round(p.h)}</span>`;
    layer.appendChild(box);
    box.getBoundingClientRect();
    box.style.width = p.w + 'px';
    box.style.height = p.h + 'px';
    await moveCursor(c, p.x + p.w - 6, p.y + p.h - 6, speed.draw);
    el.classList.add('built', 'in');
    if (el.matches('.hero h1')) await typeHeadline(el, c, isAborted);
    if (speed.text) await typeTexts(el, c, isAborted);
    await sleep(speed.hold);
    box.classList.add('done');
    setTimeout(() => box.remove(), 400);
  }
  async function typeHeadline(h1, c, isAborted) {
    const words = [...h1.querySelectorAll('.w')];
    words.forEach(w => w.classList.remove('on'));
    for (const w of words) {
      if (isAborted()) break;
      const p = pagePos(w);
      moveCursor(c, p.x + p.w, p.y + p.h * 0.7, 90);
      w.classList.add('on');
      await sleep(90);
    }
  }

  /* ---------- 1) Scroll mode ---------- */
  const SCROLL_SPEED = { move: 300, draw: 260, hold: 120 };
  let scrollTargets = [], queue = [], io = null, scrollOn = false;

  function startScrollMode() {
    if (!('IntersectionObserver' in window)) return;
    scrollTargets = collect(SECTIONS).filter(el => el.offsetParent !== null);
    scrollTargets.forEach(el => el.classList.add('bt'));
    document.body.classList.add('sw-scroll');
    scrollOn = true;
    io = new IntersectionObserver((entries) => {
      entries.filter(e => e.isIntersecting).map(e => e.target).sort(docOrder).forEach(el => {
        io.unobserve(el);
        if (!el.classList.contains('built')) queue.push(el);
      });
      pump();
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    scrollTargets.forEach(el => io.observe(el));
  }
  function pump() {
    if (!scrollOn || !queue.length) return;
    ensureLayer();
    // If the visitor scrolls fast, don't make them wait: reveal anything that has fallen behind.
    while (queue.length > CREW.length * 2) queue.shift().classList.add('built', 'in');
    for (const c of cursors) {
      if (c.busy || !queue.length) continue;
      const el = queue.shift();
      c.busy = true;
      build(el, c, SCROLL_SPEED, () => !scrollOn).finally(() => {
        el.classList.add('built', 'in');
        c.busy = false;
        parkLater(c);
        pump();
      });
    }
  }
  function stopScrollMode() {
    scrollOn = false;
    if (io) io.disconnect();
    queue = [];
    scrollTargets.forEach(el => el.classList.add('built', 'in'));
    document.body.classList.remove('sw-scroll');
  }

  /* ---------- 2) Full tour ---------- */
  const TOUR_SPEED = { move: 340, draw: 280, hold: 120, text: true };
  let touring = false, aborted = false, pill = null, tourTargets = [];
  const smoothScrollTo = (y) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: Math.max(0, Math.min(y, max)), behavior: 'smooth' });
    return sleep(430);
  };

  async function tour() {
    if (touring) return;
    touring = true; aborted = false;
    stopScrollMode();
    await smoothScrollTo(0);

    tourTargets = collect([...HERO, ...SECTIONS, ...FOOTER]).filter(el => el.offsetParent !== null);
    tourTargets.forEach(el => { el.classList.add('bt'); el.classList.remove('built'); textsIn(el).forEach(t => { t.classList.add('tx'); t.classList.remove('tx-on'); t.style.transition = ''; }); });
    document.body.classList.add('building');
    ensureLayer();
    cursors.forEach((c, i) => { c.el.style.transitionDuration = '0ms'; c.el.style.transform = `translate(${innerWidth / 2 + (i - 1.5) * 60}px, ${scrollY + innerHeight + 40}px)`; });

    pill = document.createElement('div');
    pill.className = 'sw-pill';
    pill.innerHTML = '<span class="sw-dot"></span><span class="sw-msg">Building this page…</span><button type="button" class="sw-skip">Skip <kbd>Esc</kbd></button>';
    document.body.appendChild(pill);
    pill.querySelector('.sw-skip').addEventListener('click', () => { aborted = true; });

    const t0 = performance.now();
    await sleep(300);
    let i = 0;
    while (i < tourTargets.length && !aborted) {
      const fp = pagePos(tourTargets[i]);
      if (fp.y < scrollY + 80 || fp.y > scrollY + innerHeight * 0.55) await smoothScrollTo(fp.y - 110);
      const batch = [];
      while (i < tourTargets.length && batch.length < CREW.length) {
        const p = pagePos(tourTargets[i]);
        if (batch.length && p.y + Math.min(p.h, 160) > scrollY + innerHeight - 20) break;
        batch.push(tourTargets[i]); i++;
      }
      await Promise.all(batch.map((el, k) => sleep(k * 90).then(() => aborted ? null : build(el, cursors[k], TOUR_SPEED, () => aborted))));
    }
    const secs = ((performance.now() - t0) / 1000).toFixed(0);

    tourTargets.forEach(el => el.classList.add('built', 'in'));
    document.querySelectorAll('.hero h1 .w').forEach(w => w.classList.add('on'));
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    cursors.forEach(c => parkLater(c));
    document.querySelectorAll('.tx').forEach(t => t.classList.add('tx-on'));
    setTimeout(() => { document.body.classList.remove('building'); document.querySelectorAll('.tx').forEach(t => { t.classList.remove('tx', 'tx-on'); t.style.transition = ''; }); }, 450);

    if (aborted) { pill.remove(); touring = false; return; }
    pill.classList.add('ok');
    pill.querySelector('.sw-msg').textContent = `Built in ${secs}s ✓`;
    const skip = pill.querySelector('.sw-skip');
    skip.innerHTML = 'Back to top ↑';
    skip.onclick = () => { scrollTo({ top: 0, behavior: 'smooth' }); pill.remove(); };
    setTimeout(() => pill.isConnected && pill.remove(), 6000);
    touring = false;
  }

  document.querySelectorAll('[data-build]').forEach(b => b.addEventListener('click', tour));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && touring) aborted = true; });
  addEventListener('resize', () => layer && layer.isConnected && (layer.style.height = document.documentElement.scrollHeight + 'px'));
  startScrollMode();
})();
