/* "Watch this page build itself" — original build-mode animation for this portfolio.
   A small team of labelled cursors draws a measured box around each block of the page
   and reveals it, scrolling from the hero down to Contact. Skip any time (button or Esc). */
(() => {
  const btns = document.querySelectorAll('[data-build]');
  if (!btns.length) return;

  const CREW = [
    { name: 'Inventory', color: '#d9480f' },
    { name: 'Dispatch',  color: '#2b8a3e' },
    { name: 'Vendors',   color: '#2e6bd9' },
    { name: 'MIS',       color: '#7a4bd1' },
  ];
  const SELECTORS = [
    '.hero .eyebrow', '.hero h1', '.hero .lede', '.hero .cta', '.hero .small-link', '.hero-art',
    '#impact .section-head', '#impact .group-label', '#impact .tile',
    '#work .section-head', '#work .case-text', '#work .case-visual',
    '#experience .section-head', '#experience .timeline > li:not(.rail)',
    '#skills .section-head', '#skills .skill-group',
    '#education .kicker', '#education .edu li', '#education .paper',
    '#contact .kicker', '#contact h2', '#contact .lede', '#contact .cta', '#contact .small-link',
  ];

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  let running = false, aborted = false, layer, pill, cursors = [], targets = [];

  const svgArrow = (c) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="${c}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

  function pagePos(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  }
  function moveCursor(c, x, y, ms = 380) {
    c.el.style.transitionDuration = ms + 'ms';
    c.el.style.transform = `translate(${x}px, ${y}px)`;
    return sleep(ms);
  }
  function smoothScrollTo(y) {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: Math.max(0, Math.min(y, max)), behavior: 'smooth' });
    return sleep(430);
  }

  function setup() {
    targets = [];
    SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => { if (el.offsetParent !== null && !targets.includes(el)) targets.push(el); }));
    targets.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
    targets.forEach(el => el.classList.add('bt'));

    layer = document.createElement('div');
    layer.className = 'sw-layer';
    layer.style.height = document.documentElement.scrollHeight + 'px';
    document.body.appendChild(layer);

    cursors = CREW.map((m, i) => {
      const el = document.createElement('div');
      el.className = 'sw-cursor';
      el.innerHTML = svgArrow(m.color) + `<span class="sw-tag" style="background:${m.color}">${m.name}</span>`;
      el.style.transform = `translate(${innerWidth / 2 + (i - 1.5) * 60}px, ${scrollY + innerHeight + 40}px)`;
      layer.appendChild(el);
      return { el, ...m };
    });

    pill = document.createElement('div');
    pill.className = 'sw-pill';
    pill.innerHTML = '<span class="sw-dot"></span><span class="sw-msg">Building this page…</span><button type="button" class="sw-skip">Skip <kbd>Esc</kbd></button>';
    document.body.appendChild(pill);
    pill.querySelector('.sw-skip').addEventListener('click', () => { aborted = true; });

    document.body.classList.add('building');
  }

  async function typeHeadline(h1, c) {
    const words = [...h1.querySelectorAll('.w')];
    if (!words.length) return;
    words.forEach(w => w.classList.remove('on'));
    for (const w of words) {
      if (aborted) break;
      const p = pagePos(w);
      moveCursor(c, p.x + p.w, p.y + p.h * 0.7, 90);
      w.classList.add('on');
      await sleep(90);
    }
  }

  async function build(el, c, i) {
    await sleep(i * 90);
    if (aborted) return;
    const p = pagePos(el);
    await moveCursor(c, p.x - 4, p.y - 4);
    if (aborted) return;
    const box = document.createElement('div');
    box.className = 'sw-box';
    box.style.cssText = `left:${p.x}px;top:${p.y}px;--c:${c.color}`;
    box.innerHTML = `<span class="sw-dim" style="background:${c.color}">${Math.round(p.w)} × ${Math.round(p.h)}</span>`;
    layer.appendChild(box);
    box.getBoundingClientRect();
    box.style.width = p.w + 'px';
    box.style.height = p.h + 'px';
    await moveCursor(c, p.x + p.w - 6, p.y + p.h - 6, 320);
    el.classList.add('built', 'in');
    if (el.matches('.hero h1')) await typeHeadline(el, c);
    await sleep(160);
    box.classList.add('done');
    setTimeout(() => box.remove(), 450);
  }

  function finish() {
    targets.forEach(el => el.classList.add('built', 'in'));
    document.querySelectorAll('.hero h1 .w').forEach(w => w.classList.add('on'));
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    cursors.forEach((c, i) => { c.el.style.transitionDuration = '600ms'; c.el.style.transform = `translate(${innerWidth + 80}px, ${scrollY + 120 + i * 50}px)`; c.el.style.opacity = '0'; });
    setTimeout(() => {
      document.body.classList.remove('building');
      targets.forEach(el => el.classList.remove('bt', 'built'));
      layer && layer.remove();
    }, 650);
  }

  async function run() {
    if (running) return;
    running = true; aborted = false;
    await smoothScrollTo(0);
    setup();
    const t0 = performance.now();
    await sleep(350);

    let i = 0;
    while (i < targets.length && !aborted) {
      const first = targets[i];
      const fp = pagePos(first);
      if (fp.y < scrollY + 80 || fp.y > scrollY + innerHeight * 0.55) await smoothScrollTo(fp.y - 110);
      const batch = [];
      while (i < targets.length && batch.length < CREW.length) {
        const p = pagePos(targets[i]);
        if (batch.length && p.y + Math.min(p.h, 160) > scrollY + innerHeight - 20) break;
        batch.push(targets[i]); i++;
      }
      await Promise.all(batch.map((el, k) => build(el, cursors[k], k)));
    }

    const secs = ((performance.now() - t0) / 1000).toFixed(0);
    finish();
    if (aborted) { pill.remove(); running = false; return; }
    pill.classList.add('ok');
    pill.querySelector('.sw-msg').textContent = `Built in ${secs}s ✓`;
    const skip = pill.querySelector('.sw-skip');
    skip.innerHTML = 'Back to top ↑';
    skip.onclick = () => { scrollTo({ top: 0, behavior: 'smooth' }); pill.remove(); };
    setTimeout(() => pill.isConnected && pill.remove(), 6000);
    running = false;
  }

  btns.forEach(b => b.addEventListener('click', run));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && running) aborted = true; });
})();
