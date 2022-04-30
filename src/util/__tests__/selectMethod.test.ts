import { selectMethod } from '../selectMethod';

describe('selectMethod', () => {
  it('throw errors', () => {
    expect(() => {
      //@ts-expect-error expected to fail
      selectMethod({ kind: 'fail' });
    }).toThrow('Unknown fitting algorithm');
  });
});
