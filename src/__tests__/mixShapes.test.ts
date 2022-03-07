import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { Shape1D } from 'ml-peak-shape-generator';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

let nbPoints = 31;
let xFactor = 0.1;
let x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('Sum of a mix of distributions', () => {
  it('group of two GL', () => {
    let peaks = [
      {
        x: 0,
        y: 0.001,
        fwhm: 0.31,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.5 },
        } as Shape1D,
      },
      {
        x: 0,
        y: 0.001,
        fwhm: 0.31,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.5 },
        } as Shape1D,
      },
      { x: -0.5, y: 0.001, fwhm: 0.31, shape: { kind: 'gaussian' } },
      { x: 0.5, y: 0.001, fwhm: 0.31, shape: { kind: 'gaussian' } },
      { x: -0.5, y: 0.001, fwhm: 0.31, shape: { kind: 'lorentzian' } },
      { x: 0.5, y: 0.001, fwhm: 0.31, shape: { kind: 'lorentzian' } },
    ];

    const peaksGenerator = [
      { x: 0, y: 0.001, fwhm: 0.31, mu: 0.5 },
      { x: 0, y: 0.001, fwhm: 0.31, mu: 0.5 },
      { x: -0.5, y: 0.001, fwhm: 0.31 },
      { x: 0.5, y: 0.001, fwhm: 0.31 },
      { x: -0.5, y: 0.001, fwhm: 0.31 },
      { x: 0.5, y: 0.001, fwhm: 0.31 },
    ];

    const data: DataXY = generateSpectrum(peaksGenerator, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
      },
    });

    let result = optimize(
      data,
      [
        {
          x: 0.001,
          y: 0.0009,
          fwhm: (xFactor * nbPoints) / 8,
          shape: {
            kind: 'pseudoVoigt',
            options: { mu: 0.52 },
          } as Shape1D,
        },
        {
          x: 0.001,
          y: 0.0009,
          fwhm: (xFactor * nbPoints) / 8,
          shape: {
            kind: 'pseudoVoigt',
            options: { mu: 0.52 },
          } as Shape1D,
        },
        {
          x: -0.52,
          y: 0.0009,
          fwhm: (xFactor * nbPoints) / 8,
          shape: { kind: 'gaussian' } as Shape1D,
        },
        {
          x: 0.52,
          y: 0.0009,
          fwhm: (xFactor * nbPoints) / 8,
          shape: { kind: 'gaussian' } as Shape1D,
        },
        {
          x: -0.52,
          y: 0.0009,
          fwhm: (xFactor * nbPoints) / 8,
          shape: { kind: 'lorentzian' } as Shape1D,
        },
        {
          x: 0.52,
          y: 0.0009,
          fwhm: (xFactor * nbPoints) / 8,
          shape: { kind: 'lorentzian' } as Shape1D,
        },
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 1000, errorTolerance: 1e-8 },
        },
      },
    );

    for (let i = 0; i < 6; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 0);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 0);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 0);
    }
  });
});
