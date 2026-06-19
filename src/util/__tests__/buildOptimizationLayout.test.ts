import { describe, expect, it } from 'vitest';

import type { Peak } from '../../index.ts';
import { buildOptimizationLayout } from '../buildOptimizationLayout.ts';
import type { InternalPeak } from '../internalPeaks/getInternalPeaks.ts';

describe('buildOptimizationLayout', () => {
  it('preserves the current one-slot-per-variable behavior without groups', () => {
    const internalPeaks: InternalPeak[] = [
      {
        id: 'A',
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [-1, 0, 0.4],
          max: [1, 2, 0.7],
          init: [0, 1, 0.6],
          gradientDifference: [0.1, 0.01, 0.02],
        },
        fromIndex: 0,
        toIndex: 2,
      },
      {
        id: 'B',
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [2, 0, 0.5],
          max: [3, 3, 0.9],
          init: [2.5, 2, 0.8],
          gradientDifference: [0.1, 0.01, 0.03],
        },
        fromIndex: 3,
        toIndex: 5,
      },
    ];

    const peaks: Peak[] = [
      { id: 'A', x: 0, y: 1 },
      {
        id: 'B',
        x: 2.5,
        y: 2,
        parameters: {
          x: { optimize: false },
        },
      },
    ];

    const layout = buildOptimizationLayout(internalPeaks, peaks, {
      parameters: {
        y: { optimize: false },
      },
    });

    expect(layout.variables).toHaveLength(6);
    expect(layout.freeIndices).toStrictEqual([0, 2, 5]);
    expect(Array.from(layout.variableInit)).toStrictEqual([
      0, 1, 0.6, 2.5, 2, 0.8,
    ]);
    expect(layout.variableToPeakValues(layout.variableInit)).toStrictEqual([
      0, 1, 0.6, 2.5, 2, 0.8,
    ]);
  });

  it('creates one shared variable for grouped members and applies factor plus offset', () => {
    const internalPeaks: InternalPeak[] = [
      {
        id: 'A',
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [-1, 0, 0.4],
          max: [1, 2, 0.7],
          init: [0, 1, 0.6],
          gradientDifference: [0.1, 0.01, 0.02],
        },
        fromIndex: 0,
        toIndex: 2,
      },
      {
        id: 'B',
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [2, 0, 0.9],
          max: [3, 3, 1.5],
          init: [2.5, 2, 1.3],
          gradientDifference: [0.1, 0.01, 0.04],
        },
        fromIndex: 3,
        toIndex: 5,
      },
    ];

    const peaks: Peak[] = [
      { id: 'A', x: 0, y: 1 },
      { id: 'B', x: 2.5, y: 2 },
    ];

    const layout = buildOptimizationLayout(internalPeaks, peaks, {
      linkedParameters: [
        {
          parameter: 'fwhm',
          peaks: [{ id: 'A' }, { id: 'B', factor: 2, offset: 0.1 }],
        },
      ],
    });

    expect(layout.variables).toHaveLength(5);
    expect(layout.variables[2]).toMatchObject({
      parameter: 'fwhm',
      init: 0.95,
      min: 0.4,
      max: 1.5,
      gradientDifference: 0.02,
      optimize: true,
    });

    const result = layout.variableToPeakValues([0, 1, 0.55, 2.5, 2]);
    const expected = [0, 1, 0.55, 2.5, 2, 1.2];

    for (const [index, value] of expected.entries()) {
      expect(result[index]).toBeCloseTo(value, 1);
    }
  });

  it('rejects inconsistent optimize flags within a linked group', () => {
    const internalPeaks: InternalPeak[] = [
      {
        id: 'A',
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [-1, 0, 0.4],
          max: [1, 2, 0.7],
          init: [0, 1, 0.6],
          gradientDifference: [0.1, 0.01, 0.02],
        },
        fromIndex: 0,
        toIndex: 2,
      },
      {
        id: 'B',
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [2, 0, 0.5],
          max: [3, 3, 0.9],
          init: [2.5, 2, 0.8],
          gradientDifference: [0.1, 0.01, 0.03],
        },
        fromIndex: 3,
        toIndex: 5,
      },
    ];

    const peaks: Peak[] = [
      { id: 'A', x: 0, y: 1 },
      {
        id: 'B',
        x: 2.5,
        y: 2,
        parameters: {
          fwhm: { optimize: false },
        },
      },
    ];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [
          {
            parameter: 'fwhm',
            peaks: [{ id: 'A' }, { id: 'B' }],
          },
        ],
      }),
    ).toThrow(/consistent optimize flag/);
  });
});
