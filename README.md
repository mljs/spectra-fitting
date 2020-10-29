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
import { optimizeSum } from 'ml-spectra-fitting';
import { SpectrumGenerator } from 'spectrum-generator';

const generator = new SpectrumGenerator({
  nbPoints: 41,
  from: -1,
  to: 1,
});

// calculate fhwm from the expected standard deviation.
const sdTofwhm = (sd) => 2 * Math.sqrt(2 * Math.log(2)) * sd;
generator.addPeak({ x: 0.5, y: 0.2 }, { width: sdTofwhm(0.2) });
generator.addPeak({ x: -0.5, y: 0.2 }, { width: sdTofwhm(0.3) });

//points to fit {x, y};
let data = generator.getSpectrum();

//the approximate values to be optimized, It could comming from a peak picking with ml-gsd
let peakList = [
  {
    x: -0.5,
    y: 0.18,
    width: 0.18,
  },
  {
    x: 0.52,
    y: 0.17,
    width: 0.37,
  },
];

// the function recive a peaklist with {x, y, width} as a guess
// and return a list of objects

let fittedParams = optimizeSum(data, peakList);
console.log(fittedParams);
/**
 {
    error: 0.010502794375558983,
    parameters: [
      {
        x: -0.49999760133593774,
        y: 0.1999880261075537,
        width: 0.3000369491704072
      },
      {
        x: 0.5000084944744884,
        y: 0.20004144804853427,
        width: 0.1999731186595336
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
