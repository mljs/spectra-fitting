let { optimizeLorentzianTrain, singleLorentzian } = require('../lib/index');

let nbPoints = 31;
let tFactor = 0.1;
let t = new Array(nbPoints);
for (let i = 0; i < nbPoints; i++) {
  t[i] = (i - nbPoints / 2) * tFactor;
}

let pTrue = [0, 0.001, (tFactor * nbPoints) / 10];
let yData = singleLorentzian(pTrue);
let groups = [
  {
    x: 0.1,
    y: 0.0009,
    width: (tFactor * nbPoints) / 6,
  },
];
let result = optimizeLorentzianTrain([t, yData(t)], groups);
let nL = pTrue.length / 3;
for (let i = 0; i < nL; i++) {
  let pFit = result[i];
}
