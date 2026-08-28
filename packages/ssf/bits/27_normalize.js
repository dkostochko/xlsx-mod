function normalize_xl_unsafe(v/*:number*/)/*:number*/ {
	if(v == 0) return 0;
	var s = v.toPrecision(17);
	if(s.indexOf("e") > -1) {
		var m = s.slice(0, s.indexOf("e"));
		if(m.indexOf(".") > -1) {
			var tail = m.charAt(0) + m.slice(2, 17);
			m = m.slice(0, 16);
			if(tail.length == 16) {
				m = String(Math.round(Number(tail.slice(0,15) + "." + tail.slice(15))));
				if(m.length == 16) m = m.slice(0,2) + "." + m.slice(2);
				else m = m.charAt(0) + "." + m.slice(1);
			}
		}
		else m = m.slice(0,15) + fill("0", m.length - 15);
		return Number(m + s.slice(s.indexOf("e")));
	}
	var n = s.indexOf(".") > -1 ? s.slice(0, (s.slice(0,2) == "0." ? 17 : 16)) : (s.slice(0,15) + fill("0", s.length - 15));
	return Number(n);
}
