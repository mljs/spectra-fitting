import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe('Optimize sum of Gaussians', () => {
  const peaks = [
    { x: -0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
    { x: 0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
  ];

  const data: DataXY = generateSpectrum(peaks, {
    generator: {
      from: -1,
      to: 1,
      nbPoints: 1024,
      shape: { kind: 'gaussian' },
    },
  });

  const result = optimize(
    data,
    [
      {
        x: -0.55,
        y: 0.9,
        shape: { kind: 'gaussian' as const, fwhm: 0.08 },
        parameters: {
          x: { min: -0.49, max: -0.512 },
          y: { min: 0.9, max: 1.2 },
          fwhm: { min: 0.04, max: 0.07 },
        },
      },
      {
        x: 0.55,
        y: 0.9,
        shape: { kind: 'gaussian' as const, fwhm: 0.08 },
        parameters: {
          x: { min: 0.49, max: 0.512 },
          y: { min: 0.9, max: 1.2 },
          fwhm: { min: 0.04, max: 0.07 },
        },
      },
    ],
    {
      optimization: {
        kind: 'direct',
        options: {
          maxIterations: 20,
        },
      },
    },
  );
  for (let i = 0; i < 2; i++) {
    const peak = peaks[i];
    for (const key in peak) {
      //@ts-expect-error to be improved
      const value = peak[key];
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      it(`peak at ${peak.x} key: ${key}`, () => {
        //@ts-expect-error to be improved
        expect(result.peaks[i][key]).toMatchCloseTo(value, 2);
      });
    }
  }
});
