import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize, Peak1D } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

let nbPoints = 31;
let xFactor = 0.1;
let x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('One Shape tested', () => {
  it('Gaussian', () => {
    const peaks: Peak1D[] = [
      {
        x: -0.5,
        y: 0.001,
        shape: { kind: 'gaussian', fwhm: 0.31 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
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
          x: -0.52,
          y: 0.0009,
          shape: { kind: 'gaussian', fwhm: 0.35 },
        },
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 1000, errorTolerance: 1e-8 },
        },
      },
    );

    let fittedPeak = result.peaks[0];
    expect(fittedPeak).toBeCloseTo(peaks[0], 6);
  });

  it('Lorentzian', () => {
    let peaks = [
      {
        x: -0.5,
        y: 0.001,
        shape: { kind: 'lorentzian' as const, fwhm: 0.31 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: { kind: 'lorentzian' },
      },
    });

    let result = optimize(
      data,
      [
        {
          x: -0.52,
          y: 0.0009,
          shape: { kind: 'lorentzian', fwhm: 0.29 },
        },
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 1000, errorTolerance: 1e-8 },
        },
      },
    );

    let fittedPeak = result.peaks[0];
    expect(fittedPeak.x).toBeCloseTo(peaks[0].x, 3);
    expect(fittedPeak.y).toBeCloseTo(peaks[0].y, 3);
    expect(fittedPeak.shape.fwhm).toBeCloseTo(peaks[0].shape.fwhm, 1);
  });

  it('Pseudo Voigt', () => {
    let peaks = [
      {
        x: 0,
        y: 0.001,
        shape: { kind: 'pseudoVoigt' as const, fwhm: 0.31, mu: 0.5 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: { kind: 'pseudoVoigt' },
      },
    });

    let result = optimize(
      data,
      [
        {
          x: 0.001,
          y: 0.0009,
          shape: {
            kind: 'pseudoVoigt',
            fwhm: (xFactor * nbPoints) / 8,
            mu: 0.52,
          },
        },
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 1000, errorTolerance: 1e-8 },
        },
      },
    );

    let fittedPeak = result.peaks[0];
    expect(fittedPeak.x).toBeCloseTo(peaks[0].x, 3);
    expect(fittedPeak.y).toBeCloseTo(peaks[0].y, 3);
    expect(fittedPeak.shape.fwhm).toBeCloseTo(peaks[0].shape.fwhm, 3);
  });
});
