import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe('Optimize sum of Gaussians', () => {
  it('positive maxima peaks, default value', () => {
    const peaks = [
      {
        id: 'first',
        x: -0.5,
        y: 1,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
      {
        id: 'second',
        x: 0.5,
        y: 1,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -10,
        to: 10,
        nbPoints: 1001,
        shape: { kind: 'gaussian' },
      },
    });

    const result = optimize(data, [
      {
        id: 'first',
        x: -0.55,
        y: 0.9,
        shape: { kind: 'gaussian' as const, fwhm: 0.08 },
      },
      {
        id: 'second',
        x: 0.55,
        y: 0.9,
        shape: { kind: 'gaussian' as const, fwhm: 0.08 },
      },
    ]);

    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(peaks[i], 3);
    }
  });

  it('positive maxima peaks, wide peaks, default value', () => {
    const peaks = [
      { x: -0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.4 } },
      { x: 0.5, y: 1, shape: { kind: 'lorentzian' as const, fwhm: 0.4 } },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -10,
        to: 10,
        nbPoints: 1001,
      },
    });

    const result = optimize(data, [
      { x: -0.52, y: 0.9, shape: { kind: 'gaussian', fwhm: 0.2 } },
      { x: 0.52, y: 0.9, shape: { kind: 'lorentzian', fwhm: 0.6 } },
    ]);
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(peaks[i], 3);
    }
  });
});

describe('Optimize sum of Lorentzians', () => {
  it('positive maxima peaks', () => {
    const peaks = [
      { x: -0.5, y: 1, shape: { kind: 'lorentzian' as const, fwhm: 0.05 } },
      { x: 0.5, y: 1, shape: { kind: 'lorentzian' as const, fwhm: 0.05 } },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -5,
        to: 5,
        nbPoints: 1001,
      },
    });

    const result = optimize(
      data,
      [
        { x: -0.52, y: 0.9 },
        { x: 0.52, y: 0.9 },
      ],
      {
        shape: { kind: 'lorentzian', fwhm: 0.08 },
      },
    );
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(peaks[i], 3);
    }
  });
});

describe('Optimize sum of PseudoVoigts', () => {
  it('positive maxima peaks', () => {
    const peaks = [
      { x: -0.5, y: 1, shape: { kind: 'pseudoVoigt' as const, fwhm: 0.05 } },
      { x: 0.5, y: 1, shape: { kind: 'pseudoVoigt' as const, fwhm: 0.05 } },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -5,
        to: 5,
        nbPoints: 1001,
        shape: {
          kind: 'pseudoVoigt',
        },
      },
    });

    const result = optimize(
      data,
      [
        { x: -0.52, y: 0.9 },
        { x: 0.52, y: 0.9 },
      ],
      {
        shape: { kind: 'pseudoVoigt', fwhm: 0.08 },
      },
    );
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(structuredClone(peaks[i]), 3);
    }
  });
});
