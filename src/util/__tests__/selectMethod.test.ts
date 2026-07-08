import { describe, expect, it } from 'vitest';

import { selectMethod } from '../selectMethod.ts';
import { directOptimization } from '../wrappers/directOptimization.ts';

describe('selectMethod', () => {
  it('throws errors', () => {
    expect(() => {
      selectMethod({ kind: 'fail' as never });
    }).toThrow('Unknown fitting algorithm');
  });

  it('uses direct defaults with maxIterations', () => {
    const { algorithm, optimizationOptions } = selectMethod({
      kind: 'direct',
    });

    expect(algorithm).toBe(directOptimization);
    expect(optimizationOptions).toMatchObject({
      maxIterations: 20,
      epsilon: 1e-4,
      tolerance: 1e-16,
      tolerance2: 1e-12,
      initialState: {},
    });
    expect(optimizationOptions).not.toHaveProperty('iterations');
  });

  it('forwards direct maxIterations overrides', () => {
    const { optimizationOptions } = selectMethod({
      kind: 'direct',
      options: { maxIterations: 7 },
    });

    expect(optimizationOptions).toMatchObject({ maxIterations: 7 });
  });
});
