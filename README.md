# ml-spectra-fitting

[![NPM version](https://img.shields.io/npm/v/ml-spectra-fitting.svg)](https://www.npmjs.com/package/ml-spectra-fitting)
[![npm download](https://img.shields.io/npm/dm/ml-spectra-fitting.svg)](https://www.npmjs.com/package/ml-spectra-fitting)
[![test coverage](https://img.shields.io/codecov/c/github/mljs/spectra-fitting.svg)](https://codecov.io/gh/mljs/spectra-fitting)
[![license](https://img.shields.io/npm/l/ml-spectra-fitting.svg)](https://github.com/mljs/spectra-fitting/blob/main/LICENSE)

This is a spectra fitting package to optimize the position (x), max intensity (y),
full width at half-maximum (FWHM = width) and the ratio of gaussian contribution (mu) if it's required.

It supports the `gaussian`, `lorentzian`, `pseudoVoigt`, `pseudoVoigtTCH`,
`lorentzianDispersive`, `generalizedLorentzian` and `splitGaussian` shapes of
[ml-peak-shape-generator](https://github.com/mljs/peak-shape-generator).
The `splitGaussian` shape is asymmetric: it is parameterized by `fwhmLow` and
`fwhmHigh` instead of `fwhm`, and both are optimized independently.
The three most common ones are:

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

generator.addPeak(
  { x: 0.5, y: 0.2 },
  { shape: { kind: 'gaussian', fwhm: 0.2 } },
);
generator.addPeak(
  { x: -0.5, y: 0.2 },
  { shape: { kind: 'lorentzian', fwhm: 0.1 } },
);

//points to fit {x, y};
const data = generator.getSpectrum();

//the approximate values to be optimized, it could come from a peak picking with ml-gsd
const peaks = [
  {
    x: -0.5,
    y: 0.22,
    shape: {
      kind: 'pseudoVoigt',
      fwhm: 0.25,
    },
  },
  {
    x: 0.52,
    y: 0.18,
    shape: {
      kind: 'pseudoVoigt',
      fwhm: 0.18,
    },
  },
];

// the function receives an array of peaks with {x, y, shape} as a guess
// and returns the optimized peaks
const fittedParams = optimize(data, peaks);

console.log(fittedParams);
// {
//   error: 3.689192965926774e-8,
//   iterations: 100,
//   peaks: [
//     {
//       x: -0.49999998364851705,
//       y: 0.2000001018716569,
//       shape: { kind: 'pseudoVoigt', fwhm: 0.10000007214964078, mu: 0 },
//     },
//     {
//       x: 0.500000000861883,
//       y: 0.1999983363407256,
//       shape: { kind: 'pseudoVoigt', fwhm: 0.20000322106167928, mu: 1 },
//     },
//   ],
// }
```

A `pseudoVoigt` fit recovers `mu = 0` for the lorentzian peak and `mu = 1` for
the gaussian one. Each peak's own `shape.kind` wins over the `shape` passed in
the options, which only applies to peaks that do not define one.

## Linked parameters

You can link one parameter across multiple peaks so they share one optimization
variable.

For each linked peak, the actual parameter value is reconstructed as:

```text
actualValue = sharedVariable * factor + offset
```

By default, `factor = 1` and `offset = 0`.

```js
import { optimize } from 'ml-spectra-fitting';

const result = optimize(data, peaks, {
  parameters: {
    x: { optimize: false },
  },
  linkedParameters: [
    {
      parameter: 'fwhm',
      peaks: [{ id: 'left' }, { id: 'right' }],
    },
    {
      parameter: 'y',
      peaks: [
        { id: 'left', factor: 1 },
        { id: 'right', factor: 2 },
      ],
    },
  ],
});
```

`linkedParameters.peaks[].id` accepts either the peak index or peak `id`.

If the linked parameter is `y`, `offset` is interpreted in the original Y scale.

## License

[MIT](./LICENSE)
