'use strict';

var LM = require('curve-fitting');
var Matrix = require('ml-matrix');

/**
 * This function calculates the spectrum as a sum of lorentzian functions. The Lorentzian
 * parameters are divided in 3 batches. 1st: centers; 2nd: heights; 3th: widths;
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
function sumOfLorentzians(t,p,c){
    var nL = p.length/3,factor,i, j,p2, cols = t.rows;
    var tmp = new Matrix(t.length,1), result = new Matrix(t.length,1);
    for(j=0;j<cols;j++){
        result[j][0]=0;
    }
    for(i=0;i<nL;i++){
        p2 = Math.pow(p[i+nL*2][0],2);
        factor = p[i+nL][0]*p2;
        for(j=0;j<cols;j++){
            result[j][0]+=factor/(Math.pow(t[j][0]-p[i][0],2)+p2);
        }
    }
    return result;
}
/**
 * Single 4 parameter lorentzian function
 * @param t Ordinate values
 * @param p Lorentzian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
function singleLorentzian(t,p,c){
    var factor = p[2][0]*Math.pow(p[1][0],2);
    var rows = t.rows;
    var result = new Matrix(t.rows, t.columns);
    for(var i=0;i<rows;i++){
        result[i][0]=p[3][0]+factor/(Math.pow(t[i][0]-p[0][0],2)+Math.pow(p[1][0],2));
    }
    return result;
}


function optimizeSingleLorentzian(data) {
    var nbPoints = data.length;
    var t = new Matrix(nbPoints,1);

    var y_data = new Matrix(nbPoints,1);

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

    var p_fit = LM.optimize(singleLorentzian,p_init,t,y_data,weight,-0.001,p_min,p_max,consts,opts);

    return [p_fit[0][0],p_fit[2][0]*maxY,p_fit[1][0]*2];

}
/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
function optimizeLorentzianSum(xy, group){
    //var xy = this.sampling(spectrum, group,false);
    var nbPoints = xy[0].length;
    var t = new Matrix(nbPoints,1);//independent variable
    var y_data = new Matrix(nbPoints,1);
    var maxY = 0,i;
    for(i=0;i<nbPoints;i++){
        t[i][0]=xy[0][i][0];
        y_data[i][0]=xy[1][i][0];
        if(y_data[i][0]>maxY)
            maxY = y_data[i][0];
    }
    for(i=0;i<nbPoints;i++){
        y_data[i][0]/=maxY
    }
    var weight = [nbPoints / math.sqrt(y_data.dot(y_data))];
    //console.log("weight: "+weight+" "+nbPoints );
    var opts = [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        1 ];
    var consts = [ ];// optional vector of constants

    var nL = group.length;
    var p_init = new Matrix(nL*3,1);
    var p_min =  new Matrix(nL*3,1);
    var p_max =  new Matrix(nL*3,1);
    for( i=0;i<nL;i++){
        p_init[i][0] = group[i][0];
        p_init[i+nL][0] = group[i][1]/maxY;
        p_init[i+2*nL][0] = group[i][2]/2;

        p_min[i][0] = group[i][0]-0.0025;
        p_min[i+nL][0] = 0;
        p_min[i+2*nL][0] = group[i][2]/8;

        p_max[i][0] = group[i][0]+0.0025;
        p_max[i+nL][0] = group[i][1]*1.3/maxY;
        p_max[i+2*nL][0] = group[i][2]*2;
    }

    var p_fit = LM.optimize(sumOfLorentzians,p_init,t,y_data,weight,-0.00005,p_min,p_max,consts,opts);

    //Put back the result in the correct format
    var result = new Array(nL);
    for( i=0;i<nL;i++){
        result[i]=[p_fit[i][0],p_fit[i+nL][0]*maxY,p_fit[i+2*nL][0]*2];
    }

    return result;

}

module.exports = optimizeSingleLorentzian;
module.exports = optimizeLorentzianSum;