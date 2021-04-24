import { checkInput } from '../checkInput';

describe('change default parameters', () => {
  it('change the max value of x parameter', () => {
    let data = { x: [-1, 0, 1], y: [1, 2, 1] };
    let peaks = [{ x: 0, y: 1, width: 2 }];
    let options = {
      optimization: {
        parameters: {
          x: {
            hola: 'hola2',
            max: (peak) => peak.x + peak.width * 0.1,
          },
        },
      },
    };

    let { optimization } = checkInput(data, peaks, options);
    let { parameters } = optimization;
    expect(parameters.x.max[0](peaks[0])).toBe(0.2);
    expect(parameters.x.min[0](peaks[0])).toBe(-4);
    expect(parameters.y.max[0](peaks[0])).toBe(1.5);
  });
});
