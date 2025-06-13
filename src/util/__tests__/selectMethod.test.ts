import { describe, expect, it } from 'vitest';

import { selectMethod } from '../selectMethod.ts';

describe('selectMethod', () => {
  it('throw errors', () => {
    expect(() => {
      selectMethod({ kind: 'fail' as never });
    }).toThrow('Unknown fitting algorithm');
  });
});
