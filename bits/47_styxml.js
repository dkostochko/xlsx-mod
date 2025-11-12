function parse_borders(t, styles, themes, opts) {
	styles.Borders = [];
	let border = null;
	let currentProp = null;
	let pass = false;

	const tagGroups = {
		ignoredTags: ["<borders", "<borders/>", "</borders>"],
		borderTags: ["<border", "<border>", "<border/>"],
		endBorderTags: ["</border>"],
		sideTags: ["<left", "<right", "<top", "<bottom", "<diagonal"],
		endSideTags: ["</left>", "</right>", "</top>", "</bottom>", "</diagonal>"],
		selfClosingSideTags: ["<left/>", "<right/>", "<top/>", "<bottom/>", "<diagonal/>"]
	};

	const handleTag = (tag, y) => {
		if (tagGroups.ignoredTags.includes(tag)) {
			return;
		}
		if (tagGroups.borderTags.includes(tag)) {
			border = {};
		} else if (tagGroups.endBorderTags.includes(tag)) {
			if (border) {
				styles.Borders.push(border);
			}
			border = null;
		} else if (tagGroups.sideTags.includes(tag)) {
			currentProp = tag.slice(1);
			border[currentProp] = y.style ? { style: y.style } : {};
		} else if (tagGroups.endSideTags.includes(tag) || tagGroups.selfClosingSideTags.includes(tag)) {
			currentProp = null;
		} else if (tag === "<color" && currentProp && border[currentProp]) {
			border[currentProp].color = parseColor(y, themes);
		} else if (tag === "<ext") {
			pass = true;
		} else if (tag === "</ext") {
			pass = false;
		} else if (opts?.WTF && !pass) {
			throw new Error(`Unrecognized tag: ${y[0]} in borders`);
		}
	};

	(t[0].match(tagregex) || []).forEach(x => {
		const y = parsexmltag(x);
		handleTag(strip_ns(y[0]), y);
	});
}

/* 18.8.21 fills CT_Fills */
function parse_fills(t, styles, themes, opts) {
	styles.Fills = [];
	var fill = {};
	var pass = false;
	(t[0].match(tagregex)||[]).forEach(function(x) {
		var y = parsexmltag(x);
		switch(strip_ns(y[0])) {
			case '<fills': case '<fills>': case '</fills>': break;

			/* 18.8.20 fill CT_Fill */
			case '<fill>': case '<fill': case '<fill/>':
				fill = {}; styles.Fills.push(fill); break;
			case '</fill>': break;

			/* 18.8.24 gradientFill CT_GradientFill */
			case '<gradientFill>': break;
			case '<gradientFill':
			case '</gradientFill>': styles.Fills.push(fill); fill = {}; break;

			/* 18.8.32 patternFill CT_PatternFill */
			case '<patternFill': case '<patternFill>':
				if(y.patternType) fill.patternType = y.patternType;
				break;
			case '<patternFill/>': case '</patternFill>': break;

			/* 18.8.3 bgColor CT_Color */
			case '<bgColor':
				fill.bgColor = parseColor(y, themes);
				break;
			case '<bgColor/>': case '</bgColor>': break;

			/* 18.8.19 fgColor CT_Color */
			case '<fgColor':
				fill.fgColor = parseColor(y, themes);
				break;
			case '<fgColor/>': case '</fgColor>': break;

			/* 18.8.38 stop CT_GradientStop */
			case '<stop': case '<stop/>': break;
			case '</stop>': break;

			/* 18.8.? color CT_Color */
			case '<color': case '<color/>': break;
			case '</color>': break;

			/* 18.2.10 extLst CT_ExtensionList ? */
			case '<extLst': case '<extLst>': case '</extLst>': break;
			case '<ext': pass = true; break;
			case '</ext>': pass = false; break;
			default: if(opts && opts.WTF) {
				if(!pass) throw new Error('unrecognized ' + y[0] + ' in fills');
			}
		}
	});
}

/* 18.8.23 fonts CT_Fonts */
function parse_fonts(t, styles, themes, opts) {
	styles.Fonts = [];
	var font = {};
	var pass = false;
	(t[0].match(tagregex)||[]).forEach(function(x) {
		var y = parsexmltag(x);
		switch(strip_ns(y[0])) {
			case '<fonts': case '<fonts>': case '</fonts>': break;

			/* 18.8.22 font CT_Font */
			case '<font': case '<font>': break;
			case '</font>': case '<font/>':
				styles.Fonts.push(font);
				font = {};
				break;

			/* 18.8.29 name CT_FontName */
			case '<name': if(y.val) font.name = utf8read(y.val); break;
			case '<name/>': case '</name>': break;

			/* 18.8.2  b CT_BooleanProperty */
			case '<b': font.bold = y.val ? parsexmlbool(y.val) : 1; break;
			case '<b/>': font.bold = 1; break;

			/* 18.8.26 i CT_BooleanProperty */
			case '<i': font.italic = y.val ? parsexmlbool(y.val) : 1; break;
			case '<i/>': font.italic = 1; break;

			/* 18.4.13 u CT_UnderlineProperty */
			case '<u':
				switch(y.val) {
					case "none": font.underline = 0x00; break;
					case "single": font.underline = 0x01; break;
					case "double": font.underline = 0x02; break;
					case "singleAccounting": font.underline = 0x21; break;
					case "doubleAccounting": font.underline = 0x22; break;
				} break;
			case '<u/>': font.underline = 1; break;

			/* 18.4.10 strike CT_BooleanProperty */
			case '<strike': font.strike = y.val ? parsexmlbool(y.val) : 1; break;
			case '<strike/>': font.strike = 1; break;

			/* 18.4.2  outline CT_BooleanProperty */
			case '<outline': font.outline = y.val ? parsexmlbool(y.val) : 1; break;
			case '<outline/>': font.outline = 1; break;

			/* 18.8.36 shadow CT_BooleanProperty */
			case '<shadow': font.shadow = y.val ? parsexmlbool(y.val) : 1; break;
			case '<shadow/>': font.shadow = 1; break;

			/* 18.8.12 condense CT_BooleanProperty */
			case '<condense': font.condense = y.val ? parsexmlbool(y.val) : 1; break;
			case '<condense/>': font.condense = 1; break;

			/* 18.8.17 extend CT_BooleanProperty */
			case '<extend': font.extend = y.val ? parsexmlbool(y.val) : 1; break;
			case '<extend/>': font.extend = 1; break;

			/* 18.4.11 sz CT_FontSize */
			case '<sz': if(y.val) font.sz = +y.val; break;
			case '<sz/>': case '</sz>': break;

			/* 18.4.14 vertAlign CT_VerticalAlignFontProperty */
			case '<vertAlign': if(y.val) font.vertAlign = y.val; break;
			case '<vertAlign/>': case '</vertAlign>': break;

			/* 18.8.18 family CT_FontFamily */
			case '<family': if(y.val) font.family = parseInt(y.val,10); break;
			case '<family/>': case '</family>': break;

			/* 18.8.35 scheme CT_FontScheme */
			case '<scheme': if(y.val) font.scheme = y.val; break;
			case '<scheme/>': case '</scheme>': break;

			/* 18.4.1 charset CT_IntProperty */
			case '<charset':
				if(y.val == '1') break;
				y.codepage = CS2CP[parseInt(y.val, 10)];
				break;

			/* 18.?.? color CT_Color */
			case '<color':
				font.color = parseColor(y, themes);
				break;
			case '<color/>': case '</color>': break;

			/* note: sometimes mc:AlternateContent appears bare */
			case '<AlternateContent': pass = true; break;
			case '</AlternateContent>': pass = false; break;

			/* 18.2.10 extLst CT_ExtensionList ? */
			case '<extLst': case '<extLst>': case '</extLst>': break;
			case '<ext': pass = true; break;
			case '</ext>': pass = false; break;
			default: if(opts && opts.WTF) {
				if(!pass) throw new Error('unrecognized ' + y[0] + ' in fonts');
			}
		}
	});
}

/* 18.8.31 numFmts CT_NumFmts */
function parse_numFmts(t, styles, opts) {
	styles.NumberFmt = [];
	var k/*Array<number>*/ = (keys(table_fmt)/*:any*/);
	for(var i=0; i < k.length; ++i) styles.NumberFmt[k[i]] = table_fmt[k[i]];
	var m = t[0].match(tagregex);
	if(!m) return;
	for(i=0; i < m.length; ++i) {
		var y = parsexmltag(m[i]);
		switch(strip_ns(y[0])) {
			case '<numFmts': case '</numFmts>': case '<numFmts/>': case '<numFmts>': break;
			case '<numFmt': {
				var f=unescapexml(utf8read(y.formatCode)), j=parseInt(y.numFmtId,10);
				styles.NumberFmt[j] = f;
				if(j>0) {
					if(j > 0x188) {
						for(j = 0x188; j > 0x3c; --j) if(styles.NumberFmt[j] == null) break;
						styles.NumberFmt[j] = f;
					}
					SSF__load(f,j);
				}
			} break;
			case '</numFmt>': break;
			default: if(opts.WTF) throw new Error('unrecognized ' + y[0] + ' in numFmts');
		}
	}
}

function write_numFmts(NF/*:{[n:number|string]:string}*//*::, opts*/) {
	var o = ["<numFmts>"];
	[[5,8],[23,26],[41,44],[/*63*/50,/*66],[164,*/392]].forEach(function(r) {
		for(var i = r[0]; i <= r[1]; ++i) if(NF[i] != null) o[o.length] = (writextag('numFmt',null,{numFmtId:i,formatCode:escapexml(NF[i])}));
	});
	if(o.length === 1) return "";
	o[o.length] = ("</numFmts>");
	o[0] = writextag('numFmts', null, { count:o.length-2 }).replace("/>", ">");
	return o.join("");
}

/* 18.8.10 cellXfs CT_CellXfs */
var cellXF_uint = [ "numFmtId", "fillId", "fontId", "borderId", "xfId" ];
var cellXF_bool = [ "applyAlignment", "applyBorder", "applyFill", "applyFont", "applyNumberFormat", "applyProtection", "pivotButton", "quotePrefix" ];
function parse_cellXfs(t, styles, opts) {
	styles.CellXf = [];
	var xf;
	var pass = false;
	(t[0].match(tagregex)||[]).forEach(function(x) {
		var y = parsexmltag(x), i = 0;
		switch(strip_ns(y[0])) {
			case '<cellXfs': case '<cellXfs>': case '<cellXfs/>': case '</cellXfs>': break;

			/* 18.8.45 xf CT_Xf */
			case '<xf': case '<xf/>': case '<xf>':
				xf = y;
				delete xf[0];
				for(i = 0; i < cellXF_uint.length; ++i) if(xf[cellXF_uint[i]])
					xf[cellXF_uint[i]] = parseInt(xf[cellXF_uint[i]], 10);
				for(i = 0; i < cellXF_bool.length; ++i) if(xf[cellXF_bool[i]])
					xf[cellXF_bool[i]] = parsexmlbool(xf[cellXF_bool[i]]);
				if(styles.NumberFmt && xf.numFmtId > 0x188) {
					for(i = 0x188; i > 0x3c; --i) if(styles.NumberFmt[xf.numFmtId] == styles.NumberFmt[i]) { xf.numFmtId = i; break; }
				}
				styles.CellXf.push(xf); break;
			case '</xf>': break;

			/* 18.8.1 alignment CT_CellAlignment */
			case '<alignment': case '<alignment/>': case '<alignment>':
				var alignment = {};
				if(y.vertical) alignment.vertical = y.vertical;
				if(y.horizontal) alignment.horizontal = y.horizontal;
				if(y.textRotation != null) alignment.textRotation = y.textRotation;
				if(y.indent) alignment.indent = y.indent;
				if(y.wrapText) alignment.wrapText = parsexmlbool(y.wrapText);
				xf.alignment = alignment;
				break;
			case '</alignment>': break;

			/* 18.8.33 protection CT_CellProtection */
			case '<protection': case '<protection>':
				break;
			case '</protection>': case '<protection/>': break;

			/* note: sometimes mc:AlternateContent appears bare */
			case '<AlternateContent': case '<AlternateContent>': pass = true; break;
			case '</AlternateContent>': pass = false; break;

			/* 18.2.10 extLst CT_ExtensionList ? */
			case '<extLst': case '<extLst>': case '</extLst>': break;
			case '<ext': pass = true; break;
			case '</ext>': pass = false; break;
			default: if(opts && opts.WTF) {
				if(!pass) throw new Error('unrecognized ' + y[0] + ' in cellXfs');
			}
		}
	});
}

function write_cellXfs(cellXfs)/*:string*/ {
	var o/*:Array<string>*/ = [];
	o[o.length] = (writextag('cellXfs',null));
	cellXfs.forEach(function(c) {
		o[o.length] = (writextag('xf', null, c));
	});
	o[o.length] = ("</cellXfs>");
	if(o.length === 2) return "";
	o[0] = writextag('cellXfs',null, {count:o.length-2}).replace("/>",">");
	return o.join("");
}

function parse_dxfs(t, styles, themes) {
	const TAGRE = (typeof tagregex !== 'undefined' && tagregex) || /<[^>]*>/g;
	const dxfs = [];
	if (!t || !t[0]) {
		if (styles) styles.DifferentialFormats = dxfs;
		return dxfs;
	}

	const tokens = t[0].match(TAGRE) || [];

	let inDxfs = false;
	let inDxf = false;
	let cur = null;
	let inFont = false;
	let inFill = false;
	let inPatternFill = false;
	let inBorder = false;
	let borderEdge = null;

	const stripNs = (n) => n.replace(/^[A-Za-z_][\w.-]*:/, "");
	const parseTag = (tok) => {
		const isClose = /^<\//.test(tok);
		const isSelfClose = /\/>$/.test(tok);
		const m = tok.match(/^<\/*([A-Za-z0-9_:\-]+)(?:\s[^>]*)?\/?>$/);
		const name = m ? stripNs(m[1]) : "";
		return { name, isClose, isSelfClose };
	};
	const parseAttrs = (tok) => {
		const out = {};
		let m;
		const re = /([A-Za-z_][\w:.-]*)\s*=\s*"([^"]*)"/g;
		while ((m = re.exec(tok))) {
			out[stripNs(m[1])] = m[2];
		}
		return out;
	};
	const num = (v) => (v == null ? undefined : (v.indexOf('.') >= 0 ? parseFloat(v) : parseInt(v, 10)));
	const bool = (v) => v === "1" || v === "true" || v === "TRUE";
	const ensure = (obj, key) => {
		if (!obj[key]) obj[key] = {};
		return obj[key];
	};

	tokens.forEach((tok) => {
		const { name, isClose, isSelfClose } = parseTag(tok);
		const attrs = isClose ? {} : parseAttrs(tok);

		if (name === "dxfs") {
			if (!isClose) inDxfs = true;
			else inDxfs = false;
			return;
		}

		if (!inDxfs) return;

		if (name === "dxf") {
			if (isClose) {
				if (cur) dxfs.push(cur);
				cur = null;
				inDxf = false;
			} else {
				inDxf = true;
				cur = {};
				if (isSelfClose) {
					dxfs.push(cur);
					cur = null;
					inDxf = false;
				}
			}
			return;
		}

		if (!inDxf) return;

		if (name === "font") {
			if (isClose) inFont = false;
			else {
				inFont = true;
				if (!isSelfClose) ensure(cur, "font");
				else ensure(cur, "font");
			}
			return;
		}

		if (name === "fill") {
			if (isClose) inFill = false;
			else {
				inFill = true;
				if (isSelfClose) ensure(cur, "fill");
			}
			return;
		}
		if (name === "patternFill") {
			if (isClose) inPatternFill = false;
			else {
				inPatternFill = true;
				const f = ensure(cur, "fill");
				if (attrs.patternType) f.patternType = attrs.patternType;
			}
			return;
		}

		if (name === "border") {
			if (isClose) {
				inBorder = false;
			} else {
				inBorder = true;
				ensure(cur, "border");
			}
			return;
		}
		if (inBorder && (name === "left" || name === "right" || name === "top" || name === "bottom" || name === "diagonal" || name === "vertical" || name === "horizontal")) {
			if (isClose) {
				borderEdge = null;
			} else {
				borderEdge = name;
				const b = ensure(cur, "border");
				if (!b[borderEdge]) b[borderEdge] = {};
				if (attrs.style) b[borderEdge].style = attrs.style;
				if (isSelfClose) borderEdge = null;
			}
			return;
		}

		if (inFont) {
			if (name === "b" && !isClose) {
				ensure(cur, "font").bold = true;
				return;
			}
			if (name === "i" && !isClose) {
				ensure(cur, "font").italic = true;
				return;
			}
			if (name === "strike" && !isClose) {
				ensure(cur, "font").strike = true;
				return;
			}
			if (name === "u" && !isClose) {
				const v = attrs.val;
				ensure(cur, "font").underline = v ? v : true;
				return;
			}
			if (name === "color" && !isClose) {
				ensure(cur, "font").color = {rgb: "#"+parseColor(attrs, themes).rgb};
				return;
			}
			if (name === "sz" && !isClose && attrs.val != null) {
				ensure(cur, "font").sz = num(attrs.val);
				return;
			}
			if (name === "name" && !isClose && attrs.val != null) {
				ensure(cur, "font").name = attrs.val;
				return;
			}
			if (name === "family" && !isClose && attrs.val != null) {
				ensure(cur, "font").family = num(attrs.val);
				return;
			}
			if (name === "charset" && !isClose && attrs.val != null) {
				ensure(cur, "font").charset = num(attrs.val);
				return;
			}
			if (name === "scheme" && !isClose && attrs.val != null) {
				ensure(cur, "font").scheme = attrs.val;
				return;
			}
		}

		if (inPatternFill) {
			if (name === "fgColor" && !isClose) {
				ensure(cur, "fill").fgColor = {rgb: "#"+parseColor(attrs, themes).rgb};
				return;
			}
			if (name === "bgColor" && !isClose) {
				ensure(cur, "fill").bgColor = {rgb: "#"+parseColor(attrs, themes).rgb};
				return;
			}
		}

		if (inBorder && borderEdge && name === "color" && !isClose) {
			const b = ensure(cur, "border");
			if (!b[borderEdge]) b[borderEdge] = {};
			b[borderEdge].color = {rgb: "#"+parseColor(attrs, themes).rgb};
			return;
		}

		if (name === "alignment" && !isClose) {
			const a = ensure(cur, "alignment");
			if (attrs.horizontal) a.horizontal = attrs.horizontal;
			if (attrs.vertical) a.vertical = attrs.vertical;
			if (attrs.textRotation != null) a.textRotation = num(attrs.textRotation);
			if (attrs.wrapText != null) a.wrapText = bool(attrs.wrapText);
			if (attrs.indent != null) a.indent = num(attrs.indent);
			if (attrs.shrinkToFit != null) a.shrinkToFit = bool(attrs.shrinkToFit);
			if (attrs.readingOrder != null) a.readingOrder = num(attrs.readingOrder);
			return;
		}

		if (name === "protection" && !isClose) {
			const p = ensure(cur, "protection");
			if (attrs.locked != null) p.locked = bool(attrs.locked);
			if (attrs.hidden != null) p.hidden = bool(attrs.hidden);
			return;
		}

		if (name === "numFmt" && !isClose) {
			const n = {};
			if (attrs.numFmtId != null) n.numFmtId = num(attrs.numFmtId);
			if (attrs.formatCode != null) n.formatCode = attrs.formatCode;
			if (Object.keys(n).length) cur.numFmt = n;
			return;
		}

		if (name === "extLst") {
			return;
		}
	});

	if (styles) styles.DifferentialFormats = dxfs;
	return dxfs;
}


/* 18.8 Styles CT_Stylesheet*/
var parse_sty_xml= /*#__PURE__*/(function make_pstyx() {
var numFmtRegex = /<(?:\w+:)?numFmts([^>]*)>[\S\s]*?<\/(?:\w+:)?numFmts>/;
var cellXfRegex = /<(?:\w+:)?cellXfs([^>]*)>[\S\s]*?<\/(?:\w+:)?cellXfs>/;
var dxfsRegex = /<(?:\w+:)?dxfs([^>]*)>[\S\s]*?<\/(?:\w+:)?dxfs>/;
var fillsRegex = /<(?:\w+:)?fills([^>]*)>[\S\s]*?<\/(?:\w+:)?fills>/;
var fontsRegex = /<(?:\w+:)?fonts([^>]*)>[\S\s]*?<\/(?:\w+:)?fonts>/;
var bordersRegex = /<(?:\w+:)?borders([^>]*)>[\S\s]*?<\/(?:\w+:)?borders>/;

return function parse_sty_xml(data, themes, opts) {
	var styles = {};
	if(!data) return styles;
	data = str_remove_ng(data, "<!--", "-->").replace(/<!DOCTYPE[^\[]*\[[^\]]*\]>/gm,"");
	/* 18.8.39 styleSheet CT_Stylesheet */
	var t;

	/* 18.8.31 numFmts CT_NumFmts ? */
	if((t=data.match(numFmtRegex))) parse_numFmts(t, styles, opts);

	/* 18.8.23 fonts CT_Fonts ? */
	if((t=data.match(fontsRegex))) parse_fonts(t, styles, themes, opts);

	/* 18.8.21 fills CT_Fills ? */
	if((t=data.match(fillsRegex))) parse_fills(t, styles, themes, opts);

	/* 18.8.5  borders CT_Borders ? */
	if((t=data.match(bordersRegex))) parse_borders(t, styles, themes, opts);

	/* 18.8.9  cellStyleXfs CT_CellStyleXfs ? */
	/* 18.8.8  cellStyles CT_CellStyles ? */

	/* 18.8.10 cellXfs CT_CellXfs ? */
	if((t=data.match(cellXfRegex))) parse_cellXfs(t, styles, opts);

	if((t=data.match(dxfsRegex))) {
		parse_dxfs(t, styles, themes);
	}

	/* 18.8.15 dxfs CT_Dxfs ? */
	/* 18.8.42 tableStyles CT_TableStyles ? */
	/* 18.8.11 colors CT_Colors ? */
	/* 18.2.10 extLst CT_ExtensionList ? */

	return styles;
};
})();

function write_sty_xml(wb/*:Workbook*/, opts)/*:string*/ {
	var o = [XML_HEADER, writextag('styleSheet', null, {
		'xmlns': XMLNS_main[0],
		'xmlns:vt': XMLNS.vt
	})], w;
	if(wb.SSF && (w = write_numFmts(wb.SSF)) != null) o[o.length] = w;
	o[o.length] = ('<fonts count="1"><font><sz val="12"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font></fonts>');
	o[o.length] = ('<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>');
	o[o.length] = ('<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>');
	o[o.length] = ('<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>');
	if((w = write_cellXfs(opts.cellXfs))) o[o.length] = (w);
	o[o.length] = ('<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>');
	o[o.length] = ('<dxfs count="0"/>');
	o[o.length] = ('<tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4"/>');

	if(o.length>2){ o[o.length] = ('</styleSheet>'); o[1]=o[1].replace("/>",">"); }
	return o.join("");
}
