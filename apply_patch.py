#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LUMINA - Patch "Jenis Akun" (versi statis)
Cara pakai: taruh file ini di folder website (sejajar dengan index.html), lalu jalankan:
    python apply_patch.py
File asli dicadangkan ke folder backup_sebelum_patch/. Jika ada satu saja bagian yang tidak cocok,
TIDAK ADA file yang diubah dan pesan kesalahan ditampilkan.
"""
import os, sys, shutil

DIR = os.path.dirname(os.path.abspath(__file__))
DRIVE = "https://drive.google.com/drive/folders/1oLm05X1naBQ-AUZkULfDeuY7a3T9ej3g?usp=sharing"

# ---------------------------------------------------------------- lumina-core.js
CORE_BLOCK = r'''var cache={pub:null,local:null};
var DRIVE_DEFAULT="__DRIVE__";
var TYPES={admin:{label:"Admin",months:0},mahasiswa:{label:"Mahasiswa",months:6},plus:{label:"Student Plus",months:6},customer:{label:"Customer",months:6},dummy:{label:"Akun Dummy",months:0}};
var TYPE_KEYS=["mahasiswa","plus","customer","dummy"];
var PROF_PREFIX="luminaProfile:";
function okUrl(u){u=String(u||"").trim();return /^https:\/\/\S+$/.test(u)?u:"";}
function addMonths(ts,n){var d=new Date(ts);d.setMonth(d.getMonth()+n);return d.getTime();}
function defaultExpiry(type,from){var m=(TYPES[type]||{}).months;return m?addMonths(from||Date.now(),m):0;}
function accStatus(a,now){
 if(!a)return "none"; if(a.active===false)return "inactive";
 if(a.role==="admin"||a.type==="dummy")return "active";
 return(a.expiresAt&&(now||Date.now())>=a.expiresAt)?"expired":"active";
}
function logAcc(a,act,note){a.history=a.history||[];a.history.push({ts:Date.now(),act:String(act),note:String(note||"")});if(a.history.length>50)a.history=a.history.slice(-50);}
function cleanProfile(p){
 p=(p&&typeof p==="object")?p:{};var ph=String(p.photo||"");
 if(!/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(ph)||ph.length>300000)ph="";
 return {name:String(p.name||"").trim().slice(0,80),email:String(p.email||"").trim().slice(0,120),wa:String(p.wa||"").replace(/[^\d+]/g,"").slice(0,20),
  job:String(p.job||"").trim().slice(0,80),semester:String(p.semester||"").trim().slice(0,30),photo:ph,updatedAt:Number(p.updatedAt)||0};
}
function loadProfile(u){try{return cleanProfile(JSON.parse(localStorage.getItem(PROF_PREFIX+u)||"null"));}catch(e){return cleanProfile(null);}}
function saveProfile(u,p){p.updatedAt=Date.now();try{localStorage.setItem(PROF_PREFIX+u,JSON.stringify(p));return true;}catch(e){return false;}}
function profileOk(p){return !!(p.name&&/^\S+@\S+\.\S+$/.test(p.email)&&/^\+?\d{8,15}$/.test(p.wa));}
function sessionType(){var s=getSession();return (s&&s.type)||"";}
function applyDummyLock(){
 if(window.__dl)return;window.__dl=1;
 var s=document.createElement("style");s.textContent="html,body{height:100%!important;overflow:hidden!important}";document.head.appendChild(s);
 var stop=function(e){e.preventDefault();};
 addEventListener("wheel",stop,{passive:false});addEventListener("touchmove",stop,{passive:false});
 addEventListener("keydown",function(e){if([32,33,34,35,36,38,40].indexOf(e.keyCode)>=0&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||""))e.preventDefault();});
}'''.replace("__DRIVE__", DRIVE)

CORE_ACC = r'''var role=a.role==="admin"?"admin":"student",type=role==="admin"?"admin":(TYPE_KEYS.indexOf(a.type)>=0?a.type:"mahasiswa"),created=Number(a.createdAt)||0;
  var exp=(a.expiresAt==null||isNaN(Number(a.expiresAt)))?defaultExpiry(type,created||Date.now()):Number(a.expiresAt);
  if(type==="dummy"||type==="admin")exp=0;
  var hist=(Array.isArray(a.history)?a.history:[]).filter(function(h){return h&&h.act;}).slice(-50).map(function(h){return {ts:Number(h.ts)||0,act:String(h.act),note:String(h.note||"")};});
  return {user:String(a.user).trim(),name:String(a.name||a.user),role:role,type:type,hash:String(a.hash),createdAt:created,expiresAt:exp,active:a.active!==false,history:hist};'''

CORE = [
 ("var cache={pub:null,local:null};", CORE_BLOCK),
 ('role:"admin",hash:hashPassword(DEFAULT_ADMIN.user,DEFAULT_ADMIN.pass),createdAt:Date.now()};}',
  'role:"admin",type:"admin",hash:hashPassword(DEFAULT_ADMIN.user,DEFAULT_ADMIN.pass),createdAt:Date.now(),expiresAt:0,active:true,history:[]};}'),
 ('return {user:String(a.user).trim(),name:String(a.name||a.user),role:a.role==="admin"?"admin":"student",hash:String(a.hash),createdAt:Number(a.createdAt)||0};', CORE_ACC),
 ('passScore:clamp(Math.round(Number(st.passScore))||70,1,100)};',
  'passScore:clamp(Math.round(Number(st.passScore))||70,1,100),driveBackup:okUrl(st.driveBackup==null?DRIVE_DEFAULT:st.driveBackup),drivePhotos:okUrl(st.drivePhotos==null?DRIVE_DEFAULT:st.drivePhotos)};'),
 ('memSession=a?{user:a.user}:null;', 'memSession=a?{user:a.user,type:a.type||""}:null;'),
 ('progress:loadProg(user)};}', 'progress:loadProg(user),profile:loadProfile(user)};}'),
 ('KEY:KEY,EXPORT_KEY:EXPORT_KEY,PROG_PREFIX:PROG_PREFIX,',
  'TYPES:TYPES,TYPE_KEYS:TYPE_KEYS,addMonths:addMonths,defaultExpiry:defaultExpiry,accStatus:accStatus,logAcc:logAcc,cleanProfile:cleanProfile,loadProfile:loadProfile,saveProfile:saveProfile,profileOk:profileOk,sessionType:sessionType,applyDummyLock:applyDummyLock,\n KEY:KEY,EXPORT_KEY:EXPORT_KEY,PROG_PREFIX:PROG_PREFIX,'),
]

# ---------------------------------------------------------------- index.html
IDX_BOOT = r'''var stt=L.accStatus(me);
  if(stt!=="active"){L.setSession(null);me=null;applyRole();showGate();
   gateError(stt==="expired"?"Your account has expired. Please contact the admin to renew it.":"Your account is inactive. Please contact the admin.");
   document.body.classList.remove("loading");return;}
  $("gate").classList.add("hidden");'''

IDX_PROFILE = r'''function profileBox(){
 const p=L.loadProfile(me.user),dm=me.type==="dummy",dis=dm?" disabled":"";
 const exp=me.expiresAt?fmtDate(me.expiresAt):"no expiry";
 const f=(id,lb,v,req,ty)=>`<label>${lb}${req?" *":""}<input id="pf-${id}" type="${ty||"text"}" value="${esc(v)}"${dis}></label>`;
 return `<div class="box" style="margin-bottom:14px"><h3>Profile &amp; account</h3><p class="sub">${esc((L.TYPES[me.type]||{}).label||"")} · valid until <b>${exp}</b>. Fields marked * are required.</p>
 <form id="pf-form" class="admin-form"><div class="row"><img id="pf-prev" src="${p.photo||""}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;display:${p.photo?"block":"none"}"><label>Photo (max 1 MB, optional)<input id="pf-photo" type="file" accept="image/*"${dis}></label></div>
 <div class="cards">${f("name","Full name",p.name||me.name,true)}${f("email","Email",p.email,true,"email")}${f("wa","WhatsApp number",p.wa,true,"tel")}${f("job","Occupation",p.job)}${f("sem","Semester",p.semester)}</div>
 ${dm?"":'<div><button class="btn" type="submit">Save profile</button></div>'}</form></div>`;
}
function bindProfile(){
 const fm=$("pf-form");if(!fm||me.type==="dummy")return;
 let photo=L.loadProfile(me.user).photo;
 $("pf-photo").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  if(!/^image\//.test(f.type)||f.size>1048576){alert("Choose an image of at most 1 MB.");e.target.value="";return;}
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
   const k=Math.min(1,256/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
   const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
   photo=c.toDataURL("image/jpeg",.8);const pv=$("pf-prev");pv.src=photo;pv.style.display="block";};
   im.onerror=()=>alert("Invalid image.");im.src=r.result;};r.readAsDataURL(f);
 };
 fm.onsubmit=e=>{e.preventDefault();
  const p=L.cleanProfile({name:$("pf-name").value,email:$("pf-email").value,wa:$("pf-wa").value,job:$("pf-job").value,semester:$("pf-sem").value,photo});
  if(!L.profileOk(p)){alert("Name, a valid email, and a WhatsApp number (8–15 digits) are required.");return;}
  if(!L.saveProfile(me.user,p)){alert("Could not save (browser storage full or blocked).");return;}
  $("user-name").textContent=p.name;
  alert("Profile saved. Click “Download progress” and send the file to your admin so the update reaches them.");
 };
}
function downloadProgress(){'''

INDEX = [
 ('$("gate").classList.add("hidden");', IDX_BOOT),
 ('if(me.role==="student")L.ensureProg(me.user,me.createdAt);',
  'if(me.type==="dummy"){document.body.classList.add("dummy");L.applyDummyLock();}\n  if(me.role==="student"&&me.type!=="dummy")L.ensureProg(me.user,me.createdAt);'),
 ('t.textContent=role==="admin"?"ADMIN":"STUDENT";',
  't.textContent=((L.TYPES[me.type]||{label:"Student"}).label).toUpperCase();'),
 ('const slot=$("alert-slot");let h="";',
  'const slot=$("alert-slot");let h="";\n if(me&&me.type==="dummy"){$("nav-dot").classList.add("hidden");slot.innerHTML=\'<div class="draft-banner">👁️ <b>Demo account.</b> You can browse the materials and see the features, but you cannot take any practice or test.</div>\';return;}'),
 ('const a=b.dataset.act;',
  'const a=b.dataset.act;\n if(me&&me.type==="dummy"&&/^(start-skill|start-pretest|run-submit|run-retry|tts|dl-prog)$/.test(a)){alert("Demo accounts can view the pages but cannot take tests.");return;}'),
 ('function downloadProgress(){', IDX_PROFILE),
 ('const imp=$("imp-prog");',
  'const _pt=document.querySelector("#account-body .page-title");if(_pt)_pt.insertAdjacentHTML("afterend",profileBox());bindProfile();\n const imp=$("imp-prog");'),
]

# ---------------------------------------------------------------- lumina-pretest.js
PRE_FUNCS = r'''function canReview(){return isAdmin()||(me&&me.type==="plus");}
function reviewHTML(){
 var h='<div class="box" style="margin-bottom:14px"><h3>🔑 Review (Student Plus)</h3><p class="sub">Listening scripts, answer key, and explanations.</p>';
 ex.flat.units.forEach(function(un){
  var u=un.unit,m=X.META[un.section];
  h+='<div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px"><div class="row"><span class="pill" style="background:'+m.color+'22;color:'+m.color+'">'+m.ico+' '+m.short+'</span><b style="font-size:13px">'+esc(un.part.title)+(u.title?' · '+esc(u.title):'')+'</b></div>';
  if(u.script)h+='<div class="q-ctx" style="margin-top:8px"><b>Script</b><br>'+u.script.split("\n").filter(function(l){return !/^pause/i.test(l.trim());}).map(function(l){return fmt(esc(l));}).join("<br>")+'</div>';
  if(u.note)h+='<div class="explanation show" style="margin-bottom:8px"><strong>Script notes:</strong> '+fmt(esc(u.note))+'</div>';
  un.qs.forEach(function(it){
   var a=ex.answers[it.id];
   h+='<div style="margin:10px 0"><div class="q-text" style="margin-bottom:6px">'+it.num+'. '+(it.q.q?qHTML(it):'<i>(question read in the audio)</i>')+'</div><div class="options">'+
    it.q.o.map(function(o,j){var c=j===it.q.a?"correct":(a===j?"wrong":"");return '<div class="option '+c+'"><span>'+"ABCD"[j]+". "+fmt(esc(o))+(j===it.q.a?" ✓":"")+(a===j?" (your answer)":"")+'</span></div>';}).join("")+
    '</div><div class="explanation show"><strong>'+(a===it.q.a?"Correct.":a==null?"Unanswered.":"Incorrect.")+'</strong> '+(it.q.e?fmt(esc(it.q.e)):"<i>Explanation has not been added yet.</i>")+'</div></div>';
  });
  h+='</div>';
 });
 return h+'</div>';
}

/* ---------- klik & perubahan ---------- */'''

PRETEST = [
 ('var a=b.dataset.xact,id=b.dataset.id;',
  'var a=b.dataset.xact,id=b.dataset.id;\n if(me&&me.type==="dummy"&&/^(begin|resume|play|submit)$/.test(a)){alert("Demo accounts can view this page but cannot take the test.");return;}'),
 ('/* ---------- klik & perubahan ---------- */', PRE_FUNCS),
 ('\'<div class="notice">Scaled scores are a linear estimate',
  '(canReview()?reviewHTML():\'<div class="notice">🔒 Answer key, listening scripts and explanations are available for <b>Student Plus</b> accounts.</div>\')+\'<div class="notice">Scaled scores are a linear estimate'),
]

# ---------------------------------------------------------------- lumina-exam.js
EXAM = [
 ('audioUrl:"",script:"",passage:"",questions:[]}', 'audioUrl:"",script:"",passage:"",note:"",questions:[]}'),
 ('if((m=line.match(/^audio\\s*[:=]\\s*(.*)$/i))){u.audioUrl=audioNorm(m[1]);mode=null;return;}',
  'if((m=line.match(/^audio\\s*[:=]\\s*(.*)$/i))){u.audioUrl=audioNorm(m[1]);mode=null;return;}\n   if((m=line.match(/^(?:script ?note|catatan)\\s*[:=]\\s*(.*)$/i))){u.note=m[1].trim();mode=null;return;}'),
 ('if(u.script)o.push(u.script);', 'if(u.script)o.push(u.script);\n  if(u.note)o.push("ScriptNote: "+u.note);'),
 ('script:String(u.script||""),passage:String(u.passage||""),', 'script:String(u.script||""),note:String(u.note||""),passage:String(u.passage||""),'),
]

# ---------------------------------------------------------------- exam-manager.html (hanya contoh format)
EXMGR = [
 ('Explain: (opsional, tidak ditampilkan ke mahasiswa)',
  'Explain: (opsional, tidak ditampilkan ke mahasiswa)\nScriptNote: (opsional) penjelasan script, hanya untuk Student Plus — tulis di bawah script, di luar blok soal'),
]

# ---------------------------------------------------------------- content-manager.html
CM_ACCOUNTS = r'''const TL=k=>(L.TYPES[k]||{label:k}).label;
const STT={active:["Aktif","ok"],expired:["Kedaluwarsa","bad"],inactive:["Nonaktif","bad"]};
const renewable=a=>a.role!=="admin"&&a.type!=="dummy";
function vAccounts(){
 const now=Date.now();
 const opts=(sel,adm)=>(adm?[["admin","Admin"]]:[]).concat(L.TYPE_KEYS.map(k=>[k,TL(k)])).map(o=>`<option value="${o[0]}" ${o[0]===sel?"selected":""}>${o[1]}</option>`).join("");
 const rows=D.accounts.map(a=>{
  const s=L.accStatus(a,now),t=STT[s]||STT.active;
  return `<tr><td>${esc(a.name)}</td><td>${esc(a.user)}</td><td><span class="tag ${a.role==="admin"?"admin":""}">${esc(TL(a.type)).toUpperCase()}</span></td><td><span class="tag ${t[1]}">${t[0]}</span></td><td>${a.expiresAt?fmtDate(a.expiresAt):"Selamanya"}</td><td>${fmtDate(a.createdAt)}</td><td><div class="acts"><button class="btn secondary small" data-act="accManage" data-id="${esc(a.user)}">Kelola</button>${renewable(a)?`<button class="btn small" data-act="accExtend" data-id="${esc(a.user)}">+6 bln</button>`:""}<button class="btn secondary small" data-act="accPw" data-id="${esc(a.user)}">Ganti password</button></div></td></tr>`;
 }).join("");
 $("#view").innerHTML=title("AKUN & LOGIN","Akun & login web","Jenis akun: Admin, Mahasiswa, Student Plus, Customer (masa berlaku 6 bulan), dan Dummy (hanya melihat, tanpa masa berlaku). Akun tidak dihapus; akun yang berakhir tetap tercatat dan bisa diperpanjang.")+
 `<div class="note">🔒 Setelah menambah atau mengubah akun, <b>publikasikan</b> <code>lumina-data.json</code>. Masa berlaku dicek dengan jam perangkat pengguna.</div>
 <div class="box"><h3>Daftar akun (${D.accounts.length})</h3><div style="overflow:auto"><table><thead><tr><th>NAMA</th><th>USERNAME</th><th>JENIS</th><th>STATUS</th><th>BERLAKU S.D.</th><th>DIBUAT</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
 <div class="box"><h3>Tambah akun</h3><form class="form" id="acc-form" autocomplete="off">
  <div class="grid2"><label>Nama lengkap<input id="ac-name" required></label><label>Jenis akun<select id="ac-type">${opts("mahasiswa",true)}</select></label></div>
  <div class="grid2"><label>Username<input id="ac-user" required placeholder="huruf/angka, min. 3" autocomplete="off"></label><label>Password<input id="ac-pass" type="text" required minlength="6" placeholder="min. 6 karakter" autocomplete="off"></label></div>
  <div><button class="btn" type="submit">＋ Tambah akun</button></div></form>
  <details style="margin-top:14px"><summary style="cursor:pointer;font-size:12.5px;font-weight:700;color:#536075">Tambah banyak akun sekaligus</summary>
   <form class="form" id="accbulk-form" style="margin-top:10px"><label>Satu baris satu akun: <code>Nama | username | password | jenis</code> (jenis opsional: mahasiswa, plus, customer, dummy; default mahasiswa)<textarea id="accbulk" rows="5" placeholder="Budi Santoso | budi | rahasia123&#10;Siti Aminah | siti | rahasia456 | plus"></textarea></label><div><button class="btn" type="submit">＋ Tambah semua</button></div></form></details></div>`;
 const addAcc=(name,user,pass,type)=>{
  user=user.trim();
  if(!/^[A-Za-z0-9._-]{3,30}$/.test(user))return "Username “"+user+"” tidak valid (huruf, angka, titik, strip, underscore; 3–30 karakter).";
  if(pass.length<6)return "Password untuk “"+user+"” minimal 6 karakter.";
  if(L.findAccount(D,user))return "Username “"+user+"” sudah dipakai.";
  const t=Date.now(),a={user,name:name.trim()||user,role:type==="admin"?"admin":"student",type,hash:L.hashPassword(user,pass),createdAt:t,expiresAt:L.defaultExpiry(type,t),active:true,history:[]};
  L.logAcc(a,"Akun dibuat",TL(type));D.accounts.push(a);return "";
 };
 $("#acc-form").onsubmit=e=>{e.preventDefault();const er=addAcc($("#ac-name").value,$("#ac-user").value,$("#ac-pass").value,$("#ac-type").value);if(er){alert(er);return;}if(commit("Akun ditambahkan"))vAccounts();};
 $("#accbulk-form").onsubmit=e=>{
  e.preventDefault();
  const lines=$("#accbulk").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length){alert("Belum ada baris yang diisi.");return;}
  const errs=[];let ok=0;
  lines.forEach(ln=>{
   const p=ln.split("|").map(x=>x.trim());if(p.length<3){errs.push("Format salah: "+ln);return;}
   let type="mahasiswa";if(p.length>=4&&L.TYPE_KEYS.includes(p[p.length-1].toLowerCase()))type=p.pop().toLowerCase();
   const er=addAcc(p[0],p[1],p.slice(2).join("|"),type);if(er)errs.push(er);else ok++;
  });
  if(ok)commit(ok+" akun ditambahkan");
  if(errs.length)alert(ok+" akun berhasil. Yang gagal:\n\n"+errs.join("\n"));
  vAccounts();
 };
}

'''

CM_ACTIONS = r'''accExtend(user){
 const a=L.findAccount(D,user);if(!a||!renewable(a))return;
 const to=L.addMonths(Math.max(Date.now(),a.expiresAt||0),6);
 if(!confirm("Perpanjang "+a.user+" +6 bulan, sampai "+fmtDate(to)+"?"))return;
 L.logAcc(a,"Diperpanjang 6 bulan","s.d. "+fmtDate(to));a.expiresAt=to;commit("Akun diperpanjang");vAccounts();
},
accManage(user){
 const a=L.findAccount(D,user);if(!a)return;
 const adm=a.role==="admin",rc=L.getRecap()[user],pf=rc&&rc.profile?L.cleanProfile(rc.profile):null;
 const dstr=a.expiresAt?new Date(a.expiresAt).toISOString().slice(0,10):"";
 const hist=(a.history||[]).slice(-8).reverse().map(h=>`<div class="hint">${fmtDate(h.ts)} · ${esc(h.act)}${h.note?" — "+esc(h.note):""}</div>`).join("")||'<div class="hint">Belum ada riwayat.</div>';
 const prof=pf&&pf.name?`<div class="box"><h3>Profil (dari laporan mahasiswa)</h3><div class="row">${pf.photo?`<img src="${pf.photo}" style="width:64px;height:64px;border-radius:50%;object-fit:cover"> <a class="btn secondary small" download="foto-${esc(user)}.jpg" href="${pf.photo}">⬇ Foto (unggah ke Drive)</a>`:""}</div>
  <div class="sub">${esc(pf.name)}<br>${esc(pf.email)} · ${esc(pf.wa)}<br>Pekerjaan: ${esc(pf.job||"—")} · Semester: ${esc(pf.semester||"—")}</div></div>`:`<p class="hint">Belum ada data profil. Impor laporan progres mahasiswa di menu Rekap.</p>`;
 modal(`<h3>${esc(a.name)} <span class="hint">(${esc(a.user)})</span></h3><form class="form" id="am-form">
  ${adm?"":`<div class="grid2"><label>Jenis akun<select id="am-type">${L.TYPE_KEYS.map(k=>`<option value="${k}" ${k===a.type?"selected":""}>${TL(k)}</option>`).join("")}</select></label><label>Berlaku sampai<input id="am-exp" type="date" value="${dstr}"><span class="hint">Kosong hanya untuk Dummy.</span></label></div>
  <label style="display:flex;gap:8px;align-items:center"><input id="am-act" type="checkbox" style="width:auto" ${a.active!==false?"checked":""}> Akun aktif</label>`}
  ${prof}<div><b style="font-size:12px">Riwayat</b>${hist}</div>
  <div class="row"><button class="btn" type="submit">Simpan</button><button class="btn secondary" type="button" id="am-c">Tutup</button></div></form>`,()=>{
  $("#am-c").onclick=closeModal;
  if(!adm)$("#am-type").onchange=()=>{const t=$("#am-type").value;$("#am-exp").value=t==="dummy"?"":new Date(L.defaultExpiry(t)).toISOString().slice(0,10);};
  $("#am-form").onsubmit=e=>{
   e.preventDefault();
   if(!adm){
    const nt=$("#am-type").value,ds=$("#am-exp").value;let exp=0;
    if(nt!=="dummy"){if(!ds){alert("Isi tanggal berlaku sampai.");return;}exp=new Date(ds+"T23:59:59").getTime();}
    if(nt!==a.type)L.logAcc(a,"Jenis diubah",TL(a.type)+" → "+TL(nt));
    if(nt!=="dummy"&&exp!==a.expiresAt)L.logAcc(a,"Masa berlaku diatur","s.d. "+fmtDate(exp));
    const act=$("#am-act").checked;if(act!==(a.active!==false))L.logAcc(a,act?"Diaktifkan":"Dinonaktifkan");
    a.type=nt;a.expiresAt=exp;a.active=act;
   }
   closeModal();commit("Akun diperbarui");vAccounts();
  };
 },true);
},
recapDl(){
 const rc=L.getRecap(),arr=Object.keys(rc).map(k=>({type:"lumina-progress",version:1,user:k,name:rc[k].name,exportedAt:rc[k].exportedAt,progress:rc[k].progress,profile:rc[k].profile||null}));
 if(!arr.length){alert("Belum ada data rekap untuk diunduh.");return;}
 const b=new Blob([JSON.stringify(arr,null,2)],{type:"application/json"}),url=URL.createObjectURL(b),el=document.createElement("a");
 el.href=url;el.download="lumina-recap-backup.json";document.body.appendChild(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
},
 accDel(user){'''

CM_RECAP = r'''$("#rc-imp").onchange=async e=>{
  let ok=0,bad=0;const rc=L.getRecap();
  for(const f of [...e.target.files]){
   try{
    const raw=JSON.parse(await f.text());
    for(const j of (Array.isArray(raw)?raw:[raw])){
     if(!j||j.type!=="lumina-progress"||!j.user){bad++;continue;}
     const u=String(j.user),old=rc[u]?L.cleanProg(rc[u].progress):L.cleanProg(null);
     const pf=j.profile?L.cleanProfile(j.profile):((rc[u]&&rc[u].profile)||null);
     rc[u]={name:String(j.name||u),exportedAt:Number(j.exportedAt)||Date.now(),progress:L.mergeProg(old,L.cleanProg(j.progress)),profile:pf};ok++;
    }
   }catch(err){bad++;}
  }
  if(ok)L.setRecap(rc);
  e.target.value="";alert(ok+" laporan diimpor"+(bad?", "+bad+" tidak valid.":"."));vRecap();
 };
}

'''

CM_SET_HTML = r'''<label>Link folder Drive untuk backup data (lumina-data.json)<input id="st-bk" value="${esc(s.driveBackup||"")}" placeholder="https://drive.google.com/drive/folders/…"></label>
  <label>Link folder Drive untuk foto mahasiswa<input id="st-ph" value="${esc(s.drivePhotos||"")}" placeholder="https://drive.google.com/drive/folders/…"></label>
  <div><button class="btn" data-act="stSave">Simpan pengaturan</button></div>'''

CM_BACKUP = r'''<div class="box"><h3>5. Backup ke Google Drive</h3><p class="hint" style="font-size:13px">1) Unduh <code>lumina-data.json</code> (berisi semua akun beserta riwayatnya). 2) Unduh backup profil &amp; rekap. 3) Unggah keduanya ke folder Drive Anda. Ulangi secara berkala.</p>
 <div class="row"><button class="btn" data-act="export">⬇ lumina-data.json</button><button class="btn secondary" data-act="recapDl">⬇ Backup profil &amp; rekap</button>${D.settings.driveBackup?`<a class="btn secondary" href="${esc(D.settings.driveBackup)}" target="_blank" rel="noopener">Buka folder Drive ↗</a>`:'<span class="hint">Isi link folder di menu Pengaturan.</span>'}</div></div>
 <div class="note"><b>Catatan keamanan:</b>'''

CM_ST = r'''s.passScore=Math.min(100,Math.max(1,Math.round(Number($("#st-pass").value))||70));
  const okU=v=>/^https:\/\/\S+$/.test(v.trim())?v.trim():"";
  s.driveBackup=okU($("#st-bk").value);s.drivePhotos=okU($("#st-ph").value);'''

TRACKER_LINE = '\n;if(window.Lumina&&Lumina.sessionType&&Lumina.sessionType()==="dummy")Lumina.applyDummyLock();\n'

# ---------------------------------------------------------------- mesin patch
def load(path):
    raw = open(path, "rb").read().decode("utf-8")
    return raw.replace("\r\n", "\n"), ("\r\n" in raw)

def save(path, text, crlf):
    if crlf:
        text = text.replace("\n", "\r\n")
    open(path, "wb").write(text.encode("utf-8"))

def plan():
    jobs = []   # (filename, newtext, crlf, note)
    errors = []

    def simple(fname, edits, marker):
        p = os.path.join(DIR, fname)
        if not os.path.exists(p):
            errors.append("File tidak ditemukan: " + fname + " (jalankan skrip di folder website)")
            return None
        text, crlf = load(p)
        if marker in text:
            print("  - " + fname + ": sudah dipatch, dilewati")
            return (text, crlf, True)
        for old, new in edits:
            n = text.count(old)
            if n != 1:
                errors.append("%s: bagian yang dicari ditemukan %d kali (harus 1):\n      %s" % (fname, n, old[:90].replace("\n", "\\n")))
            else:
                text = text.replace(old, new)
        return (text, crlf, False)

    for fname, edits, marker in [
        ("lumina-core.js", CORE, "applyDummyLock"),
        ("index.html", INDEX, "function profileBox"),
        ("lumina-pretest.js", PRETEST, "function reviewHTML"),
        ("lumina-exam.js", EXAM, "ScriptNote"),
        ("exam-manager.html", EXMGR, "ScriptNote"),
    ]:
        r = simple(fname, edits, marker)
        if r and not r[2]:
            jobs.append((fname, r[0], r[1]))

    # content-manager.html
    fname = "content-manager.html"
    p = os.path.join(DIR, fname)
    if not os.path.exists(p):
        errors.append("File tidak ditemukan: " + fname)
    else:
        text, crlf = load(p)
        if "accManage" in text:
            print("  - " + fname + ": sudah dipatch, dilewati")
        else:
            def region(t, a, b, new):
                i, j = t.find(a), t.find(b)
                if i < 0 or j < 0 or j < i or t.count(a) != 1:
                    errors.append(fname + ": penanda tidak ditemukan: " + a[:60])
                    return t
                return t[:i] + new + t[j:]
            def rep(t, old, new):
                n = t.count(old)
                if n != 1:
                    errors.append("%s: bagian yang dicari ditemukan %d kali (harus 1):\n      %s" % (fname, n, old[:90]))
                    return t
                return t.replace(old, new)
            text = region(text, "function vAccounts(){", "/* ---------- REKAP MAHASISWA ---------- */", CM_ACCOUNTS)
            text = rep(text, "accDel(user){", CM_ACTIONS)
            text = region(text, '$("#rc-imp").onchange=async e=>{', "function rcDetail(user){", CM_RECAP)
            text = rep(text, '<div><button class="btn" data-act="stSave">Simpan pengaturan</button></div>', CM_SET_HTML)
            text = rep(text, 's.passScore=Math.min(100,Math.max(1,Math.round(Number($("#st-pass").value))||70));', CM_ST)
            text = rep(text, '<div class="note"><b>Catatan keamanan:</b>', CM_BACKUP)
            jobs.append((fname, text, crlf))

    # tracker (opsional)
    tp = os.path.join(DIR, "lumina-skill-tracker.js")
    if os.path.exists(tp):
        t, crlf = load(tp)
        if "applyDummyLock" not in t:
            jobs.append(("lumina-skill-tracker.js", t.rstrip("\n") + TRACKER_LINE, crlf))
    else:
        print("  - lumina-skill-tracker.js tidak ada di folder ini (opsional, dilewati)")
    return jobs, errors

def main():
    print("Memeriksa file di:", DIR)
    jobs, errors = plan()
    if errors:
        print("\nGAGAL - tidak ada file yang diubah. Masalah:")
        for e in errors:
            print("  * " + e)
        print("\nKemungkinan file Anda sudah berbeda dari versi yang saya lihat. Kirim pesan ini ke Claude.")
        sys.exit(1)
    if not jobs:
        print("Tidak ada yang perlu diubah.")
        return
    bdir = os.path.join(DIR, "backup_sebelum_patch")
    os.makedirs(bdir, exist_ok=True)
    for fname, text, crlf in jobs:
        shutil.copy2(os.path.join(DIR, fname), os.path.join(bdir, fname))
        save(os.path.join(DIR, fname), text, crlf)
        print("  ✓ " + fname + " diperbarui")
    print("\nSelesai. Cadangan file asli ada di folder backup_sebelum_patch/.")
    print("Langkah berikut: buka content-manager.html > Backup & publikasi > unduh lumina-data.json > unggah ke GitHub bersama file lain.")

if __name__ == "__main__":
    main()
