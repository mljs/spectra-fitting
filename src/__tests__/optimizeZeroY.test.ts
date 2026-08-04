import type { DataXY } from 'cheminfo-types';
import { describe, expect, it } from 'vitest';

import { optimize } from '../index.ts';

describe('optimize with zero-valued data', () => {
  it('uses a scale factor of 1 when all y values are zero', () => {
    const data: DataXY = {
      x: new Float64Array([0, 1, 2]),
      y: new Float64Array([0, 0, 0]),
    };

    const result = optimize(data, [
      {
        x: 1,
        y: 0,
        shape: { kind: 'gaussian' as const, fwhm: 1 },
      },
    ]);

    expect(result.error).toBeCloseTo(0, 8);
    expect(result.peaks).toHaveLength(1);
    expect(result.peaks[0].x).toBeCloseTo(1, 8);
    expect(result.peaks[0].y).toBeCloseTo(0, 8);
    expect(result.peaks[0].shape.fwhm).toBeCloseTo(1, 8);
  });
});
