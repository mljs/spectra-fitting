import { selectMethod } from '../selectMethod.ts';

describe('selectMethod', () => {
  it('throw errors', () => {
    expect(() => {
      //@ts-expect-error expected to fail
      selectMethod({ kind: 'fail' });
    }).toThrow('Unknown fitting algorithm');
  });
});
