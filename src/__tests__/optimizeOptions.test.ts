import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

let nbPoints = 31;
let xFactor = 0.1;
let x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('Optimize Options test', () => {
  it('Case when we use default optimization options', () => {
    let peaks = [
      {
        x: -0.5,
        y: 0.001,
        shape: { kind: 'gaussian' as const, fwhm: 0.31}
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: { kind: 'gaussian' },
      },
    });

    let result = optimize(
      data,
      [
        {
          x: -0.52,
          y: 0.0009,
          shape: { kind: 'gaussian', fwhm: (xFactor * nbPoints) / 8 },
        },
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 1000, errorTolerance: 1e-8 },
        },
      },
    );
    let pFit = result.peaks[0];
    expect(pFit.x).toBeCloseTo(peaks[0].x, 3);
    expect(pFit.y).toBeCloseTo(peaks[0].y, 3);
    expect(pFit.shape.fwhm).toBeCloseTo(peaks[0].shape.fwhm, 3);
  });

  it('Specify our own optimization options', () => {
    let peaks = [
      {
        x: -0.5,
        y: 0.001,
        shape: { kind: 'gaussian' as const, fwhm: 0.31 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: { kind: 'gaussian' },
      },
    });

    let result = optimize(
      data,
      [
        {
          x: -0.52,
          y: 0.0009,
          shape: { kind: 'gaussian', fwhm: (xFactor * nbPoints) / 8 },
        },
      ],
      {
        optimization: {
          kind: 'lm',
          parameters: [
            {
              name: 'y',
              init: 0.9,
              min: 0,
              max: 1.5,
              gradientDifference: 0.0005,
            },
            {
              name: 'fwhm',
              init: 0.4,
              min: 0.1,
              max: 1.6,
              gradientDifference: 0.0008,
            },
          ],
          options: { maxIterations: 10000, errorTolerance: 1e-8 },
        },
      },
    );
    let pFit = result.peaks[0];
    expect(pFit.x).toBeCloseTo(peaks[0].x, 3);
    expect(pFit.y).toBeCloseTo(peaks[0].y, 3);
    expect(pFit.shape.fwhm).toBeCloseTo(peaks[0].shape.fwhm, 3);
  });
});
