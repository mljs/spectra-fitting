import type { DataXY, DoubleArray } from 'cheminfo-types';
import direct from 'ml-direct';

export interface InternalDirectOptimizationOptions {
  minValues: DoubleArray;
  maxValues: DoubleArray;
  maxIterations?: number;
  epsilon?: number;
  tolerance?: number;
  tolerance2?: number;
  initialState?: object;
}

/**
 * Run a direct optimization on the provided data using a sum-of-shapes model.
 * @param data - The observed x/y data to fit.
 * @param sumOfShapes - A function returning the model prediction for a given parameter vector.
 * @param options - Optimization bounds and solver options.
 * @returns The optimized parameter values, the final objective error, and the number of iterations.
 */
export function directOptimization(
  data: DataXY,
  sumOfShapes: (parameters: DoubleArray) => (x: number) => number,
  options: InternalDirectOptimizationOptions,
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

  const { optima, minFunctionValue, iterations } = result;

  return {
    parameterError: minFunctionValue,
    iterations,
    parameterValues: optima[0],
  };
}

function getObjectiveFunction(
  data: DataXY,
  sumOfShapes: (parameters: DoubleArray) => (x: number) => number,
) {
  const { x, y } = data;
  const nbPoints = x.length;
  return (parameters: DoubleArray) => {
    const fct = sumOfShapes(parameters);
    let error = 0;
    for (let i = 0; i < nbPoints; i++) {
      error += (y[i] - fct(x[i])) ** 2;
    }
    return error;
  };
}
