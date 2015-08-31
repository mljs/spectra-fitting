'use strict';

var LM = require('curve-fitting');
var Matrix = require('ml-matrix');

function lm_func(t,p,c){
    var factor = p[2][0]*Math.pow(p[1][0],2);
    var rows = t.rows;
    var result = new Matrix(t.rows, t.columns);
    for(var i=0;i<rows;i++){
        result[i][0]=p[3][0]+factor/(Math.pow(t[i][0]-p[0][0],2)+Math.pow(p[1][0],2));
    }
    return result;
}


function optimize(data) {
    var nbPoints = data.length;
    var t = new Matrix(nbPoints,1);

    var y_data = new Matrix(nbPoints,1);
    var sum = 0;
    var maxY = 0;
    for(var i=0;i<nbPoints;i++){
        t[i][0]=data[i][0];
        y_data[i][0]=data[i][1];
        if(data[i][1]>maxY)
            maxY = data[i][1];
    }


    for(var i=0;i<nbPoints;i++){
        y_data[i][0]/=maxY
    }
    var weight = [nbPoints / Math.sqrt(y_data.dot(y_data))];

    var opts = [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        1 ];
    var consts = [ ];                         // optional vector of constants

    var p_init = new Matrix([[(t[0][0]+t[nbPoints-1][0])/2],[Math.abs(t[0][0]-t[nbPoints-1][0])/2],[1],[0]]);
    var p_min = new Matrix([[t[0][0]],[0.0],[0],[0]]);
    var p_max = new Matrix([[t[nbPoints-1][0]],[Math.abs(t[0][0]-t[nbPoints-1][0])],[1.5],[0.5]]);

    var p_fit = LM.optimize(lm_func,p_init,t,y_data,weight,-0.01,p_min,p_max,consts,opts);

    return [p_fit[0][0],p_fit[2][0]*maxY,p_fit[1][0]*2];

}

module.exports = optimize;