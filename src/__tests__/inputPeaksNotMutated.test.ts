import type { DataXY } from 'cheminfo-types';
import { generateSpectrum } from 'spectrum-generator';
import { expect, test } from 'vitest';

import { optimize } from '../index.ts';

test('optimize does not modify the peaks it receives', () => {
  const data: DataXY = generateSpectrum(
    [{ x: -0.5, y: 0.001, shape: { kind: 'gaussian' as const, fwhm: 0.31 } }],
    { generator: { from: -1, to: 1, nbPoints: 101 } },
  );

  const inputPeaks = [
    { x: -0.52, y: 0.0009, shape: { kind: 'gaussian' as const, fwhm: 0.35 } },
  ];

  const result = optimize(data, inputPeaks);

  expect(inputPeaks).toStrictEqual([
    { x: -0.52, y: 0.0009, shape: { kind: 'gaussian', fwhm: 0.35 } },
  ]);
  expect(result.peaks[0].shape).not.toBe(inputPeaks[0].shape);
  expect(result.peaks[0].x).toBeCloseTo(-0.5, 3);
});
