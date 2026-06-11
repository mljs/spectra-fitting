import { describe, expect, it } from 'vitest';

import type { Peak } from '../../index.ts';
import { getFixedParametersResult } from '../getFixedParametersResult.ts';
import type { InternalPeak } from '../internalPeaks/getInternalPeaks.ts';

const identity = (x: number) => x;
const identitySumOfShapes = () => identity;

describe('getFixedParametersResult', () => {
  it('rebuilds peaks and computes the fitting error', () => {
    const internalPeaks: InternalPeak[] = [
      {
        id: 'peak-1',
        shape: { kind: 'pseudoVoigt', fwhm: 0.5, mu: 0.4 },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm', 'mu'],
        propertiesValues: {
          min: [],
          max: [],
          init: [],
          gradientDifference: [],
        },
        fromIndex: 0,
        toIndex: 3,
      },
    ];

    const result = getFixedParametersResult<Peak>(
      internalPeaks,
      Float64Array.from([0.1, 0.2]),
      [0.1, 0.2],
      Float64Array.from([1, 2, 3, 4]),
      identitySumOfShapes,
      5,
    );

    expect(result).toMatchCloseTo({
      error: 0,
      iterations: 0,
      peaks: [
        {
          id: 'peak-1',
          x: 1,
          y: 10,
          shape: { kind: 'pseudoVoigt', fwhm: 3, mu: 4 },
        },
      ],
    });
  });
});
