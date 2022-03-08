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
  const peaks = [
    { x: -0.5, y: 1, fwhm: 0.05, shape: { kind: 'lorentzian' } },
    { x: 0.5, y: 1, fwhm: 0.05, shape: { kind: 'lorentzian' } },
  ];
  const peaksGenerator = [
    { x: -0.5, y: 1, fwhm: 0.05 },
    { x: 0.5, y: 1, fwhm: 0.05 },
  ];

  const data: DataXY = generateSpectrum(peaksGenerator, {
    generator: {
      from: -1,
      to: 1,
      nbPoints: 101,
    },
  });

  it('positive maxima peaks, specifying shape at the top', () => {
    let peakList = [
      {
        x: -0.52,
        y: 0.9,
        fwhm: 0.08,
      },
      {
        x: 0.52,
        y: 0.9,
        fwhm: 0.08,
      },
    ];
    let result = optimize(data, peakList, {
      shape: { kind: 'lorentzian' } as Shape1D,
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });
});
