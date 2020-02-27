import LM from 'ml-curve-fitting';
import Matrix from 'ml-matrix';

let math = LM.Matrix.algebra;

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
function sumOfLorentzians(t, p) {
  let nL = p.length / 3;
  let factor;
  // let i;
  let j;
  let p2;

  let cols = t.rows;
  let result = Matrix.zeros(t.length, 1);

  for (let i = 0; i < nL; i++) {
    p2 = Math.pow(p[i + nL * 2][0] / 2, 2);
    factor = p[i + nL][0] * p2;
    for (j = 0; j < cols; j++) {
      result[j][0] += factor / (Math.pow(t[j][0] - p[i][0], 2) + p2);
    }
  }
  return result;
}

export function sumOfGaussianLorentzians(t, p) {
  let nL = p.length / 4;
  let factorG1;
  let factorG2;
  let factorL;
  let cols = t.rows;

  let p2;
  let result = Matrix.zeros(t.length, 1);
  for (let i = 0; i < nL; i++) {
    let xG = p[i + nL * 3][0];
    let xL = 1 - xG;
    p2 = Math.pow(p[i + nL * 2][0] / 2, 2);
    factorL = xL * p[i + nL][0] * p2;
    factorG1 = p[i + nL * 2][0] * p[i + nL * 2][0] * 2;
    factorG2 = xG * p[i + nL][0];
    for (let j = 0; j < cols; j++) {
      result[j][0] +=
        factorG2 * Math.exp(-Math.pow(t[j][0] - p[i][0], 2) / factorG1) +
        factorL / (Math.pow(t[j][0] - p[i][0], 2) + p2);
    }
  }
  return result;
}

/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: std's;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
function sumOfGaussians(t, p) {
  let nL = p.length / 3;
  let factor;

  let cols = t.rows;
  let result = Matrix.zeros(t.length, 1);
  for (let i = 0; i < nL; i++) {
    factor = Math.pow(p[i + nL * 2][0], 2) * 2;
    for (let j = 0; j < cols; j++) {
      result[j][0] +=
        p[i + nL][0] * Math.exp(-Math.pow(t[j][0] - p[i][0], 2) / factor);
    }
  }
  return result;
}

/**
 * Single 4 parameter lorentzian function
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
export function singleLorentzian(t, p) {
  let factor = p[1][0] * Math.pow(p[2][0] / 2, 2);
  let rows = t.rows;
  let result = new Matrix(t.rows, t.columns);
  for (let i = 0; i < rows; i++) {
    result[i][0] =
      factor / (Math.pow(t[i][0] - p[0][0], 2) + Math.pow(p[2][0] / 2, 2));
  }
  return result;
}

/**
 * Single 3 parameter gaussian function
 * @param t Ordinate values
 * @param p Gaussian parameters [mean, height, std]
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
export function singleGaussian(t, p) {
  let factor2 = (p[2][0] * p[2][0]) / 2;
  let rows = t.rows;
  let result = new Matrix(t.rows, t.columns);
  for (let i = 0; i < rows; i++) {
    result[i][0] =
      p[1][0] *
      Math.exp((-(t[i][0] - p[0][0]) * (t[i][0] - p[0][0])) / factor2);
  }
  return result;
}

/**
 * * Fits a set of points to a Lorentzian function. Returns the center of the peak, the width at half height, and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
export function optimizeSingleLorentzian(xy, peak, opts) {
  opts = opts || {};
  let xy2 = parseData(xy, opts.percentage || 0);

  if (xy2 === null || xy2[0].rows < 3) {
    return null; // Cannot run an optimization with less than 3 points
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nbPoints = t.rows;

  let weight = [nbPoints / Math.sqrt(yData.dot(yData))];

  opts = Object.create(
    opts.LMOptions || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  );
  // var opts = [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        1 ];
  let consts = [];
  let dt = Math.abs(t[0][0] - t[1][0]); // optional vector of constants
  let dx = new Matrix([[-dt / 10000], [-1e-3], [-dt / 10000]]); // -Math.abs(t[0][0]-t[1][0])/100;
  let pInit = new Matrix([[peak.x], [1], [peak.width]]);
  let pMin = new Matrix([[peak.x - dt], [0.75], [peak.width / 4]]);
  let pMax = new Matrix([[peak.x + dt], [1.25], [peak.width * 4]]);

  let pFit = LM.optimize(
    singleLorentzian,
    pInit,
    t,
    yData,
    weight,
    dx,
    pMin,
    pMax,
    consts,
    opts,
  );

  pFit = pFit.p;
  return [pFit[0], [pFit[1][0] * maxY], pFit[2]];
}

/**
 * Fits a set of points to a gaussian bell. Returns the mean of the peak, the std and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
export function optimizeSingleGaussian(xy, peak, opts) {
  opts = opts || {};
  let xy2 = parseData(xy, opts.percentage || 0);

  if (xy2 === null || xy2[0].rows < 3) {
    return null; // Cannot run an optimization with less than 3 points
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];

  let nbPoints = t.rows;

  let weight = [nbPoints / Math.sqrt(yData.dot(yData))];

  opts = Object.create(
    opts.LMOptions || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  );
  // var opts = [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        1 ];
  let consts = []; // optional vector of constants
  let dt = Math.abs(t[0][0] - t[1][0]);
  let dx = new Matrix([[-dt / 10000], [-1e-3], [-dt / 10000]]); // -Math.abs(t[0][0]-t[1][0])/100;

  dx = new Matrix([
    [-Math.abs(t[0][0] - t[1][0]) / 1000],
    [-1e-3],
    [-peak.width / 1000],
  ]);
  let pInit = new Matrix([[peak.x], [1], [peak.width]]);
  let pMin = new Matrix([[peak.x - dt], [0.75], [peak.width / 4]]);
  let pMax = new Matrix([[peak.x + dt], [1.25], [peak.width * 4]]);
  // var p_min = new Matrix([[peak.x-peak.width/4],[0.75],[peak.width/3]]);
  // var p_max = new Matrix([[peak.x+peak.width/4],[1.25],[peak.width*3]]);

  let pFit = LM.optimize(
    singleGaussian,
    pInit,
    t,
    yData,
    weight,
    dx,
    pMin,
    pMax,
    consts,
    opts,
  );
  pFit = pFit.p;
  return [pFit[0], [pFit[1][0] * maxY], pFit[2]];
}

/*
 peaks on group should sorted
 */
export function optimizeLorentzianTrain(xy, group, opts) {
  let xy2 = parseData(xy);

  if (xy2 === null || xy2[0].rows < 3) {
    return null; // Cannot run an optimization with less than 3 points
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let currentIndex = 0;
  let nbPoints = t.length;
  let nextX;
  let tI, yI;
  let result = [];

  let current;
  for (let i = 0; i < group.length; i++) {
    nextX = group[i].x - group[i].width * 1.5;
    while (t[currentIndex++] < nextX && currentIndex < nbPoints);
    nextX = group[i].x + group[i].width * 1.5;
    tI = [];
    yI = [];
    while (t[currentIndex] <= nextX && currentIndex < nbPoints) {
      tI.push(t[currentIndex][0]);
      yI.push(yData[currentIndex][0] * maxY);
      currentIndex++;
    }

    current = optimizeSingleLorentzian([tI, yI], group[i], opts);
    if (current) {
      result.push({
        x: current[0][0],
        y: current[1][0],
        width: current[2][0],
        opt: true,
      });
    } else {
      result.push({
        x: group[i].x,
        y: group[i].y,
        width: group[i].width,
        opt: false,
      });
    }
  }

  return result;
}

export function optimizeGaussianTrain(xy, group, opts) {
  let xy2 = parseData(xy);

  if (xy2 === null || xy2[0].rows < 3) {
    return null; // Cannot run an optimization with less than 3 points
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let currentIndex = 0;
  let nbPoints = t.length;
  let nextX;
  let tI, yI;
  let result = [];

  let current;
  for (let i = 0; i < group.length; i++) {
    nextX = group[i].x - group[i].width * 1.5;
    while (t[currentIndex++] < nextX && currentIndex < nbPoints);
    nextX = group[i].x + group[i].width * 1.5;
    tI = [];
    yI = [];
    while (t[currentIndex] <= nextX && currentIndex < nbPoints) {
      tI.push(t[currentIndex][0]);
      yI.push(yData[currentIndex][0] * maxY);
      currentIndex++;
    }

    current = optimizeSingleGaussian([tI, yI], group[i], opts);
    if (current) {
      result.push({
        x: current[0][0],
        y: current[1][0],
        width: current[2][0],
        opt: true,
      });
    } else {
      result.push({
        x: group[i].x,
        y: group[i].y,
        width: group[i].width,
        opt: false,
      });
    }
  }

  return result;
}

export function optimizeGaussianLorentzianSum(xy, group, options = {}) {
  let {
    percentage = 0,
    LMOptions = [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  } = options;

  let xy2 = parseData(xy, percentage || 0);
  if (xy2 === null || xy2[0].rows < 3) {
    return null; // Cannot run an optimization with less than 3 points
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nbPoints = t.rows;

  let weight = [nbPoints / Math.sqrt(yData.dot(yData))];
  let consts = []; // optional vector of constants
  let nL = group.length;
  let pInit = new Matrix(nL * 4, 1);
  let pMin = new Matrix(nL * 4, 1);
  let pMax = new Matrix(nL * 4, 1);
  let dx = new Matrix(nL * 4, 1);
  let dt = Math.abs(t[0][0] - t[1][0]);

  for (let i = 0; i < nL; i++) {
    pInit[i][0] = group[i].x;
    pInit[i + nL][0] = 1;
    pInit[i + 2 * nL][0] = group[i].width;
    pInit[i + 3 * nL][0] = 0.5;

    pMin[i][0] = group[i].x - dt;
    pMin[i + nL][0] = 0;
    pMin[i + 2 * nL][0] = group[i].width / 4;
    pMin[i + 3 * nL][0] = 0;

    pMax[i][0] = group[i].x + dt;
    pMax[i + nL][0] = 1.5;
    pMax[i + 2 * nL][0] = group[i].width * 4;
    pMax[i + 3 * nL][0] = 1;

    dx[i][0] = -dt / 1000;
    dx[i + nL][0] = -1e-3;
    dx[i + 2 * nL][0] = -dt / 1000;
    dx[i + 3 * nL][0] = 0.0001;
  }
  // var dx = -Math.abs(t[0][0]-t[1][0])/10000;
  let pFit = LM.optimize(
    sumOfGaussianLorentzians,
    pInit,
    t,
    yData,
    weight,
    dx,
    pMin,
    pMax,
    consts,
    LMOptions,
  );
  pFit = pFit.p;
  // Put back the result in the correct format
  let result = new Array(nL);
  for (let i = 0; i < nL; i++) {
    result[i] = [
      pFit[i],
      [pFit[i + nL][0] * maxY],
      pFit[i + 2 * nL],
      pFit[i + 3 * nL],
    ];
  }

  return result;
}

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
export function optimizeLorentzianSum(xy, group, opts) {
  let xy2 = parseData(xy);

  if (xy2 === null || xy2[0].rows < 3) {
    return null; // Cannot run an optimization with less than 3 points
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nbPoints = t.rows;

  let weight = [nbPoints / math.sqrt(yData.dot(yData))];
  opts = Object.create(
    opts || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1],
  );
  let consts = []; // optional vector of constants

  let nL = group.length;
  let pInit = new Matrix(nL * 3, 1);
  let pMin = new Matrix(nL * 3, 1);
  let pMax = new Matrix(nL * 3, 1);
  let dx = new Matrix(nL * 3, 1);
  let dt = Math.abs(t[0][0] - t[1][0]);
  for (let i = 0; i < nL; i++) {
    pInit[i][0] = group[i].x;
    pInit[i + nL][0] = 1;
    pInit[i + 2 * nL][0] = group[i].width;

    pMin[i][0] = group[i].x - dt; // -group[i].width/4;
    pMin[i + nL][0] = 0;
    pMin[i + 2 * nL][0] = group[i].width / 4;

    pMax[i][0] = group[i].x + dt; // +group[i].width/4;
    pMax[i + nL][0] = 1.5;
    pMax[i + 2 * nL][0] = group[i].width * 4;

    dx[i][0] = -dt / 1000;
    dx[i + nL][0] = -1e-3;
    dx[i + 2 * nL][0] = -dt / 1000;
  }

  dx = -Math.abs(t[0][0] - t[1][0]) / 10000;
  let pFit = LM.optimize(
    sumOfLorentzians,
    pInit,
    t,
    yData,
    weight,
    dx,
    pMin,
    pMax,
    consts,
    opts,
  );
  pFit = pFit.p;
  // Put back the result in the correct format
  let result = new Array(nL);
  for (let i = 0; i < nL; i++) {
    result[i] = [pFit[i], [pFit[i + nL][0] * maxY], pFit[i + 2 * nL]];
  }

  return result;
}

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
export function optimizeGaussianSum(xy, group, opts) {
  let xy2 = parseData(xy);

  if (xy2 === null || xy2[0].rows < 3) {
    return null; // Cannot run an optimization with less than 3 points
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
  let nbPoints = t.rows;
  let i;

  let weight = new Matrix(nbPoints, 1); // [nbPoints / math.sqrt(y_data.dot(y_data))];
  let k = nbPoints / math.sqrt(yData.dot(yData));
  for (i = 0; i < nbPoints; i++) {
    weight[i][0] = k; // /(y_data[i][0]);
    // weight[i][0]=k*(2-y_data[i][0]);
  }

  opts = Object.create(
    opts || [3, 100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 2],
  );

  // var opts=[  3,    100, 1e-5, 1e-6, 1e-6, 1e-6, 1e-6,    11,    9,        1 ];
  let consts = []; // optional vector of constants

  let nL = group.length;
  let pInit = new Matrix(nL * 3, 1);
  let pMin = new Matrix(nL * 3, 1);
  let pMax = new Matrix(nL * 3, 1);
  let dx = new Matrix(nL * 3, 1);
  let dt = Math.abs(t[0][0] - t[1][0]);
  for (i = 0; i < nL; i++) {
    pInit[i][0] = group[i].x;
    pInit[i + nL][0] = group[i].y / maxY;
    pInit[i + 2 * nL][0] = group[i].width;

    pMin[i][0] = group[i].x - dt;
    pMin[i + nL][0] = (group[i].y * 0.8) / maxY;
    pMin[i + 2 * nL][0] = group[i].width / 2;

    pMax[i][0] = group[i].x + dt;
    pMax[i + nL][0] = (group[i].y * 1.2) / maxY;
    pMax[i + 2 * nL][0] = group[i].width * 2;

    dx[i][0] = -dt / 1000;
    dx[i + nL][0] = -1e-3;
    dx[i + 2 * nL][0] = -dt / 1000;
  }

  let pFit = LM.optimize(
    sumOfGaussians,
    pInit,
    t,
    yData,
    weight,
    dx,
    pMin,
    pMax,
    consts,
    opts,
  );
  pFit = pFit.p;
  // Put back the result in the correct format
  let result = new Array(nL);
  for (i = 0; i < nL; i++) {
    result[i] = [pFit[i], [pFit[i + nL][0] * maxY], pFit[i + 2 * nL]];
  }

  return result;
}
/**
 *
 * Converts the given input to the required x, y column matrices. y data is normalized to max(y)=1
 * @param xy
 * @returns {*[]}
 */
function parseData(xy, threshold) {
  let nbSeries = xy.length;
  let t = null;
  let yData = null;
  let x;
  let y;
  let maxY = 0;
  let nbPoints;

  if (nbSeries === 2) {
    // Looks like row wise matrix [x,y]
    nbPoints = xy[0].length;
    // if(nbPoints<3)
    //    throw new Exception(nbPoints);
    // else{
    t = new Array(nbPoints); // new Matrix(nbPoints,1);
    yData = new Array(nbPoints); // new Matrix(nbPoints,1);
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
      // It is a colum matrix
      if (typeof x[0] === 'object') {
        for (let i = 0; i < nbPoints; i++) {
          t[i] = x[i][0];
          yData[i] = y[i][0];
          if (y[i][0] > maxY) {
            maxY = y[i][0];
          }
        }
      }
    }

    // }
  } else {
    // Looks like a column wise matrix [[x],[y]]
    nbPoints = nbSeries;
    // if(nbPoints<3)
    //    throw new SizeException(nbPoints);
    // else {
    t = new Array(nbPoints); // new Matrix(nbPoints, 1);
    yData = new Array(nbPoints); // new Matrix(nbPoints, 1);
    for (let i = 0; i < nbPoints; i++) {
      t[i] = xy[i][0];
      yData[i] = xy[i][1];
      if (yData[i] > maxY) {
        maxY = yData[i];
      }
    }
    // }
  }
  // nbPoints = nbSeries;
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
/*
function sizeException(nbPoints) {
  return new RangeError(
    `Not enough points to perform the optimization: ${nbPoints}< 3`
  );
}
*/
