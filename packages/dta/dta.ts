import { CellObject, DenseWorkSheet, WorkBook, type utils } from 'xlsx';
export { parse, set_utils, version };

const version = "0.0.2";

let _utils: typeof utils;
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
function set_utils(utils: any): void {
  _utils = utils;
}

function u8_to_str(u8: Uint8Array): string {
  return new TextDecoder().decode(u8);
}

/* sadly the web zealots decided to abandon binary strings */
function u8_to_latin1(u8: Uint8Array): string {
  return new TextDecoder("latin1").decode(u8);
}


/* TODO: generalize and map to SSF */
function format_number_dta(value: number, format: string, t: number): CellObject {
  if(value < 0) { const res = format_number_dta(-value, format, t); res.w = "-" + res.w; return res; }
  const o: CellObject = { t: "n", v: value };
  /* NOTE: The Stata CSV exporter appears to ignore the column formats, instead using these defaults */
  switch(t) {
    case 251: case 0x62: case 65530: format = "%8.0g"; break; // byte
    case 252: case 0x69: case 65529: format = "%8.0g"; break; // int
    case 253: case 0x6c: case 65528: format = "%12.0g"; break; // long
    case 254: case 0x66: case 65527: format = "%9.0g"; break; // float
    case 255: case 0x64: case 65526: format = "%10.0g"; break; // double
    default: throw t;
  }
  try {
    let w = +((format.match(/%(\d+)/)||[])[1]) || 8;
    let k = 0;
    if(value < 1) ++k;
    if(value < 0.1) ++k;
    if(value < 0.01) ++k;
    if(value < 0.001) ++k;
    const e = value.toExponential();
    const exp = e.indexOf("e") == -1 ? 0 : +e.slice(e.indexOf("e")+1);
    let h = w - 2 - exp;
    if(h < 0) h = 0;
    var m = format.match(/%\d+\.(\d+)/);
    if(m && +m[1]) h = +m[1];
    o.w = (Math.round(value * 10**(h))/10**(h)).toFixed(h).replace(/^([-]?)0\./,"$1.");
    o.w = o.w.slice(0, w + k);
    if(o.w.indexOf(".") > -1) o.w = o.w.replace(/0+$/,"");
    o.w = o.w.replace(/\.$/,"");
    if(o.w == "") o.w = "0";
  } catch(e) {}
  return o;
}

interface Payload {
  /** Offset */
  ptr: number;

  /** Raw data */
  raw: Uint8Array;

  /** DataView */
  dv: DataView;
}

function u8_to_dataview(array: Uint8Array): DataView { return new DataView(array.buffer, array.byteOffset, array.byteLength); }
function valid_inc(p: Payload, n: string): boolean {
  if(u8_to_str(p.raw.slice(p.ptr, p.ptr + n.length)) != n) return false;
  p.ptr += n.length;
  return true;
}

function read_f64(p: Payload, LE: boolean): number | null {
  p.ptr += 8;
  const d = p.dv.getFloat64(p.ptr - 8, LE);
  return d > 8.988e+307 ? null : d;
}
function read_f32(p: Payload, LE: boolean): number | null {
  p.ptr += 4;
  const d = p.dv.getFloat32(p.ptr - 4, LE);
  return d > 1.701e+38 ? null : d;
}
function read_u32(p: Payload, LE: boolean) {
  p.ptr += 4;
  return p.dv.getUint32(p.ptr - 4, LE);
}
function read_i32(p: Payload, LE: boolean): number | null {
  p.ptr += 4;
  const u = p.dv.getInt32(p.ptr - 4, LE);
  return u > 0x7fffffe4 ? null : u;
}
function read_u16(p: Payload, LE: boolean) {
  p.ptr += 2;
  return p.dv.getUint16(p.ptr - 2, LE);
}
function read_i16(p: Payload, LE: boolean): number | null {
  p.ptr += 2;
  const u = p.dv.getInt16(p.ptr - 2, LE);
  return u > 32740 ? null : u;
}
function read_u8(p: Payload) {
  return p.raw[p.ptr++];
}
function read_i8(p: Payload): number | null {
  let u = p.raw[p.ptr++];
  u = u < 128 ? u : u - 256;
  return u > 100 ? null : u;
}

/* the annotations are from `dtaversion` */
const SUPPORTED_VERSIONS_TAGGED = [
  "117", // stata 13
  "118", // stata 14-18
  "119", // stata 15-18 (> 32767 variables)
  "120", // stata 18 (<= 32767, with aliases)
  "121", // stata 18 (> 32767, with aliases)
];
const SUPPORTED_VERSIONS_LEGACY = [
  102, // stata 1
  103, // stata 2/3
  104, // stata 4
  105, // stata 5
  108, // stata 6
  110, // stata 7
  111, // stata 7
  112, // stata 8/9
  113, // stata 8/9
  114, // stata 10/11
  115, // stata 12
];

function parse_tagged(raw: Uint8Array): WorkBook {
  const err = ("Not a DTA file");

  const d: Payload = {
    ptr: 0,
    raw,
    dv: u8_to_dataview(raw)
  };

  let vers: number = 118;
  let LE: boolean = true;
  let nvar: number = 0, nobs: number = 0, nobs_lo = 0, nobs_hi = 0;
  let label: string = "", timestamp: string = "";
  const var_types: number[] = [];
  const var_names: string[] = [];
  const formats: string[] = [];

  /* 5. Dataset format definition */
  if(!valid_inc(d, "<stata_dta>")) throw err;

  /* 5.1 Header <header> */
  {
    if(!valid_inc(d, "<header>")) throw err;

    /* <release> */
    {
      if(!valid_inc(d, "<release>")) throw err;
      /* NOTE: this assumes the version is 3 characters wide */
      const res = u8_to_latin1(d.raw.slice(d.ptr, d.ptr+3));
      d.ptr += 3;
      if(!valid_inc(d, "</release>")) throw err;
      if(SUPPORTED_VERSIONS_TAGGED.indexOf(res) == -1) throw (`Unsupported DTA ${res} file`);
      vers = +res;
    }

    /* <byteorder> */
    {
      if(!valid_inc(d, "<byteorder>")) throw err;
      /* NOTE: this assumes the byte order is 3 characters wide */
      const res = u8_to_latin1(d.raw.slice(d.ptr, d.ptr+3));
      d.ptr += 3;
      if(!valid_inc(d, "</byteorder>")) throw err;
      switch(res) {
        case "MSF": LE = false; break;
        case "LSF": LE = true; break;
        default: throw (`Unsupported byteorder ${res}`);
      }
    }

    /* <K> */
    {
      if(!valid_inc(d, "<K>")) throw err;
      nvar = (vers === 119 || vers >= 121) ? read_u32(d, LE) : read_u16(d, LE);
      if(!valid_inc(d, "</K>")) throw err;
    }

    /* <N> */
    {
      if(!valid_inc(d, "<N>")) throw err;
      if(vers == 117) nobs = nobs_lo = read_u32(d, LE);
      else {
        const lo = read_u32(d, LE), hi = read_u32(d, LE);
        nobs = LE ? ((nobs_lo = lo) + (nobs_hi = hi) * Math.pow(2,32)) : ((nobs_lo = hi) + (nobs_hi = lo) * Math.pow(2,32));
      }
      if(nobs > 1e6) console.error(`More than 1 million observations -- extra rows will be dropped`);
      if(!valid_inc(d, "</N>")) throw err;
    }

    /* <label> */
    {
      if(!valid_inc(d, "<label>")) throw err;
      const w = vers >= 118 ? 2 : 1;
      const strlen = w == 1 ? read_u8(d) : read_u16(d, LE);
      if(strlen > 0) label = u8_to_str(d.raw.slice(d.ptr, d.ptr + w));
      d.ptr += strlen;
      if(!valid_inc(d, "</label>")) throw err;
    }

    /* <timestamp> */
    {
      if(!valid_inc(d, "<timestamp>")) throw err;
      const strlen = read_u8(d);
      timestamp = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + strlen));
      d.ptr += strlen;
      if(!valid_inc(d, "</timestamp>")) throw err;
    }

    if(!valid_inc(d, "</header>")) throw err;
  }

  /* 5.2 Map <map> */
  {
    /* TODO: validate map? */
    if(!valid_inc(d, "<map>")) throw err;
    /* 14 8-byte offsets for:
      <stata_data>
      <map>
      <variable_types>
      <varnames>
      <sortlist>
      <formats>
      <value_label_names>
      <variable_labels>
      <characteristics>
      <data>
      <strls>
      <value_labels>
      </stata_data>
      EOF
    */
    d.ptr += 8 * 14;
    if(!valid_inc(d, "</map>")) throw err;
  }

  let stride = 0;
  /* 5.3 Variable types <variable_types> */
  {
    if(!valid_inc(d, "<variable_types>")) throw err;
    for(var i = 0; i < nvar; ++i) {
      const type = read_u16(d, LE);
      var_types.push(type);
      if(type >= 1 && type <= 2045) stride += type;
      else switch(type) {
        case 32768: stride += 8; break;
        case 65525: stride += 0; break; // alias
        case 65526: stride += 8; break;
        case 65527: stride += 4; break;
        case 65528: stride += 4; break;
        case 65529: stride += 2; break;
        case 65530: stride += 1; break;
        default: throw (`Unsupported field type ${type}`);
      }
    }
    if(!valid_inc(d, "</variable_types>")) throw err;
  }

  /* 5.4 Variable names <varnames> */
  {
    if(!valid_inc(d, "<varnames>")) throw err;
    const w = vers >= 118 ? 129 : 33;
    for(let i = 0; i < nvar; ++i) {
      const name = u8_to_str(d.raw.slice(d.ptr, d.ptr + w));
      d.ptr += w;
      var_names.push(name.replace(/\x00[\s\S]*/,""));
    }
    if(!valid_inc(d, "</varnames>")) throw err;
  }

  /* 5.5 Sort order of observations <sortlist> */
  {
    /* TODO: check sort list? */
    if(!valid_inc(d, "<sortlist>")) throw err;
    d.ptr += (2 * nvar + 2) * ((vers == 119 || vers == 121) ? 2 : 1);
    if(!valid_inc(d, "</sortlist>")) throw err;
  }

  /* 5.6 Display formats <formats> */
  {
    if(!valid_inc(d, "<formats>")) throw err;
    const w = vers >= 118 ? 57 : 49;
    for(let i = 0; i < nvar; ++i) {
      const name = u8_to_str(d.raw.slice(d.ptr, d.ptr + w));
      d.ptr += w;
      formats.push(name.replace(/\x00[\s\S]*/,""));
    }
    if(!valid_inc(d, "</formats>")) throw err;
  }

  const value_label_names: string[] = [];
  /* TODO: <value_label_names> */
  {
    if(!valid_inc(d, "<value_label_names>")) throw err;
    const w = vers >= 118 ? 129 : 33;
    for(let i = 0; i < nvar; ++i, d.ptr += w) value_label_names[i] = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + w)).replace(/\x00.*$/,"");
    if(!valid_inc(d, "</value_label_names>")) throw err;
  }

  /* TODO: <variable_labels> */
  {
    if(!valid_inc(d, "<variable_labels>")) throw err;
    const w = vers >= 118 ? 321 : 81;
    d.ptr += w * nvar;
    if(!valid_inc(d, "</variable_labels>")) throw err;
  }

  /* 5.9 Characteristics <characteristics> */
  {
    if(!valid_inc(d, "<characteristics>")) throw err;
    while(valid_inc(d, "<ch>")) {
      const len = read_u32(d, LE);
      d.ptr += len;
      if(!valid_inc(d, "</ch>")) throw err;
    }
    if(!valid_inc(d, "</characteristics>")) throw err;
  }

  const ws: DenseWorkSheet = (_utils.aoa_to_sheet([var_names], {dense: true} as any) as DenseWorkSheet);

  var ptrs: Array<[number, number, Uint8Array]> = []
  /* 5.10 Data <data> */
  {
    if(!valid_inc(d, "<data>")) throw err;
    for(let R = 0; R < nobs; ++R) {
      const row: any[] = [];
      for(let C = 0; C < nvar; ++C) {
        let t = var_types[C];
        // TODO: formats, dta_12{0,1} aliases?
        if(t >= 1 && t <= 2045) {
          /* NOTE: dta_117 restricts strf to ASCII */
          let s = u8_to_str(d.raw.slice(d.ptr, d.ptr + t));
          s = s.replace(/\x00[\s\S]*/,"");
          row[C] = s;
          d.ptr += t;
        } else switch(t) {
          case 65525: d.ptr += 0; break; // alias
          case 65530: row[C] = read_i8(d); break; // byte
          case 65529: row[C] = read_i16(d, LE); break; // int
          case 65528: row[C] = read_i32(d, LE); break; // long
          case 65527: row[C] = read_f32(d, LE); break; // float
          case 65526: row[C] = read_f64(d, LE); break; // double
          case 32768: {
            row[C] = "##SheetJStrL##";
            ptrs.push([R+1,C, d.raw.slice(d.ptr, d.ptr + 8)]);
            d.ptr += 8;
          } break;
          default: throw (`Unsupported field type ${t} for ${var_names[C]}`);
        }
        if(typeof row[C] == "number" && formats[C]) row[C] = format_number_dta(row[C], formats[C], t);
      }
      _utils.sheet_add_aoa(ws, [row], {origin: -1, sheetStubs: true});
    }
    if(!valid_inc(d, "</data>")) throw err;
  }

  /* 5.11 StrLs <strls> */
  {
    if(!valid_inc(d, "<strls>")) throw err;

    const strl_tbl: string[][] = [];
      while(d.raw[d.ptr] == 71 /* G */) {
      if(!valid_inc(d, "GSO")) throw err;
      const v = read_u32(d, LE);
      let o = 0;
      if(vers == 117) o = read_u32(d, LE);
      else {
        const lo = read_u32(d, LE), hi = read_u32(d, LE);
        o = LE ? (lo + hi * Math.pow(2,32)) : (hi + lo * Math.pow(2,32));
        if(o > 1e6) console.error(`More than 1 million observations -- data will be dropped`);
      }
      const t = read_u8(d);
      const len = read_u32(d, LE);
      if(!strl_tbl[o]) strl_tbl[o] = [];
      let str = "";
      if(t == 129) {
        // TODO: dta_117 codepage
        str = new TextDecoder(vers >= 118 ? "utf8" : "latin1").decode(d.raw.slice(d.ptr, d.ptr + len));
        d.ptr += len;
      } else {
        str = new TextDecoder(vers >= 118 ? "utf8" : "latin1").decode(d.raw.slice(d.ptr, d.ptr + len)).replace(/\x00$/,"");
        d.ptr += len;
      }
      strl_tbl[o][v] = str;
    }
    if(!valid_inc(d, "</strls>")) throw err;

    ptrs.forEach(([R,C,buf]) => {
      const dv = u8_to_dataview(buf);
      let v = 0, o = 0;
      switch(vers) {
        case 117: { // v(4) o(4)
          v = dv.getUint32(0, LE);
          o = dv.getUint32(4, LE);
        } break;

        case 118: case 120: { // v(2) o(6)
          v = dv.getUint16(0, LE);
          const o1 = dv.getUint16(2, LE), o2 = dv.getUint32(4, LE);
          o = LE ? o1 + o2 * 65536 : o2 + o1 * (2**32);
        } break;

        case 119: case 121: { // v(3) o(5)
          const v1 = dv.getUint16(0, LE), v2 = buf[2];
          v = LE ? v1 + (v2 << 16) : v2 + (v1 << 8);
          const o1 = buf[3], o2 = dv.getUint32(4, LE);
          o = LE ? o1 + o2 * 256 : o2 + o1 * (2**32);
        }
      }
      ws["!data"][R][C].v = strl_tbl[o][v];
    });
  }

  /* 5.12 Value labels <value_labels> */
  {
    const w = vers >= 118 ? 129 : 33;
    if(!valid_inc(d, "<value_labels>")) throw err;
    while(valid_inc(d, "<lbl>")) {
      let len = read_u32(d, LE);
      const labname = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + w)).replace(/\x00.*$/,"");
      d.ptr += w;
      d.ptr += 3; // padding
      const labels: string[] = [];
      {
        const n = read_u32(d, LE);
        const txtlen = read_u32(d, LE);
        const off: number[] = [], val: number[] = [];
        for(let i = 0; i < n; ++i) off.push(read_u32(d, LE));
        for(let i = 0; i < n; ++i) val.push(read_u32(d, LE));
        const str = u8_to_str(d.raw.slice(d.ptr, d.ptr + txtlen));
        d.ptr += txtlen;
        for(let i = 0; i < n; ++i) labels[val[i]] = str.slice(off[i], str.indexOf("\x00", off[i]));
      }
      const C = value_label_names.indexOf(labname);
      if(C == -1) throw new Error(`unexpected value label |${labname}|`);
      for(let R = 1; R < ws["!data"].length; ++R) {
        const cell = ws["!data"][R][C];
        cell.t = "s"; cell.v = cell.w = labels[(cell.v as number)||0];
      }
      //d.ptr += len; // value_label_table
      if(!valid_inc(d, "</lbl>")) throw err;
    }
    if(!valid_inc(d, "</value_labels>")) throw err;
  }

  if(!valid_inc(d, "</stata_dta>")) throw err;
  const wb = _utils.book_new();
  _utils.book_append_sheet(wb, ws, "Sheet1");
  wb.bookType = "dta" as any;
  return wb;
}

function parse_legacy(raw: Uint8Array): WorkBook {
  let vers: number = raw[0];
  if(SUPPORTED_VERSIONS_LEGACY.indexOf(vers) == -1) throw new Error("Not a DTA file");

  const d: Payload = {
    ptr: 1,
    raw,
    dv: u8_to_dataview(raw)
  };

  let LE: boolean = true;
  let nvar: number = 0, nobs: number = 0;
  let label: string = "", timestamp: string = "";
  const var_types: number[] = [];
  const var_names: string[] = [];
  const formats: string[] = [];

  /* 5.1 Header */
  {
    const byteorder = read_u8(d);
    switch(byteorder) {
      case 1: LE = false; break;
      case 2: LE = true; break;
      default: throw (`DTA ${vers} Unexpected byteorder ${byteorder}`);
    }

    let byte = read_u8(d);
    if(byte != 1) throw (`DTA ${vers} Unexpected filetype ${byte}`);
    // NOTE: dta_105 technically supports filetype 2

    d.ptr++; // "unused"
    nvar = read_u16(d, LE);
    nobs = read_u32(d, LE);
    d.ptr += (vers >= 108 ? 81 : vers >= 103 ? 32 : 30); // TODO: data_label
    if(vers >= 105) d.ptr += 18; // TODO: time_stamp
  }

  /* 5.2 Descriptors */
  const value_label_names: string[] = [];
  {
    let C = 0;

    // typlist
    for(C = 0; C < nvar; ++C) var_types.push(read_u8(d));

    // varlist
    const w = vers >= 110 ? 33 : 9;
    for(C = 0; C < nvar; ++C) {
      var_names.push(u8_to_str(d.raw.slice(d.ptr, d.ptr + w)).replace(/\x00[\s\S]*$/,""));
      d.ptr += w;
    }

    // srtlist
    d.ptr += 2*(nvar + 1);

    // fmtlist
    const fw = (vers >= 114 ? 49 : vers >= 105 ? 12 : 7);
    for(C = 0; C < nvar; ++C) {
      formats.push(u8_to_str(d.raw.slice(d.ptr, d.ptr + fw)).replace(/\x00[\s\S]*$/,""));
      d.ptr += fw;
    }
    // lbllist
    const lw = vers >= 110 ? 33 : 9;
    for(let i = 0; i < nvar; ++i, d.ptr += lw) value_label_names[i] = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + lw)).replace(/\x00.*$/,"");
  }

  /* 5.3 Variable labels */
  // TODO: should these names be used in the worksheet?
  d.ptr += (vers >= 106 ? 81 : 32) * nvar;

  /* 5.4 Expansion fields */
  if(vers >= 105) while(d.ptr < d.raw.length) {
    const dt = read_u8(d), len = (vers >= 110 ? read_u32 : read_u16)(d, LE);
    if(dt == 0 && len == 0) break;
    d.ptr += len;
  }

  const ws: DenseWorkSheet = (_utils.aoa_to_sheet([var_names], {dense: true} as any) as DenseWorkSheet);

  /* 5.5 Data */
  for(let R = 0; R < nobs; ++R) {
    const row: any[] = [];
    for(let C = 0; C < nvar; ++C) {
      let t = var_types[C];
      // TODO: data type processing
      if((vers == 111 || vers >= 113) && t >= 1 && t <= 244) {
        /* NOTE: dta_117 restricts strf to ASCII */
        let s = u8_to_str(d.raw.slice(d.ptr, d.ptr + t));
        s = s.replace(/\x00[\s\S]*/,"");
        row[C] = s;
        d.ptr += t;
      } else if((vers == 112 || vers <= 110) && t >= 0x80) {
        /* NOTE: dta_105 restricts strf to ASCII */
        let s = u8_to_str(d.raw.slice(d.ptr, d.ptr + t - 0x7F));
        s = s.replace(/\x00[\s\S]*/,"");
        row[C] = s;
        d.ptr += t - 0x7F;
      } else switch(t) {
        case 251: case 0x62: row[C] = read_i8(d); break; // byte
        case 252: case 0x69: row[C] = read_i16(d, LE); break; // int
        case 253: case 0x6c: row[C] = read_i32(d, LE); break; // long
        case 254: case 0x66: row[C] = read_f32(d, LE); break; // float
        case 255: case 0x64: row[C] = read_f64(d, LE); break; // double
        default: throw (`Unsupported field type ${t} for ${var_names[C]}`);
      }
      if(typeof row[C] == "number" && formats[C]) row[C] = format_number_dta(row[C], formats[C], t);
    }
    _utils.sheet_add_aoa(ws, [row], {origin: -1, sheetStubs: true});
  }

  /* 5.6 Value labels */
  // TODO: < 115
  if(vers >= 115) while(d.ptr < d.raw.length) {
    const w = 33;
    let len = read_u32(d, LE);
    const labname = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + w)).replace(/\x00.*$/,"");
    d.ptr += w;
    d.ptr += 3; // padding
    const labels: string[] = [];
    {
      const n = read_u32(d, LE);
      const txtlen = read_u32(d, LE);
      const off: number[] = [], val: number[] = [];
      for(let i = 0; i < n; ++i) off.push(read_u32(d, LE));
      for(let i = 0; i < n; ++i) val.push(read_u32(d, LE));
      const str = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + txtlen));
      d.ptr += txtlen;
      for(let i = 0; i < n; ++i) labels[val[i]] = str.slice(off[i], str.indexOf("\x00", off[i]));
    }
    const C = value_label_names.indexOf(labname);
    if(C == -1) throw new Error(`unexpected value label |${labname}|`);
    for(let R = 1; R < ws["!data"].length; ++R) {
      const cell = ws["!data"][R][C];
      cell.t = "s"; cell.v = cell.w = labels[(cell.v as number)||0];
    }

  }

  const wb: WorkBook = _utils.book_new();
  _utils.book_append_sheet(wb, ws, "Sheet1");
  wb.bookType = "dta" as any;
  return wb;
}

/** Parse DTA file
 *
 * NOTE: In NodeJS, `Buffer` extends `Uint8Array`
 *
 * @param {Uint8Array} data File data
 */
function parse(data: Uint8Array): WorkBook {
  if(data[0] >= 102 && data[0] <= 115) return parse_legacy(data);
  if(data[0] === 60) return parse_tagged(data);
  throw new Error("Not a DTA file");
}
