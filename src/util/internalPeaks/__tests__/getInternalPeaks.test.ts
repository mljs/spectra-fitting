import { describe, expect, it } from 'vitest';

import type { Peak } from '../../../index.ts';
import { getInternalPeaks } from '../getInternalPeaks.js';

describe('getInternalPeaks', () => {
  it('default values', () => {
    const peaks: Peak[] = [{ x: 0, y: 1 }];
    const internalPeaks = getInternalPeaks(peaks, 1);
    expect(internalPeaks).toMatchCloseTo([
      {
        shape: { kind: 'gaussian' },
        shapeFct: { fwhm: 500 },
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [-1000, 0, 125],
          max: [1000, 1.1, 2000],
          init: [0, 1, 500],
          gradientDifference: [1, 0.001, 1],
        },

        fromIndex: 0,
        toIndex: 2,
      },
    ]);
  });

  it('uses callbacks and generalized lorentzian defaults', () => {
    const peaks: Peak[] = [
      { x: 1, y: -2 },
      {
        x: 2,
        y: 3,
        shape: {
          kind: 'generalizedLorentzian',
          fwhm: 0.3,
        },
      },
    ];

    const internalPeaks = getInternalPeaks(peaks, 4, {
      parameters: {
        x: {
          min: (peak) => peak.x - 3,
        },
      },
    });

    expect(internalPeaks[0]).toMatchCloseTo({
      shape: { kind: 'gaussian' },
      parameters: ['x', 'y', 'fwhm'],
      propertiesValues: {
        min: [-2, -1.1, 125],
        max: [1001, 0, 2000],
        init: [1, -0.5, 500],
        gradientDifference: [1, 0.001, 1],
      },
      fromIndex: 0,
      toIndex: 2,
    });

    expect(internalPeaks[1]).toMatchCloseTo({
      shape: {
        kind: 'generalizedLorentzian',
        fwhm: 0.3,
      },
      parameters: ['x', 'y', 'fwhm', 'gamma'],
      propertiesValues: {
        min: [-1, 0, 0.075, -1],
        max: [2.6, 1.1, 1.2, 2],
        init: [2, 0.75, 0.3, 0.5],
        gradientDifference: [0.0006, 0.001, 0.0006, 0.01],
      },
      fromIndex: 3,
      toIndex: 6,
    });
  });

  it('accepts zero-valued overrides and explicit gamma values', () => {
    const peaks: Peak[] = [
      {
        x: 1,
        y: 1,
        parameters: {
          x: {
            min: 0,
          },
          y: {
            init: 0,
          },
        },
        shape: {
          kind: 'generalizedLorentzian',
          fwhm: 0.3,
          gamma: 0.2,
        },
      },
    ];

    const internalPeaks = getInternalPeaks(peaks, 2);

    expect(internalPeaks[0]).toMatchCloseTo({
      shape: {
        kind: 'generalizedLorentzian',
        fwhm: 0.3,
        gamma: 0.2,
      },
      propertiesValues: {
        min: [0, 0, 0.075, -1],
        max: [1.6, 1.1, 1.2, 2],
        init: [1, 0, 0.3, 0.2],
        gradientDifference: [0.0006, 0.001, 0.0006, 0.01],
      },
      fromIndex: 0,
      toIndex: 3,
    });
  });

  it('falls back to the default gamma when gamma is zero', () => {
    const peaks: Peak[] = [
      {
        x: 0,
        y: 1,
        shape: {
          kind: 'generalizedLorentzian',
          fwhm: 0.3,
          gamma: 0,
        },
      },
    ];

    const internalPeaks = getInternalPeaks(peaks, 1);

    expect(internalPeaks[0].propertiesValues.init[3]).toBeCloseTo(0.5, 6);
  });

  it('scales an explicit y override by the max value', () => {
    const peaks: Peak[] = [
      {
        x: 0,
        y: 3,
        parameters: {
          y: {
            init: 2,
            gradientDifference: 0.01,
          },
        },
      },
    ];

    const internalPeaks = getInternalPeaks(peaks, 2);

    expect(internalPeaks[0].propertiesValues.init[1]).toBeCloseTo(1, 6);
    expect(internalPeaks[0].propertiesValues.gradientDifference[1]).toBeCloseTo(
      0.01,
      6,
    );
  });

  it('2 peaks with defaults values', () => {
    const peaks: Peak[] = [
      { x: 0, y: 1 },
      { x: 1, y: 2, shape: { kind: 'pseudoVoigt' } },
    ];
    const internalPeaks = getInternalPeaks(peaks, 1);
    expect(internalPeaks[1]).toMatchCloseTo({
      shape: { kind: 'pseudoVoigt' },
      shapeFct: { mu: 0.5, fwhm: 500 },
      parameters: ['x', 'y', 'fwhm', 'mu'],
      propertiesValues: {
        min: [-999, 0, 125, 0],
        max: [1001, 1.1, 2000, 1],
        init: [1, 2, 500, 0.5],
        gradientDifference: [1, 0.001, 1, 0.01],
      },
      fromIndex: 3,
      toIndex: 6,
    });
  });

  it('specify a shape in the options', () => {
    const peaks: Peak[] = [{ x: 0, y: 1 }];
    const internalPeaks = getInternalPeaks(peaks, 1, {
      shape: { kind: 'lorentzian' },
    });
    expect(internalPeaks).toMatchCloseTo([
      {
        shape: { kind: 'lorentzian' },
        shapeFct: { fwhm: 500 },
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [-1000, 0, 125],
          max: [1000, 1.1, 2000],
          init: [0, 1, 500],
          gradientDifference: [1, 0.001, 1],
        },

        fromIndex: 0,
        toIndex: 2,
      },
    ]);
  });

  it('specify a parameters in the options', () => {
    const peaks: Peak[] = [{ x: 0, y: 1 }];
    const internalPeaks = getInternalPeaks(peaks, 1, {
      parameters: {
        x: { min: -1, max: 1 },
        y: { min: -2 },
      },
    });
    expect(internalPeaks).toMatchCloseTo([
      {
        shape: { kind: 'gaussian' },
        shapeFct: { fwhm: 500 },
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [-1, -2, 125],
          max: [1, 1.1, 2000],
          init: [0, 1, 500],
          gradientDifference: [1, 0.001, 1],
        },

        fromIndex: 0,
        toIndex: 2,
      },
    ]);
  });

  it('specify the parameters at the level of the peak', () => {
    const peaks: Peak[] = [
      {
        x: 0,
        y: 1,
        parameters: {
          x: {
            min: -2,
            max: 2,
          },
          y: {
            min: -5,
            max: 5,
          },
        },
      },
    ];
    const internalPeaks = getInternalPeaks(peaks, 1);
    expect(internalPeaks).toMatchCloseTo([
      {
        shape: { kind: 'gaussian' },
        shapeFct: { fwhm: 500 },
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [-2, -5, 125],
          max: [2, 5, 2000],
          init: [0, 1, 500],
          gradientDifference: [1, 0.001, 1],
        },

        fromIndex: 0,
        toIndex: 2,
      },
    ]);
  });
});
