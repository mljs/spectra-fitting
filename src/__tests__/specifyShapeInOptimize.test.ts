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

describe('Optimize sum of Lorentzians', () => {
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
