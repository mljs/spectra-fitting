import { Chart, registerables } from 'chart.js';

import { runFit } from './fit.js';

Chart.register(...registerables);

function toPoints({ x, y }) {
  const points = new Array(x.length);
  for (let i = 0; i < x.length; i++) {
    points[i] = { x: x[i], y: y[i] };
  }
  return points;
}

function plot() {
  const { data, resultData, shapePeaks, result, elapsed } = runFit();

  document.querySelector('#summary').textContent =
    `error: ${result.error.toExponential(3)} — iterations: ${result.iterations} — ${elapsed.toFixed(0)} ms`;

  const datasets = [
    {
      label: 'data',
      data: toPoints(data),
      borderColor: 'red',
      backgroundColor: 'red',
      showLine: true,
      pointRadius: 0,
    },
    {
      label: 'resultData',
      data: toPoints(resultData),
      borderColor: 'blue',
      backgroundColor: 'blue',
      showLine: true,
      pointRadius: 0,
    },
  ];

  for (const [name, spectrum] of Object.entries(shapePeaks)) {
    datasets.push({
      label: name,
      data: toPoints(spectrum),
      borderColor: 'rgba(0,0,0,0.3)',
      backgroundColor: 'rgba(0,0,0,0.3)',
      showLine: true,
      pointRadius: 0,
    });
  }

  const canvas = document.querySelector('#chart');
  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { datasets },
    options: {
      parsing: false,
      normalized: true,
      animation: false,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'x' } },
        y: { title: { display: true, text: 'y' } },
      },
      plugins: { legend: { position: 'bottom' } },
      elements: { line: { tension: 0 } },
    },
  });

  addZoomInteractions(canvas, chart);
}

function createOverlay() {
  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.border = '1px dashed #888';
  element.style.background = 'rgba(128,128,128,0.15)';
  element.style.pointerEvents = 'none';
  document.body.append(element);
  return element;
}

function addZoomInteractions(canvas, chart) {
  // Wheel -> zoom Y axis
  canvas.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const yScale = chart.scales.y;
      const yValue = yScale.getValueForPixel(ev.clientY - rect.top);
      const zoomFactor = ev.deltaY < 0 ? 0.9 : 1.1; // scroll up to zoom in
      const newMin = yValue - (yValue - yScale.min) * zoomFactor;
      chart.options.scales.y.min = newMin;
      chart.options.scales.y.max =
        newMin + (yScale.max - yScale.min) * zoomFactor;
      chart.update('none');
    },
    { passive: false },
  );

  // Click-and-drag -> zoom X axis
  let isDragging = false;
  let dragStartX = 0;
  let overlay = null;

  canvas.addEventListener('mousedown', (ev) => {
    if (ev.button !== 0) return; // left button only
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStartX = ev.clientX;
    overlay = createOverlay();
    overlay.style.left = `${dragStartX}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.width = '0px';
  });

  window.addEventListener('mousemove', (ev) => {
    if (!isDragging || !overlay) return;
    const rect = canvas.getBoundingClientRect();
    const x1 = Math.min(dragStartX, ev.clientX);
    const x2 = Math.max(dragStartX, ev.clientX);
    overlay.style.left = `${x1}px`;
    overlay.style.width = `${Math.max(1, x2 - x1)}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.height = `${rect.height}px`;
  });

  window.addEventListener('mouseup', (ev) => {
    if (!isDragging) return;
    isDragging = false;
    const rect = canvas.getBoundingClientRect();
    const start = Math.max(rect.left, Math.min(dragStartX, ev.clientX));
    const end = Math.min(rect.right, Math.max(dragStartX, ev.clientX));
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (Math.abs(end - start) < 6) return; // small drags do nothing
    const xScale = chart.scales.x;
    const xMin = xScale.getValueForPixel(start);
    const xMax = xScale.getValueForPixel(end);
    chart.options.scales.x.min = Math.min(xMin, xMax);
    chart.options.scales.x.max = Math.max(xMin, xMax);
    chart.update();
  });

  // double-click -> reset zoom
  canvas.addEventListener('dblclick', () => {
    delete chart.options.scales.x.min;
    delete chart.options.scales.x.max;
    delete chart.options.scales.y.min;
    delete chart.options.scales.y.max;
    chart.update();
  });
}

try {
  plot();
} catch (error) {
  document.body.insertAdjacentHTML('beforeend', `<pre>${error.stack}</pre>`);
}
