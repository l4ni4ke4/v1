/* ============================================================
   Fehmi Soyakça — interactions, animations, i18n
   ============================================================ */
(function () {
  'use strict';

  var hasGSAP = typeof window.gsap !== 'undefined';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  // QA mode (?nopreload): static rendering — no preloader, no smooth-scroll
  // takeover, hero pinned to laptop height so tall captures show every section
  var isQA = /[?&]nopreload/.test(location.search);
  if (isQA) {
    var heroQA = document.querySelector('.hero');
    if (heroQA) heroQA.style.minHeight = '700px';
  }

  // Animation initial states only apply when JS (and GSAP) is available,
  // so the page stays fully readable if a CDN is unreachable.
  if (hasGSAP && !reduceMotion) document.documentElement.classList.add('js');

  /* ==================== i18n ==================== */
  var SKILLS = {
    tr: [
      'Bağımsız Denetim (KGK Standartları)', 'Mali Müşavirlik ve Vergi Danışmanlığı',
      'Vergi Planlaması ve Uyuşmazlık Çözümü', 'Muhasebe Sistemleri Kurulumu',
      'Kurumsallaşma Danışmanlığı', 'Finansal Raporlama ve Analiz',
      'İç Denetim ve Risk Yönetimi', 'Konkordato ve Mali Yeniden Yapılandırma',
      'Bordro ve Özlük İşlemleri', 'Mali Mevzuat ve Uyum',
      'Kurumsal Yönetim', 'Dijital Muhasebe ve E-Dönüşüm'
    ],
    en: [
      'Independent Auditing (KGK Standards)', 'Public Accounting & Tax Consultancy',
      'Tax Planning & Dispute Resolution', 'Accounting Systems Setup',
      'Corporate Structuring Advisory', 'Financial Reporting & Analysis',
      'Internal Audit & Risk Management', 'Concordat & Financial Restructuring',
      'Payroll & HR Processes', 'Financial Legislation & Compliance',
      'Corporate Governance', 'Digital Accounting & E-Transformation'
    ]
  };
  var TITLES = {
    tr: 'Fehmi Soyakça — SMMM & Bağımsız Denetçi',
    en: 'Fehmi Soyakça — CPA & Independent Auditor'
  };

  function buildMarquee(lang) {
    var html = SKILLS[lang].map(function (s) {
      return '<span class="mq-item">' + s + '</span><span class="mq-sep">✦</span>';
    }).join('');
    var seq = document.getElementById('marqueeSeq');
    var clone = document.getElementById('marqueeSeqClone');
    if (seq) seq.innerHTML = html;
    if (clone) clone.innerHTML = html;
  }

  function applyLangTexts(lang) {
    document.documentElement.lang = lang;
    document.title = TITLES[lang];
    document.querySelectorAll('[data-tr][data-en]').forEach(function (el) {
      el.textContent = el.getAttribute(lang === 'tr' ? 'data-tr' : 'data-en');
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
    });
    buildMarquee(lang);
    try { localStorage.setItem('fs-lang', lang); } catch (e) { /* private mode */ }
  }

  var langAnimating = false;
  function setLang(lang, animate) {
    if (langAnimating || lang === document.documentElement.lang) {
      if (!animate) applyLangTexts(lang);
      return;
    }
    if (!animate || !hasGSAP || reduceMotion) {
      applyLangTexts(lang);
      if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
      return;
    }
    // Cross-fade only what is on screen; everything else swaps instantly
    // so scroll-reveal states of off-screen elements stay untouched.
    langAnimating = true;
    var visible = Array.prototype.filter.call(
      document.querySelectorAll('[data-tr][data-en]'),
      function (el) {
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
      }
    );
    gsap.to(visible, {
      autoAlpha: 0, y: -10, duration: 0.28, ease: 'power2.in', stagger: 0.004,
      onComplete: function () {
        applyLangTexts(lang);
        gsap.fromTo(visible,
          { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.006,
            onComplete: function () {
              langAnimating = false;
              if (window.ScrollTrigger) ScrollTrigger.refresh();
            }
          });
      }
    });
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang'), true); });
  });

  var savedLang = 'tr';
  try { savedLang = localStorage.getItem('fs-lang') || 'tr'; } catch (e) { /* ignore */ }
  if (savedLang !== 'tr') setLang(savedLang); else buildMarquee('tr');

  /* ==================== footer year ==================== */
  var yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ==================== section watermark numerals ==================== */
  document.querySelectorAll('main .section').forEach(function (sec) {
    var no = sec.querySelector('.section-no');
    if (!no) return;
    var wm = document.createElement('span');
    wm.className = 'section-watermark';
    wm.setAttribute('aria-hidden', 'true');
    wm.textContent = no.textContent;
    sec.appendChild(wm);
  });

  /* ==================== smooth scroll (Lenis) ==================== */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduceMotion && !isQA) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGSAP && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  /* ==================== anchor navigation ==================== */
  var NAV_OFFSET = -70;
  document.querySelectorAll('[data-nav-anchor]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      if (lenis) lenis.scrollTo(target, { offset: href === '#hero' ? 0 : NAV_OFFSET, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ==================== mobile menu ==================== */
  var burger = document.getElementById('navBurger');
  var mobileMenu = document.getElementById('mobileMenu');

  function closeMobileMenu() {
    if (!mobileMenu || !mobileMenu.classList.contains('is-open')) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = !mobileMenu.classList.contains('is-open');
      mobileMenu.classList.toggle('is-open', open);
      mobileMenu.setAttribute('aria-hidden', String(!open));
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
  }

  /* ==================== nav scrolled state ==================== */
  var nav = document.getElementById('nav');
  function onScrollNav() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ==================== custom cursor ==================== */
  if (finePointer && !reduceMotion) {
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    var cx = -100, cy = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', function (e) {
      cx = e.clientX; cy = e.clientY;
      if (dot) dot.style.transform = 'translate(' + (cx - 3) + 'px,' + (cy - 3) + 'px)';
    }, { passive: true });
    (function cursorLoop() {
      rx += (cx - rx) * 0.16;
      ry += (cy - ry) * 0.16;
      if (ring) ring.style.transform = 'translate(' + (rx - 19) + 'px,' + (ry - 19) + 'px)';
      requestAnimationFrame(cursorLoop);
    })();
    document.querySelectorAll('a, button, [data-tilt]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring && ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { ring && ring.classList.remove('is-hover'); });
    });
  } else {
    var d = document.getElementById('cursorDot');
    var r = document.getElementById('cursorRing');
    if (d) d.style.display = 'none';
    if (r) r.style.display = 'none';
  }

  /* ==================== magnetic buttons ==================== */
  if (finePointer && !reduceMotion && hasGSAP) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var strength = 0.3;
      var toX = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
      var toY = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var b = el.getBoundingClientRect();
        toX((e.clientX - b.left - b.width / 2) * strength);
        toY((e.clientY - b.top - b.height / 2) * strength);
      });
      el.addEventListener('mouseleave', function () { toX(0); toY(0); });
    });
  }

  /* ==================== tilt cards + hover glow ==================== */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var maxTilt = el.classList.contains('profil-card') ? 6 : 5;
      el.addEventListener('mousemove', function (e) {
        var b = el.getBoundingClientRect();
        var px = (e.clientX - b.left) / b.width;
        var py = (e.clientY - b.top) / b.height;
        el.style.setProperty('--mx', (px * 100) + '%');
        el.style.setProperty('--my', (py * 100) + '%');
        el.style.transform =
          'perspective(800px) rotateY(' + ((px - 0.5) * maxTilt * 2) + 'deg)' +
          ' rotateX(' + ((0.5 - py) * maxTilt * 2) + 'deg)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
      });
    });

    /* glow-only (no tilt) cards — follow cursor for the radial highlight */
    document.querySelectorAll('[data-glow]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var b = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - b.left) / b.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - b.top) / b.height * 100) + '%');
      });
    });
  }

  /* advisory service cards: cursor glow handled by the [data-glow] loop above. */

  /* ==================== GSAP animations ==================== */
  if (!hasGSAP) { removePreloader(true); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ----- split hero name into chars ----- */
  document.querySelectorAll('[data-splitchars]').forEach(function (el) {
    var text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    text.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      el.appendChild(span);
    });
  });
  var heroName = document.querySelector('.hero-name');
  if (heroName) heroName.setAttribute('aria-label', 'Fehmi Soyakça');

  /* ----- preloader + hero entrance ----- */
  function removePreloader(instant) {
    var pre = document.getElementById('preloader');
    if (!pre) return;
    if (instant) { pre.style.display = 'none'; return; }
    gsap.to(pre, {
      yPercent: -100, duration: 0.9, ease: 'power4.inOut', delay: 0.15,
      onComplete: function () { pre.style.display = 'none'; }
    });
  }

  function heroEntrance() {
    if (reduceMotion) return;
    var tl = gsap.timeline({ delay: 0.55, defaults: { ease: 'power4.out' } });
    tl.from('.hero .char', { yPercent: 115, duration: 1.1, stagger: 0.035 })
      .from('.hero-overline', { y: 24, autoAlpha: 0, duration: 0.8 }, '-=0.8')
      .from('.hero-lead', { y: 28, autoAlpha: 0, duration: 0.8 }, '-=0.65')
      .from('.hero-ctas', { y: 24, autoAlpha: 0, duration: 0.7 }, '-=0.6')
      .from('.hero-strip-item', { y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, '-=0.55')
      .from('.scroll-hint', { autoAlpha: 0, duration: 0.6 }, '-=0.4');
  }

  (function runPreloader() {
    var pre = document.getElementById('preloader');
    if (isQA) { removePreloader(true); return; }
    if (!pre || reduceMotion) { removePreloader(true); heroEntrance(); return; }
    var fill = document.getElementById('preloaderFill');
    var count = document.getElementById('preloaderCount');
    var state = { v: 0 };
    gsap.timeline()
      .from('.preloader-mono', { y: 18, autoAlpha: 0, duration: 0.5, ease: 'power3.out' })
      .from('.preloader-name', { y: 26, autoAlpha: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      .to(state, {
        v: 100, duration: 1.15, ease: 'power2.inOut',
        onUpdate: function () {
          var n = Math.round(state.v);
          if (count) count.textContent = n < 10 ? '0' + n : String(n);
          if (fill) fill.style.transform = 'scaleX(' + state.v / 100 + ')';
        }
      }, '-=0.2')
      .add(function () { removePreloader(false); heroEntrance(); });
  })();

  if (reduceMotion) { removePreloader(true); }

  /* ----- nav progress bar ----- */
  gsap.to('#navProgress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  /* ----- active nav link ----- */
  document.querySelectorAll('main section[id]').forEach(function (section) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: function (self) {
        if (!self.isActive) return;
        document.querySelectorAll('.nav-links a').forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + section.id);
        });
      }
    });
  });

  if (reduceMotion) return;

  // QA: render reveal content immediately so static captures show every section
  if (isQA) {
    gsap.set('[data-reveal], [data-reveal-group] > *', { autoAlpha: 1, y: 0 });
    return;
  }

  /* ----- generic reveals ----- */
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    gsap.fromTo(el,
      { y: 44, autoAlpha: 0 },
      {
        y: 0, autoAlpha: 1, duration: 1.1, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true }
      });
  });
  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    gsap.fromTo(group.children,
      { y: 40, autoAlpha: 0 },
      {
        y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09,
        scrollTrigger: { trigger: group, start: 'top 84%', once: true }
      });
  });

  /* ----- stat counters ----- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    var from = parseInt(el.getAttribute('data-from') || '0', 10);
    var state = { v: from };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        gsap.to(state, {
          v: to, duration: 1.8, ease: 'power3.out',
          onUpdate: function () { el.textContent = String(Math.round(state.v)); }
        });
      }
    });
  });

  /* ----- timeline line fill ----- */
  var timelineFill = document.getElementById('timelineFill');
  if (timelineFill) {
    gsap.to(timelineFill, {
      scaleY: 1, ease: 'none',
      scrollTrigger: {
        trigger: '#timeline', start: 'top 70%', end: 'bottom 55%', scrub: 0.6
      }
    });
  }

  /* ----- dim the fixed particle backdrop past the hero ----- */
  gsap.to('#webgl', {
    opacity: 0.55, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '55% top', end: 'bottom top', scrub: 0.4 }
  });

  /* ----- subtle parallax while scrolling ----- */
  gsap.to('.hero-content', {
    y: -30, autoAlpha: 0.35, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: 0.5 }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* temporary QA probe: ?debug dumps layout metrics into the DOM */
  if (/[?&]debug/.test(location.search)) {
    setTimeout(function () {
      function rect(sel) {
        var el = document.querySelector(sel);
        if (!el) return 'missing';
        var r = el.getBoundingClientRect();
        var cs = getComputedStyle(el);
        return sel + ' -> w:' + Math.round(r.width) + ' h:' + Math.round(r.height) +
          ' top:' + Math.round(r.top) + ' csWidth:' + cs.width + ' AR:' + (cs.aspectRatio || 'n/a');
      }
      var d = document.createElement('pre');
      d.id = 'debugbox';
      d.textContent = ['UA: ' + navigator.userAgent,
        rect('.container'), rect('.hero-inner'), rect('.hero-content'),
        rect('.hero-lead'), rect('.hero-strip')
      ].join('\n');
      document.body.appendChild(d);
    }, 500);
  }
})();
