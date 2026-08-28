#!/usr/bin/env node
/* eslint-env node, es6 */
const DTA = require("../");
const XLSX = (() => {
  try {
    const XLSX = require("xlsx");
    DTA.set_utils(XLSX.utils);
    return XLSX;
  } catch(e) {
    throw new Error("Must install the SheetJS file processing library! See https://docs.sheetjs.com/docs/getting-started/installation/nodejs for more details");
  }
})();
const fs = require("fs");

const buf = fs.readFileSync(process.argv[2]);
const wb = DTA.parse(buf);
// translate stub cells to single blanks
//wb.Sheets[wb.SheetNames[0]]["!data"].forEach(row => row.forEach(cell => {if(cell.t == "z") {cell.t = "s"; cell.v = " ";}}));
console.log(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]));