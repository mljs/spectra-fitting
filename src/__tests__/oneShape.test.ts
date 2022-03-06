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

describe('One Shape tested', () => {
  it('Gaussian', () => {

    let pTrue = [
      -0.5,
      0.001,
      0.31,
    ];

    const peaksGenerator = [
      { x: -0.5, y: 0.001, fwhm: 0.31 },
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
          x: -0.52,
          y: 0.0009,
          fwhm: (xFactor * nbPoints) / 8,
          shape: { kind: 'gaussian' } as Shape1D,
        }
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 1000, errorTolerance: 1e-8 },
        },
      },
    );
    let index = 0;
    let pFit = result.peaks[0];
    expect(pFit.x).toBeCloseTo(pTrue[index], 0);
    expect(pFit.y).toBeCloseTo(pTrue[index + 1], 0);
    expect(pFit.fwhm).toBeCloseTo(pTrue[index + 2], 0);
  });

  it('Lorentzian', () => {

    let pTrue = [
      -0.5,
      0.001,
      0.31,
    ];

    const peaksGenerator = [
      { x: -0.5, y: 0.001, fwhm: 0.31 },
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
          x: -0.52,
          y: 0.0009,
          fwhm: (xFactor * nbPoints) / 8,
          shape: { kind: 'lorentzian' } as Shape1D,
        }
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 1000, errorTolerance: 1e-8 },
        },
      },
    );
    let index = 0;
    let pFit = result.peaks[0];
    expect(pFit.x).toBeCloseTo(pTrue[index], 0);
    expect(pFit.y).toBeCloseTo(pTrue[index + 1], 0);
    expect(pFit.fwhm).toBeCloseTo(pTrue[index + 2], 0);
  });

  it('Pseudo Voigt', () => {

    let pTrue = [
      0,
      0.001,
      0.31,
      (xFactor * nbPoints) / 10,
    ];

    const peaksGenerator = [
      { x: 0, y: 0.001, fwhm: 0.31, mu: (xFactor * nbPoints) / 10 }
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
          shape: {kind: 'pseudoVoigt', options: {mu: (xFactor * nbPoints) / 10 }} as Shape1D,
        }
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 1000, errorTolerance: 1e-8 },
        },
      },
    );
    let index = 0;
    let pFit = result.peaks[0];
    expect(pFit.x).toBeCloseTo(pTrue[index], 0);
    expect(pFit.y).toBeCloseTo(pTrue[index + 1], 0);
    expect(pFit.fwhm).toBeCloseTo(pTrue[index + 2], 0);
  });
});

