import type { DataXY } from 'cheminfo-types';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { Shape1D } from 'ml-peak-shape-generator';
import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../index';
import { getSumOfShapes } from '../shapes/getSumOfShapes';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

test('optimize one peak', () => {
  const peaks = [
    { x: 0, y: 1, fwhm: 0.05, shape: { kind: 'pseudoVoigt' } as Shape1D },
  ];

  const data: DataXY = generateSpectrum(peaks, {
    generator: {
      from: -1,
      to: 1,
      nbPoints: 101,
    },
  });

  let result = optimize(data, peaks, {});
  console.log(result.peaks);
});
