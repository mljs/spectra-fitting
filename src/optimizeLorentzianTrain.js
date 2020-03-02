import { optimizeSingleLorentzian } from './optimizeSingleLorentzian';
import { parseData } from './parseData';

/*
 peaks on group should sorted
 */
export function optimizeLorentzianTrain(xy, group, opts) {
  let xy2 = parseData(xy);

  if (xy2 === null || xy2[0].rows < 3) {
    return null;
  }

  let t = xy2[0];
  let yData = xy2[1];
  let maxY = xy2[2];
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
      tI.push(t[currentIndex][0]);
      yI.push(yData[currentIndex][0] * maxY);
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
