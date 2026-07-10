import { describe, expect, it } from 'vitest';

import type { Peak } from '../../index.ts';
import { getGlobalParameterVectors } from '../getGlobalParameterVectors.ts';
import type { InternalPeak } from '../internalPeaks/getInternalPeaks.ts';

describe('getGlobalParameterVectors', () => {
  it('respects per-peak and global optimize flags', () => {
    const internalPeaks: InternalPeak[] = [
      {
        shape: { kind: 'pseudoVoigt' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm', 'mu'],
        propertiesValues: {
          min: [1, 2, 3, 4],
          max: [5, 6, 7, 8],
          init: [9, 10, 11, 12],
          gradientDifference: [13, 14, 15, 16],
        },
        fromIndex: 0,
        toIndex: 3,
      },
    ];

    const peaks: Peak[] = [
      {
        x: 10,
        y: 20,
        parameters: {
          x: { optimize: false },
          y: {
            optimize: (peak: Peak) => peak.x > 0,
          },
        },
      },
    ];

    const result = getGlobalParameterVectors(internalPeaks, peaks, {
      parameters: {
        fwhm: { optimize: false },
        mu: {
          optimize: (peak: Peak) => peak.y > 0,
        },
      },
    });

    expect(result.freeIndices).toStrictEqual([1, 3]);
    expect(Array.from(result.globalMin)).toStrictEqual([1, 2, 3, 4]);
    expect(Array.from(result.globalMax)).toStrictEqual([5, 6, 7, 8]);
    expect(Array.from(result.globalInit)).toStrictEqual([9, 10, 11, 12]);
    expect(Array.from(result.globalGrad)).toStrictEqual([13, 14, 15, 16]);
  });

  it('uses a global optimize option when the per-peak config omits optimize', () => {
    const internalPeaks: InternalPeak[] = [
      {
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y'],
        propertiesValues: {
          min: [0, 0],
          max: [10, 1],
          init: [1, 0.5],
          gradientDifference: [0.1, 0.01],
        },
        fromIndex: 0,
        toIndex: 1,
      },
    ];

    const peaks: Peak[] = [
      {
        x: 1,
        y: 0.5,
        parameters: {
          x: { init: 1 },
        },
      },
    ];

    const result = getGlobalParameterVectors(internalPeaks, peaks, {
      parameters: {
        x: { optimize: false },
      },
    });

    expect(result.freeIndices).toStrictEqual([1]);
    expect(Array.from(result.globalInit)).toStrictEqual([1, 0.5]);
  });
});
