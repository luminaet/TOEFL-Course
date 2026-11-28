/* Lumina shared core v4 — dipakai oleh index.html, content-manager.html, dan halaman skill.
   Isi: model data CMS, akun (password di-hash), pembersih HTML, dan perhitungan progres mahasiswa. */
(function(){
"use strict";
var KEY="luminaCMS", EXPORT_KEY="luminaExportedAt", SESSION_KEY="luminaSession";
var PROG_PREFIX="luminaProg:", RECAP_KEY="luminaRecap", DAY=86400000;
var DEFAULT_ADMIN={user:"admin",pass:"lumina2026",name:"Administrator"};
var SECTIONS=["general","listening","swo","reading"];
var QSECTIONS=["listening","swo","reading"];
var MAT_SECTIONS=["listening","swo","reading"];
var LINK_GROUPS=["routine"];
var LEVELS=["easy","medium","hard"];
var DESC_FMT=["plain","numbered","bullets"];
var SEC_COLOR={listening:"#16866b",swo:"#bd7922",reading:"#7952b5"};
var cache={pub:null,local:null};
var DRIVE_DEFAULT="https://drive.google.com/drive/folders/1oLm05X1naBQ-AUZkULfDeuY7a3T9ej3g?usp=sharing";
var TYPES={admin:{label:"Admin",months:0},mahasiswa:{label:"Student",months:6},plus:{label:"Student Plus",months:6},customer:{label:"Customer",months:6},dummy:{label:"Akun Dummy",months:0}};
var TYPE_KEYS=["mahasiswa","plus","customer","dummy"];
var PROF_PREFIX="luminaProfile:";
var API_URL="https://script.google.com/macros/s/AKfycbwi00HITY3aNwMPTp5cjg898T8S74s-rIcPnK3L_BrluQ_yioILk24_3hdAYbEF6VVQJQ/exec",TOKEN_KEY="luminaToken",memToken="";
function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||memToken;}catch(e){return memToken;}}
function setToken(t){memToken=t||"";try{if(t)sessionStorage.setItem(TOKEN_KEY,t);else sessionStorage.removeItem(TOKEN_KEY);}catch(e){}}
function api(action,payload){
 var body={};for(var k in (payload||{}))body[k]=payload[k];body.action=action;body.token=getToken();
 return fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)})
  .then(function(r){return r.json();})
  .catch(function(){throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet.");})
  .then(function(j){
   if(!j||!j.ok){var e=new Error((j&&j.error)||"Permintaan ke server gagal.");e.api=true;e.status=j&&j.status;throw e;}
   return j;
  });
}
function remoteLogin(user,pass){
 user=String(user||"").trim();
 return api("login",{user:user,hash:hashPassword(user,pass)}).then(function(j){setToken(j.token);return j.account;});
}
function qrLogin(code){return api("qrLogin",{code:String(code||"")}).then(function(j){setToken(j.token);return j.account;});}
function refreshSession(){return api("me").then(function(j){setSession(j.account);return j.account;});}
function fetchRawPublished(){
 return fetch("lumina-data.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});
}
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
}

/* ---------- helpers ---------- */
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function uid(p){return (p||"id")+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function clamp(n,a,b){return Math.min(b,Math.max(a,n));}
function safeUrl(u){
 u=String(u==null?"":u).trim();
 if(/^(https?:\/\/|mailto:)/i.test(u))return u;
 if(!/^[a-z][a-z0-9+.\-]*:/i.test(u)&&/^[\w\-.\/%~]+(\?[\w\-.=&%]*)?(#[\w\-]*)?$/.test(u))return u;
 return "";
}
function safeColor(c){return /^#[0-9a-f]{6}$/i.test(c||"")?c:"";}
function normalizeAudioUrl(u){
 u=String(u||"").trim(); if(!u)return "";
 var m=u.match(/drive\.google\.com\/file\/d\/([\w-]+)/)||u.match(/drive\.google\.com\/open\?(?:[^#]*&)?id=([\w-]+)/)||u.match(/drive\.google\.com\/uc\?(?:[^#]*&)?id=([\w-]+)/);
 if(m)return "https://drive.google.com/uc?export=download&id="+m[1];
 return u;
}

/* ---------- SHA-256 (murni JS, tidak butuh HTTPS) ---------- */
var K=[],H0=[];
(function(){
 var n=2,c=0;
 while(c<64){
  var p=true;for(var i=2;i*i<=n;i++){if(n%i===0){p=false;break;}}
  if(p){ if(c<8)H0[c]=(Math.pow(n,1/2)%1)*4294967296|0; K[c]=(Math.pow(n,1/3)%1)*4294967296|0; c++; }
  n++;
 }
})();
function sha256(str){
 var data=new TextEncoder().encode(str), l=data.length, total=((l+9+63)>>6)<<6;
 var buf=new Uint8Array(total); buf.set(data); buf[l]=0x80;
 var dv=new DataView(buf.buffer);
 dv.setUint32(total-8,Math.floor(l*8/4294967296)); dv.setUint32(total-4,(l*8)>>>0);
 var h=H0.slice(), w=new Int32Array(64);
 function rr(x,n){return (x>>>n)|(x<<(32-n));}
 for(var off=0;off<total;off+=64){
  for(var i=0;i<16;i++)w[i]=dv.getUint32(off+i*4);
  for(i=16;i<64;i++){
   var a15=w[i-15],a2=w[i-2];
   var s0=rr(a15,7)^rr(a15,18)^(a15>>>3), s1=rr(a2,17)^rr(a2,19)^(a2>>>10);
   w[i]=(w[i-16]+s0+w[i-7]+s1)|0;
  }
  var a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
  for(i=0;i<64;i++){
   var S1=rr(e,6)^rr(e,11)^rr(e,25), ch=(e&f)^(~e&g), t1=(hh+S1+ch+K[i]+w[i])|0;
   var S0=rr(a,2)^rr(a,13)^rr(a,22), mj=(a&b)^(a&c)^(b&c), t2=(S0+mj)|0;
   hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
  }
  h[0]=(h[0]+a)|0;h[1]=(h[1]+b)|0;h[2]=(h[2]+c)|0;h[3]=(h[3]+d)|0;
  h[4]=(h[4]+e)|0;h[5]=(h[5]+f)|0;h[6]=(h[6]+g)|0;h[7]=(h[7]+hh)|0;
 }
 return h.map(function(x){return (x>>>0).toString(16).padStart(8,"0");}).join("");
}
function hashPassword(user,pass){return sha256("lumina|"+String(user)+"|"+pass);}

/* ---------- pembersih HTML (hanya tag aman + warna) ---------- */
var ALLOWED={B:1,STRONG:1,I:1,EM:1,U:1,S:1,SPAN:1,MARK:1,P:1,BR:1,UL:1,OL:1,LI:1,H3:1,H4:1,A:1,DIV:1,BLOCKQUOTE:1,HR:1,SUB:1,SUP:1};
var DROP={SCRIPT:1,STYLE:1,IFRAME:1,OBJECT:1,EMBED:1,LINK:1,META:1,NOSCRIPT:1,TEMPLATE:1,SVG:1,MATH:1,FORM:1,INPUT:1,BUTTON:1,TEXTAREA:1,SELECT:1};
var COLOR_RE=/^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*(,\s*\d{1,3}\s*){2}(,\s*[\d.]+\s*)?\)|[a-z]{3,20})$/i;
function cleanStyle(el){
 var out=[],props=["color","background-color"];
 for(var i=0;i<props.length;i++){var v=(el.style.getPropertyValue(props[i])||"").trim(); if(v&&COLOR_RE.test(v))out.push(props[i]+":"+v);}
 return out.join(";");
}
function walk(src,dst,doc){
 Array.prototype.slice.call(src.childNodes).forEach(function(ch){
  if(ch.nodeType===3){dst.appendChild(doc.createTextNode(ch.nodeValue));return;}
  if(ch.nodeType!==1)return;
  var tag=ch.tagName;
  if(DROP[tag])return;
  if(!ALLOWED[tag]){walk(ch,dst,doc);return;}
  var el=doc.createElement(tag.toLowerCase());
  if(tag==="A"){var href=safeUrl(ch.getAttribute("href")); if(href){el.setAttribute("href",href);el.setAttribute("target","_blank");el.setAttribute("rel","noopener noreferrer");}}
  var st=cleanStyle(ch); if(st)el.setAttribute("style",st);
  walk(ch,el,doc); dst.appendChild(el);
 });
}
function sanitizeHTML(html){
 var src=new DOMParser().parseFromString("<body>"+String(html||""),"text/html").body;
 var doc=document.implementation.createHTMLDocument("");
 var wrap=doc.createElement("div"); walk(src,wrap,doc); return wrap.innerHTML;
}
/* pembersih "kaya": mempertahankan class Tailwind, tabel, dan struktur kartu (untuk halaman Skill) */
var RICH={DIV:1,SPAN:1,P:1,BR:1,B:1,STRONG:1,I:1,EM:1,U:1,S:1,MARK:1,UL:1,OL:1,LI:1,H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,A:1,TABLE:1,THEAD:1,TBODY:1,TFOOT:1,TR:1,TH:1,TD:1,CODE:1,PRE:1,BLOCKQUOTE:1,HR:1,SUB:1,SUP:1,SMALL:1};
var CLASS_RE=/^[\w\s\-:\/\[\]\.%#(),!@=+*]*$/;
function walkRich(src,dst,doc){
 Array.prototype.slice.call(src.childNodes).forEach(function(ch){
  if(ch.nodeType===3){dst.appendChild(doc.createTextNode(ch.nodeValue));return;}
  if(ch.nodeType!==1)return;
  var tag=ch.tagName;
  if(DROP[tag])return;
  if(!RICH[tag]){walkRich(ch,dst,doc);return;}
  var el=doc.createElement(tag.toLowerCase());
  var cls=ch.getAttribute("class"); if(cls&&cls.length<600&&CLASS_RE.test(cls))el.setAttribute("class",cls);
  var rid=ch.getAttribute("id"); if(rid&&/^quiz-[a-z-]{1,30}$/.test(rid))el.setAttribute("id",rid);
  if(tag==="A"){var href=safeUrl(ch.getAttribute("href")); if(href){el.setAttribute("href",href);el.setAttribute("target","_blank");el.setAttribute("rel","noopener noreferrer");}}
  if(tag==="TD"||tag==="TH"){["colspan","rowspan"].forEach(function(a){var v=ch.getAttribute(a); if(v&&/^\d{1,2}$/.test(v))el.setAttribute(a,v);});}
  var st=cleanStyle(ch); if(st)el.setAttribute("style",st);
  walkRich(ch,el,doc); dst.appendChild(el);
 });
}
function sanitizeRich(html){
 var src=new DOMParser().parseFromString("<body>"+String(html||""),"text/html").body;
 var doc=document.implementation.createHTMLDocument("");
 var wrap=doc.createElement("div"); walkRich(src,wrap,doc); return wrap.innerHTML;
}
function textToHTML(t){return String(t||"").split(/\n{2,}/).map(function(p){return "<p>"+esc(p).replace(/\n/g,"<br>")+"</p>";}).join("");}

/* ---------- data bawaan ---------- */
function Q(q,o,a,e,topic){return {q:q,o:o,a:a,e:e,topic:topic||""};}
function defPage(id,label,file,sec,desc){return {id:id,label:label,file:file,color:SEC_COLOR[sec],bullet:"number",desc:desc||"",descFmt:"plain"};}
function defaults(){
 return {
  version:4, updatedAt:0,
  materials:[],
  materialPages:{
   listening:[defPage("lis-skill1","Listening Skill 1: Short Conversations","","listening","Identify who is speaking, where the conversation takes place, and the main idea.")],
   swo:[
    defPage("swo-skill1","Skill 1: Subject & Verb","materiswoskill1.html","swo","Every clause needs a subject and a verb that agree with each other."),
    defPage("swo-skill2","Skill 2","materiswoskill2.html","swo"),
    defPage("swo-skill3","Skill 3","materiswoskill3.html","swo"),
    defPage("swo-skill4","Skill 4","materiswoskill4.html","swo"),
    defPage("swo-skill5","Skill 5","materiswoskill5.html","swo"),
    defPage("swo-skill6","Skill 6","materiswoskill6.html","swo")
   ],
   reading:[defPage("read-skill1","Reading Skill 1: Main Idea","","reading","Skim the passage first, then decide what the whole text is mostly about.")]
  },
  practice:{
   "lis-skill1":{passage:"",audioUrl:"",audioScript:"Woman: Have you finished the report for Professor Allen? Man: Almost. I still need to check the figures in the final section. Woman: The professor said he would like to receive it before noon tomorrow. Man: That should be fine. I will review it tonight and send it first thing in the morning. Woman: Great. Let me know if you need me to check anything.",minutes:10,questions:[
    Q("What are the speakers mainly discussing?",["A class schedule","A report that needs to be completed","A meeting with Professor Allen","A change in research topic"],1,"They discuss checking the figures and submitting the report before the deadline."),
    Q("What does the man still need to do?",["Write the introduction","Meet the professor","Check the figures","Print the report"],2,"He says he still needs to check the figures in the final section."),
    Q("When does the professor want to receive the report?",["Tonight","Tomorrow before noon","Tomorrow evening","Next week"],1,"The woman says the professor wants it before noon tomorrow.")
   ]},
   "swo-skill1":{passage:"",audioUrl:"",audioScript:"",minutes:10,questions:[
    Q("The committee _____ the final decision yesterday.",["make","makes","made","making"],2,"The time expression 'yesterday' requires the simple past: made.","Verb tense"),
    Q("The new library, _____ last year, is already popular with students.",["complete","completed","was completing","which completing"],1,"The past participle 'completed' works as a reduced passive adjective clause.","Reduced clauses"),
    Q("Neither the students nor the teacher _____ aware of the schedule change.",["were","are","have","was"],3,"With neither...nor, the verb agrees with the nearer subject. 'Teacher' is singular, so use was.","Subject-Verb Agreement"),
    Q("The researcher collected the data carefully, _____ the results were reliable.",["because","so","although","unless"],1,"'So' introduces the result: careful collection led to reliable results.","Connectors")
   ]},
   "read-skill1":{passage:"<p>Urban trees provide benefits that extend beyond their appearance. Their leaves can provide shade, reducing the amount of heat absorbed by streets and buildings. Trees also help manage rainwater: some water is intercepted by leaves, while roots can improve the soil's ability to absorb rainfall. In addition, urban vegetation creates habitats for birds and insects. However, planting trees in cities requires careful planning. Species must be selected according to local climate, available space, and maintenance needs. A tree that grows well in a park may not be suitable for a narrow sidewalk where roots could damage pavement or underground pipes. Therefore, successful urban forestry depends not simply on planting more trees, but on choosing appropriate species and caring for them over time.</p>",audioUrl:"",audioScript:"",minutes:12,questions:[
    Q("What is the main idea of the passage?",["Why cities should remove old trees","The benefits of urban trees and the need for careful planning","How birds migrate through cities","Why all tree species grow well on sidewalks"],1,"The passage describes several benefits and explains why tree selection and maintenance matter."),
    Q("According to the passage, how can trees help manage rainwater?",["By preventing all rainfall","By making streets wider","By intercepting water and improving soil absorption","By directing water into buildings"],2,"The passage states that leaves intercept some water and roots can improve soil absorption."),
    Q("The word 'intercepted' is closest in meaning to _____.",["collected or caught","heated","destroyed","measured"],0,"In context, leaves catch or hold some of the rainwater."),
    Q("Why might a tree be unsuitable for a narrow sidewalk?",["It may attract too many birds","Its roots may damage pavement or pipes","It cannot receive sunlight","It may stop all traffic"],1,"The passage specifically mentions possible damage from roots.")
   ]}
  },
  pretest:{
   easy:{minutes:15,questions:[
    Q("She _____ to school every day.",["go","goes","going","gone"],1,"With a third-person singular subject in the simple present, add -s: goes.","Present simple"),
    Q("There are _____ books on the table.",["much","a lot","many","a little"],2,"'Books' is countable, so use 'many'.","Quantifiers"),
    Q("My brother is taller _____ me.",["that","than","then","as"],1,"Comparatives use 'than'.","Comparison")
   ]},
   medium:{minutes:20,questions:[
    Q("The report _____ by the committee before the deadline.",["was submitted","submitted","has submit","submitting"],0,"The report receives the action, so use the passive: was submitted.","Passive voice"),
    Q("Not only _____ the exam, but she also received a scholarship.",["she passed","did she pass","she did pass","passed she"],1,"After 'Not only' at the start of a clause, the auxiliary comes before the subject.","Inversion"),
    Q("The professor, along with his students, _____ attending the conference.",["are","were","is","be"],2,"The subject is 'professor' (singular); 'along with ...' does not change the verb.","Subject-Verb Agreement")
   ]},
   hard:{minutes:25,questions:[
    Q("Had the committee reviewed the proposal earlier, the errors _____ avoided.",["would be","would have been","will have been","had been"],1,"A third conditional (inverted) needs 'would have + past participle' in the result clause.","Conditionals"),
    Q("The more carefully you read, _____ you will understand.",["the better","better","the best","more better"],0,"The double comparative structure is 'the more..., the better...'.","Comparative structures"),
    Q("Rarely _____ such a remarkable performance.",["we have seen","have we seen","we saw","seen we"],1,"A negative adverb at the start of a sentence triggers subject–auxiliary inversion.","Inversion")
   ]}
  },
  links:{routine:[]},
  skills:{},
  accounts:[],
  settings:{requireLogin:true,inactiveDays:5,periodWeeks:4,passScore:70}
 };
}
function seedAdmin(){return {user:DEFAULT_ADMIN.user,name:DEFAULT_ADMIN.name,role:"admin",type:"admin",hash:hashPassword(DEFAULT_ADMIN.user,DEFAULT_ADMIN.pass),createdAt:Date.now(),expiresAt:0,active:true,history:[]};}

/* ---------- normalisasi ---------- */
function validQ(q){return q&&typeof q.q==="string"&&Array.isArray(q.o)&&q.o.length>=2&&typeof q.a==="number";}
function cleanQ(q){var o=q.o.map(String);return {id:q.id||uid("q"),q:q.q,o:o,a:(q.a>=0&&q.a<o.length)?q.a:0,e:String(q.e||""),topic:String(q.topic||""),ctx:String(q.ctx||"")};}
function cleanQs(arr){return (Array.isArray(arr)?arr:[]).filter(validQ).map(cleanQ);}
function emptySet(){return {passage:"",audioUrl:"",audioScript:"",minutes:10,questions:[]};}
function cleanSet(s){
 s=(s&&typeof s==="object")?s:{};
 return {passage:String(s.passage||""),audioUrl:String(s.audioUrl||""),audioScript:String(s.audioScript||""),minutes:clamp(Math.round(Number(s.minutes))||10,1,180),questions:cleanQs(s.questions)};
}
function cleanPages(arr){
 return (Array.isArray(arr)?arr:[]).filter(function(p){return p&&p.label;}).map(function(p){
  return {id:p.id||uid("p"),label:String(p.label),file:String(p.file||""),color:safeColor(p.color),
   bullet:p.bullet==="dot"?"dot":"number",desc:String(p.desc||""),descFmt:DESC_FMT.indexOf(p.descFmt)>=0?p.descFmt:"plain"};
 });
}
var DEF_LABEL={listening:"Listening Skill 1",swo:"Skill 1",reading:"Reading Skill 1"};

function normalize(d){
 d=(d&&typeof d==="object")?d:{};
 if(!Object.keys(d).length)d=defaults();
 var base=defaults();
 var out={version:4,updatedAt:Number(d.updatedAt)||0};
 out.materials=(Array.isArray(d.materials)?d.materials:[]).filter(function(m){return m&&m.title;}).map(function(m){
  return {id:m.id||uid("m"),section:SECTIONS.indexOf(m.section)>=0?m.section:"general",title:String(m.title),html:String(m.html||""),color:safeColor(m.color),updated:Number(m.updated)||0};
 });

 /* halaman skill per bagian */
 var hasMP=d.materialPages&&typeof d.materialPages==="object";
 out.materialPages={};
 MAT_SECTIONS.forEach(function(s){
  var arr=hasMP?d.materialPages[s]:(s==="swo"&&Array.isArray(d.skillPages)?d.skillPages:base.materialPages[s]);
  out.materialPages[s]=cleanPages(arr);
 });

 /* soal latihan per skill (kunci = id halaman skill) */
 out.practice={};
 if(d.practice&&typeof d.practice==="object"){
  Object.keys(d.practice).forEach(function(k){out.practice[k]=cleanSet(d.practice[k]);});
 }else{
  /* migrasi data lama: soal per sesi → dipasang pada skill pertama tiap bagian */
  QSECTIONS.forEach(function(s){
   var qs=cleanQs(d.questions&&d.questions[s]);
   var aud=(s==="listening"&&Array.isArray(d.audio)&&d.audio.length)?d.audio[0]:null;
   var rd=(s==="reading"&&d.reading&&typeof d.reading.passage==="string"&&d.reading.passage)?d.reading:null;
   if(!qs.length&&!aud&&!rd)return;
   var pg=out.materialPages[s][0];
   if(!pg){pg=cleanPages([{label:DEF_LABEL[s]}])[0];pg.id=s+"-skill1";pg.color=SEC_COLOR[s];out.materialPages[s].push(pg);}
   var set=emptySet(); set.questions=qs;
   if(aud){set.audioUrl=String(aud.url||"");set.audioScript=String(aud.script||"");}
   if(rd)set.passage=rd.passage;
   out.practice[pg.id]=set;
  });
 }

 /* pre-test 3 tingkat */
 out.pretest={};
 LEVELS.forEach(function(lv){
  var src=(d.pretest&&d.pretest[lv])||(d.pretest?{}:base.pretest[lv]);
  out.pretest[lv]={minutes:clamp(Math.round(Number(src.minutes))||base.pretest[lv].minutes,1,240),questions:cleanQs(src.questions)};
 });

 out.links={};
 LINK_GROUPS.forEach(function(g){
  var arr=d.links&&d.links[g];
  out.links[g]=Array.isArray(arr)?arr.filter(function(l){return l&&l.label&&l.url;}).map(function(l){return {id:l.id||uid("l"),label:String(l.label),url:String(l.url)};}):[];
 });
 out.skillPages=out.materialPages.swo.map(function(p){return {label:p.label,file:p.file};}); /* kompatibilitas */

 out.skills={};
 if(d.skills&&typeof d.skills==="object"){
  Object.keys(d.skills).forEach(function(k){
   var s=d.skills[k]; if(!s||typeof s!=="object")return;
   var secs={}; if(s.sections&&typeof s.sections==="object")Object.keys(s.sections).forEach(function(sk){if(typeof s.sections[sk]==="string")secs[sk]=s.sections[sk];});
   out.skills[k]={title:String(s.title||""),sections:secs,quiz:Array.isArray(s.quiz)?s.quiz:null,updated:Number(s.updated)||0};
  });
 }
 out.accounts=[]; /* akun disimpan di server (Apps Script), bukan di lumina-data.json */
 var st=(d.settings&&typeof d.settings==="object")?d.settings:{};
 out.settings={requireLogin:true,
  inactiveDays:clamp(Math.round(Number(st.inactiveDays))||5,1,30),minMaterialSec:clamp(Math.round(Number(st.minMaterialSec))||180,30,3600),minViewSec:clamp(Math.round(Number(st.minViewSec))||120,30,3600),
  periodWeeks:clamp(Math.round(Number(st.periodWeeks))||4,1,12),
  passScore:clamp(Math.round(Number(st.passScore))||70,1,100),driveBackup:okUrl(st.driveBackup==null?DRIVE_DEFAULT:st.driveBackup),drivePhotos:okUrl(st.drivePhotos==null?DRIVE_DEFAULT:st.drivePhotos)};
 return out;
}

function allSkills(d){
 var out=[];
 MAT_SECTIONS.forEach(function(s){(d.materialPages[s]||[]).forEach(function(p,i){out.push({id:p.id,section:s,idx:i,label:p.label,file:p.file,color:p.color,bullet:p.bullet,desc:p.desc,descFmt:p.descFmt});});});
 return out;
}

/* ---------- simpan / muat ---------- */
function hasLocal(){try{return !!localStorage.getItem(KEY);}catch(e){return false;}}
function stripped(d){var c={};Object.keys(d).forEach(function(k){if(k!=="__src")c[k]=d[k];});return c;}
function fetchPublished(){
 return fetch("lumina-data.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(j){return j?normalize(j):null;}).catch(function(){return null;});
}
function loadLocal(){try{var raw=localStorage.getItem(KEY);return raw?normalize(JSON.parse(raw)):null;}catch(e){return null;}}
/* Untuk admin/Content Manager: draf lokal diutamakan, jika tidak ada pakai versi terpublikasi. */
function loadEditor(){
 var local=loadLocal(); cache.local=local;
 if(local){local.__src="draft";return fetchPublished().then(function(p){cache.pub=p;return local;});}
 return fetchPublished().then(function(p){
  cache.pub=p;
  var d=p||normalize({}); d.__src=p?"published":"default";
  if(p&&p.updatedAt){try{localStorage.setItem(EXPORT_KEY,String(p.updatedAt));}catch(e){}}
  return d;
 });
}
/* Untuk halaman latihan: siswa SELALU membaca versi terpublikasi (lumina-data.json);
   admin yang sedang login melihat drafnya (pratinjau). */
function loadViewer(){
 return fetchPublished().then(function(pub){
  var local=loadLocal(); cache.pub=pub; cache.local=local;
  var s=getSession();
  if(local&&s){if(s.role==="admin"){local.__src="draft";return local;}}
  var d=pub||local||normalize({});
  d.__src=pub?"published":(local?"draft":"default");
  return d;
 });
}
function save(d){d.updatedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(stripped(d)));return true;}catch(e){return false;}}
function getExportedAt(){try{return Number(localStorage.getItem(EXPORT_KEY))||0;}catch(e){return 0;}}
function download(d){
 var blob=new Blob([JSON.stringify(stripped(d),null,2)],{type:"application/json"});
 var u=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=u;a.download="lumina-data.json";document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(u);},1500);
 try{localStorage.setItem(EXPORT_KEY,String(Date.now()));}catch(e){}
}

/* ---------- akun & sesi ---------- */
var memSession=null;
function findAccount(d,user){user=String(user||"").trim();for(var i=0;i<d.accounts.length;i++){if(d.accounts[i].user===user)return d.accounts[i];}return null;}
function checkLogin(d,user,pass){var a=findAccount(d,user);return(a&&a.hash===hashPassword(a.user,pass))?a:null;}
/* login halaman latihan: cek ke versi terpublikasi; draf lokal hanya berlaku untuk akun admin */
function login(user,pass){
 var pub=cache.pub, loc=cache.local, a=null;
 if(pub){a=checkLogin(pub,user,pass);if(!a&&loc){var b=checkLogin(loc,user,pass);if(b&&b.role==="admin")a=b;}}
 else if(loc)a=checkLogin(loc,user,pass);
 else a=checkLogin(normalize({}),user,pass);
 return a;
}
function getSession(){try{var s=sessionStorage.getItem(SESSION_KEY);return s?JSON.parse(s):memSession;}catch(e){return memSession;}}
function setSession(a){
 memSession=a?{user:a.user,type:a.type||"",role:a.role||"",name:a.name||a.user,createdAt:a.createdAt||0,expiresAt:a.expiresAt||0,active:a.active!==false}:null;if(!a)setToken("");
 try{if(a)sessionStorage.setItem(SESSION_KEY,JSON.stringify(memSession));else sessionStorage.removeItem(SESSION_KEY);}catch(e){}
}
function currentAccount(d){var s=getSession();if(!s)return null;if(s.role)return {user:s.user,name:s.name,role:s.role,type:s.type,createdAt:s.createdAt,expiresAt:s.expiresAt,active:s.active,history:[]};return findAccount(d,s.user);}
function isDefaultPassword(a){return !!a&&a.hash===hashPassword(a.user,DEFAULT_ADMIN.pass);}

/* ---------- progres mahasiswa (disimpan per browser) ---------- */
function progKey(u){return PROG_PREFIX+String(u);}
function cleanProg(p){
 p=(p&&typeof p==="object")?p:{};
 return {
  since:Number(p.since)||0,
  acts:(Array.isArray(p.acts)?p.acts:[]).filter(function(v){return v&&v.k&&Number(v.ts);}).map(function(v){return {k:String(v.k).slice(0,12),ref:String(v.ref||"").slice(0,60),ts:Number(v.ts)};}),
  visits:(Array.isArray(p.visits)?p.visits:[]).filter(function(v){return v&&v.skill&&Number(v.ts);}).map(function(v){return {skill:String(v.skill),ts:Number(v.ts)};}),
  attempts:(Array.isArray(p.attempts)?p.attempts:[]).filter(function(a){return a&&Number(a.ts)&&Number(a.total)>0;}).map(function(a){
   return {kind:a.kind==="pretest"?"pretest":"skill",skill:String(a.skill||""),section:String(a.section||""),level:String(a.level||""),score:Number(a.score)||0,total:Number(a.total),pct:Number(a.pct)||0,ts:Number(a.ts),answered:(a.answered==null||isNaN(Number(a.answered)))?null:Number(a.answered)};
  })
 };
}
function loadProg(user){try{var r=localStorage.getItem(progKey(user));return cleanProg(r?JSON.parse(r):null);}catch(e){return cleanProg(null);}}
function saveProg(user,p){try{localStorage.setItem(progKey(user),JSON.stringify(p));return true;}catch(e){return false;}}
function ensureProg(user,since){var p=loadProg(user);if(!p.since){p.since=since||Date.now();saveProg(user,p);}return p;}
function recordVisit(user,skill){
 var p=ensureProg(user),now=Date.now(),last=p.visits.length?p.visits[p.visits.length-1]:null;
 if(last&&last.skill===skill&&now-last.ts<600000)return;
 p.visits.push({skill:skill,ts:now}); if(p.visits.length>3000)p.visits=p.visits.slice(-3000);
 saveProg(user,p); queueEv(user,{t:"v",ts:now,skill:skill});
}
function recordAttempt(user,att){
 var p=ensureProg(user); att.ts=Date.now(); p.attempts.push(att);
 if(p.attempts.length>3000)p.attempts=p.attempts.slice(-3000);
 saveProg(user,p);
 queueEv(user,{t:"a",ts:att.ts,ak:att.kind,skill:att.skill,section:att.section,level:att.level,score:att.score,total:att.total,pct:att.pct,answered:att.answered});
}
/* ---------- aktivitas yang memenuhi syarat ---------- */
function recordAct(user,kind,ref,gap){
 var p=ensureProg(user),now=Date.now(),g=(gap==null)?120000:gap;ref=String(ref||"");
 for(var i=p.acts.length-1;i>=0&&now-p.acts[i].ts<g;i--){if(p.acts[i].k===kind&&p.acts[i].ref===ref)return false;}
 p.acts.push({k:kind,ref:ref,ts:now});if(p.acts.length>3000)p.acts=p.acts.slice(-3000);
 saveProg(user,p);queueEv(user,{t:"c",ts:now,k:kind,ref:ref});return true;
}
/* menghitung detik AKTIF: tab terlihat dan ada gerakan/ketukan/gulir dalam 2 menit terakhir; memanggil cb tiap kali mencapai "sec" detik */
function watchActive(sec,cb){
 var acc=0,last=Date.now(),stopped=false,IDLE=120000,evs=["mousemove","keydown","scroll","touchstart","click","wheel"];
 function bump(){last=Date.now();}
 evs.forEach(function(e){window.addEventListener(e,bump,{passive:true,capture:true});});
 var iv=setInterval(function(){
  if(stopped||document.visibilityState!=="visible"||Date.now()-last>IDLE)return;
  acc++;if(acc>=sec){acc=0;try{cb();}catch(e){}}
 },1000);
 return function(){stopped=true;clearInterval(iv);evs.forEach(function(e){window.removeEventListener(e,bump,{capture:true});});};
}
/* halaman materi (mis. materiswoskill1.html): hitung waktu aktif di halaman itu; tautan ke situs lain tidak bisa diukur */
function startMaterialWatch(){
 var strip=function(x){return String(x).split(/[?#]/)[0].split("/").pop().toLowerCase().replace(/\.html?$/,"");};
 var base=strip(location.pathname);
 if(!base||/^(index|content-manager|exam-manager)$/.test(base)||/[?&]edit(=|&|$)/.test(location.search))return;
 var run=function(){
  var s=getSession();if(!s||s.role!=="student"||s.type==="dummy")return;
  fetchPublished().then(function(d){
   if(!d)return;var id="";
   MAT_SECTIONS.forEach(function(sec){(d.materialPages[sec]||[]).forEach(function(p){if(!id&&p.file&&strip(p.file)===base)id=p.id;});});
   if(!id)return;
   watchActive(Math.max(30,d.settings.minMaterialSec||180),function(){recordAct(s.user,"study",id);});
  });
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
}
startMaterialWatch();
/* ---------- kirim progres ke server (antrian tahan-offline; server mencatat ke tab Progress + waktu) ---------- */
var OUT_PREFIX="luminaOutbox:", SYNC_PREFIX="luminaSynced:", flushT=0, flushing=false;
function outLoad(u){try{var a=JSON.parse(localStorage.getItem(OUT_PREFIX+u)||"[]");return Array.isArray(a)?a:[];}catch(e){return [];}}
function outSave(u,a){try{localStorage.setItem(OUT_PREFIX+u,JSON.stringify(a.slice(-3000)));}catch(e){}}
function canSync(user){var s=getSession();return !!(s&&s.user===String(user)&&s.role==="student"&&s.type!=="dummy"&&getToken());}
function schedFlush(user,ms){clearTimeout(flushT);flushT=setTimeout(function(){flushOut(user);},ms);}
function queueEv(user,ev){if(!canSync(user))return;var a=outLoad(user);a.push(ev);outSave(user,a);schedFlush(user,2500);}
/* sekali per akun per browser: kirim juga progres lama yang sudah ada di browser ini (server membuang duplikat) */
function backfill(user){
 var k=SYNC_PREFIX+user;try{if(localStorage.getItem(k))return;localStorage.setItem(k,String(Date.now()));}catch(e){return;}
 var p=loadProg(user),ev=[];
 p.visits.forEach(function(v){ev.push({t:"v",ts:v.ts,skill:v.skill});});
 p.acts.forEach(function(v){ev.push({t:"c",ts:v.ts,k:v.k,ref:v.ref});});
 p.attempts.forEach(function(a){ev.push({t:"a",ts:a.ts,ak:a.kind,skill:a.skill,section:a.section,level:a.level,score:a.score,total:a.total,pct:a.pct,answered:a.answered});});
 ev.sort(function(x,y){return x.ts-y.ts;});
 outSave(user,ev.slice(-2500).concat(outLoad(user)));
}
function flushOut(user){
 if(flushing||!canSync(user))return Promise.resolve();
 backfill(user);
 var a=outLoad(user);if(!a.length)return Promise.resolve();
 var n=Math.min(150,a.length);flushing=true;
 return api("logProgress",{events:a.slice(0,n)}).then(function(){
  var cur=outLoad(user);outSave(user,cur.slice(n));flushing=false;if(cur.length>n)schedFlush(user,500);
 }).catch(function(e){flushing=false;schedFlush(user,e&&e.api?600000:60000);});
}
/* dicek berkala: begitu ada sesi mahasiswa (termasuk tepat setelah login), progres lama + antrean langsung dikirim */
function autoFlush(){var s=getSession();if(s&&s.role==="student")flushOut(s.user);}
setTimeout(autoFlush,3000);setInterval(autoFlush,10000);
function mergeProg(a,b){
 var seenV={},seenA={},out={since:0,acts:[],visits:[],attempts:[]};
 out.since=(a.since&&b.since)?Math.min(a.since,b.since):(a.since||b.since);
 [a,b].forEach(function(p){
  p.visits.forEach(function(v){var k=v.skill+"|"+v.ts;if(!seenV[k]){seenV[k]=1;out.visits.push(v);}});
  (p.acts||[]).forEach(function(v){var k="c|"+v.k+"|"+v.ref+"|"+v.ts;if(!seenV[k]){seenV[k]=1;out.acts.push(v);}});
  p.attempts.forEach(function(x){var k=x.kind+"|"+x.skill+"|"+x.level+"|"+x.ts;if(!seenA[k]){seenA[k]=1;out.attempts.push(x);}});
 });
 out.visits.sort(function(x,y){return x.ts-y.ts;}); out.attempts.sort(function(x,y){return x.ts-y.ts;}); out.acts.sort(function(x,y){return x.ts-y.ts;});
 return out;
}
function exportProgress(user,name){return {type:"lumina-progress",version:1,user:String(user),name:String(name||user),exportedAt:Date.now(),progress:loadProg(user),profile:loadProfile(user)};}
function getRecap(){try{var r=JSON.parse(localStorage.getItem(RECAP_KEY)||"{}");return (r&&typeof r==="object")?r:{};}catch(e){return {};}}
function setRecap(o){try{localStorage.setItem(RECAP_KEY,JSON.stringify(o));return true;}catch(e){return false;}}

/* ---------- perhitungan ---------- */
function periodInfo(prog,st,now){
 var len=st.periodWeeks*7*DAY, since=prog.since||now, idx=Math.max(0,Math.floor((now-since)/len));
 return {len:len,since:since,index:idx,start:since+idx*len,end:since+(idx+1)*len};
}
function skillStats(prog,id,from,to){
 from=from||0; to=(to==null)?Infinity:to;
 var at=prog.attempts.filter(function(a){return a.kind==="skill"&&a.skill===id&&a.ts>=from&&a.ts<to;}).sort(function(a,b){return a.ts-b.ts;});
 var vs=prog.visits.filter(function(v){return v.skill===id&&v.ts>=from&&v.ts<to;}).length;
 var best=null,sum=0; at.forEach(function(a){sum+=a.pct;if(best===null||a.pct>best)best=a.pct;});
 return {visits:vs,attempts:at.length,best:best,last:at.length?at[at.length-1].pct:null,avg:at.length?Math.round(sum/at.length):null};
}
function skillStatus(s,pass){return s.best!==null&&s.best>=pass?"mastered":(s.attempts?"progress":(s.visits?"studying":"none"));}
function summary(prog,d,from,to){
 var sk=allSkills(d).filter(function(s){return d.practice[s.id]&&d.practice[s.id].questions.length;});
 var best=[],mastered=0;
 sk.forEach(function(s){var x=skillStats(prog,s.id,from,to);if(x.attempts){best.push(x.best);if(x.best>=d.settings.passScore)mastered++;}});
 return {total:sk.length,attempted:best.length,mastered:mastered,score:best.length?Math.round(best.reduce(function(a,b){return a+b;},0)/best.length):null};
}
function qualAttempt(a){return a.answered==null||a.answered>=1;}
function lastActivity(prog){
 var m=0;
 (prog.acts||[]).forEach(function(v){if(v.ts>m)m=v.ts;});
 prog.attempts.forEach(function(a){if(qualAttempt(a)&&a.ts>m)m=a.ts;});
 return m;
}
function dayNum(ts){return Math.floor((ts-new Date(ts).getTimezoneOffset()*60000)/DAY);}
function streak(prog,now){
 var set={}; (prog.acts||[]).forEach(function(v){set[dayNum(v.ts)]=1;}); prog.attempts.forEach(function(a){if(qualAttempt(a))set[dayNum(a.ts)]=1;});
 var days=Object.keys(set).map(Number).sort(function(a,b){return a-b;}), longest=0,run=0,prev=null;
 days.forEach(function(x){run=(prev!==null&&x===prev+1)?run+1:1;if(run>longest)longest=run;prev=x;});
 var t=dayNum(now),cur=0,c=set[t]?t:t-1;
 while(set[c]){cur++;c--;}
 return {current:cur,longest:longest,days:days.length};
}
function inactivity(prog,st,now){
 var last=lastActivity(prog), ref=last||prog.since||now, ms=now-ref;
 return {warn:ms>=st.inactiveDays*DAY,days:Math.floor(ms/DAY),never:!last,last:last};
}

window.Lumina={
 TYPES:TYPES,TYPE_KEYS:TYPE_KEYS,addMonths:addMonths,defaultExpiry:defaultExpiry,accStatus:accStatus,logAcc:logAcc,cleanProfile:cleanProfile,loadProfile:loadProfile,saveProfile:saveProfile,profileOk:profileOk,sessionType:sessionType,applyDummyLock:applyDummyLock,
 api:api,remoteLogin:remoteLogin,qrLogin:qrLogin,refreshSession:refreshSession,getToken:getToken,fetchRawPublished:fetchRawPublished,
 KEY:KEY,EXPORT_KEY:EXPORT_KEY,PROG_PREFIX:PROG_PREFIX,DAY:DAY,DEFAULT_ADMIN:DEFAULT_ADMIN,
 SECTIONS:SECTIONS,QSECTIONS:QSECTIONS,MAT_SECTIONS:MAT_SECTIONS,LINK_GROUPS:LINK_GROUPS,LEVELS:LEVELS,SEC_COLOR:SEC_COLOR,
 esc:esc,uid:uid,safeUrl:safeUrl,safeColor:safeColor,normalizeAudioUrl:normalizeAudioUrl,
 sha256:sha256,hashPassword:hashPassword,sanitizeHTML:sanitizeHTML,sanitizeRich:sanitizeRich,textToHTML:textToHTML,
 defaults:defaults,normalize:normalize,allSkills:allSkills,
 load:loadEditor,loadEditor:loadEditor,loadViewer:loadViewer,loadLocal:loadLocal,save:save,hasLocal:hasLocal,fetchPublished:fetchPublished,
 getExportedAt:getExportedAt,download:download,
 findAccount:findAccount,checkLogin:checkLogin,login:login,getSession:getSession,setSession:setSession,currentAccount:currentAccount,isDefaultPassword:isDefaultPassword,
 cleanProg:cleanProg,loadProg:loadProg,saveProg:saveProg,ensureProg:ensureProg,recordVisit:recordVisit,recordAttempt:recordAttempt,mergeProg:mergeProg,recordAct:recordAct,watchActive:watchActive,flushOut:flushOut,
 exportProgress:exportProgress,getRecap:getRecap,setRecap:setRecap,
 periodInfo:periodInfo,skillStats:skillStats,skillStatus:skillStatus,summary:summary,lastActivity:lastActivity,streak:streak,inactivity:inactivity
};
})();

/* Lumina dialog fallback: jika browser memblokir confirm()/alert() (centang "Jangan izinkan situs ini memunculkan dialog lagi"),
   confirm() langsung bernilai false dan alert() tidak tampil. Deteksi itu, lalu pakai dialog di dalam halaman. */
(function(){
"use strict";
var nConfirm=window.confirm.bind(window),nAlert=window.alert.bind(window);
var lastEl=null,lastT=0,okUntil=0;
document.addEventListener("click",function(e){
 var b=e.target&&e.target.closest?e.target.closest("button,a,[data-act],[data-xact],[data-go]"):null;
 if(b&&!b.closest("#lum-dlg")){lastEl=b;lastT=Date.now();}
},true);
function dialog(msg,buttons){
 var old=document.getElementById("lum-dlg");if(old)old.remove();
 var o=document.createElement("div");o.id="lum-dlg";
 o.style.cssText="position:fixed;inset:0;z-index:2147483000;background:#0008;display:grid;place-items:center;padding:16px;font-family:Inter,'Segoe UI',Arial,sans-serif";
 var c=document.createElement("div");
 c.style.cssText="background:#fff;color:#20283a;border-radius:14px;padding:20px;width:100%;max-width:420px;box-shadow:0 20px 60px #0006";
 var p=document.createElement("p");
 p.style.cssText="margin:0 0 16px;font-size:14px;line-height:1.6;white-space:pre-line;word-break:break-word";p.textContent=msg;
 var r=document.createElement("div");r.style.cssText="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap";
 function kd(e){if(e.key==="Escape"){o.remove();document.removeEventListener("keydown",kd);}}
 var first=null;
 buttons.forEach(function(b){
  var x=document.createElement("button");x.type="button";x.textContent=b.t;
  x.style.cssText="border:0;border-radius:9px;padding:9px 16px;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer;"+b.css;
  x.onclick=function(){o.remove();document.removeEventListener("keydown",kd);if(b.fn)b.fn();};
  r.appendChild(x);first=x;
 });
 c.appendChild(p);c.appendChild(r);o.appendChild(c);document.body.appendChild(o);
 document.addEventListener("keydown",kd);
 if(first&&first.focus)first.focus();
}
window.confirm=function(msg){
 if(Date.now()<okUntil){okUntil=0;return true;}
 var t0=performance.now(),r=nConfirm(msg);
 if(r)return true;
 if(performance.now()-t0>120)return false;               /* pengguna benar-benar menekan Batal */
 var el=lastEl;
 if(!el||!el.isConnected||Date.now()-lastT>10000)return false;
 dialog(String(msg),[
  {t:"Batal",css:"background:#eef1f6;color:#435067"},
  {t:"Ya, lanjutkan",css:"background:#981f34;color:#fff",fn:function(){okUntil=Date.now()+6000;el.click();}}
 ]);
 return false;
};
window.alert=function(msg){
 var t0=performance.now();nAlert(msg);
 if(performance.now()-t0<40)dialog(String(msg),[{t:"OK",css:"background:#981f34;color:#fff"}]);
};
})();
