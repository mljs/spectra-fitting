declare module 'ml-direct' {
  interface DirectOptions {
    iterations: number;
    epsilon: number;
    tolerance: number;
    tolerance2: number;
    initialState: any;
  }

  interface DirectResult {
    optima: number[][];
    iterations: number;
    minFunctionValue: number;
  }

  export default function direct(
    objectiveFunction: (parameters: number[]) => number,
    minValues: number[],
    maxValues: number[],
    options: DirectOptions,
  ): DirectResult;
}
