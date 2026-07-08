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
      init: 0.6,
      min: 0.4,
      max: 0.7,
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

  it('rejects linked groups without members', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [{ parameter: 'fwhm', peaks: [] }],
      }),
    ).toThrow(/must contain at least one peak/);
  });

  it('rejects linked groups that reference the same peak twice', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [
          { parameter: 'fwhm', peaks: [{ id: 'A' }, { id: 'A' }] },
        ],
      }),
    ).toThrow(/same peak more than once/);
  });

  it('rejects linked groups that overlap with an earlier shared variable', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [
          { parameter: 'fwhm', peaks: [{ id: 'A' }] },
          { parameter: 'fwhm', peaks: [{ id: 'A' }] },
        ],
      }),
    ).toThrow(/already linked/);
  });

  it('rejects linked groups whose member bounds are incompatible', () => {
    const internalPeaks: InternalPeak[] = [
      {
        id: 'A',
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [-1, 0, 0],
          max: [1, 2, 1],
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
          min: [2, 0, 5],
          max: [3, 3, 7],
          init: [2.5, 2, 6],
          gradientDifference: [0.1, 0.01, 0.03],
        },
        fromIndex: 3,
        toIndex: 5,
      },
    ];

    const peaks: Peak[] = [
      { id: 'A', x: 0, y: 1 },
      { id: 'B', x: 2.5, y: 2 },
    ];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [
          {
            parameter: 'fwhm',
            peaks: [{ id: 'A' }, { id: 'B', factor: 2, offset: 1 }],
          },
        ],
      }),
    ).toThrow(/incompatible bounds/);
  });

  it('rejects linked groups that reference an invalid peak index', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [{ parameter: 'fwhm', peaks: [{ id: -1 }] }],
      }),
    ).toThrow(/Invalid peak reference/);
  });

  it('rejects linked groups that reference an unknown parameter', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [{ parameter: 'foo', peaks: [{ id: 'A' }] }],
      }),
    ).toThrow(/Unknown parameter/);
  });

  it('rejects linked groups that reference an unknown peak id', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [{ parameter: 'fwhm', peaks: [{ id: 'B' }] }],
      }),
    ).toThrow(/Unknown peak id/);
  });

  it('rejects linked groups that use an ambiguous peak id', () => {
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
        id: 'A',
        shape: { kind: 'gaussian' },
        shapeFct: {} as never,
        parameters: ['x', 'y', 'fwhm'],
        propertiesValues: {
          min: [2, 0, 0.4],
          max: [3, 3, 0.7],
          init: [2.5, 2, 0.8],
          gradientDifference: [0.1, 0.01, 0.03],
        },
        fromIndex: 3,
        toIndex: 5,
      },
    ];

    const peaks: Peak[] = [
      { id: 'A', x: 0, y: 1 },
      { id: 'A', x: 2.5, y: 2 },
    ];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [{ parameter: 'fwhm', peaks: [{ id: 'A' }] }],
      }),
    ).toThrow(/ambiguous/);
  });

  it('rejects linked groups with a zero or non-finite factor', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [
          { parameter: 'fwhm', peaks: [{ id: 'A', factor: 0 }] },
        ],
      }),
    ).toThrow(/non-zero finite factor/);
  });

  it('rejects linked groups with a non-finite offset', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    expect(() =>
      buildOptimizationLayout(internalPeaks, peaks, {
        linkedParameters: [
          { parameter: 'fwhm', peaks: [{ id: 'A', offset: Number.NaN }] },
        ],
      }),
    ).toThrow(/finite offset/);
  });

  it('uses a per-peak optimize callback when resolving the optimize flag', () => {
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
    ];

    const peaks: Peak[] = [
      {
        id: 'A',
        x: 0,
        y: 1,
        parameters: {
          fwhm: { optimize: () => false },
        },
      },
    ];

    const layout = buildOptimizationLayout(internalPeaks, peaks, {});

    expect(layout.variables[2]?.optimize).toBe(false);
    expect(layout.freeIndices).toStrictEqual([0, 1]);
  });

  it('uses a global optimize callback when resolving the optimize flag', () => {
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
    ];

    const peaks: Peak[] = [{ id: 'A', x: 0, y: 1 }];

    const layout = buildOptimizationLayout(internalPeaks, peaks, {
      parameters: {
        fwhm: { optimize: () => false },
      },
    });

    expect(layout.variables[2]?.optimize).toBe(false);
    expect(layout.freeIndices).toStrictEqual([0, 1]);
  });
});
