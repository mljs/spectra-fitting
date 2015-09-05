'use strict';


var Opt = require("../src/");

//console.log(Opt);
var Matrix = require("ml-matrix");

var nbPoints = 31;
var tFactor = 0.1;
var t = new Matrix(nbPoints,1);
var center = 0;
for(var i=0;i<nbPoints;i++){
    t[i][0]=(i-nbPoints/2)*tFactor;
}

describe('Optimize 4 parameters Lorentzian', function () {

    it('Should approximate the true parameters', function () {
        //[center,]
        var p_true = new Matrix([[0],[tFactor*nbPoints/10],[10],[0.15]]);

        var y = Opt.singleLorentzian(t, p_true, []);
        var result = Opt.optimizeSingleLorentzian(t,y);

        result[0][0].should.approximately(p_true[0][0],1e-3);
        result[1][0].should.approximately(p_true[1][0],1e-3);
        result[2][0].should.approximately(p_true[2][0],1e-3);
        result[3][0].should.approximately(p_true[3][0],1e-3);

        console.log(p_true);
        console.log(result);
    });
});

describe('Optimize 3 parameters Gaussian', function () {

    it('Should approximate the true parameters', function () {
        var p_true = new Matrix([[0],[tFactor*nbPoints/10],[234]]);

        var y = Opt.singleGaussian(t, p_true, []);
        var result = Opt.optimizeSingleGaussian(t,y);
        result[0][0].should.approximately(p_true[0][0],1e-3);
        result[1][0].should.approximately(p_true[1][0],1e-3);
        result[2][0].should.approximately(p_true[2][0],1e-3);

        console.log(p_true);
        console.log(result);
    });
});


