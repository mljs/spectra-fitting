/* eslint-disable vitest/prefer-importing-vitest-globals -- `assert` is the local util under test, not the vitest global */
import { describe, expect, it } from 'vitest';

import { assert } from '../assert.ts';

describe('assert', () => {
  it('does not throw for truthy values', () => {
    expect(() => assert(true)).not.toThrow();
  });

  it('throws the default message for falsy values', () => {
    expect(() => assert(false)).toThrow('unreachable');
  });

  it('throws a custom message when provided', () => {
    expect(() => assert(0, 'broken')).toThrow('broken');
  });
});
