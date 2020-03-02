import Matrix from 'ml-matrix';

/**
 *
 * Converts the given input to the required x, y column matrices. y data is normalized to max(y)=1
 * @param xy
 * @returns {*[]}
 */
export function parseData(xy, threshold) {
  let nbSeries = xy.length;
  let t = null;
  let yData = null;
  let x;
  let y;
  let maxY = 0;
  let nbPoints;
  if (nbSeries === 2) {
    nbPoints = xy[0].length;
    t = new Array(nbPoints);
    yData = new Array(nbPoints);
    x = xy[0];
    y = xy[1];
    if (typeof x[0] === 'number') {
      for (let i = 0; i < nbPoints; i++) {
        t[i] = x[i];
        yData[i] = y[i];
        if (y[i] > maxY) {
          maxY = y[i];
        }
      }
    } else {
      if (typeof x[0] === 'object') {
        for (let i = 0; i < nbPoints; i++) {
          t[i] = x[i][0];
          yData[i] = y[i];
          if (y[i] > maxY) {
            maxY = y[i][0];
          }
        }
      }
    }
  } else {
    nbPoints = nbSeries;
    t = new Array(nbPoints);
    yData = new Array(nbPoints);
    for (let i = 0; i < nbPoints; i++) {
      t[i] = xy[i][0];
      yData[i] = xy[i][1];
      if (yData[i] > maxY) {
        maxY = yData[i];
      }
    }
  }
  for (let i = 0; i < nbPoints; i++) {
    yData[i] /= maxY;
  }
  if (threshold) {
    for (let i = nbPoints - 1; i >= 0; i--) {
      if (yData[i] < threshold) {
        yData.splice(i, 1);
        t.splice(i, 1);
      }
    }
  }
  if (t.length > 0) {
    return [new Matrix([t]).transpose(), new Matrix([yData]).transpose(), maxY];
  }
  return null;
}
