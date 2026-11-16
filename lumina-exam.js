/* Lumina Exam v1 — model data Pre-Test (3 sesi ala TOEFL ITP), parser teks, penilaian, suara TTS.
   Dipakai oleh index.html (via lumina-pretest.js) dan exam-manager.html. Butuh lumina-core.js. */
(function(root){
"use strict";
var L=root.Lumina||{};
var KEY="luminaExam",EXP_KEY="luminaExamExportedAt",RUN_P="luminaExamRun:",RES_P="luminaExamRes:";
var LEVELS=["easy","medium","hard"],SECS=["listening","swo","reading"],ROLES=["narrator","woman","man"];
var META={
 listening:{name:"Listening Comprehension",short:"Listening",ico:"🎧",color:"#16866b",std:50,minutes:40},
 swo:{name:"Structure & Written Expression",short:"Structure",ico:"✍️",color:"#bd7922",std:40,minutes:25},
 reading:{name:"Reading Comprehension",short:"Reading",ico:"📖",color:"#7952b5",std:50,minutes:55}
};
var PTYPES=["short","conversation","talk","structure","error","passage"];
var SEC_DIR={
 listening:"In this section you will demonstrate your ability to understand conversations and talks in English. Each audio can be played only the number of times shown on the screen. Read each question carefully, then choose the best answer.",
 swo:"This section measures your ability to recognize language that is appropriate for standard written English. In Part A (Structure), choose the word or phrase that best completes the sentence. In Part B (Written Expression), choose the one underlined word or phrase that must be changed for the sentence to be correct.",
 reading:"In this section you will read several passages. Each passage is followed by questions about it. Answer each question on the basis of what is stated or implied in the passage."
};
var DEF_VOICES={narrator:{voice:"",rate:0.95,pitch:1},woman:{voice:"",rate:0.95,pitch:1.15},man:{voice:"",rate:0.95,pitch:0.8}};

function clamp(n,a,b){return Math.min(b,Math.max(a,n));}
function uid(p){return (p||"id")+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function mk(id,type,title,dir,target){return {id:id,type:type,title:title,directions:dir,target:target,units:[]};}
function emptyParts(sec){
 if(sec==="listening")return [
  mk("la","short","Part A — Short Conversations","In Part A you will hear short conversations between two people. After each conversation you will hear a question about what was said. Choose the best answer, (A), (B), (C), or (D).",30),
  mk("lb","conversation","Part B — Longer Conversations","In Part B you will hear longer conversations. After each conversation you will answer several questions about it.",8),
  mk("lc","talk","Part C — Talks","In Part C you will hear talks, such as a lecture or an announcement. After each talk you will answer several questions about it.",12)];
 if(sec==="swo")return [
  mk("sa","structure","Part A — Structure","Questions 1–15 are incomplete sentences. Choose the one word or phrase that best completes the sentence.",15),
  mk("sb","error","Part B — Written Expression","Each sentence has four underlined parts, marked (A) to (D). Choose the one underlined part that must be changed for the sentence to be correct.",25)];
 return [mk("ra","passage","Reading Passages","Read each passage and answer the questions that follow. Five passages with ten questions each is typical.",50)];
}

/* ---------- parser teks ⇄ unit ---------- */
var PAUSE_RE=/^\[?\s*(?:pause|jeda)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:s|sec|secs|detik|dtk)?\s*\]?$/i;
function pauseSec(v){return Math.min(120,Math.max(0.5,parseFloat(String(v).replace(",","."))||1));}
var RESERVED=/^(q|question|soal|answer|jawaban|ans|explain|explanation|penjelasan|topic|topik|audio|passage|teks|a|b|c|d)$/i;
function audioNorm(u){return L.normalizeAudioUrl?L.normalizeAudioUrl(u):String(u||"").trim();}
function parseUnits(text,partId){
 text=String(text||"").replace(/\r/g,"");
 var chunks=[];
 if(/^\s*###/m.test(text)){
  text.split(/^[ \t]*###/m).slice(1).forEach(function(c){var i=c.indexOf("\n");chunks.push({title:(i<0?c:c.slice(0,i)).trim(),lines:i<0?[]:c.slice(i+1).split("\n")});});
 }else{
  text.split(/\n\s*\n+/).forEach(function(b){if(b.trim())chunks.push({title:"",lines:b.split("\n")});});
 }
 var units=[],errors=[];
 chunks.forEach(function(ch,ci){
  var u={id:partId+"-u"+(units.length+1),title:ch.title,audioUrl:"",script:"",passage:"",questions:[]},sc=[],ps=[],cur=null,mode=null,m;
  ch.lines.forEach(function(raw){
   var line=raw.trim();
   if(!line){if(mode==="passage")ps.push("");else if(mode!=="passage")mode=null;return;}
   if((m=line.match(/^audio\s*[:=]\s*(.*)$/i))){u.audioUrl=audioNorm(m[1]);mode=null;return;}
   if((m=line.match(/^(?:passage|teks)\s*[:=]\s*(.*)$/i))&&!cur){mode="passage";if(m[1])ps.push(m[1]);return;}
   if((m=line.match(/^(?:q|question|soal)\s*[:.)\-]\s*(.*)$/i))){cur={q:m[1],o:["","","",""],a:-1,e:"",topic:""};u.questions.push(cur);mode="q";return;}
   if(cur&&(m=line.match(/^([A-D])\s*[).:]\s*(.*)$/i))){cur.o["ABCD".indexOf(m[1].toUpperCase())]=m[2].trim();mode=null;return;}
   if(cur&&(m=line.match(/^(?:answer|jawaban|ans)\s*[:=]\s*\(?([A-D])/i))){cur.a="ABCD".indexOf(m[1].toUpperCase());mode=null;return;}
   if(cur&&(m=line.match(/^(?:explain(?:ation)?|penjelasan)\s*[:=]\s*(.*)$/i))){cur.e=m[1];mode="e";return;}
   if(cur&&(m=line.match(/^(?:topic|topik)\s*[:=]\s*(.*)$/i))){cur.topic=m[1];mode=null;return;}
   if(mode==="passage"){ps.push(line);return;}
   if(!cur&&(m=line.match(PAUSE_RE))){sc.push("Pause: "+pauseSec(m[1]));return;}
   if(!cur&&(m=line.match(/^([A-Za-z][A-Za-z0-9 .]{0,24}):\s*(.+)$/))&&!RESERVED.test(m[1].trim())){sc.push(m[1].trim()+": "+m[2].trim());return;}
   if(cur&&mode==="q"){cur.q+=" "+line;return;}
   if(cur&&mode==="e"){cur.e+=" "+line;return;}
   if(!cur&&sc.length){sc[sc.length-1]+=" "+line;return;}
  });
  u.script=sc.join("\n");
  u.passage=ps.join("\n").replace(/^\s+|\s+$/g,"");
  var label="Unit "+(ci+1)+(ch.title?" ("+ch.title+")":"");
  var ok=true;
  u.questions.forEach(function(q,qi){
   q.q=q.q.trim();
   if(q.o.some(function(x){return !x;})){var segs=[],r=/__(.+?)__/g,mm;while((mm=r.exec(q.q)))segs.push(mm[1]);if(segs.length===4)q.o=segs;}
   if(!q.q){errors.push(label+", soal "+(qi+1)+": teks soal kosong.");ok=false;}
   else if(q.o.some(function(x){return !x;})){errors.push(label+", soal "+(qi+1)+": pilihan A–D harus lengkap (atau tandai 4 bagian bergaris bawah dengan __kata__).");ok=false;}
   else if(q.a<0){errors.push(label+", soal "+(qi+1)+": baris Answer: A/B/C/D belum ada.");ok=false;}
   q.id=u.id+"-q"+(qi+1);
  });
  if(!u.questions.length){errors.push(label+": tidak ada soal (baris Q:).");ok=false;}
  if(ok)units.push(u);else u.id=partId+"-bad";
 });
 /* ulang id agar berurutan tanpa celah */
 units.forEach(function(u,i){u.id=partId+"-u"+(i+1);u.questions.forEach(function(q,j){q.id=u.id+"-q"+(j+1);});});
 return {units:units,errors:errors};
}
function serializeUnits(units){
 return (units||[]).map(function(u,i){
  var o=["### "+(u.title||"Unit "+(i+1))];
  if(u.audioUrl)o.push("Audio: "+u.audioUrl);
  if(u.script)o.push(u.script);
  if(u.passage){o.push("Passage: "+u.passage);o.push("");}
  u.questions.forEach(function(q,j){
   if(j>0||!u.passage)o.push("");
   o.push("Q: "+q.q);
   q.o.forEach(function(x,k){o.push("ABCD"[k]+") "+x);});
   o.push("Answer: "+"ABCD"[q.a]);
   if(q.topic)o.push("Topic: "+q.topic);
   if(q.e)o.push("Explain: "+q.e);
  });
  return o.join("\n");
 }).join("\n\n");
}

/* ---------- normalisasi ---------- */
function cleanQ(q,id){
 q=q||{};var o=(Array.isArray(q.o)?q.o:[]).slice(0,4).map(String);while(o.length<4)o.push("");
 return {id:id||q.id||uid("q"),q:String(q.q||""),o:o,a:clamp(Math.round(Number(q.a))||0,0,3),e:String(q.e||""),topic:String(q.topic||"")};
}
function cleanUnit(u,pid,i){
 u=u||{};var id=pid+"-u"+(i+1);
 return {id:id,title:String(u.title||""),audioUrl:String(u.audioUrl||""),script:String(u.script||""),passage:String(u.passage||""),
  questions:(Array.isArray(u.questions)?u.questions:[]).filter(function(q){return q&&q.q;}).map(function(q,j){return cleanQ(q,id+"-q"+(j+1));})};
}
function cleanPart(p){
 p=p||{};var id=String(p.id||uid("p")).replace(/[^\w\-]/g,"");
 return {id:id,type:PTYPES.indexOf(p.type)>=0?p.type:"passage",title:String(p.title||"Part"),directions:String(p.directions||""),
  target:clamp(Math.round(Number(p.target))||0,0,200),units:(Array.isArray(p.units)?p.units:[]).map(function(u,i){return cleanUnit(u,id,i);}).filter(function(u){return u.questions.length;})};
}
var SAMPLE={
 la:"### Report\nWoman: Have you finished the report for Professor Allen?\nMan: Almost. I still need to check the figures in the last section.\nNarrator: What does the man mean?\nQ: What does the man imply about the report?\nA) It has already been submitted.\nB) It needs a final check.\nC) It was lost.\nD) It is too long.\nAnswer: B\nTopic: Short conversation\n\n### Library\nMan: Do you know where I can find the journals for my research?\nWoman: They moved them to the second floor of the library last week.\nNarrator: What does the woman say about the journals?\nQ: Where are the journals now?\nA) On the first floor\nB) At the front desk\nC) On the second floor\nD) In the professor's office\nAnswer: C\nTopic: Short conversation",
 lb:"### Study group\nWoman: Are you coming to the study group tonight?\nMan: I wish I could, but I have a part-time shift until nine.\nWoman: We're meeting at eight in the library. We could also meet again on Saturday.\nMan: Saturday would be perfect. I'm free all day.\nNarrator: Question 1. Why can't the man attend tonight?\nQ: Why can't the man attend the study group tonight?\nA) He is sick.\nB) He has to work.\nC) He forgot about it.\nD) He needs to travel.\nAnswer: B\nTopic: Conversation detail\n\nQ: What do the speakers decide to do?\nA) Cancel the group\nB) Meet at nine tonight\nC) Meet again on Saturday\nD) Study separately\nAnswer: C\nTopic: Conversation main idea",
 sa:"### s1\nQ: The committee _____ the final decision yesterday.\nA) make\nB) makes\nC) made\nD) making\nAnswer: C\nTopic: Verb tense\n\n### s2\nQ: Neither the students nor the teacher _____ aware of the schedule change.\nA) were\nB) are\nC) have\nD) was\nAnswer: D\nTopic: Subject-Verb Agreement",
 sb:"### e1\nQ: The __researcher__ collected the data __careful__, so the results __were__ __reliable__.\nAnswer: B\nTopic: Adverbs\n\n### e2\nQ: Each of the __students__ __have__ to submit __an__ essay __by__ Friday.\nAnswer: B\nTopic: Subject-Verb Agreement",
 ra:"### Urban trees\nPassage: Urban trees provide benefits that extend beyond their appearance. Their leaves provide shade, reducing the heat absorbed by streets and buildings. Trees also help manage rainwater: some water is intercepted by leaves, while roots improve the soil's ability to absorb rainfall.\n\nHowever, planting trees in cities requires careful planning. A tree that grows well in a park may not be suitable for a narrow sidewalk where roots could damage pavement or underground pipes. Successful urban forestry therefore depends not simply on planting more trees, but on choosing appropriate species and caring for them over time.\n\nQ: What is the main idea of the passage?\nA) Why cities should remove old trees\nB) The benefits of urban trees and the need for careful planning\nC) How birds migrate through cities\nD) Why all trees grow well on sidewalks\nAnswer: B\nTopic: Main idea\n\nQ: The word \"intercepted\" in the passage is closest in meaning to\nA) caught\nB) heated\nC) destroyed\nD) measured\nAnswer: A\nTopic: Vocabulary\n\nQ: Why might a tree be unsuitable for a narrow sidewalk?\nA) It attracts too many birds.\nB) Its roots may damage pavement or pipes.\nC) It cannot receive sunlight.\nD) It stops all traffic.\nAnswer: B\nTopic: Detail"
};
function defaults(){
 var d={version:1,updatedAt:0,settings:{totalMinutes:120,audioPlays:1,generalNotes:"",lineEvery:5,voices:JSON.parse(JSON.stringify(DEF_VOICES))},levels:{}};
 LEVELS.forEach(function(lv){var o={sections:{}};SECS.forEach(function(s){o.sections[s]={directions:SEC_DIR[s],minutes:META[s].minutes,parts:emptyParts(s)};});d.levels[lv]=o;});
 var e=d.levels.easy.sections;
 [[e.listening.parts[0],SAMPLE.la],[e.listening.parts[1],SAMPLE.lb],[e.swo.parts[0],SAMPLE.sa],[e.swo.parts[1],SAMPLE.sb],[e.reading.parts[0],SAMPLE.ra]].forEach(function(x){x[0].units=parseUnits(x[1],x[0].id).units;});
 return d;
}
function normalize(d){
 d=(d&&typeof d==="object")?d:{};
 if(!d.levels)return normalize(Object.assign(defaults(),{updatedAt:Number(d.updatedAt)||0,settings:d.settings||defaults().settings}));
 var out={version:1,updatedAt:Number(d.updatedAt)||0},s=d.settings||{},ap=Number(s.audioPlays);if(s.audioPlays==null||isNaN(ap))ap=1;
 out.settings={totalMinutes:clamp(Math.round(Number(s.totalMinutes))||120,10,360),audioPlays:clamp(Math.round(ap),0,10),generalNotes:String(s.generalNotes||""),lineEvery:(s.lineEvery==null||isNaN(Number(s.lineEvery)))?5:clamp(Math.round(Number(s.lineEvery)),0,20),voices:{}};
 ROLES.forEach(function(r){var v=(s.voices&&s.voices[r])||{},b=DEF_VOICES[r];out.settings.voices[r]={voice:String(v.voice||""),rate:clamp(Number(v.rate)||b.rate,0.5,1.5),pitch:clamp(Number(v.pitch)||b.pitch,0.3,2)};});
 out.levels={};
 LEVELS.forEach(function(lv){
  var o={sections:{}},src=(d.levels[lv]&&d.levels[lv].sections)||{};
  SECS.forEach(function(sec){
   var x=src[sec]||{},parts=Array.isArray(x.parts)&&x.parts.length?x.parts.map(cleanPart):emptyParts(sec);
   o.sections[sec]={directions:String(x.directions||SEC_DIR[sec]),minutes:clamp(Math.round(Number(x.minutes))||META[sec].minutes,1,240),parts:parts};
  });
  out.levels[lv]=o;
 });
 return out;
}

/* ---------- format teks: **tebal**, *miring* ---------- */
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function fmt(t){
 return esc(t).replace(/\*\*([^*\s](?:[^*]*?[^*\s])?)\*\*/g,"<strong>$1</strong>").replace(/(^|[^*])\*([^*\s](?:[^*]*?[^*\s])?)\*(?!\*)/g,"$1<em>$2</em>");
}
function fmtPassage(t){
 return String(t||"").split(/\n\s*\n+/).map(function(p){return p.trim();}).filter(Boolean).map(function(p){return "<p>"+fmt(p.replace(/\s*\n\s*/g," "))+"</p>";}).join("");
}

/* ---------- susun urutan soal ---------- */
function flatten(lv){
 var units=[],qs=[],num={listening:0,swo:0,reading:0};
 SECS.forEach(function(sec){lv.sections[sec].parts.forEach(function(p){var first=true;p.units.forEach(function(u){
  if(!u.questions.length)return;
  var un={id:u.id,section:sec,part:p,unit:u,qs:[],first:first,idx:units.length};first=false;
  u.questions.forEach(function(q){num[sec]++;var it={id:q.id,q:q,section:sec,partId:p.id,partTitle:p.title,partType:p.type,num:num[sec],unit:un,gi:qs.length};un.qs.push(it);qs.push(it);});
  units.push(un);
 });});});
 return {units:units,qs:qs,count:num};
}

/* ---------- penilaian ---------- */
/* Skala 31–68 per sesi (perkiraan linear), total = rata-rata × 10 → 310–680. Bukan tabel konversi resmi ETS. */
function scaled(c,t){return t?Math.round(31+37*c/t):null;}
function score(flat,answers){
 var secs={},parts={},plist=[],topics={},tot=0,cor=0;
 SECS.forEach(function(s){secs[s]={total:0,correct:0,wrong:0,blank:0,scaled:null};});
 flat.qs.forEach(function(it){
  var a=answers[it.id],s=secs[it.section],ok=(a===it.q.a);s.total++;tot++;
  if(a==null)s.blank++;else if(ok){s.correct++;cor++;}else s.wrong++;
  var pk=it.section+"|"+it.partId;if(!parts[pk]){parts[pk]={section:it.section,title:it.partTitle,total:0,correct:0};plist.push(parts[pk]);}
  parts[pk].total++;if(ok)parts[pk].correct++;
  if(it.q.topic){var t=topics[it.q.topic]||(topics[it.q.topic]={topic:it.q.topic,total:0,correct:0});t.total++;if(ok)t.correct++;}
 });
 var sc=[];SECS.forEach(function(s){var x=secs[s];x.scaled=scaled(x.correct,x.total);if(x.scaled!=null)sc.push(x.scaled);});
 return {sections:secs,parts:plist,topics:Object.keys(topics).map(function(k){return topics[k];}),total:tot,correct:cor,pct:tot?Math.round(cor/tot*100):0,
  scaledTotal:sc.length?Math.round(sc.reduce(function(a,b){return a+b;},0)/sc.length*10):null,sectionCount:sc.length};
}

/* ---------- penyimpanan ---------- */
function loadDraft(){try{var r=localStorage.getItem(KEY);return r?normalize(JSON.parse(r)):null;}catch(e){return null;}}
function saveDraft(d){d.updatedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(d));return true;}catch(e){return false;}}
function fetchPublished(){return fetch("lumina-exam.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(j){return j?normalize(j):null;}).catch(function(){return null;});}
function loadViewer(preferDraft){
 return fetchPublished().then(function(pub){
  var loc=loadDraft();
  if(preferDraft)return loc||pub||normalize(null);
  return pub||loc||normalize(null);
 });
}
function getExportedAt(){try{return Number(localStorage.getItem(EXP_KEY))||0;}catch(e){return 0;}}
function download(d){
 var blob=new Blob([JSON.stringify(d,null,2)],{type:"application/json"}),u=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=u;a.download="lumina-exam.json";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1500);
 try{localStorage.setItem(EXP_KEY,String(Date.now()));}catch(e){}
}
function runKey(u,l){return RUN_P+String(u)+":"+l;}
function loadRun(u,l){try{var r=localStorage.getItem(runKey(u,l));return r?JSON.parse(r):null;}catch(e){return null;}}
function saveRun(u,l,s){try{localStorage.setItem(runKey(u,l),JSON.stringify(s));}catch(e){}}
function clearRun(u,l){try{localStorage.removeItem(runKey(u,l));}catch(e){}}
function getResults(u){try{var r=JSON.parse(localStorage.getItem(RES_P+String(u))||"[]");return Array.isArray(r)?r:[];}catch(e){return [];}}
function saveResult(u,res){var a=getResults(u);a.push(res);if(a.length>40)a=a.slice(-40);try{localStorage.setItem(RES_P+String(u),JSON.stringify(a));}catch(e){}}

/* ---------- suara (Web Speech API) ---------- */
var voices=[];
function loadVoices(){if(root.speechSynthesis)voices=root.speechSynthesis.getVoices()||[];}
if(root.speechSynthesis){loadVoices();root.speechSynthesis.addEventListener&&root.speechSynthesis.addEventListener("voiceschanged",loadVoices);}
function listVoices(){loadVoices();return voices.slice();}
function roleOf(sp){var s=String(sp||"").toLowerCase().trim();if(/^(narrator|announcer)/.test(s))return "narrator";if(/^(woman|female|girl|lady|ms|mrs|miss)/.test(s))return "woman";if(/^(man|male|boy|mr|sir)/.test(s))return "man";return "narrator";}
function parseScript(script){
 return String(script||"").split(/\n/).map(function(l){return l.trim();}).filter(Boolean).map(function(l){
  var pm=l.match(PAUSE_RE);if(pm)return {role:"pause",pause:pauseSec(pm[1])};
  var m=l.match(/^([A-Za-z][A-Za-z0-9 .]{0,24}):\s*(.+)$/);
  return m?{role:roleOf(m[1]),text:m[2]}:{role:"narrator",text:l};
 });
}
var FEM=/(zira|samantha|female|aria|jenny|susan|karen|moira|tessa|victoria|hazel|allison|libby|sonia|serena|fiona|joanna|salli|kimberly)/i,MAL=/(david|mark|male|daniel|alex|guy|fred|james|george|ryan|thomas|rishi|matthew|joey|brian|arthur)/i;
function pickVoice(role,cfg){
 loadVoices();var c=(cfg&&cfg[role])||{},v=null;
 if(c.voice)v=voices.filter(function(x){return x.name===c.voice;})[0]||null;
 if(!v){
  var en=voices.filter(function(x){return /^en/i.test(x.lang);}),us=en.filter(function(x){return /en[-_]US/i.test(x.lang);});if(us.length)en=us;
  if(role==="woman")v=en.filter(function(x){return FEM.test(x.name);})[0];
  else if(role==="man")v=en.filter(function(x){return MAL.test(x.name);})[0];
  else v=en[0];
  if(!v)v=en[0]||null;
 }
 return v;
}
function speakScript(script,cfg,onend){
 if(!root.speechSynthesis){if(onend)onend(false);return {stop:function(){}};}
 var items=parseScript(script),i=0,stopped=false;
 function next(){
  if(stopped)return;
  if(i>=items.length){if(onend)onend(true);return;}
  var it=items[i++];
  if(it.role==="pause"){setTimeout(next,it.pause*1000);return;}
  var u=new SpeechSynthesisUtterance(it.text),c=(cfg&&cfg[it.role])||{},v=pickVoice(it.role,cfg);
  if(v){u.voice=v;u.lang=v.lang;}else u.lang="en-US";
  u.rate=c.rate||0.95;u.pitch=c.pitch||1;
  u.onend=function(){if(!stopped)setTimeout(next,it.role==="narrator"?500:350);};
  u.onerror=function(){if(!stopped)next();};
  root.speechSynthesis.speak(u);
 }
 root.speechSynthesis.cancel();setTimeout(next,60);
 return {stop:function(){stopped=true;root.speechSynthesis.cancel();}};
}

root.LuminaExam={fmt:fmt,fmtPassage:fmtPassage,LEVELS:LEVELS,SECS:SECS,ROLES:ROLES,META:META,PTYPES:PTYPES,SEC_DIR:SEC_DIR,DEF_VOICES:DEF_VOICES,
 uid:uid,emptyParts:emptyParts,parseUnits:parseUnits,serializeUnits:serializeUnits,defaults:defaults,normalize:normalize,flatten:flatten,score:score,scaled:scaled,
 loadDraft:loadDraft,saveDraft:saveDraft,fetchPublished:fetchPublished,loadViewer:loadViewer,getExportedAt:getExportedAt,download:download,
 loadRun:loadRun,saveRun:saveRun,clearRun:clearRun,getResults:getResults,saveResult:saveResult,
 listVoices:listVoices,parseScript:parseScript,roleOf:roleOf,pickVoice:pickVoice,speakScript:speakScript};
})(typeof window!=="undefined"?window:globalThis);
