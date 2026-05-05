import type { DataXY } from 'cheminfo-types';
import { generateSpectrum } from 'spectrum-generator';
import { describe, expect, it } from 'vitest';

import { optimize } from '../index.ts';

describe('Optimize only fwhm', () => {
  it('optimizes fwhm while keeping x and y fixed', () => {
    const truePeaks = [
      { x: -0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
      { x: 0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
    ];

    const data: DataXY = generateSpectrum(truePeaks, {
      generator: {
        from: -5,
        to: 5,
        nbPoints: 1001,
        shape: { kind: 'gaussian' },
      },
    });

    const initial = [
      { x: -0.5, y: 1.0, shape: { kind: 'gaussian' as const, fwhm: 0.08 } },
      { x: 0.5, y: 1.0, shape: { kind: 'gaussian' as const, fwhm: 0.08 } },
    ];

    const result = optimize(data, initial, {
      parameters: {
        x: { optimize: false },
        y: { optimize: false },
      },
    });

    // positions and amplitudes should remain the same
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i].x).toBeCloseTo(truePeaks[i].x, 6);
      expect(result.peaks[i].y).toBeCloseTo(truePeaks[i].y, 6);
      // fwhm should be fitted back near the true value
      expect(result.peaks[i].shape.fwhm).toBeCloseTo(
        truePeaks[i].shape.fwhm,
        3,
      );
    }
  });

  it('does not optimize when all parameters have optimize=false', () => {
    const truePeaks = [
      { x: -0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
      { x: 0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.05 } },
    ];

    const data: DataXY = generateSpectrum(truePeaks, {
      generator: {
        from: -5,
        to: 5,
        nbPoints: 1001,
        shape: { kind: 'gaussian' },
      },
    });

    const initial = [
      { x: -0.6, y: 0.9, shape: { kind: 'gaussian' as const, fwhm: 0.08 } },
      { x: 0.6, y: 1.1, shape: { kind: 'gaussian' as const, fwhm: 0.1 } },
    ];

    const result = optimize(data, initial, {
      parameters: {
        x: { optimize: false },
        y: { optimize: false },
        fwhm: { optimize: false },
      },
    });

    // with all parameters fixed, result should match initial guesses
    for (let i = 0; i < 2; i++) {
      expect(result.peaks[i].x).toBeCloseTo(initial[i].x, 6);
      expect(result.peaks[i].y).toBeCloseTo(initial[i].y, 6);
      expect(result.peaks[i].shape.fwhm).toBeCloseTo(initial[i].shape.fwhm, 6);
    }
  });
});
