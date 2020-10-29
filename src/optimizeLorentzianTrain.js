import { optimizeSingleLorentzian } from './optimizeSingleLorentzian';

/*
 peaks on group should sorted
 */
export function optimizeLorentzianTrain(xy, group, options = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  yData.forEach((x, i, arr) => (arr[i] /= maxY));
  let currentIndex = 0;
  let nbPoints = t.length;
  let nextX;
  let tI, yI;
  let result = [];
  let current;
  for (let i = 0; i < group.length; i++) {
    nextX = group[i].x - group[i].width * 1.5;
    while (t[currentIndex++] < nextX && currentIndex < nbPoints);
    nextX = group[i].x + group[i].width * 1.5;
    tI = [];
    yI = [];
    while (t[currentIndex] <= nextX && currentIndex < nbPoints) {
      tI.push(t[currentIndex]);
      yI.push(yData[currentIndex] * maxY);
      currentIndex++;
    }
    current = optimizeSingleLorentzian([tI, yI], group[i], options);
    if (current) {
      result.push({
        x: current.parameters[0],
        y: current.parameters[1],
        width: current.parameters[2],
        opt: true,
      });
    } else {
      result.push({
        x: group[i].x,
        y: group[i].y,
        width: group[i].width,
        opt: false,
      });
    }
  }
  return result;
}
