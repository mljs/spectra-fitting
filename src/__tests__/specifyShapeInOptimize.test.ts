import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { Shape1D } from 'ml-peak-shape-generator';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe('Optimize sum of Gaussians', () => {
  it('positive maxima peaks, default value', () => {
    const peaks = [
      { x: -0.5, y: 1, fwhm: 0.05 },
      { x: 0.5, y: 1, fwhm: 0.05 },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: { kind: 'gaussian' },
      },
    });

    let initialPeaks = [
      { x: -0.52, y: 0.9, fwhm: 0.08 },
      { x: 0.52, y: 0.9, fwhm: 0.08 },
    ];

    let result = optimize(data, initialPeaks);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 5);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 4);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 5);
    }
  });

  it('positive maxima peaks, wide peaks, default value', () => {
    const peaks = [
      { x: -0.5, y: 1, fwhm: 0.4 },
      { x: 0.5, y: 1, fwhm: 0.4 },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -1,
        to: 1,
        nbPoints: 101,
        shape: { kind: 'gaussian' },
      },
    });

    let initialPeaks = [
      { x: -0.52, y: 0.9, fwhm: 0.2 },
      { x: 0.52, y: 0.9, fwhm: 0.6 },
    ];
    let result = optimize(data, initialPeaks);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 4);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 2);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });
});

describe('Optimize sum of Lorentzians', () => {
  it('positive maxima peaks', () => {
    const peaks = [
      { x: -0.5, y: 1, fwhm: 0.05 },
      { x: 0.5, y: 1, fwhm: 0.05 },
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

    let initialPeaks = [
      { x: -0.52, y: 0.9, fwhm: 0.08 },
      { x: 0.52, y: 0.9, fwhm: 0.08 },
    ];

    let result = optimize(data, initialPeaks, {
      shape: { kind: 'lorentzian' } as Shape1D,
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 3);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 2);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 3);
    }
  });
});

describe('Optimize sum of PseudoVoigts', () => {
  it('positive maxima peaks', () => {
    const peaks = [
      { x: -0.5, y: 1, fwhm: 0.05 },
      { x: 0.5, y: 1, fwhm: 0.05 },
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

    let initialPeaks = [
      { x: -0.52, y: 0.9, fwhm: 0.08 },
      { x: 0.52, y: 0.9, fwhm: 0.08 },
    ];

    let result = optimize(data, initialPeaks, {
      shape: { kind: 'pseudoVoigt' } as Shape1D,
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 3);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 2);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 3);
    }
  });
});
