var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, copyDefault, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && (copyDefault || key !== "default"))
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toCommonJS = /* @__PURE__ */ ((cache) => {
  return (module2, temp) => {
    return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
  };
})(typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : 0);

// dta.ts
var dta_exports = {};
__export(dta_exports, {
  parse: () => parse,
  set_utils: () => set_utils,
  version: () => version
});
var version = "0.0.2";
var _utils;
function set_utils(utils) {
  _utils = utils;
}
function u8_to_str(u8) {
  return new TextDecoder().decode(u8);
}
function u8_to_latin1(u8) {
  return new TextDecoder("latin1").decode(u8);
}
function format_number_dta(value, format, t) {
  if (value < 0) {
    const res = format_number_dta(-value, format, t);
    res.w = "-" + res.w;
    return res;
  }
  const o = { t: "n", v: value };
  switch (t) {
    case 251:
    case 98:
    case 65530:
      format = "%8.0g";
      break;
    case 252:
    case 105:
    case 65529:
      format = "%8.0g";
      break;
    case 253:
    case 108:
    case 65528:
      format = "%12.0g";
      break;
    case 254:
    case 102:
    case 65527:
      format = "%9.0g";
      break;
    case 255:
    case 100:
    case 65526:
      format = "%10.0g";
      break;
    default:
      throw t;
  }
  try {
    let w = +(format.match(/%(\d+)/) || [])[1] || 8;
    let k = 0;
    if (value < 1)
      ++k;
    if (value < 0.1)
      ++k;
    if (value < 0.01)
      ++k;
    if (value < 1e-3)
      ++k;
    const e = value.toExponential();
    const exp = e.indexOf("e") == -1 ? 0 : +e.slice(e.indexOf("e") + 1);
    let h = w - 2 - exp;
    if (h < 0)
      h = 0;
    var m = format.match(/%\d+\.(\d+)/);
    if (m && +m[1])
      h = +m[1];
    o.w = (Math.round(value * 10 ** h) / 10 ** h).toFixed(h).replace(/^([-]?)0\./, "$1.");
    o.w = o.w.slice(0, w + k);
    if (o.w.indexOf(".") > -1)
      o.w = o.w.replace(/0+$/, "");
    o.w = o.w.replace(/\.$/, "");
    if (o.w == "")
      o.w = "0";
  } catch (e) {
  }
  return o;
}
function u8_to_dataview(array) {
  return new DataView(array.buffer, array.byteOffset, array.byteLength);
}
function valid_inc(p, n) {
  if (u8_to_str(p.raw.slice(p.ptr, p.ptr + n.length)) != n)
    return false;
  p.ptr += n.length;
  return true;
}
function read_f64(p, LE) {
  p.ptr += 8;
  const d = p.dv.getFloat64(p.ptr - 8, LE);
  return d > 8988e304 ? null : d;
}
function read_f32(p, LE) {
  p.ptr += 4;
  const d = p.dv.getFloat32(p.ptr - 4, LE);
  return d > 1701e35 ? null : d;
}
function read_u32(p, LE) {
  p.ptr += 4;
  return p.dv.getUint32(p.ptr - 4, LE);
}
function read_i32(p, LE) {
  p.ptr += 4;
  const u = p.dv.getInt32(p.ptr - 4, LE);
  return u > 2147483620 ? null : u;
}
function read_u16(p, LE) {
  p.ptr += 2;
  return p.dv.getUint16(p.ptr - 2, LE);
}
function read_i16(p, LE) {
  p.ptr += 2;
  const u = p.dv.getInt16(p.ptr - 2, LE);
  return u > 32740 ? null : u;
}
function read_u8(p) {
  return p.raw[p.ptr++];
}
function read_i8(p) {
  let u = p.raw[p.ptr++];
  u = u < 128 ? u : u - 256;
  return u > 100 ? null : u;
}
var SUPPORTED_VERSIONS_TAGGED = [
  "117",
  "118",
  "119",
  "120",
  "121"
];
var SUPPORTED_VERSIONS_LEGACY = [
  102,
  103,
  104,
  105,
  108,
  110,
  111,
  112,
  113,
  114,
  115
];
function parse_tagged(raw) {
  const err = "Not a DTA file";
  const d = {
    ptr: 0,
    raw,
    dv: u8_to_dataview(raw)
  };
  let vers = 118;
  let LE = true;
  let nvar = 0, nobs = 0, nobs_lo = 0, nobs_hi = 0;
  let label = "", timestamp = "";
  const var_types = [];
  const var_names = [];
  const formats = [];
  if (!valid_inc(d, "<stata_dta>"))
    throw err;
  {
    if (!valid_inc(d, "<header>"))
      throw err;
    {
      if (!valid_inc(d, "<release>"))
        throw err;
      const res = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + 3));
      d.ptr += 3;
      if (!valid_inc(d, "</release>"))
        throw err;
      if (SUPPORTED_VERSIONS_TAGGED.indexOf(res) == -1)
        throw `Unsupported DTA ${res} file`;
      vers = +res;
    }
    {
      if (!valid_inc(d, "<byteorder>"))
        throw err;
      const res = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + 3));
      d.ptr += 3;
      if (!valid_inc(d, "</byteorder>"))
        throw err;
      switch (res) {
        case "MSF":
          LE = false;
          break;
        case "LSF":
          LE = true;
          break;
        default:
          throw `Unsupported byteorder ${res}`;
      }
    }
    {
      if (!valid_inc(d, "<K>"))
        throw err;
      nvar = vers === 119 || vers >= 121 ? read_u32(d, LE) : read_u16(d, LE);
      if (!valid_inc(d, "</K>"))
        throw err;
    }
    {
      if (!valid_inc(d, "<N>"))
        throw err;
      if (vers == 117)
        nobs = nobs_lo = read_u32(d, LE);
      else {
        const lo = read_u32(d, LE), hi = read_u32(d, LE);
        nobs = LE ? (nobs_lo = lo) + (nobs_hi = hi) * Math.pow(2, 32) : (nobs_lo = hi) + (nobs_hi = lo) * Math.pow(2, 32);
      }
      if (nobs > 1e6)
        console.error(`More than 1 million observations -- extra rows will be dropped`);
      if (!valid_inc(d, "</N>"))
        throw err;
    }
    {
      if (!valid_inc(d, "<label>"))
        throw err;
      const w = vers >= 118 ? 2 : 1;
      const strlen = w == 1 ? read_u8(d) : read_u16(d, LE);
      if (strlen > 0)
        label = u8_to_str(d.raw.slice(d.ptr, d.ptr + w));
      d.ptr += strlen;
      if (!valid_inc(d, "</label>"))
        throw err;
    }
    {
      if (!valid_inc(d, "<timestamp>"))
        throw err;
      const strlen = read_u8(d);
      timestamp = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + strlen));
      d.ptr += strlen;
      if (!valid_inc(d, "</timestamp>"))
        throw err;
    }
    if (!valid_inc(d, "</header>"))
      throw err;
  }
  {
    if (!valid_inc(d, "<map>"))
      throw err;
    d.ptr += 8 * 14;
    if (!valid_inc(d, "</map>"))
      throw err;
  }
  let stride = 0;
  {
    if (!valid_inc(d, "<variable_types>"))
      throw err;
    for (var i = 0; i < nvar; ++i) {
      const type = read_u16(d, LE);
      var_types.push(type);
      if (type >= 1 && type <= 2045)
        stride += type;
      else
        switch (type) {
          case 32768:
            stride += 8;
            break;
          case 65525:
            stride += 0;
            break;
          case 65526:
            stride += 8;
            break;
          case 65527:
            stride += 4;
            break;
          case 65528:
            stride += 4;
            break;
          case 65529:
            stride += 2;
            break;
          case 65530:
            stride += 1;
            break;
          default:
            throw `Unsupported field type ${type}`;
        }
    }
    if (!valid_inc(d, "</variable_types>"))
      throw err;
  }
  {
    if (!valid_inc(d, "<varnames>"))
      throw err;
    const w = vers >= 118 ? 129 : 33;
    for (let i2 = 0; i2 < nvar; ++i2) {
      const name = u8_to_str(d.raw.slice(d.ptr, d.ptr + w));
      d.ptr += w;
      var_names.push(name.replace(/\x00[\s\S]*/, ""));
    }
    if (!valid_inc(d, "</varnames>"))
      throw err;
  }
  {
    if (!valid_inc(d, "<sortlist>"))
      throw err;
    d.ptr += (2 * nvar + 2) * (vers == 119 || vers == 121 ? 2 : 1);
    if (!valid_inc(d, "</sortlist>"))
      throw err;
  }
  {
    if (!valid_inc(d, "<formats>"))
      throw err;
    const w = vers >= 118 ? 57 : 49;
    for (let i2 = 0; i2 < nvar; ++i2) {
      const name = u8_to_str(d.raw.slice(d.ptr, d.ptr + w));
      d.ptr += w;
      formats.push(name.replace(/\x00[\s\S]*/, ""));
    }
    if (!valid_inc(d, "</formats>"))
      throw err;
  }
  const value_label_names = [];
  {
    if (!valid_inc(d, "<value_label_names>"))
      throw err;
    const w = vers >= 118 ? 129 : 33;
    for (let i2 = 0; i2 < nvar; ++i2, d.ptr += w)
      value_label_names[i2] = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + w)).replace(/\x00.*$/, "");
    if (!valid_inc(d, "</value_label_names>"))
      throw err;
  }
  {
    if (!valid_inc(d, "<variable_labels>"))
      throw err;
    const w = vers >= 118 ? 321 : 81;
    d.ptr += w * nvar;
    if (!valid_inc(d, "</variable_labels>"))
      throw err;
  }
  {
    if (!valid_inc(d, "<characteristics>"))
      throw err;
    while (valid_inc(d, "<ch>")) {
      const len = read_u32(d, LE);
      d.ptr += len;
      if (!valid_inc(d, "</ch>"))
        throw err;
    }
    if (!valid_inc(d, "</characteristics>"))
      throw err;
  }
  const ws = _utils.aoa_to_sheet([var_names], { dense: true });
  var ptrs = [];
  {
    if (!valid_inc(d, "<data>"))
      throw err;
    for (let R = 0; R < nobs; ++R) {
      const row = [];
      for (let C = 0; C < nvar; ++C) {
        let t = var_types[C];
        if (t >= 1 && t <= 2045) {
          let s = u8_to_str(d.raw.slice(d.ptr, d.ptr + t));
          s = s.replace(/\x00[\s\S]*/, "");
          row[C] = s;
          d.ptr += t;
        } else
          switch (t) {
            case 65525:
              d.ptr += 0;
              break;
            case 65530:
              row[C] = read_i8(d);
              break;
            case 65529:
              row[C] = read_i16(d, LE);
              break;
            case 65528:
              row[C] = read_i32(d, LE);
              break;
            case 65527:
              row[C] = read_f32(d, LE);
              break;
            case 65526:
              row[C] = read_f64(d, LE);
              break;
            case 32768:
              {
                row[C] = "##SheetJStrL##";
                ptrs.push([R + 1, C, d.raw.slice(d.ptr, d.ptr + 8)]);
                d.ptr += 8;
              }
              break;
            default:
              throw `Unsupported field type ${t} for ${var_names[C]}`;
          }
        if (typeof row[C] == "number" && formats[C])
          row[C] = format_number_dta(row[C], formats[C], t);
      }
      _utils.sheet_add_aoa(ws, [row], { origin: -1, sheetStubs: true });
    }
    if (!valid_inc(d, "</data>"))
      throw err;
  }
  {
    if (!valid_inc(d, "<strls>"))
      throw err;
    const strl_tbl = [];
    while (d.raw[d.ptr] == 71) {
      if (!valid_inc(d, "GSO"))
        throw err;
      const v = read_u32(d, LE);
      let o = 0;
      if (vers == 117)
        o = read_u32(d, LE);
      else {
        const lo = read_u32(d, LE), hi = read_u32(d, LE);
        o = LE ? lo + hi * Math.pow(2, 32) : hi + lo * Math.pow(2, 32);
        if (o > 1e6)
          console.error(`More than 1 million observations -- data will be dropped`);
      }
      const t = read_u8(d);
      const len = read_u32(d, LE);
      if (!strl_tbl[o])
        strl_tbl[o] = [];
      let str = "";
      if (t == 129) {
        str = new TextDecoder(vers >= 118 ? "utf8" : "latin1").decode(d.raw.slice(d.ptr, d.ptr + len));
        d.ptr += len;
      } else {
        str = new TextDecoder(vers >= 118 ? "utf8" : "latin1").decode(d.raw.slice(d.ptr, d.ptr + len)).replace(/\x00$/, "");
        d.ptr += len;
      }
      strl_tbl[o][v] = str;
    }
    if (!valid_inc(d, "</strls>"))
      throw err;
    ptrs.forEach(([R, C, buf]) => {
      const dv = u8_to_dataview(buf);
      let v = 0, o = 0;
      switch (vers) {
        case 117:
          {
            v = dv.getUint32(0, LE);
            o = dv.getUint32(4, LE);
          }
          break;
        case 118:
        case 120:
          {
            v = dv.getUint16(0, LE);
            const o1 = dv.getUint16(2, LE), o2 = dv.getUint32(4, LE);
            o = LE ? o1 + o2 * 65536 : o2 + o1 * 2 ** 32;
          }
          break;
        case 119:
        case 121: {
          const v1 = dv.getUint16(0, LE), v2 = buf[2];
          v = LE ? v1 + (v2 << 16) : v2 + (v1 << 8);
          const o1 = buf[3], o2 = dv.getUint32(4, LE);
          o = LE ? o1 + o2 * 256 : o2 + o1 * 2 ** 32;
        }
      }
      ws["!data"][R][C].v = strl_tbl[o][v];
    });
  }
  {
    const w = vers >= 118 ? 129 : 33;
    if (!valid_inc(d, "<value_labels>"))
      throw err;
    while (valid_inc(d, "<lbl>")) {
      let len = read_u32(d, LE);
      const labname = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + w)).replace(/\x00.*$/, "");
      d.ptr += w;
      d.ptr += 3;
      const labels = [];
      {
        const n = read_u32(d, LE);
        const txtlen = read_u32(d, LE);
        const off = [], val = [];
        for (let i2 = 0; i2 < n; ++i2)
          off.push(read_u32(d, LE));
        for (let i2 = 0; i2 < n; ++i2)
          val.push(read_u32(d, LE));
        const str = u8_to_str(d.raw.slice(d.ptr, d.ptr + txtlen));
        d.ptr += txtlen;
        for (let i2 = 0; i2 < n; ++i2)
          labels[val[i2]] = str.slice(off[i2], str.indexOf("\0", off[i2]));
      }
      const C = value_label_names.indexOf(labname);
      if (C == -1)
        throw new Error(`unexpected value label |${labname}|`);
      for (let R = 1; R < ws["!data"].length; ++R) {
        const cell = ws["!data"][R][C];
        cell.t = "s";
        cell.v = cell.w = labels[cell.v || 0];
      }
      if (!valid_inc(d, "</lbl>"))
        throw err;
    }
    if (!valid_inc(d, "</value_labels>"))
      throw err;
  }
  if (!valid_inc(d, "</stata_dta>"))
    throw err;
  const wb = _utils.book_new();
  _utils.book_append_sheet(wb, ws, "Sheet1");
  wb.bookType = "dta";
  return wb;
}
function parse_legacy(raw) {
  let vers = raw[0];
  if (SUPPORTED_VERSIONS_LEGACY.indexOf(vers) == -1)
    throw new Error("Not a DTA file");
  const d = {
    ptr: 1,
    raw,
    dv: u8_to_dataview(raw)
  };
  let LE = true;
  let nvar = 0, nobs = 0;
  let label = "", timestamp = "";
  const var_types = [];
  const var_names = [];
  const formats = [];
  {
    const byteorder = read_u8(d);
    switch (byteorder) {
      case 1:
        LE = false;
        break;
      case 2:
        LE = true;
        break;
      default:
        throw `DTA ${vers} Unexpected byteorder ${byteorder}`;
    }
    let byte = read_u8(d);
    if (byte != 1)
      throw `DTA ${vers} Unexpected filetype ${byte}`;
    d.ptr++;
    nvar = read_u16(d, LE);
    nobs = read_u32(d, LE);
    d.ptr += vers >= 108 ? 81 : vers >= 103 ? 32 : 30;
    if (vers >= 105)
      d.ptr += 18;
  }
  const value_label_names = [];
  {
    let C = 0;
    for (C = 0; C < nvar; ++C)
      var_types.push(read_u8(d));
    const w = vers >= 110 ? 33 : 9;
    for (C = 0; C < nvar; ++C) {
      var_names.push(u8_to_str(d.raw.slice(d.ptr, d.ptr + w)).replace(/\x00[\s\S]*$/, ""));
      d.ptr += w;
    }
    d.ptr += 2 * (nvar + 1);
    const fw = vers >= 114 ? 49 : vers >= 105 ? 12 : 7;
    for (C = 0; C < nvar; ++C) {
      formats.push(u8_to_str(d.raw.slice(d.ptr, d.ptr + fw)).replace(/\x00[\s\S]*$/, ""));
      d.ptr += fw;
    }
    const lw = vers >= 110 ? 33 : 9;
    for (let i = 0; i < nvar; ++i, d.ptr += lw)
      value_label_names[i] = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + lw)).replace(/\x00.*$/, "");
  }
  d.ptr += (vers >= 106 ? 81 : 32) * nvar;
  if (vers >= 105)
    while (d.ptr < d.raw.length) {
      const dt = read_u8(d), len = (vers >= 110 ? read_u32 : read_u16)(d, LE);
      if (dt == 0 && len == 0)
        break;
      d.ptr += len;
    }
  const ws = _utils.aoa_to_sheet([var_names], { dense: true });
  for (let R = 0; R < nobs; ++R) {
    const row = [];
    for (let C = 0; C < nvar; ++C) {
      let t = var_types[C];
      if ((vers == 111 || vers >= 113) && t >= 1 && t <= 244) {
        let s = u8_to_str(d.raw.slice(d.ptr, d.ptr + t));
        s = s.replace(/\x00[\s\S]*/, "");
        row[C] = s;
        d.ptr += t;
      } else if ((vers == 112 || vers <= 110) && t >= 128) {
        let s = u8_to_str(d.raw.slice(d.ptr, d.ptr + t - 127));
        s = s.replace(/\x00[\s\S]*/, "");
        row[C] = s;
        d.ptr += t - 127;
      } else
        switch (t) {
          case 251:
          case 98:
            row[C] = read_i8(d);
            break;
          case 252:
          case 105:
            row[C] = read_i16(d, LE);
            break;
          case 253:
          case 108:
            row[C] = read_i32(d, LE);
            break;
          case 254:
          case 102:
            row[C] = read_f32(d, LE);
            break;
          case 255:
          case 100:
            row[C] = read_f64(d, LE);
            break;
          default:
            throw `Unsupported field type ${t} for ${var_names[C]}`;
        }
      if (typeof row[C] == "number" && formats[C])
        row[C] = format_number_dta(row[C], formats[C], t);
    }
    _utils.sheet_add_aoa(ws, [row], { origin: -1, sheetStubs: true });
  }
  if (vers >= 115)
    while (d.ptr < d.raw.length) {
      const w = 33;
      let len = read_u32(d, LE);
      const labname = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + w)).replace(/\x00.*$/, "");
      d.ptr += w;
      d.ptr += 3;
      const labels = [];
      {
        const n = read_u32(d, LE);
        const txtlen = read_u32(d, LE);
        const off = [], val = [];
        for (let i = 0; i < n; ++i)
          off.push(read_u32(d, LE));
        for (let i = 0; i < n; ++i)
          val.push(read_u32(d, LE));
        const str = u8_to_latin1(d.raw.slice(d.ptr, d.ptr + txtlen));
        d.ptr += txtlen;
        for (let i = 0; i < n; ++i)
          labels[val[i]] = str.slice(off[i], str.indexOf("\0", off[i]));
      }
      const C = value_label_names.indexOf(labname);
      if (C == -1)
        throw new Error(`unexpected value label |${labname}|`);
      for (let R = 1; R < ws["!data"].length; ++R) {
        const cell = ws["!data"][R][C];
        cell.t = "s";
        cell.v = cell.w = labels[cell.v || 0];
      }
    }
  const wb = _utils.book_new();
  _utils.book_append_sheet(wb, ws, "Sheet1");
  wb.bookType = "dta";
  return wb;
}
function parse(data) {
  if (data[0] >= 102 && data[0] <= 115)
    return parse_legacy(data);
  if (data[0] === 60)
    return parse_tagged(data);
  throw new Error("Not a DTA file");
}
module.exports = __toCommonJS(dta_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parse,
  set_utils,
  version
});
