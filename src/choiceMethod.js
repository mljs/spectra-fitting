import LM from 'ml-levenberg-marquardt';

const LEVENBERG_MARQUARDT = 1;

export function choiceMethod(optOptions = {}) {
  let { kind, options } = optOptions;
  kind = getKind(kind);
  switch (kind) {
    case 1:
      return { algorithm: LM, optOptions: checkOptions(kind, options) };
    default:
      throw new Error(`Unknown kind algorithm`);
  }
}

function checkOptions(kind, options = {}) {
  switch (kind) {
    case 1:
      return Object.assign({}, lmOptions, options);
    default:
      return;
  }
}

function getKind(kind) {
  if (typeof kind !== 'string') return kind;
  switch (kind.toLowerCase().replace(/[^a-z]/g, '')) {
    case 'lm':
    case 'levenbergmarquardt':
      return LEVENBERG_MARQUARDT;
    default:
      throw new Error(`Unknown kind algorithm`);
  }
}

const lmOptions = {
  damping: 1.5,
  gradientDifference: 1e-5,
  maxIterations: 100,
  errorTolerance: 10e-5,
};
