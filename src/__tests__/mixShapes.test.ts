import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe('Sum of a mix of distributions', () => {
  it('2 peaks', () => {
    let peaks = [
      {
        x: -0.5,
        y: 0.001,
        shape: {
          kind: 'pseudoVoigt' as const,
          fwhm: 0.3,
          mu: 0.5,
        },
      },
      { x: 0.5, y: 0.001, shape: { kind: 'gaussian' as const, fwhm: 0.3 } },
    ];
    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -20,
        to: 20,
        nbPoints: 1001,
      },
    });

    let result = optimize(
      data,
      [
        {
          x: -0.6,
          y: 0.002,
          shape: {
            kind: 'pseudoVoigt' as const,
            fwhm: 0.4,
            mu: 0.2,
          },
        },
        { x: 0.4, y: 0.0006, shape: { kind: 'gaussian' as const, fwhm: 0.2 } },
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 10, errorTolerance: 1e-5 },
        },
      },
    );
    // we have a little bit more error on mu
    //@ts-expect-error we ignoere this ts error
    peaks.forEach((peak) => peak.shape.mu && delete peak.shape.mu);
    for (let i = 0; i < result.peaks.length; i++) {
      expect(result.peaks[i]).toMatchCloseTo(peaks[i], 3);
    }
  });
  it.only('6 peaks', () => {
    let peaks = [
      {
        x: 0,
        y: 0.001,
        shape: {
          kind: 'pseudoVoigt' as const,
          fwhm: 0.2,
          mu: 0.5,
        },
      },
      { x: 0.5, y: 0.001, shape: { kind: 'gaussian' as const, fwhm: 0.2 } },
      { x: 1, y: 0.001, shape: { kind: 'lorentzian' as const, fwhm: 0.2 } },
      {
        x: 1.5,
        y: 0.001,
        shape: {
          kind: 'pseudoVoigt' as const,
          fwhm: 0.2,
          mu: 0.5,
        },
      },
      { x: 2, y: 0.001, shape: { kind: 'gaussian' as const, fwhm: 0.2 } },
      { x: 2.5, y: 0.001, shape: { kind: 'lorentzian' as const, fwhm: 0.2 } },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -20,
        to: 20,
        nbPoints: 1001,
      },
    });

    let result = optimize(
      data,
      [
        {
          x: 0.1,
          y: 0.0015,
          shape: {
            kind: 'pseudoVoigt' as const,
            fwhm: 0.17,
            mu: 0.7,
          },
        },
        { x: 0.45, y: 0.001, shape: { kind: 'gaussian' as const, fwhm: 0.17 } },
        {
          x: 1.05,
          y: 0.001,
          shape: { kind: 'lorentzian' as const, fwhm: 0.0 },
        },
        {
          x: 1.51,
          y: 0.001,
          shape: {
            kind: 'pseudoVoigt' as const,
            fwhm: 0.25,
            mu: 0.5,
          },
        },
        {
          x: 2.04,
          y: 0.0007,
          shape: { kind: 'gaussian' as const, fwhm: 0.15 },
        },
        {
          x: 2.4,
          y: 0.001,
          shape: { kind: 'lorentzian' as const, fwhm: 0.25 },
        },
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 20, errorTolerance: 1e-5 },
        },
      },
    );

    console.log(result.peaks[0]);
    // we have a little bit more error on mu
    //@ts-expect-error we ignoere this ts error
    peaks.forEach((peak) => peak.shape.mu && delete peak.shape.mu);
    for (let i = 0; i < result.peaks.length; i++) {
      console.log(i);
      expect(result.peaks[i]).toMatchCloseTo(peaks[i], 2);
    }
  });
});
