/* vim: set ts=2: */
/*jshint loopfunc:true, mocha:true, node:true */
/*eslint-env node, mocha */
var XLSX = require("xlsx"), SSF = require("../");

describe('rounding', function() {

  it('number', function() {
    var wb = XLSX.readFile("./test/rounding.xlsx", {cellNF: true, dense: true});
    var data = wb.Sheets.number["!data"];
    data.slice(1).forEach(function(r,R) {
      var val = data[R+1][0].v;
      var raw = parseFloat(data[R+1][1].v);
      r.slice(2).forEach(function(cell, C) {
        var fmt = data[0][C+2].v;
        var w = SSF.format(fmt, val);
        if(w != cell.v) throw ([R, C, val, fmt, cell.v, w].join("|"));
        var W = SSF.format(fmt, raw);
        if(W != cell.v) throw ([R, C, val, fmt, cell.v, W, "!!"].join("|"));
      });
    });
  });

  it('date', function() {
    var wb = XLSX.readFile("./test/rounding.xlsx", {cellNF: true, dense: true});
    var data = wb.Sheets.date["!data"];
    data.slice(1).forEach(function(r,R) {
      var val = data[R+1][0].v;
      r.slice(1).forEach(function(cell, C) {
        var fmt = data[0][C+1].v;
        if(fmt == 'yyyy-mm-dd [hh]:mm:ss') return; // Format broken in excel 2007 - present
        var w = SSF.format(fmt, val);
        if(w != cell.v) throw([R, C, val, fmt, cell.v, w].join("|"));
      });
    });
  });

});