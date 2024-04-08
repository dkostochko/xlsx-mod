var strs = {}; // shared strings
var _ssfopts = {}; // spreadsheet formatting options


/*global Map */
var browser_has_Map = typeof Map !== 'undefined';

function get_sst_id(sst/*:SST*/, str/*:string*/, rev)/*:number*/ {
	var i = 0, len = sst.length;
	if(rev) {
		if(browser_has_Map ? rev.has(str) : Object.prototype.hasOwnProperty.call(rev, str)) {
			var revarr = browser_has_Map ? rev.get(str) : rev[str];
			for(; i < revarr.length; ++i) {
				if(sst[revarr[i]].t === str) { sst.Count ++; return revarr[i]; }
			}
		}
	} else for(; i < len; ++i) {
		if(sst[i].t === str) { sst.Count ++; return i; }
	}
	sst[len] = ({t:str}/*:any*/); sst.Count ++; sst.Unique ++;
	if(rev) {
		if(browser_has_Map) {
			if(!rev.has(str)) rev.set(str, []);
			rev.get(str).push(len);
		} else {
			if(!Object.prototype.hasOwnProperty.call(rev, str)) rev[str] = [];
			rev[str].push(len);
		}
	}
	return len;
}

function col_obj_w(C/*:number*/, col) {
	var p = ({min:C+1,max:C+1}/*:any*/);
	/* wch (chars), wpx (pixels) */
	var wch = -1;
	if(col.MDW) MDW = col.MDW;
	if(col.width != null) p.customWidth = 1;
	else if(col.wpx != null) wch = px2char(col.wpx);
	else if(col.wch != null) wch = col.wch;
	if(wch > -1) { p.width = char2width(wch); p.customWidth = 1; }
	else if(col.width != null) p.width = col.width;
	if(col.hidden) p.hidden = true;
	if(col.level != null) { p.outlineLevel = p.level = col.level; }
	return p;
}

function default_margins(margins/*:Margins*/, mode/*:?string*/) {
	if(!margins) return;
	var defs = [0.7, 0.7, 0.75, 0.75, 0.3, 0.3];
	if(mode == 'xlml') defs = [1, 1, 1, 1, 0.5, 0.5];
	if(margins.left   == null) margins.left   = defs[0];
	if(margins.right  == null) margins.right  = defs[1];
	if(margins.top    == null) margins.top    = defs[2];
	if(margins.bottom == null) margins.bottom = defs[3];
	if(margins.header == null) margins.header = defs[4];
	if(margins.footer == null) margins.footer = defs[5];
}

function get_cell_style(styles/*:Array<any>*/, cell/*:Cell*/, opts) {
	var z = opts.revssf[cell.z != null ? cell.z : "General"];
	var i = 0x3c, len = styles.length;
	if(z == null && opts.ssf) {
		for(; i < 0x188; ++i) if(opts.ssf[i] == null) {
			SSF__load(cell.z, i);
			// $FlowIgnore
			opts.ssf[i] = cell.z;
			opts.revssf[cell.z] = z = i;
			break;
		}
	}
	for(i = 0; i != len; ++i) if(styles[i].numFmtId === z) return i;
	styles[len] = {
		numFmtId:z,
		fontId:0,
		fillId:0,
		borderId:0,
		xfId:0,
		applyNumberFormat:1
	};
	return len;
}

var indexedColors  = {
	"0":'00000000',
	"1":'00FFFFFF',
	"2":'00FF0000',
	"3":'0000FF00',
	"4":'000000FF',
	"5":'00FFFF00',
	"6":'00FF00FF',
	"7":'0000FFFF',
	"8":'00000000',
	"9":'00FFFFFF',
	"10":'00FF0000',
	"11":'0000FF00',
	"12":'000000FF',
	"13":'00FFFF00',
	"14":'00FF00FF',
	"15":'0000FFFF',
	"16":'00800000',
	"17":'00008000',
	"18":'00000080',
	"19":'00808000',
	"20":'00800080',
	"21":'00008080',
	"22":'00C0C0C0',
	"23":'00808080',
	"24":'009999FF',
	"25":'00993366',
	"26":'00FFFFCC',
	"27":'00CCFFFF',
	"28":'00660066',
	"29":'00FF8080',
	"30":'000066CC',
	"31":'00CCCCFF',
	"32":'00000080',
	"33":'00FF00FF',
	"34":'00FFFF00',
	"35":'0000FFFF',
	"36":'00800080',
	"37":'00800000',
	"38":'00008080',
	"39":'000000FF',
	"40":'0000CCFF',
	"41":'00CCFFFF',
	"42":'00CCFFCC',
	"43":'00FFFF99',
	"44":'0099CCFF',
	"45":'00FF99CC',
	"46":'00CC99FF',
	"47":'00FFCC99',
	"48":'003366FF',
	"49":'0033CCCC',
	"50":'0099CC00',
	"51":'00FFCC00',
	"52":'00FF9900',
	"53":'00FF6600',
	"54":'00666699',
	"55":'00969696',
	"56":'00003366',
	"57":'00339966',
	"58":'00003300',
	"59":'00333300',
	"60":'00993300',
	"61":'00993366',
	"62":'00333399',
	"63":'00333333',
	"64":null,//system Foreground n/a
	"65":null//system Background n/a
};

function combineIndexedColor(indexedColorsInner , indexedColors ) {
	var ret = {};
	if(indexedColorsInner==null || indexedColorsInner.length===0){
		return indexedColors;
	}
	for(var key in indexedColors){
		var value = indexedColors[key], kn = parseInt(key);
		var inner = indexedColorsInner[kn];
		if(inner==null){
			ret[key] = value;
		}
		else{
			ret[key] = inner.attributeList.rgb;
		}
	}

	return ret;
}

function LightenDarkenColor(sixColor, tint){
	var hsl = rgb2HSL(hex2RGB(sixColor));
	if(tint>0){
		hsl[2] = hsl[2] * (1.0-tint) + tint;
	}
	else if(tint<0){
		hsl[2] = hsl[2] * (1.0 + tint);
	}
	else{
		return sixColor;
	}

	return rgb2Hex(hsl2RGB(hsl));
}

function getColor(colorInfo, styles){
	var clrScheme = styles.clrScheme;
	var indexedColorsInner = styles.indexedColors;
	var indexedColorsList = combineIndexedColor(indexedColorsInner, indexedColors);
	var indexed = colorInfo.indexed, rgb = colorInfo.rgb, theme = colorInfo.theme, tint = colorInfo.tint;
	var color;
	if(indexed!=null){
		var indexedNum = parseInt(indexed);
		color = indexedColorsList[indexedNum];
		if(color!=null){
			color = color.substring(color.length-6, color.length);
		}
	}
	else if(rgb!=null){
		color = rgb.substring(rgb.length-6, rgb.length);
	}
	else if(theme!=null){
/*		var themeNum = parseInt(theme);
		if(themeNum===0){
			themeNum = 1;
		}
		else if(themeNum===1){
			themeNum = 0;
		}
		else if(themeNum===2){
			themeNum = 3;
		}
		else if(themeNum===3){
			themeNum = 2;
		}*/
		var clrSchemeElement = clrScheme[theme];
		if(clrSchemeElement!=null){
			color = clrSchemeElement.rgb;
		}
	}
	var tintedColor = color;
	if(tint!=null){
		var tintNum = parseFloat(tint);
		if(color!=null){
			tintedColor = LightenDarkenColor(color, tintNum);
		}
	}

	return [color ? color.toLowerCase() : color, tintedColor ? tintedColor.toLowerCase() : tintedColor];
}

function safe_format(p/*:Cell*/, fmtid/*:number*/, fillid/*:?number*/, opts, themes, styles, cellFormat) {
	try {
		if(opts.cellNF) p.z = table_fmt[fmtid];
	} catch(e) { if(opts.WTF) throw e; }
	if(p.t === 'z' && !opts.cellStyles) return;
	if(p.t === 'd' && typeof p.v === 'string') p.v = parseDate(p.v);
	if((!opts || opts.cellText !== false) && p.t !== 'z') try {
		if(table_fmt[fmtid] == null) SSF__load(SSFImplicit[fmtid] || "General", fmtid);
		if(p.t === 'e') p.w = p.w || BErr[p.v];
		else if(fmtid === 0) {
			if(p.t === 'n') {
				if((p.v|0) === p.v) p.w = p.v.toString(10);
				else p.w = SSF_general_num(p.v);
			}
			else if(p.t === 'd') {
				var dd = datenum(p.v);
				if((dd|0) === dd) p.w = dd.toString(10);
				else p.w = SSF_general_num(dd);
			}
			else if(p.v === undefined) return "";
			else p.w = SSF_general(p.v,_ssfopts);
		}
		else if(p.t === 'd') p.w = SSF_format(fmtid,datenum(p.v),_ssfopts);
		else p.w = SSF_format(fmtid,p.v,_ssfopts);
	} catch(e) { if(opts.WTF) throw e; }
	if(!opts.cellStyles) return;
	if (cellFormat) {
		if (cellFormat.applyFont) {
			p.font = styles.Fonts[cellFormat.fontId];
		}
		if (cellFormat.applyAlignment) {
			p.alignment = cellFormat.alignment;
		}
	}
	if(fillid != null) try {
		p.s =  styles.Fills[fillid];
		var color;
		if (p.s.fgColor && !p.s.fgColor.rgb && !!themes.themeElements) {
			color = getColor(p.s.fgColor, themes.themeElements);
			p.s.fgColor.rgb = color[1];
			if(opts.WTF) p.s.fgColor.raw_rgb = color[0];
		}
		if (p.s.bgColor && !p.s.bgColor.rgb && !!themes.themeElements) {
			color = getColor(p.s.bgColor, themes.themeElements);
			p.s.bgColor.rgb = color[1];
			if(opts.WTF) p.s.bgColor.raw_rgb = color[0];
		}
		//console.log("Colors", p.s.fgColor, p.s.bgColor);
		/*if (p.s.fgColor && p.s.fgColor.theme && !p.s.fgColor.rgb) {
			p.s.fgColor.rgb = rgb_tint(themes.themeElements.clrScheme[p.s.fgColor.theme].rgb, p.s.fgColor.tint || 0);
			if(opts.WTF) p.s.fgColor.raw_rgb = themes.themeElements.clrScheme[p.s.fgColor.theme].rgb;
		}
		if (p.s.bgColor && p.s.bgColor.theme) {
			p.s.bgColor.rgb = rgb_tint(themes.themeElements.clrScheme[p.s.bgColor.theme].rgb, p.s.bgColor.tint || 0);
			if(opts.WTF) p.s.bgColor.raw_rgb = themes.themeElements.clrScheme[p.s.bgColor.theme].rgb;
		}*/
	} catch(e) { if(opts.WTF && styles.Fills) throw e; }
}

function check_ws(ws/*:Worksheet*/, sname/*:string*/, i/*:number*/) {
	if(ws && ws['!ref']) {
		var range = safe_decode_range(ws['!ref']);
		if(range.e.c < range.s.c || range.e.r < range.s.r) throw new Error("Bad range (" + i + "): " + ws['!ref']);
	}
}
