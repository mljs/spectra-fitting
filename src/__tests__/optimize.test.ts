import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';
import { sumOfGaussians } from '../shapes/sumOfGaussians';
import { sumOfLorentzians } from '../shapes/sumOfLorentzians';
import { sumOfPseudoVoigts } from '../shapes/sumOfPseudoVoigts';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

let nbPoints = 31;
let xFactor = 0.1;
let x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('Optimize sum of Lorentzian', () => {
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
    peakOptions: {
      factor: 6,
    },
  });

  it('group of two GL', () => {
    let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];
    let yData = sumOfLorentzians(pTrue);
    let peakList = [
      { x: -0.5, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
      { x: 0.52, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
    ];
    let result = optimize({ x, y: x.map((i) => yData(i)) }, peakList, {
      shape: { kind: 'lorentzian' },
    });
    let nL = pTrue.length / 3;
    for (let i = 0; i < nL; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(pTrue[i], 2);
      expect(pFit.y).toBeCloseTo(pTrue[i + nL], 2);
      expect(pFit.fwhm).toBeCloseTo(pTrue[i + nL * 2], 1);
      expect(peakList).toStrictEqual([
        { x: -0.5, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
        { x: 0.52, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
      ]);
    }
  });

  // ADDED
  it('positive maxima peaks', () => {
    let peakList = [
      {
        x: -0.5,
        y: 1,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: 1,
        fwhm: 0.08,
      },
    ];
    let result = optimize(data, peakList, { shape: { kind: 'lorentzian' } });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });

  // Case when baseline not zero
  it('baseline higher than zero', () => {
    let peakList = [
      {
        x: -0.5,
        y: 3,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: 3,
        fwhm: 0.08,
      },
    ];
    let dataCopy = { ...data };
    dataCopy.y.map((el) => el + 2);
    const peaksCopy = [
      { x: -0.5, y: 3, fwhm: 0.05 },
      { x: 0.5, y: 3, fwhm: 0.05 },
    ];

    let result = optimize(dataCopy, peakList, {
      shape: { kind: 'lorentzian' },
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaksCopy[i].x, 1);
      expect(pFit.y + 2).toBeCloseTo(peaksCopy[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaksCopy[i].fwhm, 1);
    }
  });

  it('negative maxima peaks', () => {
    let peakList = [
      {
        x: -0.5,
        y: -1,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: -1,
        fwhm: 0.08,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => value - 2);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'lorentzian' },
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
        x: -0.5,
        y: -1,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: -1,
        fwhm: 0.08,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => -value);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'lorentzian' },
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
        x: -0.5,
        y: 0,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: 0,
        fwhm: 0.08,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => 1 - value);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'lorentzian' },
    });
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
    { x: -0.5, y: 1, fwhm: 0.05 },
    { x: 0.5, y: 1, fwhm: 0.05 },
  ];
  const data: DataXY = generateSpectrum(peaks, {
    generator: {
      from: -1,
      to: 1,
      nbPoints: 101,
    },
    peakOptions: {
      factor: 6,
    },
  });

  it('group of two GL', () => {
    let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];
    let yData = sumOfGaussians(pTrue);
    let result = optimize(
      { x, y: x.map((i) => yData(i)) },
      [
        { x: -0.5, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
        { x: 0.52, y: 0.0009, fwhm: (xFactor * nbPoints) / 8 },
      ],
      { shape: { kind: 'gaussian' } },
    );
    let nL = pTrue.length / 3;
    for (let i = 0; i < nL; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(pTrue[i], 2);
      expect(pFit.y).toBeCloseTo(pTrue[i + nL], 2);
      expect(pFit.fwhm).toBeCloseTo(pTrue[i + nL * 2], 2);
    }
  });

  // ADDED
  it('positive maxima peaks', () => {
    let peakList = [
      {
        x: -0.5,
        y: 1,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: 1,
        fwhm: 0.08,
      },
    ];
    let result = optimize(data, peakList, { shape: { kind: 'gaussian' } });
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
        x: -0.5,
        y: -1,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: -1,
        fwhm: 0.08,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => value - 2);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'gaussian' },
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
        x: -0.5,
        y: -1,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: -1,
        fwhm: 0.08,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => -value);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'gaussian' },
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
        x: -0.5,
        y: 0,
        fwhm: 0.08,
      },
      {
        x: 0.5,
        y: 0,
        fwhm: 0.08,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => 1 - value);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'gaussian' },
    });
    for (let i = 0; i < 2; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(peaks[i].x, 1);
      expect(pFit.y).toBeCloseTo(peaks[i].y, 1);
      expect(pFit.fwhm).toBeCloseTo(peaks[i].fwhm, 1);
    }
  });
});

describe('Optimize 4 parameters of a linear combination of gaussian and lorentzians', () => {
  const peaks = [
    { x: 0, y: 0.001, fwhm: 0.31, mu: (xFactor * nbPoints) / 10 },
    { x: 0, y: 0.001, fwhm: 0.31, mu: (xFactor * nbPoints) / 10 },
  ];
  const data: DataXY = generateSpectrum(peaks, {
    generator: {
      from: -1,
      to: 1,
      nbPoints: 101,
    },
    peakOptions: {
      factor: 6,
    },
  });

  it('group of two GL', () => {
    let pTrue = [
      0,
      0,
      0.001,
      0.001,
      0.31,
      0.31,
      (xFactor * nbPoints) / 10,
      (xFactor * nbPoints) / 10,
    ];
    let func = sumOfPseudoVoigts(pTrue);
    let result = optimize(
      { x, y: x.map(func) },
      [
        { x: 0.1, y: 0.0009, fwhm: (xFactor * nbPoints) / 6 },
        { x: 0.1, y: 0.0009, fwhm: (xFactor * nbPoints) / 6 },
      ],
      {
        shape: { kind: 'pseudoVoigt' },
        optimization: {
          kind: 'lm',
          options: { maxIterations: 300, damping: 0.5, errorTolerance: 1e-8 },
        },
      },
    );
    let nL = pTrue.length / 4;
    for (let i = 0; i < nL; i++) {
      let pFit = result.peaks[i];
      expect(pFit.x).toBeCloseTo(pTrue[i], 3);
      expect(pFit.y).toBeCloseTo(pTrue[i + nL], 3);
      expect(pFit.fwhm).toBeCloseTo(pTrue[i + nL * 2], 2);
    }
  });

  // ADDED
  it('positive maxima peaks', () => {
    let peakList = [
      {
        x: 0.001,
        y: 0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        mu: (xFactor * nbPoints) / 10,
      },
      {
        x: 0.001,
        y: 0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        mu: (xFactor * nbPoints) / 10,
      },
    ];
    let result = optimize(data, peakList, {
      shape: { kind: 'pseudoVoigt' },
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
        mu: (xFactor * nbPoints) / 10,
      },
      {
        x: 0.001,
        y: -0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        mu: (xFactor * nbPoints) / 10,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => value - 2);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'pseudoVoigt' },
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
        mu: (xFactor * nbPoints) / 10,
      },
      {
        x: 0.001,
        y: -0.0009,
        fwhm: (xFactor * nbPoints) / 6,
        mu: (xFactor * nbPoints) / 10,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => -value);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'pseudoVoigt' },
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
        y: 0.99,
        fwhm: (xFactor * nbPoints) / 6,
        mu: (xFactor * nbPoints) / 10,
      },
      {
        x: 0.001,
        y: 0.99,
        fwhm: (xFactor * nbPoints) / 6,
        mu: (xFactor * nbPoints) / 10,
      },
    ];
    let modifiedData = data;
    modifiedData.y.map((value) => 1 - value);
    let result = optimize(modifiedData, peakList, {
      shape: { kind: 'pseudoVoigt' },
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
});
