/* eslint-env mocha, node, es6 */
const fs = require("fs"), assert = require("assert");

const DTA = require("./");
const XLSX = require("xlsx");
DTA.set_utils(XLSX.utils);

const test_folders = [
  "test_files"
];
for(let tF of test_folders) describe(tF, () => {
  const test_files = fs.readdirSync(tF);
  for(let tf of test_files) {
    if(tf.endsWith("csv")) it(`${tf.replace(".csv", "")} [CSV]`, () => {
      const buf = fs.readFileSync(`${tF}/${tf.replace(".csv", "")}`);
      const wb = DTA.parse(buf);
      assert(wb.SheetNames.length > 0);
      /* stata will represent unspecified values as single spaces */
      //wb.Sheets[wb.SheetNames[0]]["!data"].forEach(row => row.forEach(cell => {if(cell.t == "z") {cell.t = "s"; cell.v = " ";}}));
      const csvstr = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
      const baseline = fs.readFileSync(`${tF}/${tf}`, "utf8").replace(/[\r\n]+/g,"\n");
      assert.equal(csvstr.trim(), baseline.trim());
    });
    if(!tf.endsWith("dta")) continue;
    it(tf, () => {
      const buf = fs.readFileSync(`${tF}/${tf}`);
      const wb = DTA.parse(buf);
      assert(wb.SheetNames.length > 0);
    });
  }
});

