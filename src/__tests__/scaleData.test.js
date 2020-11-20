import { scaleData } from '../scaleData';

describe('scaling data', () => {
  let x = [7, 6, 5, 4, 3, 2, 1];
  let y = [1, 2, 3, 4, 3, 2, 1];
  let peaks = [{ x: 4, y: 4, width: 0.2 }];
  it('scaling and reverse scaling', () => {
    let scaled = scaleData({ x, y }, peaks);

    expect(scaled.data.x[3]).toBe(0.5);
    expect(scaled.data.x[6]).toBe(0);
    expect(scaled.data.x[0]).toBe(1);
    expect(scaled.data.y[3]).toBe(1);

    let backScaled = scaleData(scaled.data, scaled.peaks, {
      scaleXY: true,
      reverse: true,
      minX: scaled.oldMinX,
      maxX: scaled.oldMaxX,
      maxY: scaled.oldMaxY,
    });

    expect(backScaled.data.x[3]).toBe(4);
    expect(backScaled.data.x[6]).toBe(1);
    expect(backScaled.data.x[0]).toBe(7);
    expect(backScaled.data.y[3]).toBe(4);
    expect(backScaled.peaks[0].width).toBe(0.2);
  });
});
