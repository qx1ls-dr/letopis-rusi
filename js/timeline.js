/**
 * timeline.js — горизонтальная лента времени в хедере
 * =====================================================
 * Логика активной точки и прокрутки вынесена сюда,
 * build-функции живут в main.js
 */

'use strict';

// Дополнительная логика: клавиатурная навигация по ленте
document.addEventListener('DOMContentLoaded', () => {
  initTimelineKeyboard();
  initTimelineTouch();
});

function initTimelineKeyboard() {
  const dots = document.querySelectorAll('.timeline-dot');
  if (!dots.length) return;

  dots.forEach((dot, i) => {
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('role', 'button');
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dot.click();
      }
      if (e.key === 'ArrowRight' && i < dots.length - 1) {
        dots[i + 1].focus();
      }
      if (e.key === 'ArrowLeft' && i > 0) {
        dots[i - 1].focus();
      }
    });
  });
}

// Свайп для мобильной ленты времени
function initTimelineTouch() {
  const nav = document.querySelector('.timeline-nav');
  if (!nav) return;

  let startX = 0;
  let scrollLeft = 0;

  nav.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    scrollLeft = nav.scrollLeft;
  }, { passive: true });

  nav.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - startX;
    nav.scrollLeft = scrollLeft - dx;
  }, { passive: true });
}

// Плавная прокрутка ленты к году
window.scrollTimelineToYear = function(year) {
  const dot = document.querySelector(`.timeline-dot[data-year="${year}"]`);
  if (!dot) return;
  const nav = document.querySelector('.timeline-nav');
  if (!nav) return;
  const dotCenter = dot.offsetLeft + dot.offsetWidth / 2;
  const navCenter = nav.offsetWidth / 2;
  nav.scrollTo({ left: dotCenter - navCenter, behavior: 'smooth' });
};
