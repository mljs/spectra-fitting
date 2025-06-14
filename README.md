# ml-spectra-fitting

[![NPM version](https://img.shields.io/npm/v/ml-spectra-fitting.svg)](https://www.npmjs.com/package/ml-spectra-fitting)
[![npm download](https://img.shields.io/npm/dm/ml-spectra-fitting.svg)](https://www.npmjs.com/package/ml-spectra-fitting)
[![test coverage](https://img.shields.io/codecov/c/github/mljs/spectra-fitting.svg)](https://codecov.io/gh/mljs/spectra-fitting)
[![license](https://img.shields.io/npm/l/ml-spectra-fitting.svg)](https://github.com/mljs/spectra-fitting/blob/main/LICENSE)

This is a spectra fitting package to optimize the position (x), max intensity (y),
full width at half-maximum (FWHM = width) and the ratio of gaussian contribution (mu) if it's required.
It supports three kinds of shapes:

| Name         |                                                                                                                            Equation                                                                                                                             |
| ------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| Gaussian     |                                                                 <img src="https://tex.cheminfo.org/?tex=y%20%5Ccdot%20exp%20%5Cleft%5B%5Cfrac%7B%5Cdelta%7D%7B2%20%5Csigma%5E2%7D%5Cright%5D"/>                                                                 |
| Lorentzian   |                                                                             <img src="https://tex.cheminfo.org/?tex=y%5Ccdot%5Cfrac%7B%5Cgamma%7D%7B%5Cdelta%20%2B%20%5Cgamma%7D"/>                                                                             |
| Pseudo Voigt | <img src="https://tex.cheminfo.org/?tex=y%20*%20%5Cleft%5B%5Cmu%20%5Ccdot%20exp%20%5Cleft%5B%5Cfrac%7B%5Cdelta%7D%7B2%20%5Csigma%5E2%7D%5Cright%5D%20%2B%20(1%20-%20%5Cmu)%20%5Ccdot%20%5Cfrac%7B%5Cgamma%7D%7B%5Cdelta%20%2B%20%5Cgamma%7D%20%5Cright%5D%0A"/> |

where

| <img src="https://tex.cheminfo.org/?tex=%5Cdelta%20%3D%20%5Cleft(t%20-%20x%5Cright)%5E2%0A"/> | <img src="https://tex.cheminfo.org/?tex=%5Csigma%20%3D%20%5Cfrac%7BFWHM%7D%7B2%5Csqrt%7B2%20%5Ccdot%20Ln(2)%7D%7D"/> | <img src="https://tex.cheminfo.org/?tex=%5Cgamma%3D%5Cleft(FWHM%5Cright)%5E2"/> |
| --------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------ |

It is a wrapper of [ml-levenberg-marquardt](https://github.com/mljs/levenberg-marquardt)

## [API Documentation](https://mljs.github.io/spectra-fitting/)

## Installation

```console
npm i ml-spectra-fitting
```

## Example

```js
import { optimize } from 'ml-spectra-fitting';
import { SpectrumGenerator } from 'spectrum-generator';

const generator = new SpectrumGenerator({
  nbPoints: 101,
  from: -1,
  to: 1,
});

// by default the kind of shape is gaussian;
generator.addPeak({ x: 0.5, y: 0.2 }, { fwhm: 0.2 });
generator.addPeak(
  { x: -0.5, y: 0.2 },
  {
    shape: {
      kind: 'lorentzian',
      fwhm: 0.1,
    },
  },
);

//points to fit {x, y};
let data = generator.getSpectrum();
console.log(JSON.stringify({ x: Array.from(data.x), y: Array.from(data.y) }));
//the approximate values to be optimized, It could coming from a peak picking with ml-gsd
let peaks = [
  {
    x: -0.5,
    y: 0.22,
    shape: {
      kind: 'gaussian',
      fwhm: 0.25,
    },
  },
  {
    x: 0.52,
    y: 0.18,
    shape: {
      kind: 'gaussian',
      fwhm: 0.18,
    },
  },
];

// the function receive an array of peak with {x, y, fwhm} as a guess
// and return a list of objects
let fittedParams = optimize(data, peaks, { shape: { kind: 'pseudoVoigt' } });

console.log(fittedParams);
const result = {
  error: 0.12361588652854476,
  iterations: 100,
  peaks: [
    {
      x: -0.5000014532421942,
      y: 0.19995307937326137,
      shape: {
        kind: 'pseudoVoigt',
        fwhm: 0.10007670374735196,
        mu: 0.004731136777288483,
      },
    },
    {
      x: 0.5001051783652894,
      y: 0.19960010175400406,
      shape: {
        kind: 'pseudoVoigt',
        fwhm: 0.19935932346969124,
        mu: 1,
      },
    },
  ],
};
```

For data with and combination of signals with shapes between gaussian and lorentzians, we could use the kind pseudovoigt to fit the data.

```js
import { optimize } from 'ml-spectra-fitting';
import { SpectrumGenerator } from 'spectrum-generator';

const generator = new SpectrumGenerator({
  nbPoints: 101,
  from: -1,
  to: 1,
});

// by default the kind of shape is gaussian;
generator.addPeak({ x: 0.5, y: 0.2 }, { fwhm: 0.2 });
generator.addPeak(
  { x: -0.5, y: 0.2 },
  {
    shape: {
      kind: 'lorentzian',
      fwhm: 0.1,
    },
  },
);

//points to fit {x, y};
let data = generator.getSpectrum();
console.log(JSON.stringify({ x: Array.from(data.x), y: Array.from(data.y) }));
//the approximate values to be optimized, It could coming from a peak picking with ml-gsd
let peaks = [
  {
    x: -0.5,
    y: 0.22,
    shape: {
      kind: 'gaussian',
      fwhm: 0.25,
    },
  },
  {
    x: 0.52,
    y: 0.18,
    shape: {
      kind: 'gaussian',
      fwhm: 0.18,
    },
  },
];

// the function receive an array of peak with {x, y, fwhm} as a guess
// and return a list of objects
let fittedParams = optimize(data, peaks, { shape: { kind: 'pseudoVoigt' } });

console.log(fittedParams);
const result = {
  error: 0.12361588652854476,
  iterations: 100,
  peaks: [
    {
      x: -0.5000014532421942,
      y: 0.19995307937326137,
      shape: {
        kind: 'pseudoVoigt',
        fwhm: 0.10007670374735196,
        mu: 0.004731136777288483,
      },
    },
    {
      x: 0.5001051783652894,
      y: 0.19960010175400406,
      shape: {
        kind: 'pseudoVoigt',
        fwhm: 0.19935932346969124,
        mu: 1,
      },
    },
  ],
};
```

## License

[MIT](./LICENSE)
