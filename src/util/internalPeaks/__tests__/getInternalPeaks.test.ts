import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';

import { Peak } from '../../..';
import { getInternalPeaks } from '../getInternalPeaks';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe('getInternalPeaks', () => {
  it('default values', () => {
    const peaks: Peak[] = [{ x: 0, y: 1 }];
    const internalPeaks = getInternalPeaks(peaks, { min: 0, max: 1, range: 1 });
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

  it('2 peaks with defaults values', () => {
    const peaks: Peak[] = [
      { x: 0, y: 1 },
      { x: 1, y: 2, shape: { kind: 'pseudoVoigt' } },
    ];
    const internalPeaks = getInternalPeaks(peaks, { min: 0, max: 1, range: 1 });
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
    const internalPeaks = getInternalPeaks(
      peaks,
      { min: 0, max: 1, range: 1 },
      {
        shape: { kind: 'lorentzian' },
      },
    );
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
    const internalPeaks = getInternalPeaks(
      peaks,
      { min: 0, max: 1, range: 1 },
      {
        parameters: {
          x: { min: -1, max: 1 },
          y: { min: -2 },
        },
      },
    );
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
    const internalPeaks = getInternalPeaks(peaks, { min: 0, max: 1, range: 1 });
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
