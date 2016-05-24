'use strict';

var LM = require('ml-curve-fitting');
var math = LM.Matrix.algebra;
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
    var result = Matrix.zeros(t.length,1);

    for(i=0;i<nL;i++){
        p2 = Math.pow(p[i+nL*2][0]/2,2);
        factor = p[i+nL][0]*p2;
        for(j=0;j<cols;j++){
            result[j][0]+=factor/(Math.pow(t[j][0]-p[i][0],2)+p2);
        }
    }
    return result;
}

/**
 * This function calculates the spectrum as a sum of gaussian functions. The Gaussian
 * parameters are divided in 3 batches. 1st: centers; 2nd: height; 3th: std's;
 * @param t Ordinate values
 * @param p Gaussian parameters
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
function sumOfGaussians(t,p,c){
    var nL = p.length/3,factor,i, j, cols = t.rows;
    var result = Matrix.zeros(t.length,1);

    for(i=0;i<nL;i++){
        factor = p[i+nL*2][0]*p[i+nL*2][0]/2;
        for(j=0;j<cols;j++){
            result[j][0]+=p[i+nL][0]*Math.exp(-(t[i][0]-p[i][0])*(t[i][0]-p[i][0])/factor);
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
    var factor = p[1][0]*Math.pow(p[2][0]/2,2);
    var rows = t.rows;
    var result = new Matrix(t.rows, t.columns);
    for(var i=0;i<rows;i++){
        result[i][0]=factor/(Math.pow(t[i][0]-p[0][0],2)+Math.pow(p[2][0]/2,2));
    }
    return result;
}

/**
 * Single 3 parameter gaussian function
 * @param t Ordinate values
 * @param p Gaussian parameters [mean, height, std]
 * @param c Constant parameters(Not used)
 * @returns {*}
 */
function singleGaussian(t,p,c){
    var factor2 = p[2][0]*p[2][0]/2;
    var rows = t.rows;
    var result = new Matrix(t.rows, t.columns);
    for(var i=0;i<rows;i++){
        result[i][0]=p[1][0]*Math.exp(-(t[i][0]-p[0][0])*(t[i][0]-p[0][0])/factor2);
    }
    return result;
}

/**
 * * Fits a set of points to a Lorentzian function. Returns the center of the peak, the width at half height, and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
function optimizeSingleLorentzian(xy, peak, opts) {
    opts = opts || {};
    var xy2 = parseData(xy, opts.percentage||0);

    if(xy2===null||xy2[0].rows<3){
        return null; //Cannot run an optimization with less than 3 points
    }

    var t = xy2[0];
    var y_data = xy2[1];
    var maxY = xy2[2];
    var nbPoints = t.rows, i;

    var weight = [nbPoints / Math.sqrt(y_data.dot(y_data))];

    var opts=Object.create(opts.LMOptions || [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        1 ]);
    //var opts = [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        1 ];
    var consts = [ ];
    var dt = Math.abs(t[0][0]-t[1][0]);// optional vector of constants
    var dx = new Matrix([[-dt/10000],[-1e-3],[-dt/10000]]);//-Math.abs(t[0][0]-t[1][0])/100;
    var p_init = new Matrix([[peak.x],[1],[peak.width]]);
    var p_min = new Matrix([[peak.x-dt],[0.75],[peak.width/4]]);
    var p_max = new Matrix([[peak.x+dt],[1.25],[peak.width*4]]);

    var p_fit = LM.optimize(singleLorentzian,p_init,t,y_data,weight,dx,p_min,p_max,consts,opts);


    p_fit = p_fit.p;
    return [p_fit[0],[p_fit[1][0]*maxY],p_fit[2]];

}

/**
 * Fits a set of points to a gaussian bell. Returns the mean of the peak, the std and the height of the signal.
 * @param data,[y]
 * @returns {*[]}
 */
function optimizeSingleGaussian(xy, peak, opts) {
    opts = opts || {};
    var xy2 = parseData(xy, opts.percentage||0);

    if(xy2===null||xy2[0].rows<3){
        return null; //Cannot run an optimization with less than 3 points
    }

    var t = xy2[0];
    var y_data = xy2[1];
    var maxY = xy2[2];

    var nbPoints = t.rows, i;



    var weight = [nbPoints / Math.sqrt(y_data.dot(y_data))];

    var opts=Object.create(opts.LMOptions || [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        1 ]);
    //var opts = [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        1 ];
    var consts = [ ];                         // optional vector of constants
    var dt = Math.abs(t[0][0]-t[1][0]);
    var dx = new Matrix([[-dt/10000],[-1e-3],[-dt/10000]]);//-Math.abs(t[0][0]-t[1][0])/100;

    var dx = new Matrix([[-Math.abs(t[0][0]-t[1][0])/1000],[-1e-3],[-peak.width/1000]]);
    var p_init = new Matrix([[peak.x],[1],[peak.width]]);
    var p_min = new Matrix([[peak.x-dt],[0.75],[peak.width/4]]);
    var p_max = new Matrix([[peak.x+dt],[1.25],[peak.width*4]]);
    //var p_min = new Matrix([[peak.x-peak.width/4],[0.75],[peak.width/3]]);
    //var p_max = new Matrix([[peak.x+peak.width/4],[1.25],[peak.width*3]]);

    var p_fit = LM.optimize(singleGaussian,p_init,t,y_data,weight,dx,p_min,p_max,consts,opts);
    p_fit = p_fit.p;
    return [p_fit[0],[p_fit[1][0]*maxY],p_fit[2]];
}

/*
 peaks on group should sorted
 */
function optimizeLorentzianTrain(xy, group, opts){
    var xy2 = parseData(xy);
    //console.log(xy2[0].rows);
    if(xy2===null||xy2[0].rows<3){
        return null; //Cannot run an optimization with less than 3 points
    }

    var t = xy2[0];
    var y_data = xy2[1];
    var maxY = xy2[2];
    var currentIndex = 0;
    var nbPoints = t.length;
    var nextX;
    var tI, yI, maxY;
    var result=[], current;
    for(var i=0; i<group.length;i++){
        nextX = group[i].x-group[i].width*1.5;
        //console.log(group[i]);
        while(t[currentIndex++]<nextX&&currentIndex<nbPoints);
        nextX = group[i].x+group[i].width*1.5;
        tI = [];
        yI = [];
        while(t[currentIndex]<=nextX&&currentIndex<nbPoints){
            tI.push(t[currentIndex][0]);
            yI.push(y_data[currentIndex][0]*maxY);
            currentIndex++;
        }

        current=optimizeSingleLorentzian([tI, yI], group[i], opts);
        if(current){
            result.push({"x":current[0][0],"y":current[1][0],"width":current[2][0],"opt":true});
        }
        else{
            result.push({"x":group[i].x,"y":group[i].y,"width":group[i].width,"opt":false});
        }
    }

    return result;

}

function optimizeGaussianTrain(xy, group, opts){
    var xy2 = parseData(xy);
    //console.log(xy2[0].rows);
    if(xy2===null||xy2[0].rows<3){
        return null; //Cannot run an optimization with less than 3 points
    }

    var t = xy2[0];
    var y_data = xy2[1];
    var maxY = xy2[2];
    var currentIndex = 0;
    var nbPoints = t.length;
    var nextX;
    var tI, yI, maxY;
    var result=[], current;
    for(var i=0; i<group.length;i++){
        nextX = group[i].x-group[i].width*1.5;
        //console.log(group[i]);
        while(t[currentIndex++]<nextX&&currentIndex<nbPoints);
        nextX = group[i].x+group[i].width*1.5;
        tI = [];
        yI = [];
        while(t[currentIndex]<=nextX&&currentIndex<nbPoints){
            tI.push(t[currentIndex][0]);
            yI.push(y_data[currentIndex][0]*maxY);
            currentIndex++;
        }

        current=optimizeSingleGaussian([tI, yI], group[i], opts);
        if(current){
            result.push({"x":current[0][0],"y":current[1][0],"width":current[2][0],"opt":true});
        }
        else{
            result.push({"x":group[i].x,"y":group[i].y,"width":group[i].width,"opt":false});
        }
    }

    return result;
}



/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
function optimizeLorentzianSum(xy, group, opts){
    var xy2 = parseData(xy);

    if(xy2===null||xy2[0].rows<3){
        return null; //Cannot run an optimization with less than 3 points
    }

    var t = xy2[0];
    var y_data = xy2[1];
    var maxY = xy2[2];
    var nbPoints = t.rows, i;

    var weight = [nbPoints / math.sqrt(y_data.dot(y_data))];
    var opts=Object.create(opts || [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2, 11, 9, 1 ]);
    var consts = [ ];// optional vector of constants

    var nL = group.length;
    var p_init = new Matrix(nL*3,1);
    var p_min =  new Matrix(nL*3,1);
    var p_max =  new Matrix(nL*3,1);
    var dx = new Matrix(nL*3,1);
    var dt = Math.abs(t[0][0]-t[1][0]);
    for( i=0;i<nL;i++){
        p_init[i][0] = group[i].x;
        p_init[i+nL][0] = 1;
        p_init[i+2*nL][0] = group[i].width;

        p_min[i][0] = group[i].x-dt;//-group[i].width/4;
        p_min[i+nL][0] = 0;
        p_min[i+2*nL][0] = group[i].width/4;

        p_max[i][0] = group[i].x+dt;//+group[i].width/4;
        p_max[i+nL][0] = 1.5;
        p_max[i+2*nL][0] = group[i].width*4;

        dx[i][0] = -dt/1000;
        dx[i+nL][0] = -1e-3;
        dx[i+2*nL][0] = -dt/1000;
    }

    var dx = -Math.abs(t[0][0]-t[1][0])/10000;
    var p_fit = LM.optimize(sumOfLorentzians, p_init, t, y_data, weight, dx, p_min, p_max, consts, opts);
    p_fit=p_fit.p;
    //Put back the result in the correct format
    var result = new Array(nL);
    for( i=0;i<nL;i++){
        result[i]=[p_fit[i],[p_fit[i+nL][0]*maxY],p_fit[i+2*nL]];
    }

    return result;

}

/**
 *
 * @param xy A two column matrix containing the x and y data to be fitted
 * @param group A set of initial lorentzian parameters to be optimized [center, heigth, half_width_at_half_height]
 * @returns {Array} A set of final lorentzian parameters [center, heigth, hwhh*2]
 */
function optimizeGaussianSum(xy, group, opts){
    var xy2 = parseData(xy);

    if(xy2===null||xy2[0].rows<3){
        return null; //Cannot run an optimization with less than 3 points
    }

    var t = xy2[0];
    var y_data = xy2[1];
    var maxY = xy2[2];
    var nbPoints = t.rows,i;

    var weight = new Matrix(nbPoints,1);//[nbPoints / math.sqrt(y_data.dot(y_data))];
    var k = nbPoints / math.sqrt(y_data.dot(y_data));
    for(i=0;i<nbPoints;i++){
        weight[i][0]=k;///(y_data[i][0]);
        //weight[i][0]=k*(2-y_data[i][0]);
    }

    var opts=Object.create(opts || [  3,    100, 1e-3, 1e-3, 1e-3, 1e-2, 1e-2,    11,    9,        2 ]);
    //var opts=[  3,    100, 1e-5, 1e-6, 1e-6, 1e-6, 1e-6,    11,    9,        1 ];
    var consts = [ ];// optional vector of constants

    var nL = group.length;
    var p_init = new Matrix(nL*3,1);
    var p_min =  new Matrix(nL*3,1);
    var p_max =  new Matrix(nL*3,1);
    var dx = new Matrix(nL*3,1);
    var dt = Math.abs(t[0][0]-t[1][0]);
    for( i=0;i<nL;i++){
        p_init[i][0] = group[i].x;
        p_init[i+nL][0] = group[i].y/maxY;
        p_init[i+2*nL][0] = group[i].width;

        p_min[i][0] = group[i].x-dt;
        p_min[i+nL][0] = group[i].y*0.8/maxY;
        p_min[i+2*nL][0] = group[i].width/2;

        p_max[i][0] = group[i].x+dt;
        p_max[i+nL][0] = group[i].y*1.2/maxY;
        p_max[i+2*nL][0] = group[i].width*2;

        dx[i][0] = -dt/1000;
        dx[i+nL][0] = -1e-3;
        dx[i+2*nL][0] = -dt/1000;
    }
    //console.log(t);
    var p_fit = LM.optimize(sumOfLorentzians,p_init,t,y_data,weight,dx,p_min,p_max,consts,opts);
    p_fit = p_fit.p;
    //Put back the result in the correct format
    var result = new Array(nL);
    for( i=0;i<nL;i++){
        result[i]=[p_fit[i],[p_fit[i+nL][0]*maxY],p_fit[i+2*nL]];
    }

    return result;

}
/**
 *
 * Converts the given input to the required x, y column matrices. y data is normalized to max(y)=1
 * @param xy
 * @returns {*[]}
 */
function parseData(xy, threshold){
    var nbSeries = xy.length;
    var t = null;
    var y_data = null, x,y;
    var maxY = 0, i,j;

    if(nbSeries==2){
        //Looks like row wise matrix [x,y]
        var nbPoints = xy[0].length;
        //if(nbPoints<3)
        //    throw new Exception(nbPoints);
        //else{
        t = new Array(nbPoints);//new Matrix(nbPoints,1);
        y_data = new Array(nbPoints);//new Matrix(nbPoints,1);
        x = xy[0];
        y = xy[1];
        if(typeof x[0] === "number"){
            for(i=0;i<nbPoints;i++){
                t[i]=x[i];
                y_data[i]=y[i];
                if(y[i]>maxY)
                    maxY = y[i];
            }
        }
        else{
            //It is a colum matrix
            if(typeof x[0] === "object"){
                for(i=0;i<nbPoints;i++){
                    t[i]=x[i][0];
                    y_data[i]=y[i][0];
                    if(y[i][0]>maxY)
                        maxY = y[i][0];
                }
            }

        }

        //}
    }
    else{
        //Looks like a column wise matrix [[x],[y]]
        var nbPoints = nbSeries;
        //if(nbPoints<3)
        //    throw new SizeException(nbPoints);
        //else {
        t = new Array(nbPoints);//new Matrix(nbPoints, 1);
        y_data = new Array(nbPoints);//new Matrix(nbPoints, 1);
        for (i = 0; i < nbPoints; i++) {
            t[i] = xy[i][0];
            y_data[i] = xy[i][1];
            if(y_data[i]>maxY)
                maxY = y_data[i];
        }
        //}
    }
    for (i = 0; i < nbPoints; i++) {
        y_data[i]/=maxY;
    }
    if(threshold){
        for (i = nbPoints-1; i >=0; i--) {
            if(y_data[i]<threshold) {
                y_data.splice(i,1);
                t.splice(i,1);
            }
        }
    }
    if(t.length>0)
        return [(new Matrix([t])).transpose(),(new Matrix([y_data])).transpose(),maxY];
    return null;
}

function sizeException(nbPoints) {
    return new RangeError("Not enough points to perform the optimization: "+nbPoints +"< 3");
}

module.exports.optimizeSingleLorentzian = optimizeSingleLorentzian;
module.exports.optimizeLorentzianSum = optimizeLorentzianSum;
module.exports.optimizeSingleGaussian = optimizeSingleGaussian;
module.exports.optimizeGaussianSum = optimizeGaussianSum;
module.exports.singleGaussian = singleGaussian;
module.exports.singleLorentzian = singleLorentzian;
module.exports.optimizeGaussianTrain = optimizeGaussianTrain;
module.exports.optimizeLorentzianTrain = optimizeLorentzianTrain;