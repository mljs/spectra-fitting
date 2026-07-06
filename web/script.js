async function loadAndPlot() {
  const resp = await fetch('./json/optimizeOnlyFwhm.json');
  if (!resp.ok) {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<p>Could not load JSON: ${resp.status}</p>`,
    );
    return;
  }
  const obj = await resp.json();

  const { data, resultData, shapePeaks } = obj;

  const datasets = [];

  function toPointsXY(item) {
    if (!item) return [];
    // { x: number[], y: number[] }
    if (Array.isArray(item.x) && Array.isArray(item.y)) {
      return item.x.map((xx, idx) => ({ x: xx, y: item.y[idx] }));
    }
    // array of numbers -> treat as y-values vs index
    if (Array.isArray(item) && item.every((v) => typeof v === 'number')) {
      return item.map((y, i) => ({ x: i, y }));
    }
    // array of {x,y}
    if (
      Array.isArray(item) &&
      item.length > 0 &&
      typeof item[0] === 'object' &&
      'x' in item[0] &&
      'y' in item[0]
    ) {
      return item.map((p) => ({ x: p.x, y: p.y }));
    }
    // { x: number[], y: number } -> repeat y
    if (Array.isArray(item.x) && typeof item.y === 'number') {
      return item.x.map((xx) => ({ x: xx, y: item.y }));
    }
    return [];
  }

  // data: support {x:[], y:[]} or y-array
  datasets.push({
    label: 'data',
    data: toPointsXY(data),
    borderColor: 'red',
    backgroundColor: 'red',
    showLine: true,
    pointRadius: 0,
  });

  // resultData: support {x:[], y:[]} or y-array
  datasets.push({
    label: 'resultData',
    data: toPointsXY(resultData),
    borderColor: 'blue',
    backgroundColor: 'blue',
    showLine: true,
    pointRadius: 0,
  });

  // shapePeaks: object map or array of { x: [], y: [] } or arrays of points
  if (Array.isArray(shapePeaks)) {
    for (let i = 0; i < shapePeaks.length; i++) {
      const sp = shapePeaks[i];
      const points = toPointsXY(sp);
      datasets.push({
        label: `shapePeak ${i + 1}`,
        data: points,
        borderColor: 'rgba(0,0,0,0.3)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        showLine: true,
        pointRadius: 0,
      });
    }
  } else if (shapePeaks && typeof shapePeaks === 'object') {
    for (const [name, sp] of Object.entries(shapePeaks)) {
      const points = toPointsXY(sp);
      datasets.push({
        label: name,
        data: points,
        borderColor: 'rgba(0,0,0,0.3)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        showLine: true,
        pointRadius: 0,
      });
    }
  }

  const canvas = document.querySelector('#chart');
  const ctx = canvas.getContext('2d');
  // eslint-disable-next-line no-undef
  const chart = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      parsing: false,
      normalized: true,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'index / x' } },
        y: { title: { display: true, text: 'y' } },
      },
      plugins: { legend: { position: 'bottom' } },
      elements: { line: { tension: 0 } },
    },
  });

  // Wheel -> zoom Y axis
  canvas.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      try {
        const rect = canvas.getBoundingClientRect();
        const yPixel = ev.clientY - rect.top;
        const yScale = chart.scales.y;
        const yValue = yScale.getValueForPixel(yPixel);
        const zoomFactor = ev.deltaY < 0 ? 0.9 : 1.1; // scroll up to zoom in
        const min = yScale.min;
        const max = yScale.max;
        const newRange = (max - min) * zoomFactor;
        const newMin = yValue - (yValue - min) * zoomFactor;
        const newMax = newMin + newRange;
        chart.options.scales.y.min = newMin;
        chart.options.scales.y.max = newMax;
        chart.update('none');
      } catch {
        // ignore if scale methods not available
      }
    },
    { passive: false },
  );

  // Click-and-drag -> zoom X axis
  let isDragging = false;
  let dragStartX = 0;
  let overlay = null;

  function createOverlay() {
    const ov = document.createElement('div');
    ov.style.position = 'absolute';
    ov.style.border = '1px dashed #888';
    ov.style.background = 'rgba(128,128,128,0.15)';
    ov.style.pointerEvents = 'none';
    document.body.append(ov);
    return ov;
  }

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
    // small drags do nothing
    if (Math.abs(end - start) < 6) return;
    try {
      const xScale = chart.scales.x;
      const xMin = xScale.getValueForPixel(start - rect.left + rect.left);
      const xMax = xScale.getValueForPixel(end - rect.left + rect.left);
      chart.options.scales.x.min = Math.min(xMin, xMax);
      chart.options.scales.x.max = Math.max(xMin, xMax);
      chart.update();
    } catch {
      // ignore
    }
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

loadAndPlot().catch((error) => {
  document.body.insertAdjacentHTML(
    'beforeend',
    `<pre>${error.toString()}</pre>`,
  );
});
