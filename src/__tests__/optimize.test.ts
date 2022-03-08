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

  it('positive maxima peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: 0.9,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
      {
        x: 0.52,
        y: 0.9,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
    ];
    let result = optimize(data, peakList);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
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

  it('baseline higher than zero', () => {
    let peakList = [
      {
        x: -0.52,
        y: 2.9,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
      {
        x: 0.52,
        y: 2.9,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
    ];
    let yShiftedData = {
      x: data.x.slice(),
      y: data.y.map((el) => el + 2),
    };
    let result = optimize(yShiftedData, peakList);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y + 2, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  it('negative maxima peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: -1,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
      {
        x: 0.52,
        y: -1,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => value - 2);
    let result = optimize(modifiedData, peakList);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  it('Negative peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: -1,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
      {
        x: 0.52,
        y: -1,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => -value);
    let result = optimize(modifiedData, peakList);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  it('minima peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: 0,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
      {
        x: 0.52,
        y: 0,
        fwhm: 0.08,
        shape: { kind: 'lorentzian' } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => 1 - value);
    let result = optimize(modifiedData, peakList);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });
});

describe('Optimize sum of Gaussians', () => {
  const peaks = [
    { x: -0.5, y: 1, fwhm: 0.05, shape: { kind: 'gaussian' } },
    { x: 0.5, y: 1, fwhm: 0.05, shape: { kind: 'gaussian' } },
  ];

  const peaksGenerator = [
    { x: -0.5, y: 1, fwhm: 0.05 },
    { x: 0.5, y: 1, fwhm: 0.05 },
  ];

  const data: DataXY = generateSpectrum(peaksGenerator, {
    generator: {
      from: -2,
      to: 2,
      nbPoints: 101,
    },
  });

  it('positive maxima peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: 0.9,
        fwhm: 0.08,
        shape: { kind: 'gaussian' } as Shape1D,
      },
      {
        x: 0.52,
        y: 0.9,
        fwhm: 0.08,
        shape: { kind: 'gaussian' } as Shape1D,
      },
    ];
    let result = optimize(data, peakList);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });
  it('negative maxima peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: -1,
        fwhm: 0.08,
        shape: { kind: 'gaussian' } as Shape1D,
      },
      {
        x: 0.52,
        y: -1,
        fwhm: 0.08,
        shape: { kind: 'gaussian' } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => value - 2);
    let result = optimize(modifiedData, peakList, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 500, damping: 0.5, errorTolerance: 1e-8 },
      },
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 0);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  it('Negative peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: -1,
        fwhm: 0.08,
        shape: { kind: 'gaussian' } as Shape1D,
      },
      {
        x: 0.52,
        y: -1,
        fwhm: 0.08,
        shape: { kind: 'gaussian' } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => -value);
    let result = optimize(modifiedData, peakList, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 500, damping: 0.5, errorTolerance: 1e-8 },
      },
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 0);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  it('minima peaks', () => {
    let peakList = [
      {
        x: -0.52,
        y: 0,
        fwhm: 0.08,
        shape: { kind: 'gaussian' } as Shape1D,
      },
      {
        x: 0.52,
        y: 0,
        fwhm: 0.08,
        shape: { kind: 'gaussian' } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => 1 - value);
    let result = optimize(modifiedData, peakList);
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });
});

describe('Sum of Pseudo Voigts', () => {
  const peaks = [
    {
      x: 0,
      y: 0.001,
      fwhm: 0.31,
      shape: {
        kind: 'pseudoVoigt',
        options: { mu: 0.5 },
      } as Shape1D,
    },
    {
      x: 0,
      y: 0.001,
      fwhm: 0.31,
      shape: {
        kind: 'pseudoVoigt',
        options: { mu: 0.5 },
      } as Shape1D,
    },
  ];
  const peaksGenerator = [
    { x: 0, y: 0.001, fwhm: 0.31, mu: 0.5 },
    { x: 0, y: 0.001, fwhm: 0.31, mu: 0.5 },
  ];
  const data: DataXY = generateSpectrum(peaksGenerator, {
    generator: {
      from: -1,
      to: 1,
      nbPoints: 101,
    },
  });

  it('positive maxima peaks', () => {
    let peakList = [
      {
        x: 0.001,
        y: 0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.52 },
        } as Shape1D,
      },
      {
        x: 0.001,
        y: 0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.52 },
        } as Shape1D,
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
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  it('negative maxima peaks', () => {
    let peakList = [
      {
        x: 0.001,
        y: -0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.52 },
        } as Shape1D,
      },
      {
        x: 0.001,
        y: -0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.52 },
        } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => value - 2);
    let result = optimize(modifiedData, peakList, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 300, damping: 0.5, errorTolerance: 1e-8 },
      },
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  it('Negative peaks', () => {
    let peakList = [
      {
        x: 0.001,
        y: -0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.52 },
        } as Shape1D,
      },
      {
        x: 0.001,
        y: -0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.52 },
        } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => -value);
    let result = optimize(modifiedData, peakList, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 300, damping: 0.5, errorTolerance: 1e-8 },
      },
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  it('minima peaks', () => {
    let peakList = [
      {
        x: 0.001,
        y: 0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.52 },
        } as Shape1D,
      },
      {
        x: 0.001,
        y: 0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        shape: {
          kind: 'pseudoVoigt',
          options: { mu: 0.52 },
        } as Shape1D,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value: number) => 1 - value);
    let result = optimize(modifiedData, peakList, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 1000, damping: 0.1, errorTolerance: 1e-16 },
      },
    });

    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });
});
