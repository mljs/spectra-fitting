import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../src/index.ts';

const offset = 7 / 400;

const generator = {
  from: 1.99,
  to: 2.05,
  nbPoints: 1024 * 3,
  shape: { kind: 'gaussian' },
};

const truePeaks = [
  {
    id: 'triplet-peak-1',
    x: 2.02 + offset,
    y: 0.25,
    shape: { kind: 'gaussian', fwhm: 0.002 },
  },
  {
    id: 'triplet-peak-2',
    x: 2.02,
    y: 0.5,
    shape: { kind: 'gaussian', fwhm: 0.002 },
  },
  {
    id: 'triplet-peak-3',
    x: 2.02 - offset,
    y: 0.25,
    shape: { kind: 'gaussian', fwhm: 0.002 },
  },
  {
    id: 'doublet-peak-1',
    x: 2.0095 - offset / 2,
    y: 0.28,
    shape: { kind: 'gaussian', fwhm: 0.002 },
  },
  {
    id: 'doublet-peak-2',
    x: 2.0095 + offset / 2,
    y: 0.28,
    shape: { kind: 'gaussian', fwhm: 0.002 },
  },
].toSorted((a, b) => a.x - b.x);

const deltaDoublet = 2.0095;
const deltaTriplet = 2.0201;

const initialPeaks = [
  {
    id: 'triplet-peak-1',
    x: deltaTriplet + offset,
    y: 0.25,
    shape: { kind: 'gaussian', fwhm: 0.001 },
  },
  {
    id: 'triplet-peak-2',
    x: deltaTriplet,
    y: 0.54,
    shape: { kind: 'gaussian', fwhm: 0.001 },
  },
  {
    id: 'triplet-peak-3',
    x: deltaTriplet - offset,
    y: 0.31,
    shape: { kind: 'gaussian', fwhm: 0.001 },
  },
  {
    id: 'doublet-peak-1',
    x: deltaDoublet - offset / 2,
    y: 0.32,
    shape: { kind: 'gaussian', fwhm: 0.001 },
  },
  {
    id: 'doublet-peak-2',
    x: deltaDoublet + offset / 2,
    y: 0.35,
    shape: { kind: 'gaussian', fwhm: 0.001 },
  },
].toSorted((a, b) => a.x - b.x);

const linkedParameters = [
  {
    parameter: 'x',
    peaks: [
      { id: 'triplet-peak-1', offset },
      { id: 'triplet-peak-2' },
      { id: 'triplet-peak-3', offset: -offset },
    ],
  },
  {
    parameter: 'y',
    peaks: [
      { id: 'triplet-peak-1', factor: 0.5 },
      { id: 'triplet-peak-2', factor: 1 },
      { id: 'triplet-peak-3', factor: 0.5 },
    ],
  },
  {
    parameter: 'fwhm',
    peaks: [
      { id: 'triplet-peak-1' },
      { id: 'triplet-peak-2' },
      { id: 'triplet-peak-3' },
    ],
  },
  {
    parameter: 'x',
    peaks: [
      { id: 'doublet-peak-1', offset: -offset / 2 },
      { id: 'doublet-peak-2', offset: offset / 2 },
    ],
  },
  {
    parameter: 'y',
    peaks: [
      { id: 'doublet-peak-1', factor: 1 },
      { id: 'doublet-peak-2', factor: 1 },
    ],
  },
  {
    parameter: 'fwhm',
    peaks: [{ id: 'doublet-peak-1' }, { id: 'doublet-peak-2' }],
  },
];

/**
 * Generates a synthetic spectrum, fits it with linked parameters and rebuilds
 * the fitted spectrum plus the contribution of each fitted peak.
 * @returns {object} The experimental data, the fitted spectrum, one spectrum
 * per fitted peak, the optimization result and how long the fit took.
 */
export function runFit() {
  const data = generateSpectrum(truePeaks, { generator });

  const start = performance.now();
  const result = optimize(data, structuredClone(initialPeaks), {
    optimization: { kind: 'lm', options: { maxIterations: 100 } },
    linkedParameters,
    parameters: { x: { gradientDifference: 0.01 }, fwhm: { optimize: true } },
  });
  const elapsed = performance.now() - start;

  const resultData = generateSpectrum(result.peaks, { generator });

  const shapePeaks = {};
  for (const peak of result.peaks) {
    shapePeaks[peak.id] = generateSpectrum([peak], { generator });
  }

  return { data, resultData, shapePeaks, result, elapsed };
}
