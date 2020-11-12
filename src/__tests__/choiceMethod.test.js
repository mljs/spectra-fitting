import { choiceMethod } from '../choiceMethod';

describe('choiceMethod', () => {
  it('throw errors', () => {
    expect(choiceMethod).toThrow('Unknown kind algorithm');
    expect(() => {
      choiceMethod({ kind: 'fail' });
    }).toThrow('Unknown kind algorithm');
  });
});
