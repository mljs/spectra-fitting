import { optimizeSingleLorentzian } from './optimizeSingleLorentzian';

/*
 peaks on group should sorted
 */
export function optimizeLorentzianTrain(xy, group, opts = {}) {
  let t = xy[0];
  let yData = xy[1];
  let maxY = Math.max(...yData);
  //let norm = Math.sqrt(yData.reduce((a, b) => a + Math.pow(b, 2)));
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
    current = optimizeSingleLorentzian([tI, yI], group[i], opts);
    if (current) {
      result.push({
        x: current[0],
        y: current[1],
        width: current[2],
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
