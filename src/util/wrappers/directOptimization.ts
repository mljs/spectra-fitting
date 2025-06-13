import type { DataXY } from 'cheminfo-types';
import direct from 'ml-direct';

export interface DirectOptimizationOptions {
  minValues: ArrayLike<number>;
  maxValues: ArrayLike<number>;
  maxIterations?: number;
  epsilon?: number;
  tolerance?: number;
  tolerance2?: number;
  initialState?: object;
}

export function directOptimization(
  data: DataXY,
  sumOfShapes: (parameters: number[]) => (x: number) => number,
  options: DirectOptimizationOptions,
) {
  const {
    minValues,
    maxValues,
    maxIterations,
    epsilon,
    tolerance,
    tolerance2,
    initialState,
  } = options;
  const objectiveFunction = getObjectiveFunction(data, sumOfShapes);
  const result = direct(
    objectiveFunction,
    // direct internally converts ArrayLike to Float64Array,
    // so we can safely cast minValues and maxValues to number[]
    minValues as number[],
    maxValues as number[],
    {
      iterations: maxIterations,
      epsilon,
      tolerance,
      tolerance2,
      initialState,
    },
  );

  const { optima } = result;

  return {
    parameterError: result.minFunctionValue,
    iterations: result.iterations,
    parameterValues: optima[0],
  };
}

function getObjectiveFunction(
  data: DataXY,
  sumOfShapes: (parameters: number[]) => (x: number) => number,
) {
  const { x, y } = data;
  const nbPoints = x.length;
  return (parameters: number[]) => {
    const fct = sumOfShapes(parameters);
    let error = 0;
    for (let i = 0; i < nbPoints; i++) {
      error += (y[i] - fct(x[i])) ** 2;
    }
    return error;
  };
}
