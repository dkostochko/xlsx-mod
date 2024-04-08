import { WorkBook } from 'xlsx';
export { parse, set_utils, version };
declare const version = "0.0.2";
/** Set internal instance of `utils`
 *
 * Usage:
 *
 * ```js
 * const XLSX = require("xlsx");
 * const DTA = require("dta");
 * DTA.set_utils(XLSX.utils);
 * ```
 *
 * @param utils utils object
 */
declare function set_utils(utils: any): void;
/** Parse DTA file
 *
 * NOTE: In NodeJS, `Buffer` extends `Uint8Array`
 *
 * @param {Uint8Array} data File data
 */
declare function parse(data: Uint8Array): WorkBook;
