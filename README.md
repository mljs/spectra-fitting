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
import { optimizeSum } from '../index'; //'ml-spectra-fitting';
// const { optimizeSum } = require('ml-levenberg-marquardt');
import { SpectrumGenerator } from 'spectrum-generator';

const generator = new SpectrumGenerator({
  nbPoints: 41,
  from: -1,
  to: 1,
  shape: {
    kind: 'lorentzian',
    options: {
      fwhm: 100,
      length: 1001,
    },
  },
});

generator.addPeak({ x: 0.5, y: 0.2 }, { width: 0.3 });
generator.addPeak({ x: -0.5, y: 0.2 }, { width: 0.3 });

//points to fit {x, y};
let data = generator.getSpectrum();

const options = {
  kind: 'lorentzian',
  lmOptions: {
    damping: 1.5,
    gradientDifference: 10e-2,
    maxIterations: 300,
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

let fittedParams = optimizeSum(data, peakList, options);
console.log(fittedParams);
/**
 {
    error: 0.05813844262141718,
    parameters: [
      {
        x: -0.4999207613519728,
        y: 0.2004969777358536,
        width: 0.3003891480106094
      },
      {
        x: 0.5000683878450357,
        y: 0.20050244686414306,
        width: 0.3003654573416818
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
