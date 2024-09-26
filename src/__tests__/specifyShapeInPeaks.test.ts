import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize, Peak } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

const nbPoints = 31;
const xFactor = 0.1;
const x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}

describe('Optimize sum of Lorentzians', () => {
  const peaks = [
    { x: -0.5, y: 1, shape: { kind: 'lorentzian' as const, fwhm: 0.05 } },
    { x: 0.5, y: 1, shape: { kind: 'lorentzian' as const, fwhm: 0.05 } },
  ];

  const data: DataXY = generateSpectrum(peaks, {
    generator: {
      from: -5,
      to: 5,
      nbPoints: 1001,
      shape: {
        kind: 'lorentzian',
      },
    },
  });

  it('positive maxima peaks', () => {
    const initialPeaks: Peak[] = [
      {
        x: -0.52,
        y: 0.9,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08 },
      },
      {
        x: 0.52,
        y: 0.9,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08 },
      },
    ];
    const result = optimize(data, initialPeaks);
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(peaks[i], 3);
    }
  });

  it('shifted baseline up by two', () => {
    const shiftedPeaks = structuredClone(peaks);
    for (const shiftedPeak of shiftedPeaks) {
      shiftedPeak.y = shiftedPeak.y + 2;
    }
    const yShiftedData = {
      x: data.x,
      y: data.y.map((el: number) => el + 2),
    };
    const result = optimize(yShiftedData, [
      {
        x: -0.52,
        y: 2.9,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08 },
      },
      {
        x: 0.52,
        y: 2.9,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08 },
      },
    ]);
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(shiftedPeaks[i], 3);
    }
  });

  it('negative maxima peaks', () => {
    const shiftedPeaks = structuredClone(peaks);
    for (const shiftedPeak of shiftedPeaks) {
      shiftedPeak.y = shiftedPeak.y - 2;
    }
    const yShiftedPeaks = [
      {
        x: -0.52,
        y: -1,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08 },
      },
      {
        x: 0.52,
        y: -1,
        shape: { kind: 'lorentzian' as const, fwhm: 0.08 },
      },
    ];

    const yShiftedData = {
      x: data.x.slice(),
      y: data.y.map((el: number) => el - 2),
    };

    const result = optimize(yShiftedData, yShiftedPeaks);
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(shiftedPeaks[i], 3);
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
      from: -5,
      to: 5,
      nbPoints: 1001,
      shape: {
        kind: 'gaussian',
      },
    },
  });

  it('positive maxima peaks', () => {
    const peakList: Peak[] = [
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
    const result = optimize(data, peakList);
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(peaks[i], 3);
    }
  });

  it('negative maxima peaks', () => {
    const shiftedPeaks = structuredClone(peaks);
    for (const shiftedPeak of shiftedPeaks) {
      shiftedPeak.y = shiftedPeak.y - 2;
    }

    const yShiftedData = {
      x: data.x.slice(),
      y: data.y.map((el: number) => el - 2),
    };

    const result = optimize(
      yShiftedData,
      [
        {
          x: -0.52,
          y: -1,
          shape: { kind: 'gaussian' as const, fwhm: 0.08 },
        },
        {
          x: 0.52,
          y: -1,
          shape: { kind: 'gaussian' as const, fwhm: 0.08 },
        },
      ],
      {
        optimization: {
          kind: 'lm',
          options: { maxIterations: 500, damping: 0.5, errorTolerance: 1e-8 },
        },
      },
    );

    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(shiftedPeaks[i], 3);
    }
  });
});

describe('Sum of Pseudo Voigts', () => {
  const peaks = [
    {
      x: -0.5,
      y: 0.001,
      shape: {
        kind: 'pseudoVoigt' as const,
        fwhm: 0.31,
        mu: 0.5,
      },
    },
    {
      x: 0.5,
      y: 0.001,
      shape: {
        kind: 'pseudoVoigt' as const,
        fwhm: 0.31,
        mu: 0.5,
      },
    },
  ];

  // in order to correctly determine the mu we need to predict a huge width
  const data: DataXY = generateSpectrum(peaks, {
    generator: {
      from: -50,
      to: 50,
      nbPoints: 1001,
      shape: {
        kind: 'pseudoVoigt',
      },
    },
  });

  it('positive maxima peaks', () => {
    const peakList: Peak[] = [
      {
        x: -0.3,
        y: 0.0009,
        shape: {
          kind: 'pseudoVoigt' as const,
          fwhm: 0.29,
          mu: 0.52,
        },
      },
      {
        x: 0.3,
        y: 0.0009,
        shape: {
          kind: 'pseudoVoigt' as const,
          mu: 0.52,
          fwhm: 0.29,
        },
      },
    ];
    const result = optimize(data, peakList, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 100, damping: 0.5, errorTolerance: 1e-8 },
      },
    });
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i]).toMatchCloseTo(peaks[i], 3);
    }
  });
});
