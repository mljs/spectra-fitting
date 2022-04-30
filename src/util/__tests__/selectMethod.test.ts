import { selectMethod } from '../selectMethod';

describe('selectMethod', () => {
  it('throw errors', () => {
    expect(() => {
      selectMethod({ kind: 'fail' });
    }).toThrow('Unknown fitting algorithm');
  });
});
