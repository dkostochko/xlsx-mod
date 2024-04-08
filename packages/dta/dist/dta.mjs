var z="0.0.2",$;function H(r){$=r}function U(r){return new TextDecoder().decode(r)}function P(r){return new TextDecoder("latin1").decode(r)}function N(r,t,e){if(r<0){let h=N(-r,t,e);return h.w="-"+h.w,h}let s={t:"n",v:r};switch(e){case 251:case 98:case 65530:t="%8.0g";break;case 252:case 105:case 65529:t="%8.0g";break;case 253:case 108:case 65528:t="%12.0g";break;case 254:case 102:case 65527:t="%9.0g";break;case 255:case 100:case 65526:t="%10.0g";break;default:throw e}try{let h=+(t.match(/%(\d+)/)||[])[1]||8,v=0;r<1&&++v,r<.1&&++v,r<.01&&++v,r<.001&&++v;let D=r.toExponential(),T=D.indexOf("e")==-1?0:+D.slice(D.indexOf("e")+1),y=h-2-T;y<0&&(y=0);var o=t.match(/%\d+\.(\d+)/);o&&+o[1]&&(y=+o[1]),s.w=(Math.round(r*10**y)/10**y).toFixed(y).replace(/^([-]?)0\./,"$1."),s.w=s.w.slice(0,h+v),s.w.indexOf(".")>-1&&(s.w=s.w.replace(/0+$/,"")),s.w=s.w.replace(/\.$/,""),s.w==""&&(s.w="0")}catch{}return s}function L(r){return new DataView(r.buffer,r.byteOffset,r.byteLength)}function n(r,t){return U(r.raw.slice(r.ptr,r.ptr+t.length))!=t?!1:(r.ptr+=t.length,!0)}function B(r,t){r.ptr+=8;let e=r.dv.getFloat64(r.ptr-8,t);return e>8988e304?null:e}function V(r,t){r.ptr+=4;let e=r.dv.getFloat32(r.ptr-4,t);return e>1701e35?null:e}function b(r,t){return r.ptr+=4,r.dv.getUint32(r.ptr-4,t)}function G(r,t){r.ptr+=4;let e=r.dv.getInt32(r.ptr-4,t);return e>2147483620?null:e}function F(r,t){return r.ptr+=2,r.dv.getUint16(r.ptr-2,t)}function I(r,t){r.ptr+=2;let e=r.dv.getInt16(r.ptr-2,t);return e>32740?null:e}function W(r){return r.raw[r.ptr++]}function j(r){let t=r.raw[r.ptr++];return t=t<128?t:t-256,t>100?null:t}var K=["117","118","119","120","121"],J=[102,103,104,105,108,110,111,112,113,114,115];function Y(r){let t="Not a DTA file",e={ptr:0,raw:r,dv:L(r)},s=118,o=!0,h=0,v=0,D=0,T=0,y="",C="",M=[],O=[],E=[];if(!n(e,"<stata_dta>"))throw t;{if(!n(e,"<header>"))throw t;{if(!n(e,"<release>"))throw t;let a=P(e.raw.slice(e.ptr,e.ptr+3));if(e.ptr+=3,!n(e,"</release>"))throw t;if(K.indexOf(a)==-1)throw`Unsupported DTA ${a} file`;s=+a}{if(!n(e,"<byteorder>"))throw t;let a=P(e.raw.slice(e.ptr,e.ptr+3));if(e.ptr+=3,!n(e,"</byteorder>"))throw t;switch(a){case"MSF":o=!1;break;case"LSF":o=!0;break;default:throw`Unsupported byteorder ${a}`}}if(!n(e,"<K>")||(h=s===119||s>=121?b(e,o):F(e,o),!n(e,"</K>")))throw t;{if(!n(e,"<N>"))throw t;if(s==117)v=D=b(e,o);else{let a=b(e,o),l=b(e,o);v=o?(D=a)+(T=l)*Math.pow(2,32):(D=l)+(T=a)*Math.pow(2,32)}if(v>1e6&&console.error("More than 1 million observations -- extra rows will be dropped"),!n(e,"</N>"))throw t}{if(!n(e,"<label>"))throw t;let a=s>=118?2:1,l=a==1?W(e):F(e,o);if(l>0&&(y=U(e.raw.slice(e.ptr,e.ptr+a))),e.ptr+=l,!n(e,"</label>"))throw t}{if(!n(e,"<timestamp>"))throw t;let a=W(e);if(C=P(e.raw.slice(e.ptr,e.ptr+a)),e.ptr+=a,!n(e,"</timestamp>"))throw t}if(!n(e,"</header>"))throw t}if(!n(e,"<map>")||(e.ptr+=8*14,!n(e,"</map>")))throw t;let f=0;{if(!n(e,"<variable_types>"))throw t;for(var w=0;w<h;++w){let a=F(e,o);if(M.push(a),a>=1&&a<=2045)f+=a;else switch(a){case 32768:f+=8;break;case 65525:f+=0;break;case 65526:f+=8;break;case 65527:f+=4;break;case 65528:f+=4;break;case 65529:f+=2;break;case 65530:f+=1;break;default:throw`Unsupported field type ${a}`}}if(!n(e,"</variable_types>"))throw t}{if(!n(e,"<varnames>"))throw t;let a=s>=118?129:33;for(let l=0;l<h;++l){let i=U(e.raw.slice(e.ptr,e.ptr+a));e.ptr+=a,O.push(i.replace(/\x00[\s\S]*/,""))}if(!n(e,"</varnames>"))throw t}if(!n(e,"<sortlist>")||(e.ptr+=(2*h+2)*(s==119||s==121?2:1),!n(e,"</sortlist>")))throw t;{if(!n(e,"<formats>"))throw t;let a=s>=118?57:49;for(let l=0;l<h;++l){let i=U(e.raw.slice(e.ptr,e.ptr+a));e.ptr+=a,E.push(i.replace(/\x00[\s\S]*/,""))}if(!n(e,"</formats>"))throw t}let p=[];{if(!n(e,"<value_label_names>"))throw t;let a=s>=118?129:33;for(let l=0;l<h;++l,e.ptr+=a)p[l]=P(e.raw.slice(e.ptr,e.ptr+a)).replace(/\x00.*$/,"");if(!n(e,"</value_label_names>"))throw t}{if(!n(e,"<variable_labels>"))throw t;let a=s>=118?321:81;if(e.ptr+=a*h,!n(e,"</variable_labels>"))throw t}{if(!n(e,"<characteristics>"))throw t;for(;n(e,"<ch>");){let a=b(e,o);if(e.ptr+=a,!n(e,"</ch>"))throw t}if(!n(e,"</characteristics>"))throw t}let u=$.aoa_to_sheet([O],{dense:!0});var _=[];{if(!n(e,"<data>"))throw t;for(let a=0;a<v;++a){let l=[];for(let i=0;i<h;++i){let d=M[i];if(d>=1&&d<=2045){let c=U(e.raw.slice(e.ptr,e.ptr+d));c=c.replace(/\x00[\s\S]*/,""),l[i]=c,e.ptr+=d}else switch(d){case 65525:e.ptr+=0;break;case 65530:l[i]=j(e);break;case 65529:l[i]=I(e,o);break;case 65528:l[i]=G(e,o);break;case 65527:l[i]=V(e,o);break;case 65526:l[i]=B(e,o);break;case 32768:l[i]="##SheetJStrL##",_.push([a+1,i,e.raw.slice(e.ptr,e.ptr+8)]),e.ptr+=8;break;default:throw`Unsupported field type ${d} for ${O[i]}`}typeof l[i]=="number"&&E[i]&&(l[i]=N(l[i],E[i],d))}$.sheet_add_aoa(u,[l],{origin:-1,sheetStubs:!0})}if(!n(e,"</data>"))throw t}{if(!n(e,"<strls>"))throw t;let a=[];for(;e.raw[e.ptr]==71;){if(!n(e,"GSO"))throw t;let l=b(e,o),i=0;if(s==117)i=b(e,o);else{let x=b(e,o),g=b(e,o);i=o?x+g*Math.pow(2,32):g+x*Math.pow(2,32),i>1e6&&console.error("More than 1 million observations -- data will be dropped")}let d=W(e),c=b(e,o);a[i]||(a[i]=[]);let k="";d==129?(k=new TextDecoder(s>=118?"utf8":"latin1").decode(e.raw.slice(e.ptr,e.ptr+c)),e.ptr+=c):(k=new TextDecoder(s>=118?"utf8":"latin1").decode(e.raw.slice(e.ptr,e.ptr+c)).replace(/\x00$/,""),e.ptr+=c),a[i][l]=k}if(!n(e,"</strls>"))throw t;_.forEach(([l,i,d])=>{let c=L(d),k=0,x=0;switch(s){case 117:k=c.getUint32(0,o),x=c.getUint32(4,o);break;case 118:case 120:{k=c.getUint16(0,o);let g=c.getUint16(2,o),A=c.getUint32(4,o);x=o?g+A*65536:A+g*2**32}break;case 119:case 121:{let g=c.getUint16(0,o),A=d[2];k=o?g+(A<<16):A+(g<<8);let R=d[3],m=c.getUint32(4,o);x=o?R+m*256:m+R*2**32}}u["!data"][l][i].v=a[x][k]})}{let a=s>=118?129:33;if(!n(e,"<value_labels>"))throw t;for(;n(e,"<lbl>");){let l=b(e,o),i=P(e.raw.slice(e.ptr,e.ptr+a)).replace(/\x00.*$/,"");e.ptr+=a,e.ptr+=3;let d=[];{let k=b(e,o),x=b(e,o),g=[],A=[];for(let m=0;m<k;++m)g.push(b(e,o));for(let m=0;m<k;++m)A.push(b(e,o));let R=U(e.raw.slice(e.ptr,e.ptr+x));e.ptr+=x;for(let m=0;m<k;++m)d[A[m]]=R.slice(g[m],R.indexOf("\0",g[m]))}let c=p.indexOf(i);if(c==-1)throw new Error(`unexpected value label |${i}|`);for(let k=1;k<u["!data"].length;++k){let x=u["!data"][k][c];x.t="s",x.v=x.w=d[x.v||0]}if(!n(e,"</lbl>"))throw t}if(!n(e,"</value_labels>"))throw t}if(!n(e,"</stata_dta>"))throw t;let S=$.book_new();return $.book_append_sheet(S,u,"Sheet1"),S.bookType="dta",S}function q(r){let t=r[0];if(J.indexOf(t)==-1)throw new Error("Not a DTA file");let e={ptr:1,raw:r,dv:L(r)},s=!0,o=0,h=0,v="",D="",T=[],y=[],C=[];{let f=W(e);switch(f){case 1:s=!1;break;case 2:s=!0;break;default:throw`DTA ${t} Unexpected byteorder ${f}`}let w=W(e);if(w!=1)throw`DTA ${t} Unexpected filetype ${w}`;e.ptr++,o=F(e,s),h=b(e,s),e.ptr+=t>=108?81:t>=103?32:30,t>=105&&(e.ptr+=18)}let M=[];{let f=0;for(f=0;f<o;++f)T.push(W(e));let w=t>=110?33:9;for(f=0;f<o;++f)y.push(U(e.raw.slice(e.ptr,e.ptr+w)).replace(/\x00[\s\S]*$/,"")),e.ptr+=w;e.ptr+=2*(o+1);let p=t>=114?49:t>=105?12:7;for(f=0;f<o;++f)C.push(U(e.raw.slice(e.ptr,e.ptr+p)).replace(/\x00[\s\S]*$/,"")),e.ptr+=p;let u=t>=110?33:9;for(let _=0;_<o;++_,e.ptr+=u)M[_]=P(e.raw.slice(e.ptr,e.ptr+u)).replace(/\x00.*$/,"")}if(e.ptr+=(t>=106?81:32)*o,t>=105)for(;e.ptr<e.raw.length;){let f=W(e),w=(t>=110?b:F)(e,s);if(f==0&&w==0)break;e.ptr+=w}let O=$.aoa_to_sheet([y],{dense:!0});for(let f=0;f<h;++f){let w=[];for(let p=0;p<o;++p){let u=T[p];if((t==111||t>=113)&&u>=1&&u<=244){let _=U(e.raw.slice(e.ptr,e.ptr+u));_=_.replace(/\x00[\s\S]*/,""),w[p]=_,e.ptr+=u}else if((t==112||t<=110)&&u>=128){let _=U(e.raw.slice(e.ptr,e.ptr+u-127));_=_.replace(/\x00[\s\S]*/,""),w[p]=_,e.ptr+=u-127}else switch(u){case 251:case 98:w[p]=j(e);break;case 252:case 105:w[p]=I(e,s);break;case 253:case 108:w[p]=G(e,s);break;case 254:case 102:w[p]=V(e,s);break;case 255:case 100:w[p]=B(e,s);break;default:throw`Unsupported field type ${u} for ${y[p]}`}typeof w[p]=="number"&&C[p]&&(w[p]=N(w[p],C[p],u))}$.sheet_add_aoa(O,[w],{origin:-1,sheetStubs:!0})}if(t>=115)for(;e.ptr<e.raw.length;){let f=33,w=b(e,s),p=P(e.raw.slice(e.ptr,e.ptr+f)).replace(/\x00.*$/,"");e.ptr+=f,e.ptr+=3;let u=[];{let S=b(e,s),a=b(e,s),l=[],i=[];for(let c=0;c<S;++c)l.push(b(e,s));for(let c=0;c<S;++c)i.push(b(e,s));let d=P(e.raw.slice(e.ptr,e.ptr+a));e.ptr+=a;for(let c=0;c<S;++c)u[i[c]]=d.slice(l[c],d.indexOf("\0",l[c]))}let _=M.indexOf(p);if(_==-1)throw new Error(`unexpected value label |${p}|`);for(let S=1;S<O["!data"].length;++S){let a=O["!data"][S][_];a.t="s",a.v=a.w=u[a.v||0]}}let E=$.book_new();return $.book_append_sheet(E,O,"Sheet1"),E.bookType="dta",E}function Q(r){if(r[0]>=102&&r[0]<=115)return q(r);if(r[0]===60)return Y(r);throw new Error("Not a DTA file")}export{Q as parse,H as set_utils,z as version};
//# sourceMappingURL=dta.mjs.map
