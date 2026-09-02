// Compare the cost and the accuracy of the Levenberg-Marquardt fit.
// Run with: node script/jacobianBenchmark.js

import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../src/index.ts';

const scenarios = [
  {
    name: '1 gaussian, 101 points',
    nbPoints: 101,
    from: -1,
    to: 1,
    kind: 'gaussian',
    peaks: [{ x: 0, y: 1, fwhm: 0.3 }],
    repeats: 200,
  },
  {
    name: '5 gaussians, 1024 points',
    nbPoints: 1024,
    from: -1,
    to: 1,
    kind: 'gaussian',
    peaks: [
      { x: -0.6, y: 1, fwhm: 0.08 },
      { x: -0.3, y: 0.6, fwhm: 0.06 },
      { x: 0, y: 0.9, fwhm: 0.1 },
      { x: 0.35, y: 0.5, fwhm: 0.07 },
      { x: 0.65, y: 0.8, fwhm: 0.09 },
    ],
    repeats: 20,
  },
  {
    name: '10 pseudoVoigt, 3072 points',
    nbPoints: 3072,
    from: -1,
    to: 1,
    kind: 'pseudoVoigt',
    peaks: Array.from({ length: 10 }, (_, i) => ({
      x: -0.8 + i * 0.18,
      y: 0.5 + (i % 3) * 0.2,
      fwhm: 0.05 + (i % 4) * 0.01,
    })),
    repeats: 5,
  },
];

function buildShape(kind, fwhm) {
  return kind === 'pseudoVoigt' ? { kind, fwhm, mu: 0.5 } : { kind, fwhm };
}

for (const scenario of scenarios) {
  const { name, nbPoints, from, to, kind, peaks, repeats } = scenario;

  const truePeaks = peaks.map((peak) => ({
    x: peak.x,
    y: peak.y,
    shape: buildShape(kind, peak.fwhm),
  }));

  const data = generateSpectrum(truePeaks, {
    generator: { from, to, nbPoints, shape: { kind: 'gaussian' } },
  });

  // A deliberately offset starting guess, so the optimizer has real work to do.
  const guess = peaks.map((peak) => ({
    x: peak.x + 0.01,
    y: peak.y * 0.9,
    shape: buildShape(kind, peak.fwhm * 1.3),
  }));

  // warm up the JIT before timing
  for (let i = 0; i < 3; i++) optimize(data, guess);

  const start = performance.now();
  let result;
  for (let i = 0; i < repeats; i++) {
    result = optimize(data, guess);
  }
  const elapsed = (performance.now() - start) / repeats;

  let worstX = 0;
  let worstFwhm = 0;
  for (let i = 0; i < truePeaks.length; i++) {
    worstX = Math.max(worstX, Math.abs(result.peaks[i].x - truePeaks[i].x));
    worstFwhm = Math.max(
      worstFwhm,
      Math.abs(result.peaks[i].shape.fwhm - truePeaks[i].shape.fwhm),
    );
  }

  console.log(
    [
      name.padEnd(28),
      `${elapsed.toFixed(2).padStart(8)} ms`,
      `error ${result.error.toExponential(3)}`,
      `iter ${String(result.iterations).padStart(3)}`,
      `dx ${worstX.toExponential(2)}`,
      `dFwhm ${worstFwhm.toExponential(2)}`,
    ].join('  '),
  );
}
