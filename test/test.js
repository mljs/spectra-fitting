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

describe('Optimize 4 parameters of a linear combination of gaussian and lorentzians', function () {
    it('group of two GL ', function () {
        var pTrue = new Matrix([[-0.05],[0.05], [0.001], [0.001], [tFactor*nbPoints/50], [tFactor*nbPoints/50], [0.1], [0.1]]);
        var yData = Opt.sumOfGaussianLorentzians(t, pTrue);
        var result = Opt.optimizeGaussianLorentzianSum([t, yData], [{x:-0.051,y:0.0009,width:tFactor*nbPoints/50}, {x:0.052,y:0.0009,width:tFactor*nbPoints/50}]);
        console.log(result)
        for (let r of result) {

            r[0][0].should.approximately(pTrue[0][0],1e-3);
            r[1][0].should.approximately(pTrue[2][0],1e-3);
            r[2][0].should.approximately(pTrue[4][0],1e-3);
            r[3][0].should.approximately(pTrue[6][0],1e-3);
        }
    })
});
describe('Optimize 4 parameters Lorentzian', function () {

    it('Should approximate the true parameters', function () {
        //[center,]
        var p_true = new Matrix([[0],[0.001],[tFactor*nbPoints/10]]);
        //console.log(p_true);
        var y = Opt.singleLorentzian(t, p_true, []);
        //I moved the initial guess
        var result = Opt.optimizeSingleLorentzian([t,y],{x:0.1,y:0.0009,width:tFactor*nbPoints/6});
        console.log(result)
        result[0][0].should.approximately(p_true[0][0],1e-3);
        result[1][0].should.approximately(p_true[1][0],1e-3);
        result[2][0].should.approximately(p_true[2][0],1e-3);
    });
});

describe('Optimize 3 parameters Gaussian', function () {

    it('Should approximate the true parameters', function () {
        var p_true = new Matrix([[0],[0.001],[tFactor*nbPoints/10]]);
        var y = Opt.singleGaussian(t, p_true, []);
        //I moved the initial guess
        var result = Opt.optimizeSingleGaussian([t,y],{x:0.1,y:0.0009,width:tFactor*nbPoints/6});

        result[0][0].should.approximately(p_true[0][0],1e-3);
        result[1][0].should.approximately(p_true[1][0],1e-3);
        result[2][0].should.approximately(p_true[2][0],1e-3);
    });
});


