# DTA Data File Codec

Codec for reading Stata .DTA files and generating CSF workbook objects
compatible with the [SheetJS](https://sheetjs.com) library constellation.

DTA datasets can support millions of observations and over 32767 variables.
The codec will truncate data to 1048576 observations and 16384 variables.

<https://docs.sheetjs.com/docs/constellation/dta> includes a live demo.

## Installation

Using NodeJS package manager:

```bash
npm install --save https://cdn.sheetjs.com/dta-0.0.2/dta-0.0.2.tgz
```

The standalone script is also hosted on the SheetJS CDN:

```html
<script src="https://cdn.sheetjs.com/dta-0.0.2/package/dist/dta.min.js"></script>
```

## Usage

The `parse` method accepts a `Uint8Array` representing the file data. It returns
a ["Common Spreadsheet Format"](https://docs.sheetjs.com/docs/csf/) workbook
object.

The `set_utils` method accepts a `utils` object from SheetJS CE or a SheetJS
Pro build. `parse` will use methods from the `utils` object.

### NodeJS

```js
const XLSX = require("xlsx"), DTA = require("dta");
DTA.set_utils(XLSX.utils);

const wb = DTA.parse(fs.readFileSync("auto.dta"));
```

### Browser

`dist/dta.min.js` is a standalone build designed to be added with `<script>`.

```html
<script lang="javascript" src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
<script src="dist/dta.min.js"></script>
<div id="out"></div>
<script>
DTA.set_utils(XLSX.utils);
(async() => {
  /* fetch file */
  const data = await (await fetch("test.dta")).arrayBuffer();
  /* parse */
  const wb = DTA.parse(new Uint8Array(data));
  /* wb is a SheetJS workbook object */
  const html = XLSX.utils.sheet_to_html(wb.Sheets[wb.SheetNames[0]]);
  out.innerHTML = html;
})();
</script>
```

`dist/dta.mjs` is a ECMAScript Module build designed to be used with bundlers:

```js
import * as DTA from 'dta';
```
