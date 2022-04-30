import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';

import { Peak1D } from '../../..';
import { getInternalPeaks } from '../getInternalPeaks';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe('getInternalPeaks', () => {
  it('default values', () => {
    const peaks: Peak1D[] = [{ x: 0, y: 1 }];
    const internalPeaks = getInternalPeaks(peaks);
    expect(internalPeaks).toMatchCloseTo([
      {
        shape: { kind: 'gaussian' },
        shapeFct: { fwhm: 500 },
        parameters: ['x', 'y', 'fwhm'],
        parametersValues: [
          { init: [0], min: [-1000], max: [1000], gradientDifference: [1] },
          { init: [1], min: [0], max: [1.5], gradientDifference: [0.001] },
          { init: [500], min: [125], max: [2000], gradientDifference: [1] },
        ],
        fromIndex: 0,
        toIndex: 2,
      },
    ]);
  });
});
