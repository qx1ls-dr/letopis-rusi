/**
 * main.js — инициализация, скролл, параллакс, Intersection Observer
 * ==================================================================
 */

'use strict';

// ─── Глобальный счётчик очков ─────────────────────────────────────────────
window.Score = {
  total: 0,
  add(points) {
    this.total += points;
    this._updateDisplay();
  },
  _updateDisplay() {
    const el = document.getElementById('score-value');
    if (!el) return;
    el.textContent = this.total;
    el.classList.remove('bump');
    void el.offsetWidth; // reflow для перезапуска анимации
    el.classList.add('bump');
  },
};

// ─── Инициализация при загрузке DOM ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildHeader();
  buildHero();
  buildPersonSections();
  renderPdfPortraits();
  buildCompareSection();
  buildFinalQuiz();
  buildColophon();
  initScrollObserver();
  initParallax();
  initMapTooltips();
  initHeroAnimation();
});

// ─── Построение хедера ────────────────────────────────────────────────────
function buildHeader() {
  const track = document.getElementById('timeline-track');
  if (!track || !window.TIMELINE) return;

  window.TIMELINE.forEach(item => {
    const dot = document.createElement('div');
    dot.className = 'timeline-dot';
    dot.setAttribute('data-section', item.sectionId);
    dot.innerHTML = `
      <div class="timeline-dot-circle"></div>
      <span class="timeline-dot-year">${item.year}</span>
      <div class="timeline-tooltip">${item.label}</div>`;
    dot.addEventListener('click', () => {
      const target = document.getElementById(item.sectionId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    track.appendChild(dot);
  });

  // Обновление активной точки при скролле
  window.addEventListener('scroll', updateActiveTimelineDot, { passive: true });
}

function updateActiveTimelineDot() {
  const sections = ['alexander', 'kalita', 'donskoy', 'compare', 'final-quiz'];
  let currentSection = '';

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top <= 120) currentSection = id;
  });

  document.querySelectorAll('.timeline-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.section === currentSection);
  });

  // Прокрутить ленту к активной точке
  const activeDot = document.querySelector('.timeline-dot.active');
  if (activeDot) {
    const nav = document.getElementById('timeline-track');
    if (nav) {
      const dotLeft = activeDot.offsetLeft;
      const navWidth = nav.parentElement.offsetWidth;
      nav.parentElement.scrollTo({ left: dotLeft - navWidth / 2, behavior: 'smooth' });
    }
  }
}

// ─── Hero ─────────────────────────────────────────────────────────────────
function buildHero() {
  const site = window.SITE;
  if (!site) return;

  // Заголовок SVG (эффект пера — clip-path анимация)
  const titleEl = document.getElementById('hero-title-svg');
  if (titleEl) {
    titleEl.innerHTML = buildHeroTitleSVG(site.heroTitle);
  }

  const datesEl = document.getElementById('hero-dates');
  if (datesEl) datesEl.textContent = site.heroDates;

  const leadEl = document.getElementById('hero-lead');
  if (leadEl) leadEl.textContent = site.heroLead;

  const ctaEl = document.getElementById('hero-cta');
  if (ctaEl) {
    ctaEl.textContent = site.ctaText;
    ctaEl.addEventListener('click', () => {
      document.getElementById('alexander').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Карта встроена напрямую в HTML через <img>
}

function buildHeroTitleSVG(text) {
  // Создаём SVG с текстом и clip-path-анимацией
  return `<svg viewBox="-80 0 960 120" xmlns="http://www.w3.org/2000/svg"
    aria-label="${text}" role="img" style="width:100%;max-width:960px;overflow:visible">
    <defs>
      <clipPath id="title-clip">
        <rect x="-80" y="0" width="0" height="120">
          <animate attributeName="width" from="0" to="960"
            dur="2.2s" begin="0.5s" fill="freeze" calcMode="spline"
            keySplines="0.4 0 0.2 1" keyTimes="0;1"/>
        </rect>
      </clipPath>
    </defs>
    <!-- Тень -->
    <text x="402" y="92" text-anchor="middle"
      font-family="'Cinzel', serif" font-size="80" font-weight="900"
      fill="rgba(0,0,0,0.3)" letter-spacing="8"
      clip-path="url(#title-clip)">${text}</text>
    <!-- Основной текст -->
    <text x="400" y="90" text-anchor="middle"
      font-family="'Cinzel', serif" font-size="80" font-weight="900"
      fill="#c9a227" letter-spacing="8"
      clip-path="url(#title-clip)">${text}</text>
    <!-- Декоративное подчёркивание -->
    <path d="M120,102 Q400,114 680,102" fill="none" stroke="#c9a227" stroke-width="1.5"
      stroke-dasharray="560" stroke-dashoffset="560" opacity="0.7">
      <animate attributeName="stroke-dashoffset" from="560" to="0"
        dur="1.5s" begin="2.2s" fill="freeze" calcMode="spline"
        keySplines="0.4 0 0.2 1" keyTimes="0;1"/>
    </path>
  </svg>`;
}

function injectMapSVG() {
  const wrap = document.getElementById('hero-map-wrap');
  if (!wrap) return;

  fetch('./svg/map_new.svg')
    .then(r => r.text())
    .then(svgText => {
      wrap.innerHTML = svgText;
      // После инъекции инициализируем тултипы карты
      initMapTooltips();
    })
    .catch(() => {
      // Фоллбек если fetch не работает (открыт как file://)
      wrap.innerHTML = `<div style="text-align:center;color:var(--clr-gold);padding:40px;font-family:var(--font-heading)">
        [Карта Руси XIII–XV вв.]<br><small style="color:var(--clr-parchment-mid);font-family:var(--font-body)">
        Откройте сайт через сервер для отображения карты</small></div>`;
    });
}

// ─── Тултипы карты ────────────────────────────────────────────────────────
function initMapTooltips() {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip || !window.MAP_POINTS) return;

  const points = window.MAP_POINTS;

  document.querySelectorAll('.map-point-group').forEach(group => {
    const pointId = group.dataset.id;
    const data = points.find(p => p.id === pointId);
    if (!data) return;

    group.addEventListener('mouseenter', (e) => {
      showMapTooltip(data, e);
    });

    group.addEventListener('mousemove', (e) => {
      positionTooltip(e);
    });

    group.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });

    group.addEventListener('click', (e) => {
      e.stopPropagation();
      showMapTooltip(data, e);
      tooltip.classList.add('visible');
      // Автоскрытие через 3 сек на мобильных
      setTimeout(() => tooltip.classList.remove('visible'), 3500);
    });
  });

  document.addEventListener('click', () => tooltip.classList.remove('visible'));
}

function showMapTooltip(data, e) {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip) return;
  document.getElementById('map-tooltip-place').textContent = data.label;
  document.getElementById('map-tooltip-event').textContent = data.event;
  positionTooltip(e);
  tooltip.classList.add('visible');
}

function positionTooltip(e) {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip) return;
  const wrap = document.getElementById('hero-map-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  tooltip.style.left = `${x}px`;
  tooltip.style.top  = `${y}px`;
}

// ─── Анимация hero при появлении ─────────────────────────────────────────
function initHeroAnimation() {
  // Анимации задаются CSS-классами, здесь только параллакс-фон
  const parallaxBg = document.querySelector('.hero-parallax-bg');
  if (!parallaxBg) return;

  // Создаём декоративные плавающие элементы
  const decorItems = [
    { char: '✦', x: '10%', y: '20%', size: 1.2, speed: 0.3 },
    { char: '❧', x: '85%', y: '15%', size: 2, speed: 0.2 },
    { char: '✦', x: '75%', y: '65%', size: 0.9, speed: 0.4 },
    { char: '⸙', x: '5%',  y: '70%', size: 1.5, speed: 0.25 },
    { char: '✦', x: '50%', y: '85%', size: 0.8, speed: 0.35 },
  ];

  decorItems.forEach(item => {
    const span = document.createElement('span');
    span.textContent = item.char;
    span.style.cssText = `
      position: absolute;
      left: ${item.x};
      top: ${item.y};
      font-size: ${item.size}rem;
      color: rgba(201,162,39,0.25);
      pointer-events: none;
      font-family: serif;
    `;
    span.dataset.speed = item.speed;
    parallaxBg.appendChild(span);
  });
}

// ─── Параллакс ────────────────────────────────────────────────────────────
function initParallax() {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        applyParallax();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function applyParallax() {
  const scrollY = window.scrollY;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Параллакс фоновых элементов hero
  const heroDecor = document.querySelectorAll('.hero-parallax-bg span');
  heroDecor.forEach(el => {
    const speed = parseFloat(el.dataset.speed || 0.3);
    el.style.transform = `translateY(${scrollY * speed}px)`;
  });

  // Параллакс фонов секций
  document.querySelectorAll('.parallax-layer').forEach(el => {
    const rect = el.parentElement.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const offset = (window.innerHeight / 2 - centerY) * 0.12;
    el.style.transform = `translateY(${offset}px)`;
  });
}

// ─── Intersection Observer (fade-in при скролле) ──────────────────────────
function initScrollObserver() {
  const options = {
    root: null,
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Анимируем SVG-орнаменты при появлении
        entry.target.querySelectorAll('.ornament-line').forEach(line => {
          line.classList.add('drawn');
        });
        observer.unobserve(entry.target);
      }
    });
  }, options);

  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
    observer.observe(el);
  });
}

// ─── Генерация секций персоналий ─────────────────────────────────────────
function buildPersonSections() {
  if (!window.PERSONS) return;

  window.PERSONS.forEach((person, idx) => {
    const section = document.getElementById(person.id);
    if (!section) return;

    section.innerHTML = `
      <div class="person-scroll">
        <!-- Угловые украшения -->
        <div class="page page-left fade-in-left delay-${idx + 1}">
          <canvas class="portrait-fill" data-pdf="${buildPortraitSVG(person)}"></canvas>
        </div>

        <div class="page page-right fade-in-right delay-${idx + 1}">
          ${buildPageCorners()}
          <div class="tabs">
            <div class="tab-list" role="tablist">
              <button class="tab-btn active" role="tab" data-tab="bio-${person.id}">Биография</button>
              <button class="tab-btn" role="tab" data-tab="events-${person.id}">Ключевые события</button>
              <button class="tab-btn" role="tab" data-tab="contrib-${person.id}">Вклад</button>
              <button class="tab-btn" role="tab" data-tab="quiz-${person.id}">Проверь себя</button>
            </div>
            <div class="tab-panels">
              ${buildBioTab(person)}
              ${buildEventsTab(person)}
              ${buildContribTab(person)}
              ${buildMiniQuizTab(person)}
            </div>
          </div>
        </div>
      </div>`;

    initTabs(section);
    initEventCards(section);
    initMiniQuiz(person);
  });
}

function buildPageCorners() {
  return `
    <svg class="page-corner page-corner--tl" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M2,38 L2,8 Q2,2 8,2 L38,2" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="2" cy="2" r="2.5" fill="currentColor"/>
    </svg>
    <svg class="page-corner page-corner--tr" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M2,38 L2,8 Q2,2 8,2 L38,2" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="2" cy="2" r="2.5" fill="currentColor"/>
    </svg>
    <svg class="page-corner page-corner--bl" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M2,38 L2,8 Q2,2 8,2 L38,2" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="2" cy="2" r="2.5" fill="currentColor"/>
    </svg>
    <svg class="page-corner page-corner--br" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M2,38 L2,8 Q2,2 8,2 L38,2" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="2" cy="2" r="2.5" fill="currentColor"/>
    </svg>`;
}

// ─── Портреты — SVG-изображения ──────────────────────────────────────────
function buildPortraitSVG(person) {
  const portraits = {
    alexander: './svg/1000004838.pdf',
    kalita:    './svg/1000004839.pdf',
    donskoy:   './svg/1000004840.pdf',
  };
  return portraits[person.id] || '';
}

// ─── Рендеринг PDF-портретов через PDF.js ────────────────────────────────
function renderPdfPortraits() {
  if (typeof pdfjsLib === 'undefined') return;
  document.querySelectorAll('canvas[data-pdf]').forEach(canvas => {
    const src = canvas.getAttribute('data-pdf');
    if (!src) return;
    pdfjsLib.getDocument(src).promise.then(pdf => {
      return pdf.getPage(1);
    }).then(page => {
      const container = canvas.parentElement;
      const w = container.clientWidth || 400;
      const viewport = page.getViewport({ scale: 1 });
      const scale = w / viewport.width;
      const scaled = page.getViewport({ scale });
      canvas.width  = scaled.width;
      canvas.height = scaled.height;
      page.render({ canvasContext: canvas.getContext('2d'), viewport: scaled });
    });
  });
}

// ─── Вкладки ──────────────────────────────────────────────────────────────
function buildBioTab(person) {
  return `<div class="tab-panel active animate-in" id="bio-${person.id}" role="tabpanel">
    <div class="bio-meta">
      <div class="bio-meta-item">
        <span class="bio-meta-label">Родился</span>
        <span class="bio-meta-value">${person.birth}</span>
      </div>
      <div class="bio-meta-item">
        <span class="bio-meta-label">Скончался</span>
        <span class="bio-meta-value">${person.death}</span>
      </div>
    </div>
    <div class="bio-text">${person.bio}</div>
  </div>`;
}

function buildEventsTab(person) {
  const items = person.events.map((ev, i) => `
    <div class="event-item" data-index="${i}">
      <div class="event-icon">${ev.icon}</div>
      <div class="event-header" role="button" tabindex="0" aria-expanded="false">
        <span class="event-year">${ev.year}</span>
        <span class="event-title">${ev.title}</span>
        <span class="event-toggle" aria-hidden="true">▼</span>
      </div>
      <div class="event-detail" id="event-detail-${person.id}-${i}" role="region">
        ${ev.detail}
      </div>
    </div>`).join('');

  return `<div class="tab-panel" id="events-${person.id}" role="tabpanel">
    <div class="events-timeline">${items}</div>
  </div>`;
}

function buildContribTab(person) {
  const items = person.contributions.map((c, i) => `
    <li class="contribution-item fade-in delay-${Math.min(i + 1, 5)}">
      <span class="contribution-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="contribution-text">${c}</span>
    </li>`).join('');

  return `<div class="tab-panel" id="contrib-${person.id}" role="tabpanel">
    <ul class="contributions-list">${items}</ul>
  </div>`;
}

function buildMiniQuizTab(person) {
  return `<div class="tab-panel" id="quiz-${person.id}" role="tabpanel">
    <div class="quiz-container" data-person="${person.id}">
      <div id="mini-quiz-content-${person.id}">
        <p style="color:var(--clr-brown);font-style:italic;margin-bottom:var(--sp-lg)">
          Три вопроса о ${person.shortName}. Каждый верный ответ — +1 к общему счёту летописца.
        </p>
        <button class="quiz-start-btn" data-person="${person.id}" id="mini-start-${person.id}">
          Открыть свиток испытания
        </button>
      </div>
      <div id="mini-quiz-active-${person.id}" style="display:none"></div>
    </div>
  </div>`;
}

// ─── Инициализация вкладок ────────────────────────────────────────────────
function initTabs(section) {
  const tabBtns = section.querySelectorAll('.tab-btn');
  const tabPanels = section.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => {
        p.classList.remove('active', 'animate-in');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const target = section.querySelector(`#${targetId}`);
      if (target) {
        target.classList.add('active');
        requestAnimationFrame(() => target.classList.add('animate-in'));
        // Наблюдатель для fade-in внутри вкладки
        target.querySelectorAll('.fade-in').forEach(el => {
          if (!el.classList.contains('visible')) {
            setTimeout(() => el.classList.add('visible'), 50);
          }
        });
      }
    });
  });
}

// ─── Инициализация карточек событий ──────────────────────────────────────
function initEventCards(section) {
  section.querySelectorAll('.event-header').forEach(header => {
    const toggle = () => {
      const item = header.parentElement;
      const detail = item.querySelector('.event-detail');
      const isOpen = item.classList.contains('open');

      item.classList.toggle('open', !isOpen);
      detail.classList.toggle('open', !isOpen);
      header.setAttribute('aria-expanded', String(!isOpen));
    };

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}

// ─── Мини-квиз ───────────────────────────────────────────────────────────
function initMiniQuiz(person) {
  const startBtn = document.getElementById(`mini-start-${person.id}`);
  if (!startBtn) return;

  startBtn.addEventListener('click', () => {
    const intro = document.getElementById(`mini-quiz-content-${person.id}`);
    const active = document.getElementById(`mini-quiz-active-${person.id}`);
    intro.style.display = 'none';
    active.style.display = 'block';
    renderMiniQuiz(person, active, 0, 0);
  });
}

function renderMiniQuiz(person, container, questionIdx, score) {
  const questions = person.quiz;
  if (questionIdx >= questions.length) {
    window.Score.add(score);
    container.innerHTML = `
      <div style="text-align:center;padding:var(--sp-lg)">
        <div style="font-family:var(--font-heading);font-size:var(--fz-lg);color:var(--clr-gold);margin-bottom:var(--sp-md)">
          ${score} / ${questions.length}
        </div>
        <p style="color:var(--clr-brown);font-style:italic">
          ${getMiniResult(score, questions.length)}
        </p>
        <p style="color:var(--clr-ochre);font-size:var(--fz-sm);margin-top:var(--sp-md)">
          +${score} очков добавлено к счёту летописца
        </p>
      </div>`;
    return;
  }

  const q = questions[questionIdx];
  const letters = ['а', 'б', 'в', 'г'];

  container.innerHTML = `
    <div class="quiz-question-wrap current">
      <p class="quiz-question-num">Вопрос ${questionIdx + 1} из ${questions.length}</p>
      <p class="quiz-question-text">${q.question}</p>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" data-index="${i}" data-letter="${letters[i]}">
            ${opt}
          </button>`).join('')}
      </div>
      <div class="quiz-explanation" id="mini-exp-${person.id}"></div>
      <button class="quiz-next-btn" id="mini-next-${person.id}">
        ${questionIdx + 1 < questions.length ? 'Следующий вопрос →' : 'Завершить испытание'}
      </button>
    </div>`;

  let answered = false;

  container.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const chosen = parseInt(btn.dataset.index, 10);
      const isCorrect = chosen === q.correctIndex;
      const newScore = score + (isCorrect ? 1 : 0);

      container.querySelectorAll('.quiz-option').forEach(b => {
        b.disabled = true;
        if (parseInt(b.dataset.index, 10) === q.correctIndex) {
          b.classList.add('correct-answer');
        }
      });

      if (!isCorrect) btn.classList.add('wrong-answer');

      const exp = container.querySelector(`#mini-exp-${person.id}`);
      if (exp) {
        exp.textContent = q.explanation;
        exp.classList.add('visible');
      }

      const next = container.querySelector(`#mini-next-${person.id}`);
      if (next) {
        next.classList.add('visible');
        next.addEventListener('click', () => {
          renderMiniQuiz(person, container, questionIdx + 1, newScore);
        }, { once: true });
      }
    });
  });
}

function getMiniResult(score, total) {
  if (score === total) return 'Блестяще! Вы прекрасно знаете эту страницу летописи.';
  if (score >= total * 0.6) return 'Хороший результат! Ещё немного — и вы станете настоящим книжником.';
  return 'Перечитайте свиток и попробуйте снова — история требует вдумчивости.';
}

// ─── Сравнительная секция ────────────────────────────────────────────────
function buildCompareSection() {
  // Построение выполняется в compare.js
  // Здесь только инициализация контейнера источников
}

// ─── Финальный квиз ──────────────────────────────────────────────────────
function buildFinalQuiz() {
  // Инициализация выполняется в quiz.js
}

// ─── Колофон ─────────────────────────────────────────────────────────────
function buildColophon() {
  if (!window.SOURCES) return;
  const grid = document.getElementById('sources-grid');
  if (!grid) return;

  grid.innerHTML = window.SOURCES.map(cat => `
    <div class="sources-category">
      <h4>${cat.category}</h4>
      <ul class="sources-list">
        ${cat.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>`).join('');
}
