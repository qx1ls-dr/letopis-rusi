/**
 * quiz.js — финальный квиз «Испытание летописца»
 * ================================================
 * Зависит от: data/content.js (window.FINAL_QUIZ, window.RANKS)
 * Зависит от: main.js (window.Score)
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initFinalQuiz();
});

function initFinalQuiz() {
  const section = document.getElementById('final-quiz');
  if (!section || !window.FINAL_QUIZ) return;

  const container = document.getElementById('final-quiz-container');
  if (!container) return;

  // Кнопка запуска
  const startBtn = document.getElementById('final-quiz-start');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const intro = document.getElementById('final-quiz-intro');
      if (intro) intro.style.display = 'none';
      startFinalQuiz(container);
    });
  }
}

function startFinalQuiz(container) {
  // Перемешиваем вопросы
  const questions = shuffleArray([...window.FINAL_QUIZ]);
  let currentIdx = 0;
  let quizScore  = 0;

  // Прогресс-бар
  const progressFill = document.getElementById('quiz-progress-fill');
  const progressLabel = document.getElementById('quiz-progress-label');

  function updateProgress() {
    const pct = (currentIdx / questions.length) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressLabel) {
      progressLabel.textContent = `Вопрос ${Math.min(currentIdx + 1, questions.length)} из ${questions.length}`;
    }
  }

  function renderQuestion(idx) {
    updateProgress();

    if (idx >= questions.length) {
      finishQuiz(container, quizScore, questions.length);
      return;
    }

    const q = questions[idx];
    const letters = ['а', 'б', 'в', 'г'];
    const personName = getPersonName(q.personId);

    container.innerHTML = `
      <div class="quiz-question-wrap current" aria-live="polite">
        <p class="quiz-question-num">
          Вопрос ${idx + 1} из ${questions.length}
          <span style="color:var(--clr-brown-light);font-size:0.85em;margin-left:8px;">• ${personName}</span>
        </p>
        <p class="quiz-question-text">${q.question}</p>
        <div class="quiz-options" role="group" aria-label="Варианты ответа">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" data-index="${i}" data-letter="${letters[i]}"
                    role="radio" aria-checked="false">
              ${opt}
            </button>`).join('')}
        </div>
        <div class="quiz-explanation" id="final-explanation"></div>
        <button class="quiz-next-btn" id="final-next-btn">
          ${idx + 1 < questions.length ? 'Следующий вопрос →' : 'Подвести итог'}
        </button>
      </div>`;

    let answered = false;

    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const chosen = parseInt(btn.dataset.index, 10);
        const isCorrect = chosen === q.correctIndex;

        if (isCorrect) quizScore++;

        // Подсветка вариантов
        container.querySelectorAll('.quiz-option').forEach(b => {
          b.disabled = true;
          b.setAttribute('aria-checked', 'false');
          if (parseInt(b.dataset.index, 10) === q.correctIndex) {
            b.classList.add('correct-answer');
          }
        });

        if (!isCorrect) {
          btn.classList.add('wrong-answer');
        } else {
          btn.setAttribute('aria-checked', 'true');
        }

        // Пояснение
        const exp = document.getElementById('final-explanation');
        if (exp) {
          exp.classList.add('visible');
          exp.innerHTML = isCorrect
            ? `<strong>✓ Верно!</strong>`
            : `<strong>✗ Неверно.</strong> Правильный ответ: <em>${q.options[q.correctIndex]}</em>`;
        }

        // Кнопка «Далее»
        const nextBtn = document.getElementById('final-next-btn');
        if (nextBtn) {
          nextBtn.classList.add('visible');
          nextBtn.addEventListener('click', () => {
            currentIdx++;
            renderQuestion(currentIdx);
          }, { once: true });
        }
      });
    });
  }

  renderQuestion(0);
}

function finishQuiz(container, quizScore, total) {
  // Финальный прогресс
  const progressFill = document.getElementById('quiz-progress-fill');
  const progressLabel = document.getElementById('quiz-progress-label');
  if (progressFill) progressFill.style.width = '100%';
  if (progressLabel) progressLabel.textContent = `Испытание завершено`;

  // Добавить очки к общему счёту
  window.Score.add(quizScore);

  // Определить звание
  const totalScore = window.Score.total;
  const rank = getRank(totalScore);

  container.innerHTML = '';

  const finalScreen = document.getElementById('quiz-final-screen');
  if (!finalScreen) return;

  finalScreen.classList.add('visible');

  const rankEl    = document.getElementById('final-rank');
  const scoreEl   = document.getElementById('final-score');
  const descEl    = document.getElementById('final-desc');
  const sealEl    = document.getElementById('final-seal');

  if (rankEl)  rankEl.textContent  = rank.title;
  if (descEl)  descEl.textContent  = rank.description;
  if (scoreEl) scoreEl.innerHTML   = `
    Итоговый счёт: <span class="gold-shimmer">${totalScore}</span>
    <small style="color:var(--clr-brown-light);display:block;font-family:var(--font-body);font-weight:normal;font-size:0.65em;margin-top:4px;">
      (${quizScore} за финальный квиз + ${totalScore - quizScore} за мини-квизы)
    </small>`;

  // SVG-печать диплома
  if (sealEl) sealEl.innerHTML = buildDiplomaSeal(rank.title);

  // Анимация появления диплома
  const diploma = document.getElementById('final-diploma');
  if (diploma) diploma.classList.add('diploma-appear');

  // Кнопка рестарта
  const restartBtn = document.getElementById('quiz-restart');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      // Сбрасываем очки
      window.Score.total = 0;
      window.Score._updateDisplay();

      finalScreen.classList.remove('visible');

      const intro = document.getElementById('final-quiz-intro');
      if (intro) intro.style.display = 'block';

      // Сбросить прогресс
      if (progressFill) progressFill.style.width = '0%';
      if (progressLabel) progressLabel.textContent = 'Вопрос 1 из 9';
    });
  }
}

function buildDiplomaSeal(rankTitle) {
  const stars = {
    'Подмастерье':        1,
    'Писец':              2,
    'Летописец':          3,
    'Хранитель истории':  4,
  };
  const count = stars[rankTitle] || 1;

  let starsPath = '';
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = 60 + Math.cos(angle) * 35;
    const y = 60 + Math.sin(angle) * 35;
    starsPath += `<polygon points="${starPoints(x, y, 8, 4)}" fill="#c9a227" opacity="0.9"/>`;
  }
  if (count === 1) {
    starsPath = `<polygon points="${starPoints(60, 60, 16, 7)}" fill="#c9a227" opacity="0.9"/>`;
  }

  return `<svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="55" fill="none" stroke="#c9a227" stroke-width="2"/>
    <circle cx="60" cy="60" r="46" fill="rgba(201,162,39,0.08)" stroke="#c9a227" stroke-width="0.8" stroke-dasharray="3,2"/>
    ${starsPath}
    <circle cx="60" cy="60" r="18" fill="rgba(201,162,39,0.15)" stroke="#c9a227" stroke-width="1"/>
    <text x="60" y="64" text-anchor="middle" font-family="serif" font-size="9" fill="#7a5000">Летопись</text>
    <text x="60" y="74" text-anchor="middle" font-family="serif" font-size="8" fill="#7a5000">Руси</text>
  </svg>`;
}

function starPoints(cx, cy, outerR, innerR) {
  let pts = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts += `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r} `;
  }
  return pts.trim();
}

// ─── Вспомогательные функции ──────────────────────────────────────────────
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRank(score) {
  if (!window.RANKS) return { title: 'Летописец', description: '' };
  const ranks = [...window.RANKS].reverse();
  return ranks.find(r => score >= r.minScore) || window.RANKS[0];
}

function getPersonName(personId) {
  if (!window.PERSONS) return '';
  const p = window.PERSONS.find(p => p.id === personId);
  return p ? p.shortName : '';
}
