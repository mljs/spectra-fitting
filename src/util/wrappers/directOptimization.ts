import { DataXY } from 'cheminfo-types';
import direct from 'ml-direct';

export function directOptimization(
  data: DataXY,
  sumOfShapes: (parameters: number[]) => (x: number) => number,
  options: any,
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
  const result = direct(objectiveFunction, minValues, maxValues, {
    iterations: maxIterations,
    epsilon,
    tolerance,
    tolerance2,
    initialState,
  });

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
