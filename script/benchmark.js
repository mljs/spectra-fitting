// To create a benchmark report: `node --cpu-prof benchmark.js`

import { generateSpectrum } from 'spectrum-generator';

import { optimize } from '../src/index.ts';

const nbPeaks = 5;
let peaks = [];
for (let i = 0; i < nbPeaks; i++) {
  peaks.push({
    x: i,
    y: 2,
    shape: { kind: 'gaussian', fwhm: 0.5 },
  });
}
const data = generateSpectrum(peaks, {
  generator: {
    from: -20,
    to: 50,
    nbPoints: 10001,
  },
});

let guess = structuredClone(peaks);
guess.forEach((peak) => (peak.x += Math.random() / 10));

let result = optimize(data, guess, {
  optimization: { options: { maxIterations: 10 } },
});

console.log(result);
