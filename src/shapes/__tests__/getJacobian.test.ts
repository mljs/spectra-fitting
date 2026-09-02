import { generateSpectrum } from 'spectrum-generator';
import { expect, test } from 'vitest';

import type { OptimizeOptions, Peak } from '../../index.ts';
import { buildOptimizationLayout } from '../../util/buildOptimizationLayout.ts';
import { getInternalPeaks } from '../../util/internalPeaks/getInternalPeaks.ts';
import { getJacobian } from '../getJacobian.ts';
import { getSumOfShapes } from '../getSumOfShapes.ts';

/**
 * Worst relative difference between the analytical jacobian and a central
 * finite-difference approximation of the same model.
 * @param peaks - The peaks to optimize.
 * @param options - The optimization options.
 * @returns The worst relative error over a few sample positions.
 */
function worstJacobianError(peaks: Peak[], options: OptimizeOptions = {}) {
  generateSpectrum(peaks, {
    generator: { from: -1, to: 1, nbPoints: 51, shape: { kind: 'gaussian' } },
  });

  const internalPeaks = getInternalPeaks(peaks, 1, options);
  const layout = buildOptimizationLayout(internalPeaks, peaks, options, 1);
  const { freeIndices, variableInit, variables } = layout;

  const sumOfShapes = getSumOfShapes(internalPeaks);
  const jacobian = getJacobian(internalPeaks, layout, freeIndices);

  // move away from the initial guess so no derivative is evaluated at a special point
  const values = freeIndices.map((i) => variableInit[i] * 1.05 + 0.001);

  function model(reduced: number[]) {
    const full = Float64Array.from(variableInit);
    for (let k = 0; k < freeIndices.length; k++) {
      full[freeIndices[k]] = reduced[k];
    }
    const all = freeIndices.length === variables.length ? reduced : full;
    return sumOfShapes(layout.variableToPeakValues(all));
  }

  let worst = 0;
  for (const x of [-0.7, -0.2, 0.11, 0.5]) {
    const analytical = Array.from(jacobian(values)(x));
    for (let k = 0; k < values.length; k++) {
      const step = Math.max(1e-6, Math.abs(values[k]) * 1e-6);
      const up = values.slice();
      up[k] += step;
      const down = values.slice();
      down[k] -= step;
      const numerical = (model(up)(x) - model(down)(x)) / (2 * step);
      const scale = Math.max(
        1e-6,
        Math.abs(numerical),
        Math.abs(analytical[k]),
      );
      worst = Math.max(worst, Math.abs(numerical - analytical[k]) / scale);
    }
  }
  return worst;
}

const gaussianPeaks: Peak[] = [
  { id: 'a', x: -0.4, y: 1, shape: { kind: 'gaussian', fwhm: 0.2 } },
  { id: 'b', x: 0.4, y: 0.7, shape: { kind: 'gaussian', fwhm: 0.15 } },
];

// Linking y at a 1:2 ratio only has a feasible shared value when the peaks are
// really in that ratio AND the taller one stays under the y bound, which the
// factor divides by 2. Otherwise the shared init lands outside the bounds.
const ratioLinkedPeaks: Peak[] = [
  { id: 'a', x: -0.4, y: 0.5, shape: { kind: 'gaussian', fwhm: 0.2 } },
  { id: 'b', x: 0.4, y: 1, shape: { kind: 'gaussian', fwhm: 0.15 } },
];

test('matches finite differences for every supported shape', () => {
  expect(worstJacobianError(gaussianPeaks)).toBeLessThan(1e-5);
  expect(
    worstJacobianError([
      { x: 0, y: 1, shape: { kind: 'lorentzian', fwhm: 0.2 } },
    ]),
  ).toBeLessThan(1e-5);
  expect(
    worstJacobianError([
      { x: 0, y: 1, shape: { kind: 'pseudoVoigt', fwhm: 0.2, mu: 0.4 } },
    ]),
  ).toBeLessThan(1e-5);
  expect(
    worstJacobianError([
      {
        x: 0,
        y: 1,
        shape: { kind: 'generalizedLorentzian', fwhm: 0.2, gamma: 0.3 },
      },
    ]),
  ).toBeLessThan(1e-5);
  expect(
    worstJacobianError([
      { x: 0, y: 1, shape: { kind: 'pseudoVoigtTCH', fwhmG: 0.2, fwhmL: 0.1 } },
    ]),
  ).toBeLessThan(1e-5);
});

test('matches finite differences when parameters are fixed or linked', () => {
  expect(
    worstJacobianError(gaussianPeaks, {
      parameters: { x: { optimize: false } },
    }),
  ).toBeLessThan(1e-5);

  expect(
    worstJacobianError(gaussianPeaks, {
      linkedParameters: [
        { parameter: 'fwhm', peaks: [{ id: 'a' }, { id: 'b' }] },
      ],
    }),
  ).toBeLessThan(1e-5);

  expect(
    worstJacobianError(ratioLinkedPeaks, {
      linkedParameters: [
        {
          parameter: 'y',
          peaks: [
            { id: 'a', factor: 1 },
            { id: 'b', factor: 2 },
          ],
        },
      ],
    }),
  ).toBeLessThan(1e-5);

  expect(
    worstJacobianError(gaussianPeaks, {
      parameters: { x: { optimize: false } },
      linkedParameters: [
        { parameter: 'fwhm', peaks: [{ id: 'a' }, { id: 'b' }] },
      ],
    }),
  ).toBeLessThan(1e-5);
});
