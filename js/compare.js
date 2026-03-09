/**
 * compare.js — сравнительная секция «Зерцало эпохи»
 * ====================================================
 * Радарный SVG-график без библиотек, чистый SVG + JS
 * Зависит от: data/content.js (window.PERSONS, window.COMPARE)
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initCompare();
});

function initCompare() {
  if (!window.PERSONS || !window.COMPARE) return;

  const sel1 = document.getElementById('compare-select-1');
  const sel2 = document.getElementById('compare-select-2');
  if (!sel1 || !sel2) return;

  // Заполняем выпадающие списки
  window.PERSONS.forEach(p => {
    sel1.add(new Option(p.name, p.id));
    sel2.add(new Option(p.name, p.id));
  });

  // По умолчанию — два разных
  sel1.value = window.PERSONS[0].id;
  sel2.value = window.PERSONS[1].id;

  // Первоначальная отрисовка
  renderCompare();

  sel1.addEventListener('change', renderCompare);
  sel2.addEventListener('change', renderCompare);
}

function renderCompare() {
  const sel1 = document.getElementById('compare-select-1');
  const sel2 = document.getElementById('compare-select-2');
  if (!sel1 || !sel2) return;

  const p1 = window.PERSONS.find(p => p.id === sel1.value);
  const p2 = window.PERSONS.find(p => p.id === sel2.value);
  if (!p1 || !p2) return;

  // Радарный график
  const chartWrap = document.getElementById('radar-chart');
  if (chartWrap) {
    chartWrap.innerHTML = buildRadarChart(p1, p2);
  }

  // Легенда
  const legendWrap = document.getElementById('radar-legend');
  if (legendWrap) {
    legendWrap.innerHTML = buildLegend(p1, p2);
  }

  // Текстовая сводка
  const summaryEl = document.getElementById('compare-summary');
  if (summaryEl) {
    summaryEl.textContent = getCompareSummary(p1, p2);
  }
}

// ─── Радарный график ──────────────────────────────────────────────────────
function buildRadarChart(p1, p2) {
  const axes  = window.COMPARE.axes;
  const count = axes.length;

  const cx     = 580;
  const cy     = 360;
  const maxR   = 200;
  const labelR = maxR + 70;
  const rings  = 5;

  const svgW = 1100;
  const svgH = 720;
  const fz   = 15;

  let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;max-width:700px;height:auto;display:block;margin:0 auto" aria-label="Радарный график сравнения">`;

  // Светлый фон-прямоугольник (чтобы подписи читались)
  svg += `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="rgba(245,233,200,0.0)"/>`;

  // ── Концентрические кольца ──
  for (let ring = 1; ring <= rings; ring++) {
    const r = (maxR / rings) * ring;
    const pts = getPolygonPoints(cx, cy, r, count);
    svg += `<polygon points="${pts}"
      fill="${ring % 2 === 0 ? 'rgba(201,162,39,0.04)' : 'none'}"
      stroke="rgba(201,162,39,0.25)" stroke-width="1"/>`;
  }

  // ── Оси ──
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * maxR;
    const y = cy + Math.sin(angle) * maxR;
    svg += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"
      stroke="rgba(201,162,39,0.4)" stroke-width="1.2" stroke-dasharray="5,4"/>`;
  }

  // ── Подписи осей ──
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const lx = cx + Math.cos(angle) * labelR;
    const ly = cy + Math.sin(angle) * labelR;

    // text-anchor по горизонтальной позиции
    let anchor = 'middle';
    if (lx < cx - 30) anchor = 'end';
    else if (lx > cx + 30) anchor = 'start';

    const words = axes[i].split(' ');
    let labelHtml = '';

    if (words.length === 1) {
      labelHtml = `<text x="${lx.toFixed(1)}" y="${(ly + 6).toFixed(1)}"
        text-anchor="${anchor}"
        font-family="'Cinzel',serif" font-size="${fz}" fill="#2c1008" font-weight="700">
        ${axes[i]}
      </text>`;
    } else {
      // Каждое слово на отдельной строке
      const lines = words.slice();
      const totalH = lines.length * (fz + 4);
      const startY = ly - totalH / 2 + fz / 2;

      labelHtml = `<text x="${lx.toFixed(1)}" y="${startY.toFixed(1)}"
        text-anchor="${anchor}"
        font-family="'Cinzel',serif" font-size="${fz}" fill="#2c1008" font-weight="700">
        ${lines.map((line, li) =>
          `<tspan x="${lx.toFixed(1)}" dy="${li === 0 ? 0 : fz + 4}">${line}</tspan>`
        ).join('')}
      </text>`;
    }
    svg += labelHtml;
  }

  // ── Значения шкалы на верхней оси ──
  for (let ring = 1; ring <= rings; ring++) {
    const r = (maxR / rings) * ring;
    const val = ring * 2;
    const vx = cx - 14;
    const vy = cy - r + 5;
    svg += `<text x="${vx.toFixed(1)}" y="${vy.toFixed(1)}"
      font-family="serif" font-size="13" fill="rgba(44,16,8,0.5)"
      text-anchor="end">${val}</text>`;
  }

  // ── Полигоны данных ──
  const colors = ['rgba(201,162,39,0.5)', 'rgba(122,21,21,0.5)'];
  const strokes = ['#c9a227', '#7a1515'];

  [p1, p2].forEach((person, pi) => {
    const vals = axes.map(axis => (person.radar[axis] || 0) / 10);
    const pts = vals.map((v, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const r = v * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    svg += `<polygon points="${pts}"
      fill="${colors[pi]}" stroke="${strokes[pi]}" stroke-width="2"
      stroke-linejoin="round" opacity="0.85"/>`;

    // Точки на вершинах
    vals.forEach((v, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const r = v * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"
        fill="${strokes[pi]}" stroke="white" stroke-width="1.5"/>`;
    });
  });

  // ── Центр ──
  svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="rgba(201,162,39,0.6)"/>`;

  svg += `</svg>`;
  return svg;
}

function getPolygonPoints(cx, cy, r, count) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ─── Легенда ──────────────────────────────────────────────────────────────
function buildLegend(p1, p2) {
  return `
    <div class="radar-legend-item">
      <div class="radar-legend-dot" style="background:#c9a227"></div>
      <span>${p1.name}</span>
    </div>
    <div class="radar-legend-item">
      <div class="radar-legend-dot" style="background:#7a1515"></div>
      <span>${p2.name}</span>
    </div>`;
}

// ─── Текстовая сводка ─────────────────────────────────────────────────────
function getCompareSummary(p1, p2) {
  if (!window.COMPARE.summaries) return '';

  // Пробуем обе комбинации ключей
  const key1 = `${p1.id}_${p2.id}`;
  const key2 = `${p2.id}_${p1.id}`;

  return window.COMPARE.summaries[key1]
      || window.COMPARE.summaries[key2]
      || generateAutoSummary(p1, p2);
}

function generateAutoSummary(p1, p2) {
  const axes = window.COMPARE.axes;

  // Находим где p1 > p2 и наоборот
  const p1Wins = axes.filter(a => (p1.radar[a] || 0) > (p2.radar[a] || 0));
  const p2Wins = axes.filter(a => (p2.radar[a] || 0) > (p1.radar[a] || 0));

  let result = `${p1.name} превосходит ${p2.name} по параметрам: ${p1Wins.join(', ') || 'нет'}.`;
  result += ` ${p2.name} лидирует по: ${p2Wins.join(', ') || 'нет'}.`;
  return result;
}
