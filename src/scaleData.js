import getMaxValue from 'ml-array-max';

export function scaleData(data, peaks, options = {}) {
  let nbPoints = data.x.length;
  let currentMinX = data.x[0];
  let currentMaxX = data.x[nbPoints - 1];
  if (currentMinX > currentMaxX) {
    [currentMinX, currentMaxX] = [currentMaxX, currentMinX];
  }

  let {
    minX = 0,
    maxX = 1,
    maxY = getMaxValue(data.y),
    scaleXY = true,
    reverse = false,
  } = options;

  let xFactor = (maxX - minX) / (currentMaxX - currentMinX);
  let yFactor = reverse ? maxY : 1 / maxY;

  let xScaler = (x) => (x - currentMinX) * xFactor + minX;

  if (scaleXY) {
    for (let i = 0; i < nbPoints; i++) {
      data.y[i] *= yFactor;
      data.x[i] = xScaler(data.x[i]);
    }
  }

  for (let i = 0; i < peaks.length; i++) {
    peaks[i].y *= yFactor;
    peaks[i].width *= xFactor;
    peaks[i].x = xScaler(peaks[i].x);
  }

  return {
    peaks,
    data,
    oldMaxY: maxY,
    oldMaxX: currentMaxX,
    oldMinX: currentMinX,
  };
}
