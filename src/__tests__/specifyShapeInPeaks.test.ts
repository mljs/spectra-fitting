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
    { x: -0.5, y: 1, shape: { kind: 'lorentzian' as const, fwhm: 0.05 }},
    { x: 0.5, y: 1, shape: { kind: 'lorentzian' as const, fwhm: 0.05 }},
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

  it('positive maxima peaks', () => {
    let initialPeaks = [
      {
        x: -0.52,
        y: 0.9,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' as const},
      },
      {
        x: 0.52,
        y: 0.9,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' as const},
      },
    ];
    let result = optimize(data, initialPeaks);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 3);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 2);
      expect(pFit.shape.fwhm).toBeCloseTo(peaks[i].shape.fwhm, 3);
    }
  });

  it('shifted baseline up by two', () => {
    let yShiftedPeaks = [
      {
        x: -0.52,
        y: 2.9,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08},
      },
      {
        x: 0.52,
        y: 2.9,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08},
      },
    ];
    let yShiftedData = {
      x: data.x.slice(),
      y: data.y.map((el: number) => el + 2),
    };
    let result = optimize(yShiftedData, yShiftedPeaks);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 3);
      expect(pFit.y).toBeCloseTo(peaks[i].y + 2, 2);
      expect(pFit.shape.fwhm).toBeCloseTo(peaks[i].shape.fwhm, 3);
    }
  });

  it('negative maxima peaks', () => {
    let yShiftedPeaks = [
      {
        x: -0.52,
        y: -1,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08 },
      },
      {
        x: 0.52,
        y: -1,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08},
      },
    ];

    let yShiftedData = {
      x: data.x.slice(),
      y: data.y.map((el: number) => el - 2),
    };

    let result = optimize(yShiftedData, yShiftedPeaks);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 3);
      expect(pFit.y).toBeCloseTo(peaks[i].y - 2, 2);
      expect(pFit.shape.fwhm).toBeCloseTo(peaks[i].shape.fwhm, 3);
    }
  });
});

describe('Optimize sum of Gaussians', () => {
  const peaks = [
    { x: -0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
    { x: 0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
  ];

  const data: DataXY = generateSpectrum(peaks, {
    generator: {
      from: -2,
      to: 2,
      nbPoints: 101,
      shape: {
        kind: 'gaussian',
      },
    },
  });

  it('positive maxima peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: 0.9,
        shape: { kind: 'gaussian' as const, fwhm: 0.08 },
      },
      {
        x: 0.52,
        y: 0.9,
        shape: { kind: 'gaussian' as const, fwhm: 0.08 },
      },
    ];
    let result = optimize(data, peakList);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 3);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.shape.fwhm).toBeCloseTo(peaks[i].shape.fwhm, 2);
    }
  });

  it('negative maxima peaks', () => {
    let yShiftedPeaks = [
      {
        x: -0.52,
        y: -1,
        shape: { kind: 'gaussian' as const, fwhm: 0.08 },
      },
      {
        x: 0.52,
        y: -1,
        shape: { kind: 'gaussian' as const, fwhm: 0.08,},
      },
    ];
    let yShiftedData = {
      x: data.x.slice(),
      y: data.y.map((el: number) => el - 2),
    };
    let result = optimize(yShiftedData, yShiftedPeaks, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 500, damping: 0.5, errorTolerance: 1e-8 },
      },
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 3);
      expect(pFit.y).toBeCloseTo(peaks[i].y - 2, 1);
      expect(pFit.shape.fwhm).toBeCloseTo(peaks[i].shape.fwhm, 2);
    }
  });
});

describe('Sum of Pseudo Voigts', () => {
  const peaks = [
    {
      x: 0,
      y: 0.001,
      shape: {
        kind: 'pseudoVoigt' as const,
        fwhm: 0.31,
        mu: 0.5
      },
    },
    {
      x: 0,
      y: 0.001,
      shape: {
        kind: 'pseudoVoigt' as const,
        fwhm: 0.31,
        mu: 0.5,
      },
    },
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

  it('positive maxima peaks', () => {
    let peakList = [
      {
        x: 0.001,
        y: 0.0009,
        shape: {
          kind: 'pseudoVoigt' as const,
          fwhm: 0.29,
          mu: 0.52
        },
      },
      {
        x: 0.001,
        y: 0.0009,
        fwhm: 0.29,
        shape: {
          kind: 'pseudoVoigt' as const,
          mu: 0.52,
          fwhm: 0.29
        },
      },
    ];
    let result = optimize(data, peakList, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 500, damping: 0.5, errorTolerance: 1e-8 },
      },
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 2);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 2);
      expect(pFit.shape.fwhm).toBeCloseTo(peaks[i].shape.fwhm, 0);
    }
  });
});
