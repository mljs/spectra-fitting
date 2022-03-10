import { Peak1D } from '../index';

interface TypeRange {
  name : string,
  init : number | ((peak: Peak1D) => number) | (() => number),
  min : number | ((peak: Peak1D) => number) | (() => number),
  max : number | ((peak: Peak1D) => number) | (() => number),
  gradientDifference : number | ((peak: Peak1D) => number) | (() => number),
}

/** Algorithm to assign deep
 * @param target
 */
export function assignDeep(target: Record<string, any>, defaultParameters : { x : Record<string, any>, y : Record<string, any>, fwhm : Record<string, any>, mu : Record<string, any>}, parameters?: TypeRange[]) {
  if (!target) target = {};
  if (!parameters) {
    target = defaultParameters;
  } else {
    for (let key in defaultParameters) {
      let Found = false;
      for(let range of parameters) {
        if(key === range.name) {
          target[key] = {init : range.init, min : range.min, max: range.max, gradientDifference : range.gradientDifference};
          Found = true;
        }
      }
      if(Found === false) {
        target[key] = defaultParameters[key as keyof typeof defaultParameters];
      }
    }
  }
  return target;
}
