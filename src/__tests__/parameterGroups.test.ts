import type { DataXY } from 'cheminfo-types';
import { generateSpectrum } from 'spectrum-generator';
import { describe, expect, it } from 'vitest';

import { optimize } from '../index.ts';

describe('optimize with parameter groups', () => {
  it('fits a shared fwhm with LM and preserves peak ids', () => {
    const peaks = [
      {
        id: 'left',
        x: -0.5,
        y: 1,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
      {
        id: 'right',
        x: 0.5,
        y: 0.8,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -5,
        to: 5,
        nbPoints: 1001,
        shape: { kind: 'gaussian' },
      },
    });

    const result = optimize(
      data,
      [
        {
          id: 'left',
          x: -0.5,
          y: 1,
          shape: { kind: 'gaussian' as const, fwhm: 0.08 },
        },
        {
          id: 'right',
          x: 0.5,
          y: 0.8,
          shape: { kind: 'gaussian' as const, fwhm: 0.08 },
        },
      ],
      {
        parameters: {
          x: { optimize: false },
          y: { optimize: false },
        },
        parameterGroups: [
          {
            parameter: 'fwhm',
            members: [{ peak: 'left' }, { peak: 'right' }],
          },
        ],
      },
    );

    expect(result.peaks.map((peak) => peak.id)).toStrictEqual([
      'left',
      'right',
    ]);
    expect(result.peaks[0].shape.fwhm).toBeCloseTo(0.05, 1);
    expect(result.peaks[1].shape.fwhm).toBeCloseTo(0.05, 1);
    expect(result.peaks[0].shape.fwhm).toBeCloseTo(
      //@ts-expect-error should be fixed once
      result.peaks[1].shape.fwhm,
      1,
    );
  });

  it('fits linked amplitudes with a fixed ratio using direct optimization', () => {
    const peaks = [
      {
        id: 'A',
        x: -0.4,
        y: 1,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
      {
        id: 'B',
        x: 0.4,
        y: 2,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -5,
        to: 5,
        nbPoints: 1001,
        shape: { kind: 'gaussian' },
      },
    });

    const result = optimize(
      data,
      [
        {
          id: 'A',
          x: -0.4,
          y: 0.7,
          shape: { kind: 'gaussian' as const, fwhm: 0.05 },
        },
        {
          id: 'B',
          x: 0.4,
          y: 1.4,
          shape: { kind: 'gaussian' as const, fwhm: 0.05 },
        },
      ],
      {
        parameters: {
          x: { optimize: false },
          fwhm: { optimize: false },
        },
        parameterGroups: [
          {
            parameter: 'y',
            members: [
              { peak: 'A', factor: 1 },
              { peak: 'B', factor: 2 },
            ],
          },
        ],
        optimization: {
          kind: 'lm',
          options: {
            maxIterations: 2,
          },
        },
      },
    );

    expect(result.peaks[0].y).toBeCloseTo(1, 1);
    expect(result.peaks[1].y).toBeCloseTo(2, 1);
    expect(result.peaks[1].y / result.peaks[0].y).toBeCloseTo(2, 4);
  });

  it('fits linked positions with fixed offsets', () => {
    const peaks = [
      {
        id: 'P1',
        x: -0.2,
        y: 1,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
      {
        id: 'P2',
        x: 0,
        y: 1,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
      {
        id: 'P3',
        x: 0.2,
        y: 1,
        shape: { kind: 'gaussian' as const, fwhm: 0.05 },
      },
    ];

    const data: DataXY = generateSpectrum(peaks, {
      generator: {
        from: -2,
        to: 2,
        nbPoints: 1001,
        shape: { kind: 'gaussian' },
      },
    });

    const result = optimize(
      data,
      [
        {
          id: 'P1',
          x: -0.15,
          y: 1,
          shape: { kind: 'gaussian' as const, fwhm: 0.05 },
        },
        {
          id: 'P2',
          x: 0.05,
          y: 1,
          shape: { kind: 'gaussian' as const, fwhm: 0.05 },
        },
        {
          id: 'P3',
          x: 0.25,
          y: 1,
          shape: { kind: 'gaussian' as const, fwhm: 0.05 },
        },
      ],
      {
        parameters: {
          y: { optimize: false },
          fwhm: { optimize: false },
        },
        parameterGroups: [
          {
            parameter: 'x',
            members: [
              { peak: 'P1', offset: -0.2 },
              { peak: 'P2' },
              { peak: 'P3', offset: 0.2 },
            ],
          },
        ],
      },
    );

    expect(result.peaks[0].x).toBeCloseTo(-0.2, 3);
    expect(result.peaks[1].x).toBeCloseTo(0, 3);
    expect(result.peaks[2].x).toBeCloseTo(0.2, 3);
  });
});
