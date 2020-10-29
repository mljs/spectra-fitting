# ml-spectra-fitting

[![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url] [![npm download][download-image]][download-url]

Curve fitting method in javascript.

## Installation

`$ npm install ml-spectra-fitting`

## [API Documentation](https://mljs.github.io/spectra-fitting/)

This is spectra fitting package that support gaussian, lorentzian and pseudoVoigt kind of shapes. It is a wrapper of [ml-levenberg-marquardt](https://github.com/mljs/levenberg-marquardt)

## Example

```js
// import library
import { optimizeSum, optimize } from "ml-spectra-fitting";
// const { optimizeSum, optimize } = require('ml-levenberg-marquardt');

let nbPoints = 31;
let xFactor = 0.1;
let x = new Float64Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  x[i] = (i - nbPoints / 2) * xFactor;
}
// function that receives the parameters and returns
// a function with the independent variable as a parameter
function sumOfLorentzians(p) {
  return function (t) {
    let nL = p.length / 3;
    let result = 0;
    for (let i = 0; i < nL; i++) {
      let p2 = Math.pow(p[i + nL * 2] / 2, 2);
      let factor = p[i + nL] * p2;
      result += factor / (Math.pow(t - p[i], 2) + p2);
    }
    return result;
  };
}
// the real parameters of two shapes [x_1, x_2, y_1, y_2, w_1, w_2];
let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];

// create the y values
const func = sumOfLorentzians(pTrue);
y = x.map(func);

// array of points to fit
let data = {
  x,
  y,
};

const options = {
  kind: 'lorentzian',
  lmOptions: {
    damping: 1.5,
    gradientDifference: 10e-2,
    maxIterations: 100,
    errorTolerance: 10e-3,
  }
};

//the approximate values to be optimized, It could comming from a peak picking with ml-gsd
let peakList = [
  {
    x: -0.5,
    y: 0.0009,
    width: 0.38
  },
  { 
    x: 0.52, 
    y: 0.0011,  
    width: 0.37
  }
];
let fittedParams = optimizeSum(data, peakList, options);
console.log(fittedParams);
/**
 [
      {
        error: 0.000060723013888347444,
        parameters: [ -0.5000000332583525, 0.0009999898592624667, 0.3100032423580314 ]
      },
      {
        error: 0.000060723013888347444,
        parameters: [ 0.5000000281242463, 0.000999988836163871, 0.31000364272190883 ]
      }
    ]
 */
```

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/ml-spectra-fitting.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ml-spectra-fitting
[travis-image]: https://img.shields.io/travis/mljs/spectra-fitting/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/mljs/spectra-fitting
[download-image]: https://img.shields.io/npm/dm/ml-spectra-fitting.svg?style=flat-square
[download-url]: https://npmjs.org/package/ml-spectra-fitting
