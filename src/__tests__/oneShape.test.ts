import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

const nbPoints = 31;
const xFactor = 0.1;
const x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('One Shape tested', () => {
  it('Gaussian', () => {
    const peaks = [
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
      },
    });

    const result = optimize(data, [
      {
        x: -0.52,
        y: 0.0009,
        shape: { kind: 'gaussian', fwhm: 0.35 },
      },
    ]);
    expect(result.peaks[0]).toMatchCloseTo(peaks[0], 3);
  });

  it('Lorentzian', () => {
    const peaks = [
      {
        x: -0.5,
        y: 0.001,
        shape: { kind: 'lorentzian' as const, fwhm: 0.31 },
      },
    ];

    /*
     Lorentzian functions are rather flat and if we only predict the spectrum
     between -5 and 5 we don't cover enough of the function to obtain a nice
     fit
    */
    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -10,
        to: 10,
        nbPoints: 1001,
      },
    });

    const result = optimize(data, [
      {
        x: -0.52,
        y: 0.0009,
        shape: { kind: 'lorentzian', fwhm: 0.29 },
      },
    ]);

    expect(result.peaks[0]).toMatchCloseTo(peaks[0], 3);
  });

  it('Pseudo Voigt', () => {
    const peaks = [
      {
        x: 0,
        y: 0.001,
        shape: { kind: 'pseudoVoigt' as const, fwhm: 0.31, mu: 0.5 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -10,
        to: 10,
        nbPoints: 1001,
      },
    });

    const result = optimize(data, [
      {
        x: 0.001,
        y: 0.0009,
        shape: {
          kind: 'pseudoVoigt',
          fwhm: 0.28,
          mu: 1,
        },
      },
    ]);

    expect(result.peaks[0].shape.fwhm).toBeCloseTo(0.31, 4);
    expect(result.peaks[0].x).toBeCloseTo(0, 5);
    expect(result.peaks[0].y).toBeCloseTo(0.001, 5);

    expect(result.peaks[0]).toMatchCloseTo(peaks[0], 2);
  });
  it('generalized Lorentzian', () => {
    const peaks = [
      {
        x: 0,
        y: 0.001,
        shape: { kind: 'lorentzian' as const, fwhm: 0.31 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -10,
        to: 10,
        nbPoints: 256,
      },
    });

    const result = optimize(
      data,
      [
        {
          x: 0.001,
          y: 0.0009,
          shape: {
            kind: 'generalizedLorentzian',
            fwhm: 0.25,
            gamma: 0.5,
          },
        },
      ],
      {
        optimization: {
          kind: 'lm',
          options: {
            damping: 0.1,
            maxIterations: 10,
            errorTolerance: 1e-8,
          },
        },
      },
    );
    expect(result.peaks[0].shape.fwhm).toBeCloseTo(0.31, 4);
    expect(result.peaks[0].x).toBeCloseTo(0, 5);
    expect(result.peaks[0].y).toBeCloseTo(0.001, 5);
    expect(result.peaks[0].shape.fwhm).toBeCloseTo(0.31, 1);
    //@ts-expect-error should exists
    expect(result.peaks[0].shape.gamma).toBeCloseTo(0, 1);
  });
});
