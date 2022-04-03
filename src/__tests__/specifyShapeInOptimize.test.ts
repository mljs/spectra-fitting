import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe('Optimize sum of Gaussians', () => {
  it('positive maxima peaks, default value', () => {
    const peaks = [
      { x: -0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
      { x: 0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: { kind: 'gaussian' },
      },
    });

    let result = optimize(data, [
      { x: -0.52, y: 0.9, fwhm: 0.08 },
      { x: 0.52, y: 0.9, fwhm: 0.08 },
    ]);
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(
        JSON.parse(JSON.stringify(peaks[i])),
        3,
      );
    }
  });

  it('positive maxima peaks, wide peaks, default value', () => {
    const peaks = [
      { x: -0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.4 } },
      { x: 0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.4 } },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: { kind: 'gaussian' },
      },
    });

    let result = optimize(data, [
      { x: -0.52, y: 0.9, fwhm: 0.2 },
      { x: 0.52, y: 0.9, fwhm: 0.6 },
    ]);
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(
        JSON.parse(JSON.stringify(peaks[i])),
        3,
      );
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
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: {
          kind: 'lorentzian',
        },
      },
    });

    let result = optimize(
      data,
      [
        { x: -0.52, y: 0.9, fwhm: 0.08 },
        { x: 0.52, y: 0.9, fwhm: 0.08 },
      ],
      {
        shape: { kind: 'lorentzian' },
      },
    );
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(
        JSON.parse(JSON.stringify(peaks[i])),
        3,
      );
    }
  });
});

describe('Optimize sum of PseudoVoigts', () => {
  it('positive maxima peaks', () => {
    const peaks = [
      { x: -0.5, y: 1, shape: { kind: 'pseudoVoigt' as const, fwhm: 0.4 } },
      { x: 0.5, y: 1, shape: { kind: 'pseudoVoigt' as const, fwhm: 0.4 } },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: {
          kind: 'pseudoVoigt',
        },
      },
    });

    let result = optimize(
      data,
      [
        { x: -0.52, y: 0.9, fwhm: 0.08 },
        { x: 0.52, y: 0.9, fwhm: 0.08 },
      ],
      {
        shape: { kind: 'pseudoVoigt' },
      },
    );
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(
        JSON.parse(JSON.stringify(peaks[i])),
        3,
      );
    }
  });
});
