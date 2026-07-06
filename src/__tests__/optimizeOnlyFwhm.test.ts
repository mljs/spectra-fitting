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
      { x: -0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.08 } },
      { x: 0.5, y: 1, shape: { kind: 'gaussian' as const, fwhm: 0.08 } },
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

  it('optimizes only fwhm when x and y are fixed', () => {
    const offset = 7 / 400;
    const truePeaks = [
      {
        id: 'triplet-peak-1',
        x: 2.02 + offset,
        y: 0.25,
        shape: { kind: 'gaussian' as const, fwhm: 0.005 },
      },
      {
        id: 'triplet-peak-2',
        x: 2.02,
        y: 0.5,
        shape: { kind: 'gaussian' as const, fwhm: 0.005 },
      },
      {
        id: 'triplet-peak-3',
        x: 2.02 - offset,
        y: 0.25,
        shape: { kind: 'gaussian' as const, fwhm: 0.005 },
      },
      {
        id: 'doublet-peak-1',
        x: 2.0025 - offset,
        y: 0.5,
        shape: { kind: 'gaussian' as const, fwhm: 0.005 },
      },
      {
        id: 'doublet-peak-2',
        x: 2.0025 + offset,
        y: 0.5,
        shape: { kind: 'gaussian' as const, fwhm: 0.005 },
      },
    ].toSorted((a, b) => a.x - b.x);

    const data: DataXY = generateSpectrum(truePeaks, {
      generator: {
        from: 1.7,
        to: 2.3,
        nbPoints: 1024 * 3,
        shape: { kind: 'gaussian' },
      },
    });

    const initial = [
      {
        id: 'triplet-peak-1',
        x: 2.03 + offset,
        y: 0.3,
        shape: { kind: 'gaussian' as const, fwhm: 0.006 },
      },
      {
        id: 'triplet-peak-2',
        x: 2.03,
        y: 0.6,
        shape: { kind: 'gaussian' as const, fwhm: 0.006 },
      },
      {
        id: 'triplet-peak-3',
        x: 2.03 - offset,
        y: 0.3,
        shape: { kind: 'gaussian' as const, fwhm: 0.006 },
      },
      {
        id: 'doublet-peak-1',
        x: 2.01 - offset,
        y: 0.7,
        shape: { kind: 'gaussian' as const, fwhm: 0.006 },
      },
      {
        id: 'doublet-peak-2',
        x: 2.01 + offset,
        y: 0.7,
        shape: { kind: 'gaussian' as const, fwhm: 0.006 },
      },
    ].toSorted((a, b) => a.x - b.x);

    const result = optimize(data, initial, {
      optimization: {
        kind: 'lm',
        options: { maxIterations: 100 },
      },
      linkedParameters: [
        {
          parameter: 'x',
          peaks: [
            { id: 'triplet-peak-1', offset },
            { id: 'triplet-peak-2' },
            { id: 'triplet-peak-3', offset: -offset },
          ],
        },
        {
          parameter: 'y',
          peaks: [
            { id: 'triplet-peak-1', factor: 1 },
            { id: 'triplet-peak-2', factor: 2 },
            { id: 'triplet-peak-3', factor: 1 },
          ],
        },
        {
          parameter: 'fwhm',
          peaks: [
            { id: 'triplet-peak-1' },
            { id: 'triplet-peak-2' },
            { id: 'triplet-peak-3' },
          ],
        },
        {
          parameter: 'x',
          peaks: [
            { id: 'doublet-peak-1', offset: -offset },
            { id: 'doublet-peak-2', offset },
          ],
        },
        {
          parameter: 'y',
          peaks: [
            { id: 'doublet-peak-1', factor: 1 },
            { id: 'doublet-peak-2', factor: 1 },
          ],
        },
        {
          parameter: 'fwhm',
          peaks: [{ id: 'doublet-peak-1' }, { id: 'doublet-peak-2' }],
        },
      ],
    });

    const shapePeaks = [];
    for (const peak of result.peaks) {
      const data = generateSpectrum([peak], {
        generator: {
          from: 1.7,
          to: 2.3,
          nbPoints: 1024 * 3,
          shape: { kind: 'gaussian' },
        },
      });
      shapePeaks.push(data);
    }

    expect(result.peaks.map((peak) => peak.id)).toStrictEqual(
      initial.map((peak) => peak.id),
    );

    expect(result.peaks[0].x).toBeCloseTo(truePeaks[0].x, 3);
    expect(result.peaks[1].x).toBeCloseTo(truePeaks[1].x, 3);
    expect(result.peaks[2].x).toBeCloseTo(truePeaks[2].x, 3);
    expect(result.peaks[3].x).toBeCloseTo(truePeaks[3].x, 3);
    expect(result.peaks[4].x).toBeCloseTo(truePeaks[4].x, 3);

    expect(result.peaks[0].y).toBeCloseTo(truePeaks[0].y, 3);
    expect(result.peaks[1].y).toBeCloseTo(truePeaks[1].y, 3);
    expect(result.peaks[2].y).toBeCloseTo(truePeaks[2].y, 3);
    expect(result.peaks[3].y).toBeCloseTo(truePeaks[3].y, 3);
    expect(result.peaks[4].y).toBeCloseTo(truePeaks[4].y, 3);

    expect(result.peaks[0].shape.fwhm).toBeCloseTo(0.005, 3);
    expect(result.peaks[1].shape.fwhm).toBeCloseTo(0.005, 3);
    expect(result.peaks[2].shape.fwhm).toBeCloseTo(0.005, 3);
    expect(result.peaks[3].shape.fwhm).toBeCloseTo(0.005, 3);
    expect(result.peaks[4].shape.fwhm).toBeCloseTo(0.005, 3);
  });
});
