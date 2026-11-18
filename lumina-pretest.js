/* Lumina Pre-Test (ujian 3 sesi ala TOEFL ITP) — UI mahasiswa.
   Dimuat di index.html SETELAH skrip utama:
   <script src="lumina-exam.js"></script><script src="lumina-pretest.js"></script> */
(function(){
"use strict";
var X=window.LuminaExam,L=window.Lumina,esc=L.esc;
var ex=null,examCfg=null,view="";
var $=function(id){return document.getElementById(id);};
var isAdmin=function(){return !!me&&me.role==="admin";};

/* ---------- gaya & wadah ---------- */
var css=document.createElement("style");
css.textContent=
".ex-bar{position:sticky;top:92px;z-index:20;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px;box-shadow:0 4px 14px #26334b10}"+
".ex-timer{font-size:20px;font-weight:850;font-variant-numeric:tabular-nums;color:#945b16;background:#fff4e6;border-radius:9px;padding:6px 12px}.ex-timer.low{color:#b3261e;background:#fdecea}.ex-timer.low.blink{animation:blink 1s ease-in-out infinite}"+
".ex-grid{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-items:start}"+
".ex-nav{position:sticky;top:160px;border:1px solid var(--line);border-radius:12px;padding:12px;background:#fff;max-height:calc(100vh - 180px);overflow:auto}"+
".ex-nav h4{margin:10px 0 6px;font-size:12px}.ex-nav h4:first-child{margin-top:0}"+
".qgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}"+
".qb{border:1px solid var(--line);background:#fff;border-radius:7px;height:30px;font-size:11.5px;font-weight:700;color:#536075;padding:0;position:relative}"+
".qb.a{background:#e6f5f0;border-color:#83c9ad;color:var(--green)}.qb.f:after{content:'';position:absolute;top:2px;right:2px;width:7px;height:7px;border-radius:50%;background:#e0243f}.qb.c{outline:2px solid var(--red);outline-offset:1px}"+
".ex-legend{display:flex;gap:10px;flex-wrap:wrap;font-size:10.5px;color:var(--muted);margin-top:10px}.ex-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;border:1px solid #0002}"+
".ex-dir{border:1px solid var(--line);border-radius:10px;padding:9px 13px;margin-bottom:14px;background:#f7f8fb;font-size:12.5px;line-height:1.6;color:#434e62}.ex-dir summary{cursor:pointer;font-weight:800}"+
".ex-intro h3{font-size:15px;margin:18px 0 6px}.ex-intro p,.ex-intro li{font-size:13px;line-height:1.7;color:#434e62}.ex-intro ul{padding-left:20px;margin:6px 0}"+
".ex-q-foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px;flex-wrap:wrap}"+
".ex-flag.on{background:#fdecea;color:#b3261e}"+
".ex-total{font-size:48px;font-weight:850;color:var(--red);line-height:1}"+
"@media(max-width:900px){.ex-grid{grid-template-columns:1fr}.ex-nav{position:static;max-height:none}.ex-bar{top:80px}}"+
".ex-pass{position:sticky;top:112px;z-index:15;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 6px 16px #26334b18;max-height:38vh;overflow:auto;margin-bottom:14px;padding:12px 14px}"+
".pass-body{position:relative;padding-left:40px;font-size:14px}.pass-body p{margin:0 0 12px;line-height:26px;color:#2d3646}.pass-body p:last-of-type{margin-bottom:0}"+
".pass-body .ln{position:absolute;left:0;width:30px;text-align:right;font-size:11px;font-weight:800;color:#8993a4;line-height:26px;pointer-events:none}"+
".pass-body:before{content:'';position:absolute;left:35px;top:0;bottom:0;width:1px;background:var(--line)}"+
"body.exam-mode{padding-top:56px;padding-bottom:12px}body.exam-mode .hero{padding:5px max(4vw,16px)}body.exam-mode .hero .eyebrow,body.exam-mode .hero p{display:none}body.exam-mode .hero h1{font-size:17px;margin:0}body.exam-mode .brand{height:38px}body.exam-mode .logo-img{height:38px}"+
"body.exam-mode footer,body.exam-mode .sidebar{display:none}body.exam-mode .shell{grid-template-columns:1fr;margin:10px auto 20px}body.exam-mode .ex-bar{top:56px}body.exam-mode .ex-nav{top:124px;max-height:calc(100vh - 140px)}body.exam-mode .ex-pass{top:118px}"+
"body.exam-mode .ex-bar{padding:6px 12px;margin-bottom:8px;top:56px;box-shadow:0 -8px 0 #fff,0 4px 12px #26334b10}body.exam-mode .ex-timer{font-size:18px;padding:4px 10px}body.exam-mode .ex-pass{top:106px;margin-bottom:10px;box-shadow:0 -6px 0 #fff,0 6px 16px #26334b18}body.exam-mode .ex-nav{top:106px;max-height:calc(100vh - 120px)}"+
"body.exam-mode .panel{padding:12px 14px}body.exam-mode .ex-dir{margin-bottom:8px;padding:6px 10px}body.exam-mode .audio-box{padding:8px 12px;margin-bottom:8px}body.exam-mode .audio-box p{display:none}"+
"body.exam-mode .question{padding:11px 14px;margin-bottom:8px}body.exam-mode .q-meta{margin-bottom:4px}body.exam-mode .q-text{margin-bottom:7px;line-height:1.5}body.exam-mode .options{gap:5px}body.exam-mode .option{padding:6px 10px;line-height:1.4}body.exam-mode .ex-q-foot{margin-top:7px}body.exam-mode .ex-q-foot .btn{padding:5px 9px}"+
"@media(max-width:900px){body.exam-mode .ex-nav{position:static;max-height:none}body.exam-mode .ex-pass{max-height:34vh}}";
css.textContent+=
"body.exam-mode #exam .q-text{font-size:13px}"+
"body.exam-mode #exam .option{font-size:12px}"+
"body.exam-mode #exam .q-meta{font-size:9.5px}"+
"body.exam-mode #exam .ex-dir{font-size:11.5px}"+
"body.exam-mode #exam .ex-flag,body.exam-mode #exam .ex-q-foot .btn{font-size:11px}"+
"body.exam-mode #exam .pass-body{font-size:11px}"+
"body.exam-mode #exam .pass-body p{line-height:22px;margin-bottom:9px}"+
"body.exam-mode #exam .pass-body .ln{line-height:22px;font-size:10px}"+
"body.exam-mode #exam .qb{font-size:11px;height:28px}";
css.textContent+=
"#exam .pass-body{padding-left:20px}"+
"#exam .pass-body:before{left:17px}"+
"#exam .pass-body .ln{width:15px}";
css.textContent+=
"@media(min-width:901px){"+
"#exam .ex-grid{grid-template-columns:minmax(980px) 250px;justify-content:center}"+
"}";

css.textContent+=
".pg-short{display:none}"+
"@media(max-width:900px){"+
"body.exam-mode #exam .ex-bar{height:40px;padding:0 8px;flex-wrap:nowrap;gap:6px;overflow:hidden}"+
"body.exam-mode #exam .ex-bar>div:first-child{flex:none}"+
"body.exam-mode #exam .ex-bar>div:first-child>b,body.exam-mode #exam .ex-bar>div:first-child>.pill{display:none}"+
"body.exam-mode #exam #ex-prog{font-size:12px;font-weight:800;color:#536075;white-space:nowrap}"+
"body.exam-mode #exam .pg-long{display:none}"+
"body.exam-mode #exam .pg-short{display:inline}"+
"body.exam-mode #exam .ex-bar .row{flex:1;min-width:0;flex-wrap:nowrap;gap:6px}"+
"body.exam-mode #exam .ex-bar .row .btn:first-of-type{margin-left:auto}"+
"body.exam-mode #exam .ex-timer{font-size:15px;padding:3px 8px}"+
"body.exam-mode #exam .ex-bar .btn{padding:5px 9px;font-size:11px;white-space:nowrap}"+
"body.exam-mode #exam .ex-pass{top:102px;max-height:30vh;padding:8px 10px}"+
"}";
css.textContent+=
"@media(min-width:901px){"+
"body.exam-mode{min-width:980px}"+
"#exam .ex-grid{grid-template-columns:640px 250px;justify-content:center}"+
"}";
document.head.appendChild(css);
var sec=document.createElement("section");sec.id="exam";sec.className="panel page hidden";sec.innerHTML='<div id="exam-body"></div>';
document.querySelector("main.content").appendChild(sec);
var cmsBtn=$("open-cms");
if(cmsBtn){var b=document.createElement("button");b.type="button";b.dataset.role="admin";b.className="hidden";b.innerHTML='<span class="ico">🎧</span>Exam Manager';b.onclick=function(){location.href="exam-manager.html";};cmsBtn.parentNode.insertBefore(b,cmsBtn.nextSibling);}

/* tetap menandai menu Pre-Test saat halaman ujian terbuka */
var _show=showPage;
showPage=function(id){
 document.body.classList.toggle("exam-mode",(id==="exam"&&view==="run"&&!!ex&&!ex.done)||id==="run");
 _show(id);if(id==="exam")document.querySelectorAll(".nav button[data-page]").forEach(function(b){b.classList.toggle("active",b.dataset.page==="pretest");});};

/* ---------- util ---------- */
function fmtClock(sec){sec=Math.max(0,sec);var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");}
function fmtMin(sec){return Math.floor(sec/60)+" min "+String(sec%60).padStart(2,"0")+" s";}
function dateTxt(ts){return new Date(ts).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});}
function fmt(t){return String(t).replace(/\*\*([^*\s](?:[^*]*?[^*\s])?)\*\*/g,"<strong>$1</strong>").replace(/(^|[^*])\*([^*\s](?:[^*]*?[^*\s])?)\*(?!\*)/g,"$1<em>$2</em>");}
function passHTML(txt){return String(txt||"").split(/\n\s*\n/).map(function(p){p=p.replace(/\s*\n\s*/g," ").trim();return p?"<p>"+fmt(esc(p))+"</p>":"";}).join("");}
function numberLines(){
 var body=$("pass-body");if(!body||!ex||!body.offsetHeight)return;
 Array.prototype.forEach.call(body.querySelectorAll(".ln"),function(n){n.remove();});
 var every=ex.cfg.settings.lineEvery;if(!every)return;
 var lh=22,g=0;
 Array.prototype.forEach.call(body.querySelectorAll("p"),function(p){
  var lines=Math.max(1,Math.round(p.offsetHeight/lh));
  for(var i=0;i<lines;i++){g++;if(g%every===0){var s=document.createElement("span");s.className="ln";s.textContent=g;s.style.top=(p.offsetTop+i*lh)+"px";body.appendChild(s);}}
 });
}
window.addEventListener("resize",function(){if(ex&&!ex.done)numberLines();});
function curUnit(){return ex.flat.units[ex.idx];}
function answeredCount(sc){return ex.flat.qs.filter(function(q){return (!sc||q.section===sc)&&ex.answers[q.id]!=null;}).length;}
function persist(){if(ex.preview||ex.done)return;X.saveRun(ex.user,ex.level,{answers:ex.answers,flags:ex.flags,plays:ex.plays,idx:ex.idx,startedAt:ex.startedAt,endAt:ex.endAt});}
function discardEx(){if(ex){clearInterval(ex.timer);stopAudio();}ex=null;}

/* ---------- beranda Pre-Test ---------- */
R.pretest=function(){
 if(ex&&(!me||ex.user!==me.user))discardEx();
 $("pretest-body").innerHTML='<div class="empty">Loading…</div>';
 X.loadViewer(isAdmin()).then(function(cfg){examCfg=cfg;checkExpired();renderHome();});
};
function checkExpired(){
 if(!me||me.role!=="student")return;
 X.LEVELS.forEach(function(lv){
  var s=X.loadRun(me.user,lv);
  if(s&&s.endAt&&s.endAt<=Date.now()&&!(ex&&ex.level===lv&&!ex.done)){buildEx(lv,s);submitExam(true);}
 });
}
function renderHome(){
 var st=examCfg.settings,res=(me&&me.role==="student")?X.getResults(me.user):[];
 var cards=X.LEVELS.map(function(l){
  var v=LEVEL[l],flat=X.flatten(examCfg.levels[l]),n=flat.qs.length;
  var last=res.filter(function(r){return r.level===l;}).pop();
  var running=(ex&&ex.level===l&&!ex.done)||(me&&me.role==="student"&&X.loadRun(me.user,l));
  return '<article class="session-card '+v.cls+'"><div class="icon">'+v.ico+'</div><h3>'+v.name+' <span class="sk-meta">· '+v.id+'</span></h3><p>'+v.desc+'<br><b>'+n+'</b> questions · Listening '+flat.count.listening+' · Structure '+flat.count.swo+' · Reading '+flat.count.reading+'<br><b>'+st.totalMinutes+'</b> minutes total'+
   (last?'<br>Last result: <b>'+last.scaledTotal+'</b> (est.) · '+dateTxt(last.ts):"")+'</p>'+
   (n?'<button class="btn" data-xact="intro" data-id="'+l+'">'+(running?"Continue / view →":"Open "+v.name+" →")+'</button>':'<button class="btn" disabled>Coming soon</button>')+'</article>';
 }).join("");
 $("pretest-body").innerHTML='<div class="page-title"><div><div class="kicker">TOEFL PRE-TEST</div><h2>Pre-Test</h2><p>A full practice test with three sections — Listening, Structure &amp; Written Expression, and Reading — under one countdown timer. Choose a difficulty level.</p></div></div>'+
  (isAdmin()?'<div class="draft-banner">Preview mode — results are not saved. Edit questions in <a href="exam-manager.html"><b>Exam Manager</b></a>.</div>':"")+'<div class="cards three">'+cards+'</div>';
}

/* ---------- layar pengantar ---------- */
function introHTML(lv){
 var cfg=examCfg,st=cfg.settings,flat=X.flatten(cfg.levels[lv]),v=LEVEL[lv];
 var plays=st.audioPlays?("at most <b>"+st.audioPlays+"</b> time"+(st.audioPlays>1?"s":"")):"as many times as you like";
 var rows=X.SECS.map(function(s){var m=X.META[s];return '<tr><td>'+m.ico+' '+m.name+'</td><td class="n">'+flat.count[s]+'</td><td class="n">'+m.std+'</td><td class="n">~'+cfg.levels[lv].sections[s].minutes+' min</td></tr>';}).join("");
 var dirs=X.SECS.map(function(s){return '<h3>'+X.META[s].ico+' '+X.META[s].name+'</h3><p>'+esc(cfg.levels[lv].sections[s].directions)+'</p>';}).join("");
 var run=ex&&ex.level===lv&&!ex.done?ex:null,saved=(!run&&me&&me.role==="student")?X.loadRun(me.user,lv):null;
 var btn=run||saved?'<button class="btn" data-xact="resume">▶ Resume test</button> <button class="btn secondary" data-xact="restart">Start over</button>':'<button class="btn" data-xact="begin">▶  START TEST</button>';
 return '<div class="page-title"><div><div class="kicker">TOEFL PRE-TEST · '+v.name.toUpperCase()+'</div><h2>General Directions</h2><p>Please read carefully before you begin.</p></div><button class="btn secondary small" data-xact="home">← Back</button></div><div class="ex-intro">'+
  '<p>This test measures your ability to understand English as it is used in academic settings. It follows the format of the TOEFL ITP and has three sections. Work through the sections in any order using the question navigator; the timer covers the whole test.</p>'+
  '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>SECTION</th><th class="n">QUESTIONS (THIS TEST)</th><th class="n">STANDARD</th><th class="n">SUGGESTED TIME</th></tr></thead><tbody>'+rows+'<tr class="sec"><td>Total</td><td class="n">'+flat.qs.length+'</td><td class="n">140</td><td class="n">'+st.totalMinutes+' min</td></tr></tbody></table></div>'+
  '<h3>Time</h3><p>You have <b>'+st.totalMinutes+' minutes</b> in total. The countdown starts when you press Start and continues even if you open another page. When it reaches zero, your answers are submitted automatically.</p>'+
  '<h3>Listening audio</h3><p>Each audio can be played '+plays+'. Make sure your speakers or headphones work before you start.</p>'+
  '<h3>Scoring</h3><ul><li>Every question has one correct answer. There is <b>no penalty</b> for wrong answers, so answer every question.</li><li>Each section is converted to a scaled score of <b>31–68</b>; the total estimated score is the average of the three scaled scores × 10 (range <b>310–680</b>).</li><li>This is an estimate for practice and is not an official ETS score.</li><li>When you submit you will see your scores and a summary. The answer key is <b>not</b> shown.</li></ul>'+
  '<h3>Navigation</h3><ul><li>Use <b>Previous / Next</b> or click a number in the navigator. <span style="color:var(--green);font-weight:700">Green</span> = answered; a red dot = flagged for review.</li><li>You may change an answer until you submit.</li></ul>'+
  (st.generalNotes?'<h3>Notes from your lecturer</h3><p>'+esc(st.generalNotes)+'</p>':"")+dirs+'</div><div class="row" style="margin-top:18px">'+btn+'</div>';
}

/* ---------- membangun & menjalankan ujian ---------- */
function buildEx(level,saved){
 if(ex){clearInterval(ex.timer);stopAudio();}
 var cfg=examCfg,flat=X.flatten(cfg.levels[level]),now=Date.now();
 ex={level:level,cfg:cfg,flat:flat,answers:{},flags:{},plays:{},idx:0,startedAt:now,endAt:now+cfg.settings.totalMinutes*60000,preview:isAdmin(),done:false,user:me?me.user:"",timer:null,audio:null,playing:false,result:null};
 if(saved){ex.answers=saved.answers||{};ex.flags=saved.flags||{};ex.plays=saved.plays||{};ex.idx=Math.min(Number(saved.idx)||0,Math.max(0,flat.units.length-1));ex.startedAt=saved.startedAt||now;ex.endAt=saved.endAt||ex.endAt;}
}
function startTimer(){clearInterval(ex.timer);ex.timer=setInterval(tick,1000);tick();}
function tick(){
 if(!ex||ex.done){return;}
 if(!me||me.user!==ex.user){discardEx();return;}
 var rem=Math.max(0,Math.ceil((ex.endAt-Date.now())/1000)),t=$("ex-timer");
 if(t){t.textContent=fmtClock(rem);t.classList.toggle("low",rem<=600);t.classList.toggle("blink",rem<=300);}
 if(rem<=0)submitExam(true);
}
R.exam=function(){
 if(view==="intro"||!ex)return;
 if(ex.done)return renderResult();
 renderShell();
};
function renderShell(){
 $("exam-body").innerHTML='<div class="ex-bar"><div><b>Pre-Test · '+LEVEL[ex.level].name+'</b>'+(ex.preview?' <span class="pill">preview</span>':"")+' <span class="sk-meta" id="ex-prog"></span></div><div class="row"><span class="ex-timer" id="ex-timer">--:--:--</span><button class="btn secondary small" data-xact="home" title="Back to the Pre-Test menu (the timer keeps running)">⌂ Menu</button><button class="btn small" data-xact="submit">Submit test</button></div></div>'+
  '<div class="ex-grid"><div id="ex-main"></div><aside class="ex-nav" id="ex-nav"></aside></div>';
 renderUnit();tick();
}
function qHTML(it){
 var t=esc(it.q.q);
 if(it.partType==="error"){var k=0;t=t.replace(/__(.+?)__/g,function(m,x){return '<u>'+x+'</u><sup>('+"ABCD"[k++]+')</sup>';});}
 return fmt(t);
}
function renderUnit(){
 stopAudio();
 var un=curUnit(),u=un.unit,p=un.part,m=X.META[un.section],h='<div class="row" style="margin-bottom:8px"><span class="pill" style="background:'+m.color+'22;color:'+m.color+'">'+m.ico+' '+m.short+'</span><b style="font-size:13px">'+esc(p.title)+'</b></div>';
 if(p.directions)h+='<details class="ex-dir"><summary'+(un.first?' style="color:var(--red)"':'')+'>Directions'+(un.first?' (new part — click to read)':'')+'</summary><div>'+esc(p.directions)+'</div></details>';
 if(un.section==="listening"){
  if(u.audioUrl||u.script)h+='<div class="audio-box"><div class="row"><button class="btn" id="ex-play" data-xact="play">▶ Play audio</button><button class="btn secondary small" data-xact="stop">■ Stop</button><span class="sk-meta" id="ex-plays"></span></div><p>Listen carefully, then answer the question(s) below.</p></div>';
  else h+='<div class="notice">No audio has been provided for this item.</div>';
 }
 if(u.passage)h+='<div class="ex-pass"><div class="pass-body" id="pass-body">'+passHTML(u.passage)+'</div></div>';
 h+=un.qs.map(function(it){
  var a=ex.answers[it.id];
  return '<article class="question" id="exq-'+it.gi+'"><div class="q-meta">Question '+it.num+' · '+m.short+'</div>'+(it.q.q?'<div class="q-text">'+qHTML(it)+'</div>':'')+'<div class="options">'+
   it.q.o.map(function(o,j){return '<label class="option"><input type="radio" name="'+esc(it.id)+'" data-qid="'+esc(it.id)+'" value="'+j+'"'+(a===j?" checked":"")+'><span>'+"ABCD"[j]+". "+fmt(esc(o))+'</span></label>';}).join("")+
   '</div><div class="ex-q-foot"><button type="button" class="btn secondary small ex-flag'+(ex.flags[it.id]?" on":"")+'" data-xact="flag" data-id="'+esc(it.id)+'">⚑ '+(ex.flags[it.id]?"Flagged":"Flag for review")+'</button>'+(a!=null?'<button type="button" class="btn secondary small" data-xact="clear" data-id="'+esc(it.id)+'">Clear answer</button>':"")+'</div></article>';
 }).join("");
 var last=ex.idx===ex.flat.units.length-1;
 h+='<div class="row" style="justify-content:space-between;margin-top:6px"><button class="btn secondary" data-xact="prev"'+(ex.idx===0?" disabled":"")+'>← Previous</button>'+(last?'<button class="btn" data-xact="submit">Review &amp; submit</button>':'<button class="btn" data-xact="next">Next →</button>')+'</div>';
 $("ex-main").innerHTML=h;
 updatePlays();renderNav();numberLines();setTimeout(numberLines,250);
}
function renderNav(){
 var un=curUnit(),cur={};un.qs.forEach(function(q){cur[q.id]=1;});
 var h=X.SECS.map(function(s){
  var list=ex.flat.qs.filter(function(q){return q.section===s;});if(!list.length)return "";
  return '<h4>'+X.META[s].ico+' '+X.META[s].short+' · '+answeredCount(s)+'/'+list.length+'</h4><div class="qgrid">'+list.map(function(q){return '<button type="button" class="qb'+(ex.answers[q.id]!=null?" a":"")+(ex.flags[q.id]?" f":"")+(cur[q.id]?" c":"")+'" data-xact="jump" data-id="'+q.gi+'" title="Question '+q.num+'">'+q.num+'</button>';}).join("")+'</div>';
 }).join("");
 $("ex-nav").innerHTML=h+'<div class="ex-legend"><span><i style="background:#e6f5f0"></i>Answered</span><span><i style="background:#fff"></i>Not answered</span><span><i style="background:#e0243f"></i>Flagged</span></div>';
 var tot=ex.flat.qs.length,pr=$("ex-prog"),an=answeredCount();if(pr)pr.innerHTML='<span class="pg-long">· answered '+an+' of '+tot+'</span><span class="pg-short">'+an+'/'+tot+'</span>';
}
function go(i){if(i<0||i>=ex.flat.units.length)return;ex.idx=i;persist();renderUnit();window.scrollTo({top:0,behavior:"smooth"});}

/* ---------- audio ---------- */
function stopAudio(){if(ex&&ex.audio){try{ex.audio.stop();}catch(e){}ex.audio=null;}ex&&(ex.playing=false);if(window.speechSynthesis)speechSynthesis.cancel();updatePlays();}
function playsLeft(u){var max=ex.cfg.settings.audioPlays;if(ex.preview||!max)return Infinity;return Math.max(0,max-(ex.plays[u.id]||0));}
function updatePlays(){
 if(!ex||ex.done||!curUnit())return;
 var u=curUnit().unit,el=$("ex-plays"),b=$("ex-play");if(!el||!b)return;
 var left=playsLeft(u);
 el.textContent=left===Infinity?"Unlimited plays":("Plays left: "+left);
 b.disabled=ex.playing||left===0;b.textContent=ex.playing?"Playing…":"▶ Play audio";
}
function playAudio(){
 var u=curUnit().unit;if(ex.playing||playsLeft(u)===0)return;
 stopAudio();ex.plays[u.id]=(ex.plays[u.id]||0)+1;persist();ex.playing=true;updatePlays();
 var unitId=u.id,done=function(){if(ex&&curUnit().unit.id===unitId){ex.playing=false;ex.audio=null;updatePlays();}};
 var url=L.safeUrl(L.normalizeAudioUrl(u.audioUrl));
 if(url){
  var a=new Audio(url);ex.audio={stop:function(){a.pause();}};
  a.onended=done;a.onerror=function(){ex.plays[unitId]=Math.max(0,(ex.plays[unitId]||1)-1);persist();alert("The audio could not be loaded. Your play was not counted.");done();};
  a.play().catch(function(){a.onerror();});
 }else if(u.script){
  if(!window.speechSynthesis){alert("This browser does not support speech playback.");ex.plays[unitId]--;done();return;}
  ex.audio=X.speakScript(u.script,ex.cfg.settings.voices,done);
 }else done();
}

/* ---------- kirim & hasil ---------- */
function submitExam(auto){
 if(!ex||ex.done)return;
 stopAudio();ex.done=true;clearInterval(ex.timer);
 var res=X.score(ex.flat,ex.answers);
 res.level=ex.level;res.ts=Date.now();res.auto=!!auto;res.usedSec=Math.min(ex.cfg.settings.totalMinutes*60,Math.round((Date.now()-ex.startedAt)/1000));
 if(!ex.preview&&ex.user){
  X.saveResult(ex.user,res);X.clearRun(ex.user,ex.level);
  L.recordAttempt(ex.user,{kind:"pretest",skill:"",section:"",level:ex.level,score:res.correct,total:res.total,pct:res.pct});
  try{renderAlert();}catch(e){}
 }
 ex.result=res;
 var pg=$("exam");if(pg&&!pg.classList.contains("hidden"))renderResult();
}
function renderResult(){
 document.body.classList.remove("exam-mode");var r=ex.result;
 var secRows=X.SECS.map(function(s){var x=r.sections[s],m=X.META[s];if(!x.total)return "";return '<tr><td>'+m.ico+' '+m.name+'</td><td class="n">'+x.correct+' / '+x.total+'</td><td class="n">'+x.wrong+'</td><td class="n">'+x.blank+'</td><td class="n"><b>'+x.scaled+'</b></td></tr>';}).join("");
 var bars=X.SECS.map(function(s){var x=r.sections[s],m=X.META[s];if(!x.total)return "";var p=Math.round(x.correct/x.total*100);return '<div class="bar-row"><span class="lb">'+m.ico+' '+m.short+'</span><div class="bar-track"><div class="bar-fill" style="width:'+p+'%;background:'+m.color+'"></div></div><b>'+p+'%</b></div>';}).join("");
 var parts=r.parts.map(function(p){return '<tr><td>'+esc(p.title)+'</td><td class="n">'+p.correct+' / '+p.total+'</td><td class="n">'+Math.round(p.correct/p.total*100)+'%</td></tr>';}).join("");
 var topics=r.topics.slice().sort(function(a,b){return a.correct/a.total-b.correct/b.total;}).map(function(t){return '<tr><td>'+esc(t.topic)+'</td><td class="n">'+t.correct+' / '+t.total+'</td><td class="n">'+Math.round(t.correct/t.total*100)+'%</td></tr>';}).join("");
 $("exam-body").innerHTML='<div class="page-title"><div><div class="kicker">'+(r.auto?"TIME IS UP · ":"")+'RESULT · '+LEVEL[ex.level].name.toUpperCase()+'</div><h2>Your Pre-Test Score</h2><p>'+(ex.preview?"Admin preview — this result is not saved.":"Saved to your portfolio.")+' Time used: '+fmtMin(r.usedSec)+'.</p></div></div>'+
  '<div class="grid-2"><div class="box" style="text-align:center"><div class="sub">ESTIMATED TOTAL SCORE (310–680)</div><div class="ex-total">'+(r.scaledTotal==null?"—":r.scaledTotal)+'</div><div class="sk-meta" style="margin-top:8px">'+r.correct+' of '+r.total+' correct · '+r.pct+'%</div></div><div class="box"><h3>Accuracy by section</h3><p class="sub">Share of correct answers.</p><div class="bars">'+bars+'</div></div></div>'+
  '<div class="box" style="margin-bottom:14px"><h3>Section details</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>SECTION</th><th class="n">CORRECT</th><th class="n">WRONG</th><th class="n">UNANSWERED</th><th class="n">SCALED (31–68)</th></tr></thead><tbody>'+secRows+'</tbody></table></div></div>'+
  '<div class="grid-2"><div class="box"><h3>By part</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>PART</th><th class="n">CORRECT</th><th class="n">%</th></tr></thead><tbody>'+parts+'</tbody></table></div></div>'+
  (topics?'<div class="box"><h3>By topic</h3><p class="sub">Weakest topics first.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>TOPIC</th><th class="n">CORRECT</th><th class="n">%</th></tr></thead><tbody>'+topics+'</tbody></table></div></div>':'<div></div>')+'</div>'+
  (canReview()?reviewHTML():'<div class="notice">🔒 Answer key, listening scripts and explanations are available for <b>Student Plus</b> accounts.</div>')+'<div class="notice">Scaled scores are a linear estimate for practice, not an official ETS conversion. The answer key is not shown; review these topics in the skill materials.</div>'+
  '<div class="row"><button class="btn" data-xact="home">Back to Pre-Test</button><button class="btn secondary" data-xact="retake">Retake this level</button></div>';
 window.scrollTo({top:0,behavior:"smooth"});
}

function canReview(){return isAdmin()||(me&&me.type==="plus");}
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

/* ---------- klik & perubahan ---------- */
var body=$("exam-body"),pre=$("pretest-body");
function handle(e){
 var b=e.target.closest("[data-xact]");if(!b||b.disabled)return;
 var a=b.dataset.xact,id=b.dataset.id;
 if(me&&me.type==="dummy"&&/^(begin|resume|play|submit)$/.test(a)){alert("Demo accounts can view this page but cannot take the test.");return;}
 if(a==="intro"){
  if(ex&&ex.level!==id&&!ex.done&&!confirm("You have another test in progress in this session. Open this level anyway? (Your other test stays saved.)"))return;
  if(!(ex&&ex.level===id&&!ex.done))ex=ex&&ex.done?null:ex;
  window._exLevel=id;view="intro";$("exam-body").innerHTML=introHTML(id);showPage("exam");
 }
 else if(a==="home"){showPage("pretest");}
 else if(a==="begin"){
  var lv=window._exLevel;view="run";buildEx(lv,null);if(!ex.preview)persist();startTimer();showPage("exam");renderShell();
 }
 else if(a==="resume"){
  var lv2=window._exLevel;view="run";
  if(!(ex&&ex.level===lv2&&!ex.done)){var s=me&&X.loadRun(me.user,lv2);buildEx(lv2,s||null);}
  if(ex.endAt<=Date.now()){submitExam(true);showPage("exam");return;}
  startTimer();showPage("exam");renderShell();
 }
 else if(a==="restart"){if(!confirm("Discard your saved progress and start over?"))return;if(me)X.clearRun(me.user,window._exLevel);discardEx();view="intro";$("exam-body").innerHTML=introHTML(window._exLevel);}
 else if(a==="retake"){discardEx();view="intro";$("exam-body").innerHTML=introHTML(window._exLevel);}
 else if(a==="play")playAudio();
 else if(a==="stop")stopAudio();
 else if(a==="prev")go(ex.idx-1);
 else if(a==="next")go(ex.idx+1);
 else if(a==="jump"){var it=ex.flat.qs[Number(id)];go(it.unit.idx);setTimeout(function(){var el=$("exq-"+it.gi);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});},60);}
 else if(a==="flag"){ex.flags[id]=!ex.flags[id];if(!ex.flags[id])delete ex.flags[id];persist();b.classList.toggle("on",!!ex.flags[id]);b.textContent="⚑ "+(ex.flags[id]?"Flagged":"Flag for review");renderNav();}
 else if(a==="clear"){delete ex.answers[id];persist();renderUnit();}
 else if(a==="submit"){
  var un=ex.flat.qs.length-answeredCount(),fl=Object.keys(ex.flags).length;
  var msg=(un?"You have "+un+" unanswered question"+(un>1?"s":"")+". ":"All questions are answered. ")+(fl?fl+" flagged for review. ":"")+"Submit your test now? You cannot change answers afterwards.";
  if(confirm(msg))submitExam(false);
 }
}
body.addEventListener("click",handle);pre.addEventListener("click",handle);
body.addEventListener("change",function(e){
 var r=e.target.closest("input[data-qid]");if(!r||!ex||ex.done)return;
 ex.answers[r.dataset.qid]=Number(r.value);persist();renderNav();
 var q=r.closest(".question");if(q&&!q.querySelector('[data-xact="clear"]')){var f=q.querySelector(".ex-q-foot");if(f){var c=document.createElement("button");c.type="button";c.className="btn secondary small";c.dataset.xact="clear";c.dataset.id=r.dataset.qid;c.textContent="Clear answer";f.appendChild(c);}}
});
/* peringatan sebelum menutup tab saat ujian berjalan */
window.addEventListener("beforeunload",function(e){if(ex&&!ex.done&&!ex.preview){e.preventDefault();e.returnValue="";}});
})();
