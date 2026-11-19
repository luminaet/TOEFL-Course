/* Lumina Skill Editor v2 — mengedit halaman materi (Skill 1–8) langsung pada tampilannya.
   Pasang di halaman materi dengan dua baris sebelum </body>:
     <script src="lumina-core.js"></script>
     <script src="lumina-skill-editor.js"></script>
   Buka halaman dengan ?edit=1 (atau dari Content Manager) lalu masuk sebagai admin.
   v2: font (jenis/ukuran/warna), warna bebas, warna/ukuran/border/kolom kartu, undo/redo.
   Skrip ini juga menggantikan L.sanitizeRich agar gaya tersebut tidak terbuang saat disimpan/ditampilkan. */
(function(){
"use strict";
var L=window.Lumina; if(!L)return;
var PID=(location.pathname.split("/").pop()||"index").replace(/\.html?$/i,"")||"page";
var wantEdit=/[?&]edit(=|&|$)/.test(location.search);
var cms=null, editing=false, selected=null, dirty=false, savedRange=null;
var HL=["#fff3a3","#c9f2d9","#ffd3de","#cfe3ff","#ffdcb0","#e2e8f0"], TC=["#000000","#334155","#64748b","#dc2626","#2563eb","#16a34a","#d97706","#7c3aed"];
var CPX=null,SHADES=[50,100,200,300,400,500,600,700,800,900];
var NEUTRAL=["#000000","#020617","#0f172a","#1e293b","#334155","#475569","#64748b","#94a3b8","#cbd5e1","#e2e8f0","#f1f5f9","#f8fafc","#ffffff"];
var FAM=[
 ["Gray",["#f9fafb","#f3f4f6","#e5e7eb","#d1d5db","#9ca3af","#6b7280","#4b5563","#374151","#1f2937","#111827"]],
 ["Emerald",["#ecfdf5","#d1fae5","#a7f3d0","#6ee7b7","#34d399","#10b981","#059669","#047857","#065f46","#064e3b"]],
 ["Teal",["#f0fdfa","#ccfbf1","#99f6e4","#5eead4","#2dd4bf","#14b8a6","#0d9488","#0f766e","#115e59","#134e4a"]],
 ["Indigo",["#eef2ff","#e0e7ff","#c7d2fe","#a5b4fc","#818cf8","#6366f1","#4f46e5","#4338ca","#3730a3","#312e81"]],
 ["Blue",["#eff6ff","#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8","#1e40af","#1e3a8a"]],
 ["Rose",["#fff1f2","#ffe4e6","#fecdd3","#fda4af","#fb7185","#f43f5e","#e11d48","#be123c","#9f1239","#881337"]],
 ["Amber",["#fffbeb","#fef3c7","#fde68a","#fcd34d","#fbbf24","#f59e0b","#d97706","#b45309","#92400e","#78350f"]],
 ["Red",["#fef2f2","#fee2e2","#fecaca","#fca5a5","#f87171","#ef4444","#dc2626","#b91c1c","#991b1b","#7f1d1d"]],
 ["Orange",["#fff7ed","#ffedd5","#fed7aa","#fdba74","#fb923c","#f97316","#ea580c","#c2410c","#9a3412","#7c2d12"]],
 ["Green",["#f0fdf4","#dcfce7","#bbf7d0","#86efac","#4ade80","#22c55e","#16a34a","#15803d","#166534","#14532d"]],
 ["Sky",["#f0f9ff","#e0f2fe","#bae6fd","#7dd3fc","#38bdf8","#0ea5e9","#0284c7","#0369a1","#075985","#0c4a6e"]],
 ["Violet",["#f5f3ff","#ede9fe","#ddd6fe","#c4b5fd","#a78bfa","#8b5cf6","#7c3aed","#6d28d9","#5b21b6","#4c1d95"]],
 ["Pink",["#fdf2f8","#fce7f3","#fbcfe8","#f9a8d4","#f472b6","#ec4899","#db2777","#be185d","#9d174d","#831843"]]
];
function esc(s){return L.esc(s);}
function dec(s){var t=document.createElement("textarea");t.innerHTML=String(s==null?"":s);return t.value;}

/* ---------- penyaring HTML "kaya" (menggantikan L.sanitizeRich) ---------- */
(function(){
 var RICH={},DROP={};
 "DIV SPAN P BR B STRONG I EM U S MARK UL OL LI H1 H2 H3 H4 H5 H6 A TABLE THEAD TBODY TFOOT TR TH TD CODE PRE BLOCKQUOTE HR SUB SUP SMALL".split(" ").forEach(function(t){RICH[t]=1;});
 "SCRIPT STYLE IFRAME OBJECT EMBED LINK META NOSCRIPT TEMPLATE SVG MATH FORM INPUT BUTTON TEXTAREA SELECT".split(" ").forEach(function(t){DROP[t]=1;});
 var CLASS_RE=/^[\w\s\-:\/\[\]\.%#(),!@=+*]*$/;
 var C=/^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}(\.\d+)?\s*(,\s*\d{1,3}(\.\d+)?\s*){2}(,\s*[\d.]+\s*)?\)|[a-z]{3,20})$/i;
 var SZ=/^(auto|0|-?[\d.]+(px|%|em|rem|vw|vh)?)(\s+(auto|0|-?[\d.]+(px|%|em|rem)?)){0,3}$/;
 var STY={"color":C,"background-color":C,"border-color":C,
  "border-style":/^(solid|dashed|dotted|none)$/,"border-width":SZ,"border-radius":SZ,
  "width":SZ,"max-width":SZ,"height":SZ,"min-height":SZ,"padding":SZ,"margin":SZ,"gap":SZ,"font-size":SZ,
  "font-family":/^[\w\s,'"\-]{1,100}$/,
  "font-weight":/^(normal|bold|[1-9]00)$/,"font-style":/^(normal|italic)$/,
  "text-decoration":/^(none|underline|line-through)([\sa-z0-9().,#%-]*)$/i,
  "text-align":/^(left|right|center|justify)$/,"line-height":/^[\d.]+(px|em|rem|%)?$/,
  "box-sizing":/^(border-box|content-box)$/,"flex":/^(none|auto|[\d.]+(\s+[\d.]+)?(\s+(auto|[\d.]+(px|%)?))?)$/,"border-collapse":/^(collapse|separate)$/,
  "grid-template-columns":/^repeat\(\s*\d{1,2}\s*,\s*minmax\(\s*0(px)?\s*,\s*1fr\s*\)\s*\)$/};
 function styleOf(el){
  var out=[];
  Object.keys(STY).forEach(function(p){
   var v=(el.style.getPropertyValue(p)||"").trim();
   if(v&&!/url|expression|javascript|[@\\;{}<>]/i.test(v)&&STY[p].test(v))out.push(p+":"+v);
  });
  return out.join(";");
 }
 function walk(src,dst,doc){
  Array.prototype.slice.call(src.childNodes).forEach(function(ch){
   if(ch.nodeType===3){dst.appendChild(doc.createTextNode(ch.nodeValue));return;}
   if(ch.nodeType!==1)return;
   var tag=ch.tagName;
   if(DROP[tag])return;
   if(!RICH[tag]){walk(ch,dst,doc);return;}
   var el=doc.createElement(tag.toLowerCase());
   var cls=(ch.getAttribute("class")||"").split(/\s+/).filter(function(c){return c&&c.indexOf("lum-")!==0;}).join(" ");
   if(cls&&cls.length<600&&CLASS_RE.test(cls))el.setAttribute("class",cls);
   var rid=ch.getAttribute("id");if(rid&&/^quiz-[a-z-]{1,30}$/.test(rid))el.setAttribute("id",rid);
   if(tag==="A"){var href=L.safeUrl(ch.getAttribute("href"));if(href){el.setAttribute("href",href);el.setAttribute("target","_blank");el.setAttribute("rel","noopener noreferrer");}}
   if(tag==="TD"||tag==="TH"){["colspan","rowspan"].forEach(function(a){var v=ch.getAttribute(a);if(v&&/^\d{1,2}$/.test(v))el.setAttribute(a,v);});}
   var st=styleOf(ch);if(st)el.setAttribute("style",st);
   walk(ch,el,doc);dst.appendChild(el);
  });
 }
 L.sanitizeRich=function(html){
  var src=new DOMParser().parseFromString("<body>"+String(html||""),"text/html").body;
  var doc=document.implementation.createHTMLDocument(""),wrap=doc.createElement("div");
  walk(src,wrap,doc);return wrap.innerHTML;
 };
})();

/* sembunyikan sebentar agar tidak berkedip saat konten tersimpan diterapkan */
var hide=document.createElement("style");hide.id="lum-hide";hide.textContent="main{visibility:hidden}";document.head.appendChild(hide);
function reveal(){var h=document.getElementById("lum-hide");if(h)h.remove();}
setTimeout(reveal,2500);

var css=document.createElement("style");
css.textContent=[
".lum-sel{outline:2px dashed #e11d48!important;outline-offset:2px;resize:both;overflow:auto}",
"body.lum-edit{padding-bottom:260px}",
"body.lum-edit main .tab-content{outline:2px dashed #14b8a6;outline-offset:6px;border-radius:10px}",
"body.lum-edit main .tab-content:focus{outline-style:solid}",
"#lum-bar{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99999;width:max-content;max-width:96vw;max-height:48vh;overflow:auto;background:#0f172a;color:#cbd5e1;border-radius:14px;padding:8px 10px;box-shadow:0 10px 40px #0009;font:600 12px 'Plus Jakarta Sans',system-ui,sans-serif}",
"#lum-bar .r{display:flex;flex-wrap:wrap;gap:5px;align-items:center;justify-content:center;margin:3px 0}",
"#lum-bar button,#lum-bar select,#lum-bar input[type=number],.lum-fab{background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:7px;min-width:28px;height:28px;padding:0 9px;font:inherit;cursor:pointer}",
"#lum-bar input[type=number]{width:60px;cursor:text}",
"#lum-bar input[type=color]{width:30px;height:28px;padding:1px;border:1px solid #334155;border-radius:7px;background:#fff;cursor:pointer}",
"#lum-bar button:hover{background:#334155}",
"#lum-bar button:disabled{opacity:.4;cursor:not-allowed}",
"#lum-bar .sw{min-width:20px;width:20px;height:20px;padding:0;border-radius:50%}",
"#lum-bar .sep{width:1px;height:22px;background:#334155;margin:0 3px}",
"#lum-bar .lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}",
"#lum-bar .pri{background:#14b8a6;color:#04201c;border-color:#14b8a6}",
"#lum-bar .dng{background:#7f1d1d;border-color:#991b1b;color:#fecaca}",
"#lum-r2,#lum-r3{background:#1b2a47;border-radius:9px;padding:4px 6px}",
".lum-fab{position:fixed;right:14px;bottom:14px;z-index:99998;height:36px;box-shadow:0 6px 20px #0006}",
".lum-modal{position:fixed;inset:0;background:#0009;z-index:100000;display:grid;place-items:center;padding:16px;font-family:'Plus Jakarta Sans',system-ui,sans-serif}",
".lum-card{background:#fff;color:#0f172a;border-radius:14px;padding:20px;width:100%;max-width:640px;max-height:90vh;overflow:auto}",
".lum-card h3{margin:0 0 12px;font-size:17px}",
".lum-card label{display:grid;gap:4px;font-size:12px;font-weight:700;color:#475569;margin-bottom:10px}",
".lum-card input[type=text],.lum-card input[type=password],.lum-card textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;font:inherit;font-size:13px}",
".lum-card .b{border:0;border-radius:8px;padding:9px 14px;font:700 12px inherit;cursor:pointer;background:#0f172a;color:#fff}",
".lum-card .b.s{background:#e2e8f0;color:#334155}.lum-card .b.d{background:#fee2e2;color:#991b1b}",
".lum-q{border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px;background:#f8fafc}",
".lum-opt{display:flex;gap:8px;align-items:center;margin-bottom:6px}.lum-opt input[type=text]{flex:1}",
".lum-err{color:#b91c1c;font-size:12px;margin:0 0 10px}",
"#lum-pal{position:fixed;left:50%;transform:translateX(-50%);z-index:100000;width:min(600px,94vw);overflow:auto;background:#0f172a;color:#cbd5e1;border:1px solid #334155;border-radius:12px;padding:10px 12px;box-shadow:0 12px 40px #000a;font:600 12px 'Plus Jakarta Sans',system-ui,sans-serif}",
"#lum-pal .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;color:#e2e8f0;position:sticky;top:-10px;background:#0f172a;padding:4px 0;z-index:1}",
"#lum-pal .pl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin:8px 0 4px}",
"#lum-pal .pg{display:flex;flex-wrap:wrap;gap:4px}",
"#lum-pal .ps{width:24px;height:24px;border-radius:6px;border:1px solid #475569;padding:0;cursor:pointer}",
"#lum-pal .ps:hover{outline:2px solid #14b8a6;outline-offset:1px}",
"#lum-pal button[data-pc]{background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:7px;height:26px;padding:0 9px;cursor:pointer;font:inherit}",
"#lum-toast{position:fixed;left:50%;top:70px;transform:translateX(-50%);background:#0f172a;color:#fff;padding:9px 16px;border-radius:9px;font:600 13px system-ui;z-index:100001;opacity:0;transition:.25s;pointer-events:none}",
"#lum-toast.on{opacity:1}",
"main .tab-content [style*='width']:not(td):not(th){max-width:100%!important;box-sizing:border-box}",
"main .tab-content table{max-width:100%}",
"@media(max-width:640px){main .tab-content [style*='grid-template-columns']{grid-template-columns:1fr!important}}",
"@media(max-width:640px){main .tab-content .kotak-teks{width:100%!important;margin-left:0!important;margin-right:0!important}main .tab-content :has(>[style*='flex:']){flex-wrap:wrap}main .tab-content [style*='flex:']{flex:1 1 100%!important;width:100%!important}main .tab-content [style^='width:']:not(td):not(th),main .tab-content [style*=';width:']:not(td):not(th),main .tab-content [style*='; width:']:not(td):not(th){width:100%!important}}"
].join("\n");
document.head.appendChild(css);

function toast(m){var t=document.getElementById("lum-toast");if(!t){t=document.createElement("div");t.id="lum-toast";document.body.appendChild(t);}t.textContent=m;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove("on");},2400);}
function isAdmin(){var a=L.currentAccount(cms);return !!a&&a.role==="admin";}
function sections(){return Array.prototype.slice.call(document.querySelectorAll("main .tab-content"));}
function $(id){return document.getElementById(id);}

/* ---------- menerapkan konten tersimpan ---------- */
function cleanQ(q,i){
 var opts=(q.options||[]).map(function(o){return {text:L.sanitizeHTML(o.text),isCorrect:!!o.isCorrect};});
 return {id:i+1,question:L.sanitizeHTML(q.question),options:opts,explanation:L.sanitizeHTML(q.explanation)};
}
function setScoreText(){var el=document.getElementById("quiz-score");if(el&&typeof quizQuestions!=="undefined")el.textContent="0 / "+quizQuestions.length;}
function applySaved(){
 var s=cms.skills&&cms.skills[PID];
 if(s){
  if(s.title){var h1=document.querySelector("header h1");if(h1)h1.textContent=s.title;}
  sections().forEach(function(sec){if(typeof s.sections[sec.id]==="string")sec.innerHTML=L.sanitizeRich(s.sections[sec.id]);});
  if(Array.isArray(s.quiz)&&typeof quizQuestions!=="undefined"){
   quizQuestions.length=0;s.quiz.forEach(function(q,i){quizQuestions.push(cleanQ(q,i));});
   if(typeof userAnswers!=="undefined")Object.keys(userAnswers).forEach(function(k){delete userAnswers[k];});
  }
 }
 if(typeof renderQuiz==="function")renderQuiz();
 setScoreText();
}

/* ---------- login ---------- */
function modal(html){var m=document.createElement("div");m.className="lum-modal";m.innerHTML='<div class="lum-card">'+html+'</div>';document.body.appendChild(m);return m;}
function showLogin(){
 var m=modal('<h3>🔒 Login admin</h3><p style="margin:0 0 12px;font-size:13px;color:#64748b">Masuk dengan akun admin untuk mengedit halaman ini.</p><form id="lum-lf"><label>Username<input type="text" id="lum-u" autocomplete="username" required></label><label>Password<input type="password" id="lum-p" autocomplete="current-password" required></label><p class="lum-err" id="lum-e" style="display:none"></p><div style="display:flex;gap:8px"><button class="b" type="submit">Masuk</button><button class="b s" type="button" id="lum-c">Batal</button></div></form>');
 var fails=0;
 m.querySelector("#lum-u").focus();
 m.querySelector("#lum-c").onclick=function(){m.remove();};
 m.querySelector("#lum-lf").onsubmit=function(e){
  e.preventDefault();
  var er=m.querySelector("#lum-e"),btn=m.querySelector("button[type=submit]");
  btn.disabled=true;er.style.display="none";
  L.remoteLogin(m.querySelector("#lum-u").value,m.querySelector("#lum-p").value).then(function(a){
   if(!a||a.role!=="admin"){
    L.setSession(null);
    er.textContent="Akun ini bukan admin.";er.style.display="block";btn.disabled=false;return;
   }
   L.setSession(a);m.remove();
   L.load().then(function(d){cms=d;enterEdit();}).catch(function(){enterEdit();});
  }).catch(function(err){
   m.querySelector("#lum-p").value="";
   if(err&&err.api)fails++;
   er.textContent=(fails>=5)?"Terlalu banyak percobaan. Muat ulang halaman.":((err&&err.message)||"Username atau password salah.");
   er.style.display="block";
   btn.disabled=(fails>=5);
  });
 };
}

/* ---------- riwayat undo/redo ---------- */
var hist=[],hp=-1,stT=null;
function state(){
 return sections().map(function(sec){
  var c=sec.cloneNode(true);
  Array.prototype.forEach.call(c.querySelectorAll(".lum-sel"),function(x){x.classList.remove("lum-sel");});
  var q=c.querySelector("#quiz-container");if(q)q.innerHTML="";
  return c.innerHTML;
 });
}
function updUndo(){var u=$("lum-undo"),r=$("lum-redo");if(u)u.disabled=hp<=0;if(r)r.disabled=hp>=hist.length-1;}
function snap(){
 var st=state(),key=st.join("\u0001");
 if(hp>=0&&hist[hp].key===key){updUndo();return;}
 hist=hist.slice(0,hp+1);hist.push({key:key,st:st});if(hist.length>80)hist.shift();hp=hist.length-1;
 dirty=true;updUndo();
}
function snapSoon(){clearTimeout(stT);stT=setTimeout(snap,350);}
function restore(st){
 sections().forEach(function(sec,i){
  var live=sec.querySelector("#quiz-container");
  sec.innerHTML=st[i];
  if(live){var ph=sec.querySelector("#quiz-container");if(ph)ph.replaceWith(live);}
 });
 select(null);
}
function step(n){
 clearTimeout(stT);snap();
 if(hp+n<0||hp+n>=hist.length)return;
 hp+=n;restore(hist[hp].st);setCell(null);dirty=true;updUndo();
}

/* ---------- seleksi teks ---------- */
function secOf(node){
 if(!node)return null;if(node.nodeType===3)node=node.parentNode;
 var s=node.closest&&node.closest(".tab-content");
 return(s&&s.closest("main")&&!node.closest("#quiz-container"))?s:null;
}
function onSelChange(){
 var s=getSelection();
 if(s.rangeCount&&secOf(s.anchorNode)){savedRange=s.getRangeAt(0).cloneRange();setCell(cellOf(s.anchorNode));}
}
function fmt(fn,needRange){
 var sec=savedRange?secOf(savedRange.commonAncestorContainer):null;
 if(!sec){toast("Blok (pilih) teks dulu, lalu pilih formatnya");return;}
 if(needRange&&savedRange.collapsed){toast("Blok teks yang ingin diubah dulu");return;}
 try{sec.focus({preventScroll:true});}catch(e){sec.focus();}
 var s=getSelection();s.removeAllRanges();s.addRange(savedRange);
 fn();snap();
}
function setSize(px){
 fmt(function(){
  document.execCommand("styleWithCSS",false,false);
  document.execCommand("fontSize",false,"7");
  document.execCommand("styleWithCSS",false,true);
  Array.prototype.slice.call(document.querySelectorAll('main font[size="7"]')).forEach(function(f){
   var sp=document.createElement("span");sp.style.fontSize=px+"px";
   while(f.firstChild)sp.appendChild(f.firstChild);
   f.parentNode.replaceChild(sp,f);
  });
 },true);
}
function setFg(c){fmt(function(){document.execCommand("styleWithCSS",false,true);document.execCommand("foreColor",false,c);});}
function setHl(c){fmt(function(){document.execCommand("styleWithCSS",false,true);if(!document.execCommand("hiliteColor",false,c))document.execCommand("backColor",false,c);});}
function setFont(f){fmt(function(){document.execCommand("styleWithCSS",false,true);document.execCommand("fontName",false,f);},true);}

/* ---------- lebar kotak (aman untuk anak flex, responsif di HP) ---------- */
function setW(el,n){
 el.style.width=n+"%";
 var par=el.parentElement;
 if(par&&/flex/.test(getComputedStyle(par).display))el.style.flex="0 0 auto";
}

/* ---------- toolbar ---------- */
function buildBar(){
 var sw=function(k,c){return '<button type="button" class="sw" data-'+k+'="'+c+'" style="background:'+c+'" title="'+(k==="hl"?"Sorot":"Warna teks")+'"></button>';};
 var bar=document.createElement("div");bar.id="lum-bar";
 bar.innerHTML=
 '<div class="r">'+
  '<button data-act="undo" id="lum-undo" title="Urungkan (Ctrl+Z)">↶</button><button data-act="redo" id="lum-redo" title="Ulangi (Ctrl+Y)">↷</button><span class="sep"></span>'+
  '<button data-cmd="bold"><b>B</b></button><button data-cmd="italic"><i>I</i></button><button data-cmd="underline"><u>U</u></button><button data-cmd="strikeThrough"><s>S</s></button><span class="sep"></span>'+
  '<select id="tx-font" title="Jenis font (blok teks dulu)"><option value="">Font…</option><option value="\'Plus Jakarta Sans\', sans-serif">Plus Jakarta Sans</option><option value="Arial, Helvetica, sans-serif">Arial</option><option value="Georgia, serif">Georgia (serif)</option><option value="\'Times New Roman\', serif">Times New Roman</option><option value="\'Courier New\', monospace">Courier (mono)</option></select>'+
  '<select id="tx-size" title="Ukuran font (blok teks dulu)"><option value="">Ukuran…</option>'+[11,12,13,14,16,18,20,24,28,32,40].map(function(n){return '<option value="'+n+'">'+n+' px</option>';}).join("")+'</select><span class="sep"></span>'+
  '<span class="lbl">Warna</span><input type="color" id="tx-fg" value="#dc2626" title="Warna teks bebas"><button data-pal="fg" title="Palet lengkap: hitam, abu-abu, dan warna halaman ini">🎨</button>'+TC.map(function(c){return sw("fg",c);}).join("")+'<button data-fg="inherit" title="Warna asli">✕</button><span class="sep"></span>'+
  '<span class="lbl">Sorot</span><input type="color" id="tx-hl" value="#fff3a3" title="Warna sorot bebas"><button data-pal="hl" title="Palet lengkap untuk sorotan">🎨</button>'+HL.map(function(c){return sw("hl",c);}).join("")+'<button data-hl="transparent" title="Hapus sorotan">✕</button><span class="sep"></span>'+
  '<button data-cmd="justifyLeft" title="Rata kiri">⬅</button><button data-cmd="justifyCenter" title="Tengah">⬌</button><button data-cmd="justifyRight" title="Rata kanan">➡</button><span class="sep"></span>'+
  '<button data-cmd="insertUnorderedList">• Poin</button><button data-cmd="insertOrderedList">1. Nomor</button><button data-cmd="link">🔗</button><button data-cmd="unlink" title="Hapus link">⛓✕</button><button data-cmd="removeFormat" title="Bersihkan format teks">Tx</button>'+
 '</div>'+
 '<div class="r" id="lum-r2" hidden>'+
  '<b style="color:#fda4af">Kartu/kotak terpilih</b>'+
  '<span class="lbl">Isi</span><input type="color" id="cd-bg"><button data-pal="cd-bg" title="Palet warna isi kotak">🎨</button><span class="lbl">Garis</span><input type="color" id="cd-bc"><button data-pal="cd-bc" title="Palet warna garis">🎨</button><span class="lbl">Teks</span><input type="color" id="cd-fg"><button data-pal="cd-fg" title="Palet warna teks kotak">🎨</button>'+
  '<span class="lbl">Tebal garis</span><select id="cd-bw"><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>6</option></select>'+
  '<span class="lbl">Sudut</span><input type="number" id="cd-r" min="0" max="80">'+
  '<span class="lbl">Padding</span><input type="number" id="cd-p" min="0" max="80">'+
  '<span class="lbl">Lebar %</span><input type="number" id="cd-w" min="5" max="100">'+
  '<span class="lbl">Posisi</span><select id="cd-al"><option value="">…</option><option value="l">Kiri</option><option value="c">Tengah</option><option value="r">Kanan</option></select>'+
  '<span class="lbl">Tinggi px</span><input type="number" id="cd-h" min="0" max="2000">'+
  '<span class="lbl">Kolom</span><select id="cd-cols"><option value="">…</option><option value="0">Asli</option><option>1</option><option>2</option><option>3</option><option>4</option></select>'+
  '<span class="lbl">Jarak</span><input type="number" id="cd-gap" min="0" max="80">'+
  '<button data-blk="parent" title="Pilih elemen pembungkus (mis. wadah kolom)">⤴ Induk</button><button data-blk="rst" title="Hapus semua gaya buatan editor pada elemen ini">Reset gaya</button>'+
 '</div>'+
 '<div class="r">'+
  '<span class="lbl">Kartu</span><button data-blk="dup" title="Gandakan kartu/baris terpilih">⧉ Gandakan</button><button data-blk="up">↑</button><button data-blk="down">↓</button><button data-blk="del" class="dng">🗑 Hapus</button><button data-blk="note">＋ Catatan</button><button data-blk="box" title="Tambah kotak berisi teks">▢ ＋ Kotak teks</button><button data-blk="text" title="Tambah paragraf teks (di dalam kotak terpilih, atau di bawah posisi kursor)">＋ Teks</button><button data-tb="new">▦ ＋ Tabel</button>'+
  '<span class="sep"></span><button data-act="quiz">❓ Soal kuis</button><button data-act="save" class="pri">💾 Simpan</button><button data-act="reset" class="dng" title="Kembalikan ke tampilan asli">↺ Asli</button><button data-act="exit">Keluar</button>'+
 '</div>'+
 '<div class="r" id="lum-r3" hidden>'+
  '<b style="color:#99f6e4">Tabel</b>'+
  '<button data-tb="addrow">＋ Baris bawah</button><button data-tb="delrow" class="dng">− Baris</button><span class="sep"></span>'+
  '<button data-tb="addcoll">＋ Kolom kiri</button><button data-tb="addcolr">＋ Kolom kanan</button><button data-tb="delcol" class="dng">− Kolom</button><span class="sep"></span>'+
  '<button data-tb="mergeR">Gabung →</button><button data-tb="mergeD">Gabung ↓</button><button data-tb="split">Pisah sel</button><span class="sep"></span>'+
  '<button data-tb="deltbl" class="dng">🗑 Tabel</button><span class="lbl">Shift+klik sel = atur warna/lebar sel · ⤴ Induk = pilih baris/tabel</span>'+
 '</div>'+
 '<div style="text-align:center;font-size:11px;color:#94a3b8;font-weight:500">Blok teks → atur font/ukuran/warna · klik kartu (garis merah putus-putus) → panel kartu muncul; tarik pojok kanan-bawah untuk mengubah ukuran · Shift+klik = pilih elemen apa pun, ⤴ Induk = pilih pembungkusnya</div>';
 document.body.appendChild(bar);
 bar.addEventListener("mousedown",function(e){if(e.target.closest("button"))e.preventDefault();});
 bar.addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b||b.disabled)return;
  if(b.dataset.pal){openPalette(b.dataset.pal);return;}
  if(b.dataset.act){ACT[b.dataset.act]();return;}
  if(b.dataset.blk){BLK[b.dataset.blk]();return;}
  if(b.dataset.tb){TB[b.dataset.tb]();return;}
  if(b.dataset.hl){setHl(b.dataset.hl);return;}
  if(b.dataset.fg){setFg(b.dataset.fg==="inherit"?"#334155":b.dataset.fg);return;}
  var c=b.dataset.cmd;if(!c)return;
  if(c==="link"){
   var u=prompt("Alamat link (https://…)");if(u===null)return;
   var s=L.safeUrl(u);if(!s){alert("Link tidak valid.");return;}
   fmt(function(){document.execCommand("createLink",false,s);},true);
  }else fmt(function(){document.execCommand("styleWithCSS",false,true);document.execCommand(c,false,null);});
 });
 /* kontrol teks (pakai "change" agar pemilih warna tidak menutup sendiri) */
 var TX={"tx-font":setFont,"tx-size":setSize,"tx-fg":setFg,"tx-hl":setHl};
 bar.addEventListener("change",function(e){
  var f=TX[e.target.id];
  if(f){if(e.target.value)f(e.target.value);if(e.target.tagName==="SELECT")e.target.value="";}
 });
 /* kontrol kartu */
 var CP={
  "cd-bg":function(v){selected.style.backgroundColor=v;},
  "cd-bc":function(v){selected.style.borderColor=v;if(!(parseFloat(getComputedStyle(selected).borderTopWidth)>0)){selected.style.borderWidth="2px";selected.style.borderStyle="solid";}},
  "cd-fg":function(v){selected.style.color=v;},
  "cd-bw":function(v){var n=Number(v);selected.style.borderWidth=n+"px";selected.style.borderStyle=n?"solid":"none";},
  "cd-r":function(v){selected.style.borderRadius=(Number(v)||0)+"px";},
  "cd-p":function(v){var n=(Number(v)||0)+"px";if(/^(TR|THEAD|TBODY|TABLE)$/.test(selected.tagName))Array.prototype.forEach.call(selected.querySelectorAll("td,th"),function(c){c.style.padding=n;});else selected.style.padding=n;},
  "cd-w":function(v){var n=Number(v);if(n>=5&&n<=100)setW(selected,n);},
  "cd-al":function(v){if(!v)return;selected.style.margin=v==="l"?"12px auto 12px 0":(v==="c"?"12px auto":"12px 0 12px auto");},
  "cd-h":function(v){var n=Number(v)||0;if(/^(TR|TD|TH|THEAD|TBODY|TABLE)$/.test(selected.tagName)){selected.style.minHeight="";selected.style.height=n?n+"px":"";} else{selected.style.height="";selected.style.minHeight=n?n+"px":"";}},
  "cd-gap":function(v){selected.style.gap=(Number(v)||0)+"px";},
  "cd-cols":function(v){
   if(!v)return;
   if(v==="0"){selected.style.gridTemplateColumns="";return;}
   if(getComputedStyle(selected).display.indexOf("grid")<0){toast("Elemen ini bukan grid — klik ⤴ Induk untuk memilih wadah kolom");return;}
   selected.style.gridTemplateColumns="repeat("+v+", minmax(0, 1fr))";
  }
 };
 CPX=CP;
 function cp(e){var f=CP[e.target.id];if(!f||!selected)return;f(e.target.value);dirty=true;snapSoon();}
 bar.addEventListener("input",cp);bar.addEventListener("change",cp);
}
function hex(c){var m=String(c).match(/[\d.]+/g);if(!m||m.length<3)return"#000000";return"#"+m.slice(0,3).map(function(x){return("0"+Math.round(+x).toString(16)).slice(-2);}).join("");}
function sync(){
 if(!selected)return;
 var cs=getComputedStyle(selected);
 $("cd-bg").value=hex(cs.backgroundColor);$("cd-bc").value=hex(cs.borderTopColor);$("cd-fg").value=hex(cs.color);
 $("cd-bw").value=String(Math.round(parseFloat(cs.borderTopWidth))||0);
 $("cd-r").value=Math.round(parseFloat(cs.borderTopLeftRadius))||0;
 var pc=(selected.tagName==="TR"&&selected.cells[0])?getComputedStyle(selected.cells[0]):cs;$("cd-p").value=Math.round(parseFloat(pc.paddingTop))||0;
 $("cd-w").value=/%$/.test(selected.style.width)?Math.round(parseFloat(selected.style.width)):"";
 $("cd-h").value=parseInt(selected.style.minHeight)||parseInt(selected.style.height)||"";
 $("cd-gap").value=Math.round(parseFloat(cs.columnGap))||"";
 $("cd-cols").value="";$("cd-al").value="";
}

/* ---------- palet warna ---------- */
var PALN={"fg":"Warna teks","hl":"Warna sorot teks","cd-bg":"Warna isi kotak","cd-bc":"Warna garis kotak","cd-fg":"Warna teks di dalam kotak"};
function rgbaOf(s){var m=String(s).match(/[\d.]+/g);if(!m||m.length<3)return null;return {r:+m[0],g:+m[1],b:+m[2],a:m.length>3?parseFloat(m[3]):1};}
function hx(o){return "#"+[o.r,o.g,o.b].map(function(x){return("0"+Math.round(x).toString(16)).slice(-2);}).join("");}
function hslOf(h){
 var r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn,hu=0,s=0;
 if(d){s=d/(1-Math.abs(2*l-1));if(mx===r)hu=((g-b)/d)%6;else if(mx===g)hu=(b-r)/d+2;else hu=(r-g)/d+4;hu*=60;if(hu<0)hu+=360;}
 return {h:hu,s:s,l:l};
}
function sortColors(arr){
 return arr.sort(function(x,y){
  var a=hslOf(x),b=hslOf(y),an=a.s<0.12,bn=b.s<0.12;
  if(an!==bn)return an?-1:1;
  if(an)return b.l-a.l;
  if(Math.abs(a.h-b.h)>6)return a.h-b.h;
  return b.l-a.l;
 });
}
function scanColors(){
 var t={},b={},d={};
 function add(set,v){var o=rgbaOf(v);if(!o||o.a<0.99)return;set[hx(o)]=1;}
 Array.prototype.forEach.call(document.querySelectorAll("main *"),function(el){
  if(el.closest("#lum-bar,.lum-modal,#lum-pal"))return;
  var cs=getComputedStyle(el);
  add(t,cs.color);add(b,cs.backgroundColor);
  if(parseFloat(cs.borderTopWidth)>0)add(d,cs.borderTopColor);
 });
 return {t:sortColors(Object.keys(t)),b:sortColors(Object.keys(b)),d:sortColors(Object.keys(d))};
}
function closePal(){var p=$("lum-pal");if(p)p.remove();}
function palApply(target,c){
 if(target==="fg"){setFg(c);return;}
 if(target==="hl"){setHl(c);return;}
 if(!selected){toast("Klik dulu kartu/kotak yang ingin diwarnai");return;}
 if(CPX&&CPX[target]){CPX[target](c);var inp=$(target);if(inp)inp.value=c;dirty=true;snapSoon();}
}
function openPalette(target){
 var old=$("lum-pal"),same=!!old&&old.dataset.t===target;
 closePal();if(same)return;
 var sc=scanColors(),used;
 if(target==="hl"||target==="cd-bg")used=sc.b;
 else if(target==="cd-bc")used=sc.d.concat(sc.b.filter(function(x){return sc.d.indexOf(x)<0;}));
 else used=sc.t;
 var ps=function(c,t){return '<button type="button" class="ps" data-c="'+c+'" title="'+(t||c)+'" style="background:'+c+'"></button>';};
 var h='<div class="ph"><b>'+PALN[target]+'</b><button type="button" data-pc="x">✕ Tutup</button></div>'+
  '<div class="pl">Dipakai di halaman ini ('+used.length+')</div><div class="pg">'+used.map(function(c){return ps(c);}).join("")+'</div>'+
  '<div class="pl">Hitam, putih &amp; abu-abu (slate)</div><div class="pg">'+NEUTRAL.map(function(c){return ps(c);}).join("")+'</div>';
 FAM.forEach(function(f){h+='<div class="pl">'+f[0]+'</div><div class="pg">'+f[1].map(function(c,i){return ps(c,f[0].toLowerCase()+"-"+SHADES[i]+" "+c);}).join("")+'</div>';});
 var p=document.createElement("div");p.id="lum-pal";p.dataset.t=target;p.innerHTML=h;document.body.appendChild(p);
 var bar=$("lum-bar"),bh=bar?bar.offsetHeight:60;
 p.style.bottom=(bh+22)+"px";p.style.maxHeight=Math.max(140,innerHeight-bh-70)+"px";
 p.addEventListener("mousedown",function(e){if(e.target.closest("button"))e.preventDefault();});
 p.addEventListener("click",function(e){
  e.stopPropagation();
  var b=e.target.closest("button");if(!b)return;
  if(b.dataset.pc){closePal();return;}
  if(b.dataset.c){palApply(target,b.dataset.c);closePal();}
 });
}

/* ---------- pilih & ubah kartu ---------- */
function findBlock(el,sec){
 while(el&&el!==sec){
  var cs=getComputedStyle(el),cls=typeof el.className==="string"?el.className:"";
  var blockish=/^(block|flex|grid|list-item|table)$/.test(cs.display);
  var boxed=/rounded/.test(cls)||parseFloat(cs.borderTopWidth)>0||(cs.backgroundColor!=="rgba(0, 0, 0, 0)"&&cs.backgroundColor!=="transparent");
  if(el.tagName==="TR"||el.tagName==="LI"||(blockish&&boxed))return el;
  el=el.parentElement;
 }
 return null;
}
function hasQuiz(el){return !!el&&(el.id==="quiz-container"||!!el.querySelector("#quiz-container")||!!el.closest("#quiz-container"));}
function select(el){
 if(selected)selected.classList.remove("lum-sel");
 selected=el;if(el){el.classList.add("lum-sel");sync();}
 var r2=$("lum-r2");if(r2)r2.hidden=!el;
}
var BLK={
 need:function(){if(!selected){alert("Klik dulu pada kartu atau baris yang ingin diubah (akan muncul garis merah putus-putus).");return false;}return true;},
 dup:function(){if(!BLK.need())return;if(hasQuiz(selected)){toast("Soal kuis digandakan lewat tombol ❓ Soal kuis → ⧉ Gandakan");return;}var c=selected.cloneNode(true);c.classList.remove("lum-sel");selected.after(c);select(c);snap();toast("Kartu digandakan");},
 up:function(){if(!BLK.need())return;var p=selected.previousElementSibling;if(p){p.before(selected);snap();}},
 down:function(){if(!BLK.need())return;var n=selected.nextElementSibling;if(n){n.after(selected);snap();}},
 del:function(){if(!BLK.need())return;if(hasQuiz(selected)){toast("Wadah kuis tidak bisa dihapus di sini. Hapus soal lewat tombol ❓ Soal kuis");return;}if(!confirm("Hapus kartu/baris yang dipilih?"))return;var s=selected;select(null);s.remove();snap();},
 parent:function(){
  if(!BLK.need())return;
  var sec=secOf(selected),p=selected.parentElement;
  if(!p||p===sec||!sec.contains(p)){toast("Sudah di level paling atas");return;}
  select(p);
 },
 rst:function(){if(!BLK.need())return;selected.removeAttribute("style");sync();snap();toast("Gaya buatan editor dihapus");},
 box:function(){
  var n=document.createElement("div");
  n.className="kotak-teks";
  n.setAttribute("style","width:100%;max-width:100%;margin:12px 0;padding:14px;border-width:2px;border-style:solid;border-color:#14b8a6;border-radius:12px;background-color:#f0fdfa;box-sizing:border-box;color:#0f172a");
  n.innerHTML='<p style="margin:0">Tulis teks di dalam kotak ini…</p>';
  if(selected&&selected.classList.contains("kotak-teks"))selected.after(n);else placeBlock(n);
  snap();select(n);n.scrollIntoView({behavior:"smooth",block:"center"});BLK._focus(n.firstChild);
 },
 text:function(){
  var p=document.createElement("p");p.style.margin="8px 0 0";p.textContent="Tulis teks di sini…";
  if(selected&&!/^(TR|TD|TH|THEAD|TBODY|TABLE)$/.test(selected.tagName)&&!hasQuiz(selected))selected.appendChild(p);
  else placeBlock(p);
  snap();BLK._focus(p);
 },
 _focus:function(el){
  try{var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}
 },
 note:function(){
  var n=document.createElement("div");
  n.className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1";
  n.innerHTML='<div class="font-bold text-slate-900">Judul catatan</div><p class="text-slate-700 leading-relaxed">Tulis isi catatan di sini…</p>';
  if(selected)selected.after(n);
  else{var sec=document.querySelector("main .tab-content:not(.hidden)");var host=sec&&sec.firstElementChild;if(!host)return;host.appendChild(n);}
  snap();n.scrollIntoView({behavior:"smooth",block:"center"});select(n);
 }
};

/* ---------- tabel ---------- */
var curCell=null;
function cellOf(node){
 if(!node)return null;if(node.nodeType===3)node=node.parentNode;
 var c=node.closest&&node.closest("td,th");
 return(c&&secOf(c))?c:null;
}
function setCell(c){curCell=c;var r=$("lum-r3");if(r)r.hidden=!c;}
function gridOf(table){
 var rows=Array.prototype.slice.call(table.rows),g=[],pos=new Map();
 rows.forEach(function(tr,r){
  g[r]=g[r]||[];var c=0;
  Array.prototype.forEach.call(tr.cells,function(cell){
   while(g[r][c])c++;
   var rs=cell.rowSpan||1,cs=cell.colSpan||1;
   for(var i=0;i<rs;i++){g[r+i]=g[r+i]||[];for(var j=0;j<cs;j++)g[r+i][c+j]=cell;}
   pos.set(cell,{r:r,c:c});c+=cs;
  });
 });
 var n=0;g.forEach(function(row){if(row.length>n)n=row.length;});
 return {rows:rows,g:g,pos:pos,ncols:n};
}
function mkCell(tag,ref){
 var c=document.createElement(tag);
 if(ref){
  var cl=(ref.getAttribute("class")||"").replace(/\blum-sel\b/g,"").trim();if(cl)c.setAttribute("class",cl);
  var st=ref.getAttribute("style");if(st)c.setAttribute("style",st);
 }
 c.innerHTML="<br>";return c;
}
function joinCells(a,b){if(b.textContent.trim())a.innerHTML=(a.textContent.trim()?a.innerHTML+" ":"")+b.innerHTML;}
function placeBlock(node){
 var ref=selected;
 if(ref&&/^(TR|TD|TH|LI|THEAD|TBODY|TFOOT)$/.test(ref.tagName))ref=ref.closest("table,ul,ol");
 if(!ref&&savedRange&&secOf(savedRange.startContainer)){
  var n=savedRange.startContainer;if(n.nodeType===3)n=n.parentNode;
  ref=n.closest("table")||null;
  if(!ref){for(var p=n;p&&!(p.classList&&p.classList.contains("tab-content"));p=p.parentElement){if(/^(P|H[1-6]|UL|OL|BLOCKQUOTE|PRE|DIV)$/.test(p.tagName)){ref=p;break;}}}
 }
 if(ref&&ref.parentNode){ref.after(node);return;}
 var sec=document.querySelector("main .tab-content:not(.hidden)");
 var host=sec&&(sec.firstElementChild||sec);if(host)host.appendChild(node);
}
var TB={
 need:function(){
  if(!curCell||!curCell.isConnected){toast("Klik di dalam sel tabel dulu");return null;}
  var t=curCell.closest("table");if(!t)return null;
  var G=gridOf(t);return {t:t,G:G,p:G.pos.get(curCell),cell:curCell};
 },
 new:function(){
  var v=prompt("Ukuran tabel: baris,kolom (mis. 4,3). Baris pertama menjadi judul kolom.","4,3");if(v===null)return;
  var m=String(v).match(/^\s*(\d{1,2})\s*[,x×]\s*(\d{1,2})\s*$/);
  if(!m||+m[1]<1||+m[2]<1||+m[1]>30||+m[2]>12){alert("Format: baris,kolom — mis. 4,3 (maksimal 30 baris dan 12 kolom).");return;}
  var R=+m[1],C=+m[2],t=document.createElement("table"),tb=document.createElement("tbody");
  t.style.width="100%";t.style.borderCollapse="collapse";
  for(var i=0;i<R;i++){
   var tr=document.createElement("tr");
   for(var j=0;j<C;j++){
    var td=document.createElement(i===0?"th":"td"),s=td.style;
    s.borderWidth="1px";s.borderStyle="solid";s.borderColor="#cbd5e1";s.padding="8px";s.textAlign="left";
    if(i===0){s.backgroundColor="#f1f5f9";s.fontWeight="700";}
    td.textContent=i===0?"Judul "+(j+1):"Isi";tr.appendChild(td);
   }
   tb.appendChild(tr);
  }
  t.appendChild(tb);placeBlock(t);
  setCell(t.rows[1]?t.rows[1].cells[0]:t.rows[0].cells[0]);snap();
  t.scrollIntoView({behavior:"smooth",block:"center"});
 },
 addrow:function(){
  var x=TB.need();if(!x)return;
  var G=x.G,e=x.p.r+(x.cell.rowSpan||1)-1,ref=G.rows[e],seen=new Set(),tr=document.createElement("tr"),k=0;
  var inHead=ref.parentNode.tagName==="THEAD",tb=x.t.tBodies[0],srcRow=inHead&&tb&&tb.rows[0]?tb.rows[0]:null;
  for(var c=0;c<G.ncols;c++){
   var cell=G.g[e][c];if(!cell||seen.has(cell))continue;seen.add(cell);
   var pp=G.pos.get(cell),end=pp.r+(cell.rowSpan||1)-1;
   if(end>e){cell.rowSpan=(cell.rowSpan||1)+1;continue;}
   var src=inHead?(srcRow?srcRow.cells[k]:null):cell;
   var nc=mkCell(inHead?"td":cell.tagName.toLowerCase(),src);
   if((cell.colSpan||1)>1)nc.colSpan=cell.colSpan;
   tr.appendChild(nc);k++;
  }
  if(inHead){
   if(!tb){tb=document.createElement("tbody");x.t.appendChild(tb);}
   tb.insertBefore(tr,tb.firstChild);
  }else ref.after(tr);
  snap();
 },
 delrow:function(){
  var x=TB.need();if(!x)return;
  var G=x.G,r=x.p.r;
  if(G.rows.length<=1){TB.deltbl();return;}
  var tr=G.rows[r];
  if(Array.prototype.some.call(tr.cells,function(c){return (c.rowSpan||1)>1;})){toast("Baris ini punya sel gabungan ke bawah. Pisahkan selnya dulu.");return;}
  var seen=new Set();
  for(var c=0;c<G.ncols;c++){
   var cell=G.g[r][c];if(!cell||seen.has(cell))continue;seen.add(cell);
   if(G.pos.get(cell).r<r){cell.rowSpan=(cell.rowSpan||1)-1;if(cell.rowSpan===1)cell.removeAttribute("rowspan");}
  }
  tr.remove();setCell(null);snap();
 },
 addcolr:function(){TB._col(true);},
 addcoll:function(){TB._col(false);},
 _col:function(after){
  var x=TB.need();if(!x)return;
  var G=x.G,e=after?x.p.c+(x.cell.colSpan||1)-1:x.p.c-1,seen=new Set();
  G.rows.forEach(function(tr,r){
   var cur=e>=0?G.g[r][e]:null,nxt=G.g[r][e+1];
   if(cur&&nxt&&cur===nxt){if(!seen.has(cur)){cur.colSpan=(cur.colSpan||1)+1;seen.add(cur);}return;}
   var refCell=cur||nxt||x.cell,nc=mkCell(refCell.tagName.toLowerCase(),refCell),last=null;
   Array.prototype.forEach.call(tr.cells,function(cell){if(G.pos.get(cell).c<=e)last=cell;});
   if(last)last.after(nc);else tr.insertBefore(nc,tr.firstChild);
  });
  snap();
 },
 delcol:function(){
  var x=TB.need();if(!x)return;
  var G=x.G,c=x.p.c;
  if(G.ncols<=1){TB.deltbl();return;}
  var seen=new Set();
  G.rows.forEach(function(tr,r){
   var cell=G.g[r][c];if(!cell||seen.has(cell))return;seen.add(cell);
   if((cell.colSpan||1)>1){cell.colSpan=cell.colSpan-1;if(cell.colSpan===1)cell.removeAttribute("colspan");}
   else cell.remove();
  });
  setCell(null);snap();
 },
 mergeR:function(){
  var x=TB.need();if(!x)return;
  var G=x.G,r=x.p.r,c=x.p.c,cs=x.cell.colSpan||1,rs=x.cell.rowSpan||1,b=G.g[r]&&G.g[r][c+cs];
  if(!b){toast("Tidak ada sel di sebelah kanan");return;}
  var bp=G.pos.get(b);
  if(bp.r!==r||bp.c!==c+cs||(b.rowSpan||1)!==rs){toast("Sel di kanan tidak sejajar, tidak bisa digabung");return;}
  x.cell.colSpan=cs+(b.colSpan||1);joinCells(x.cell,b);b.remove();snap();
 },
 mergeD:function(){
  var x=TB.need();if(!x)return;
  var G=x.G,r=x.p.r,c=x.p.c,cs=x.cell.colSpan||1,rs=x.cell.rowSpan||1,b=G.g[r+rs]&&G.g[r+rs][c];
  if(!b){toast("Tidak ada sel di bawahnya");return;}
  var bp=G.pos.get(b);
  if(bp.r!==r+rs||bp.c!==c||(b.colSpan||1)!==cs){toast("Sel di bawah tidak sejajar, tidak bisa digabung");return;}
  x.cell.rowSpan=rs+(b.rowSpan||1);joinCells(x.cell,b);b.remove();snap();
 },
 split:function(){
  var x=TB.need();if(!x)return;
  var G=x.G,r=x.p.r,c=x.p.c,cs=x.cell.colSpan||1,rs=x.cell.rowSpan||1;
  if(cs===1&&rs===1){toast("Sel ini tidak sedang digabung");return;}
  x.cell.removeAttribute("colspan");x.cell.removeAttribute("rowspan");
  for(var i=0;i<rs;i++){
   var tr=G.rows[r+i];if(!tr)continue;
   var prev=null;
   if(i===0)prev=x.cell;
   else Array.prototype.forEach.call(tr.cells,function(cell){if(G.pos.get(cell).c<c)prev=cell;});
   for(var j=(i===0?1:0);j<cs;j++){
    var nc=mkCell(x.cell.tagName.toLowerCase(),x.cell);
    if(prev)prev.after(nc);else tr.insertBefore(nc,tr.firstChild);
    prev=nc;
   }
  }
  snap();
 },
 deltbl:function(){
  var x=TB.need();if(!x)return;
  if(!confirm("Hapus seluruh tabel ini?"))return;
  select(null);x.t.remove();setCell(null);snap();
 }
};

/* ---------- simpan, kuis, keluar ---------- */
function latestBase(){return L.loadLocal()||cms;}
function persist(mutate){
 var base=latestBase();mutate(base);
 if(!L.save(base)){alert("Gagal menyimpan: penyimpanan browser penuh atau diblokir.");return false;}
 cms=base;return true;
}
function ensureEntry(base){if(!base.skills[PID])base.skills[PID]={title:"",sections:{},quiz:null,updated:0};return base.skills[PID];}
function saveAll(){
 var out={};
 sections().forEach(function(sec){
  var c=sec.cloneNode(true);
  c.removeAttribute("contenteditable");
  Array.prototype.forEach.call(c.querySelectorAll("[contenteditable]"),function(x){x.removeAttribute("contenteditable");});
  Array.prototype.forEach.call(c.querySelectorAll(".lum-sel"),function(x){x.classList.remove("lum-sel");});
  var qc=c.querySelector("#quiz-container");if(qc)qc.innerHTML="";
  out[sec.id]=L.sanitizeRich(c.innerHTML);
 });
 var h1=document.querySelector("header h1");
 var ok=persist(function(base){var e=ensureEntry(base);e.sections=out;e.title=h1?h1.textContent.trim():"";e.updated=Date.now();});
 if(ok){dirty=false;toast("Tersimpan ✓ — unduh lumina-data.json di Content Manager untuk dipublikasikan");}
}
function quizModal(){
 if(typeof quizQuestions==="undefined"){alert("Halaman ini tidak memiliki kuis.");return;}
 var data=quizQuestions.map(function(q){return {q:dec(q.question),e:dec(q.explanation),o:q.options.map(function(o){return {t:dec(o.text),c:!!o.isCorrect};})};});
 var m=modal('<h3>❓ Soal kuis</h3><div id="lum-ql"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="b s" id="lum-qa" type="button">＋ Soal baru</button><button class="b" id="lum-qs" type="button">Simpan soal</button><button class="b s" id="lum-qc" type="button">Batal</button></div><p class="lum-err" id="lum-qe" style="display:none;margin-top:10px"></p>');
 var list=m.querySelector("#lum-ql");
 function sync2(){
  Array.prototype.forEach.call(list.querySelectorAll(".lum-q"),function(card,i){
   data[i].q=card.querySelector(".q").value;data[i].e=card.querySelector(".e").value;
   Array.prototype.forEach.call(card.querySelectorAll(".lum-opt"),function(row,j){data[i].o[j].t=row.querySelector("input[type=text]").value;data[i].o[j].c=row.querySelector("input[type=radio]").checked;});
  });
 }
 function draw(){
  list.innerHTML=data.map(function(q,i){
   return '<div class="lum-q"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Soal '+(i+1)+'</b><span style="display:flex;gap:6px"><button class="b s" type="button" data-dup="'+i+'">⧉ Gandakan</button><button class="b s" type="button" data-up="'+i+'">↑</button><button class="b s" type="button" data-dn="'+i+'">↓</button><button class="b d" type="button" data-del="'+i+'">Hapus</button></span></div>'+
   '<label>Pertanyaan<textarea class="q" rows="2">'+esc(q.q)+'</textarea></label>'+
   '<div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:4px">Pilihan (pilih bulatan untuk jawaban benar)</div>'+
   q.o.map(function(o,j){return '<div class="lum-opt"><input type="radio" name="c'+i+'" '+(o.c?"checked":"")+'><b style="width:16px">'+"ABCDEF"[j]+'</b><input type="text" value="'+esc(o.t)+'"></div>';}).join("")+
   '<label style="margin-top:8px">Pembahasan<textarea class="e" rows="3">'+esc(q.e)+'</textarea></label></div>';
  }).join("")||'<p style="color:#64748b;font-size:13px">Belum ada soal.</p>';
 }
 draw();
 list.addEventListener("click",function(e){
  var b=e.target.closest("[data-del],[data-dup],[data-up],[data-dn]");if(!b)return;
  sync2();
  if(b.dataset.del!==undefined){if(confirm("Hapus soal ini?")){data.splice(Number(b.dataset.del),1);draw();}return;}
  if(b.dataset.dup!==undefined){var i=Number(b.dataset.dup),c=JSON.parse(JSON.stringify(data[i]));data.splice(i+1,0,c);draw();list.children[i+1].scrollIntoView({block:"center"});return;}
  if(b.dataset.up!==undefined){var u=Number(b.dataset.up);if(u>0){var t=data[u];data[u]=data[u-1];data[u-1]=t;draw();}return;}
  if(b.dataset.dn!==undefined){var n=Number(b.dataset.dn);if(n<data.length-1){var t2=data[n];data[n]=data[n+1];data[n+1]=t2;draw();}}
 });
 m.querySelector("#lum-qa").onclick=function(){sync2();data.push({q:"",e:"",o:[0,1,2,3].map(function(j){return {t:"",c:j===0};})});draw();list.lastElementChild.scrollIntoView();};
 m.querySelector("#lum-qc").onclick=function(){m.remove();};
 m.querySelector("#lum-qs").onclick=function(){
  sync2();var er=m.querySelector("#lum-qe");
  for(var i=0;i<data.length;i++){
   var q=data[i];
   if(!q.q.trim()||!q.e.trim()||q.o.some(function(o){return !o.t.trim();})||!q.o.some(function(o){return o.c;})){er.textContent="Soal "+(i+1)+": lengkapi pertanyaan, semua pilihan, pembahasan, dan pilih jawaban benar.";er.style.display="block";return;}
  }
  var store=data.map(function(q,i){return {id:i+1,question:esc(q.q.trim()),explanation:esc(q.e.trim()),options:q.o.map(function(o){return {text:esc(o.t.trim()),isCorrect:o.c};})};});
  var ok=persist(function(base){var e=ensureEntry(base);e.quiz=store;e.updated=Date.now();});
  if(!ok)return;
  quizQuestions.length=0;store.forEach(function(q,i){quizQuestions.push(cleanQ(q,i));});
  if(typeof userAnswers!=="undefined")Object.keys(userAnswers).forEach(function(k){delete userAnswers[k];});
  renderQuiz();setScoreText();m.remove();toast("Soal kuis tersimpan ✓");
 };
}
var ACT={
 undo:function(){step(-1);},redo:function(){step(1);},
 save:saveAll,quiz:quizModal,
 reset:function(){
  if(!confirm("Kembalikan halaman ini ke tampilan asli? Semua hasil edit halaman ini akan hilang."))return;
  if(persist(function(base){delete base.skills[PID];}))location.href=location.pathname;
 },
 exit:function(){
  if(dirty&&!confirm("Ada perubahan yang belum disimpan. Keluar tanpa menyimpan?"))return;
  location.href=location.pathname;
 }
};

/* ---------- mode edit ---------- */
function enterEdit(){
 if(editing)return;editing=true;
 var fab=document.querySelector(".lum-fab");if(fab)fab.remove();
 document.body.classList.add("lum-edit");
 sections().forEach(function(s){s.contentEditable="true";});
 var qc=document.getElementById("quiz-container");if(qc)qc.contentEditable="false";
 var h1=document.querySelector("header h1");if(h1)h1.contentEditable="true";
 buildBar();
 document.addEventListener("selectionchange",onSelChange);
 document.addEventListener("input",function(e){if(e.target.closest&&e.target.closest("#lum-bar,.lum-modal"))return;dirty=true;snapSoon();});
 document.addEventListener("click",function(e){
  if(!editing||e.target.closest("#lum-bar,.lum-modal"))return;
  var sec=e.target.closest("main .tab-content");
  if(!sec){select(null);return;}
  var qcEl=e.target.closest("#quiz-container");
  if(qcEl&&!e.shiftKey){select(qcEl);toast("Kotak kuis dipilih — warna/ukuran bisa diatur. Soal diedit/digandakan lewat ❓ Soal kuis");return;}
  if(e.shiftKey){
   var el=e.target;
   while(el&&el!==sec&&getComputedStyle(el).display==="inline")el=el.parentElement;
   select(el&&el!==sec&&!el.closest("#quiz-container")?el:null);
  }else select(findBlock(e.target,sec));
 });
 document.addEventListener("mouseup",function(){
 if(selected){
  var w=selected.style.width,pw=selected.parentElement?selected.parentElement.clientWidth:0;
  if(/px$/.test(w)&&pw>0)setW(selected,Math.min(100,Math.round(parseFloat(w)/pw*100)));
  if(/px$/.test(selected.style.height)&&!/^(TR|TD|TH|THEAD|TBODY|TABLE)$/.test(selected.tagName)){selected.style.minHeight=selected.style.height;selected.style.height="";}
  sync();snapSoon();
 }
});
 document.addEventListener("click",function(e){if(editing&&!e.target.closest("#lum-bar,.lum-modal"))setCell(cellOf(e.target));});
 document.addEventListener("keydown",function(e){
  if(!editing||!(e.ctrlKey||e.metaKey)||e.target.closest(".lum-modal"))return;
  var k=e.key.toLowerCase();
  if(k==="z"&&!e.shiftKey){e.preventDefault();step(-1);}
  else if(k==="y"||(k==="z"&&e.shiftKey)){e.preventDefault();step(1);}
  else if(k==="s"){e.preventDefault();saveAll();}
 });
 window.addEventListener("beforeunload",function(e){if(dirty){e.preventDefault();e.returnValue="";}});
 snap();dirty=false;updUndo();
 toast("Mode edit aktif");
}
function setup(){
 function go(admin){
  if(admin){
   if(wantEdit)enterEdit();
   else{var f=document.createElement("button");f.className="lum-fab";f.textContent="✏️ Edit halaman";f.onclick=enterEdit;document.body.appendChild(f);}
  }else if(wantEdit)showLogin();
 }
 if(!L.getSession()){go(false);return;}
 L.refreshSession().then(function(me){go(!!me&&me.role==="admin");}).catch(function(){L.setSession(null);go(false);});
}

L.load().then(function(d){
 cms=d;applySaved();reveal();setup();
}).catch(function(){reveal();});
})();
