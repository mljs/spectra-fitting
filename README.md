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
import { optimizeSum, optimize } from 'ml-spectra-fitting';
// const { optimizeSum, optimize } = require('ml-levenberg-marquardt');
import { SpectrumGenerator } from 'spectrum-generator';

const generator = new SpectrumGenerator({
  nbPoints: 31,
  from: -1,
  to: 1,
  shape: {
    kind: 'lorentzian',
    options: {
      fwhm: 10,
      length: 101,
    },
  },
});

generator.addPeak({ x: 0.5, y: 0.001 }, { width: 0.31 });
generator.addPeak({ x: -0.5, y: 0.001 }, { width: 0.31 });

//points to fit {x, y};
let data = spectrum.getSpectrum();

const options = {
  kind: 'lorentzian',
  lmOptions: {
    damping: 1.5,
    gradientDifference: 10e-2,
    maxIterations: 100,
    errorTolerance: 10e-3,
  },
};

//the approximate values to be optimized, It could comming from a peak picking with ml-gsd
let peakList = [
  {
    x: -0.5,
    y: 0.0009,
    width: 0.38,
  },
  {
    x: 0.52,
    y: 0.0011,
    width: 0.37,
  },
];

// the function recive a peaklist with {x, y, width} as a guess
// and return a list of objects
let pTrue = [-0.5, 0.5, 0.001, 0.001, 0.31, 0.31];

let fittedParams = optimizeSum(data, peakList, options);
console.log(fittedParams);
/**
 {
   error: 0.000060723013888347444,
   parameters: [
      {
        x: -0.5000000332583525, 
        y: 0.0009999898592624667, 
        width: 0.3100032423580314,
      },
      {
        x: 0.5000000281242463, 
        y: 0.000999988836163871, 
        width: 0.31000364272190883,
      }
    ]
  }
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
