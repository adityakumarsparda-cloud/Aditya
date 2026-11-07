(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const targets = document.querySelectorAll('.section-head, .tile, .case, .lab, .timeline > li, .skill-group, .edu li, .paper, .contact h2');
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

  // Reorder point calculator
  const Z = [[1.2816, '90%'], [1.6449, '95%'], [2.0537, '98%'], [2.3263, '99%']];
  const $ = (id) => document.getElementById(id);
  const calc = () => {
    const d = +$('d').value, L = +$('l').value, s = +$('s').value, [z, zl] = Z[+$('z').value];
    $('o-d').textContent = d; $('o-l').textContent = L; $('o-s').textContent = s; $('o-z').textContent = zl;
    const ltd = d * L, ss = Math.ceil(z * s * Math.sqrt(L)), rop = ltd + ss;
    $('r-ltd').textContent = ltd.toLocaleString('en-IN');
    $('r-ss').textContent = ss.toLocaleString('en-IN');
    $('r-rop').textContent = rop.toLocaleString('en-IN');
    $('g-ltd').style.width = (ltd / rop * 100) + '%';
    $('g-ss').style.width = (ss / rop * 100) + '%';
  };
  ['d', 'l', 's', 'z'].forEach(id => $(id).addEventListener('input', calc)); calc();

  // Copy email
  const btn = $('copyEmail');
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('adityakumar.sparda@gmail.com'); btn.textContent = 'Copied ✓'; }
    catch (e) { btn.textContent = 'adityakumar.sparda@gmail.com'; }
    setTimeout(() => (btn.textContent = 'Copy email'), 2000);
  });

  $('yr').textContent = new Date().getFullYear();
})();
