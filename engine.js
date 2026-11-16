/* Pure learning-state engine. IDs are stable across releases. */
(function(root){
'use strict';
const SIZE=20, VERSION=1, BANK='weld-800-v1';
function shuffle(a, random=Math.random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function queue(bank,random=Math.random){
 const t=shuffle(bank.filter(q=>q.kind==='theory').map(q=>q.id),random);
 const c=shuffle(bank.filter(q=>q.kind==='calculation').map(q=>q.id),random);
 const out=[];while(t.length||c.length)out.push(...shuffle([...t.splice(0,12),...c.splice(0,8)],random));
 return out;
}
function fresh(bank){return {version:VERSION,bank:BANK,revision:0,cycle:1,queue:queue(bank),cursor:0,active:null,history:[],created:new Date().toISOString()};}
function start(s,bank){
 if(s.active && s.active.answers.length<SIZE)return s;
 if(s.cursor===bank.length){s.cycle++;s.queue=queue(bank);s.cursor=0;}
 const ids=s.queue.slice(s.cursor,s.cursor+SIZE);
 if(ids.length!==SIZE)throw Error('Некорректный размер очереди');
 s.active={start:s.cursor,ids,answers:[],feedback:false,orders:ids.map(id=>shuffle(bank.find(q=>q.id===id).options.map((_,i)=>i))),started:new Date().toISOString()};
 return s;
}
function answer(s,bank,id,choice){
 const a=s.active;if(!a||a.answers.length>=SIZE)throw Error('Нет активного вопроса');
 const n=a.answers.length;if(a.ids[n]!==id||s.queue[s.cursor]!==id)throw Error('Вопрос уже изменился');
 const q=bank.find(q=>q.id===id);if(!Number.isInteger(choice)||choice<0||choice>=q.options.length)throw Error('Неверный вариант');
 a.answers.push(choice);a.feedback=true;s.cursor++;
 if(a.answers.length===SIZE)s.history.push({cycle:s.cycle,start:a.start,ids:a.ids.slice(),answers:a.answers.slice(),at:new Date().toISOString()});
 return s;
}
function validate(raw,bank){
 const s=JSON.parse(JSON.stringify(raw));const by=new Map(bank.map(q=>[q.id,q]));
 const ints=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
 const fail=()=>{throw Error('Файл прогресса повреждён или относится к другой версии базы');};
 if(!s||s.version!==VERSION||s.bank!==BANK||!ints(s.cycle,1,100000)||!ints(s.cursor,0,bank.length)||!ints(s.revision,0,1e9))fail();
 if(!Array.isArray(s.queue)||s.queue.length!==bank.length||new Set(s.queue).size!==bank.length||s.queue.some(id=>!by.has(id)))fail();
 if(!Array.isArray(s.history)||s.history.length>40000)fail();
 function checkRecord(r,active){
  if(!r||!ints(r.start,0,bank.length-SIZE)||r.start%SIZE||!Array.isArray(r.ids)||r.ids.length!==SIZE||new Set(r.ids).size!==SIZE||r.ids.some(id=>!by.has(id)))fail();
  if(!Array.isArray(r.answers)||r.answers.length>(SIZE)||(!active&&r.answers.length!==SIZE))fail();
  r.answers.forEach((x,i)=>{if(!ints(x,0,by.get(r.ids[i]).options.length-1))fail();});
  if(active){
   if(typeof r.feedback!=='boolean'||(r.feedback&&r.answers.length===0))fail();
   if(s.cursor!==r.start+r.answers.length||r.ids.some((id,i)=>id!==s.queue[r.start+i]))fail();
   if(!Array.isArray(r.orders)||r.orders.length!==SIZE)fail();
   r.orders.forEach((o,i)=>{const len=by.get(r.ids[i]).options.length;if(!Array.isArray(o)||o.length!==len||new Set(o).size!==len||o.some(x=>!ints(x,0,len-1)))fail();});
  }else if(!ints(r.cycle,1,s.cycle)||typeof r.at!=='string')fail();
 }
 s.history.forEach(r=>checkRecord(r,false));
 if(s.active)checkRecord(s.active,true);else if(s.cursor!==0)fail();
 const keys=new Set();for(const r of s.history){const key=r.cycle+':'+r.start;if(keys.has(key))fail();keys.add(key);}
 // History must cover every completed batch, including previous cycles.
 if(s.history.length!==(s.cycle-1)*(bank.length/SIZE)+Math.floor(s.cursor/SIZE))fail();
 for(let cy=1;cy<=s.cycle;cy++){
  const h=s.history.filter(r=>r.cycle===cy).sort((a,b)=>a.start-b.start);
  const expected=cy<s.cycle?bank.length/SIZE:Math.floor(s.cursor/SIZE);
  if(h.length!==expected||h.some((r,i)=>r.start!==i*SIZE))fail();
  const ids=h.flatMap(r=>r.ids);if(new Set(ids).size!==ids.length)fail();
  if(cy===s.cycle&&ids.some((id,i)=>id!==s.queue[i]))fail();
 }
 if(s.active?.answers.length===SIZE){const r=s.history.at(-1);if(!r||r.ids.some((id,i)=>id!==s.active.ids[i])||r.answers.some((v,i)=>v!==s.active.answers[i]))fail();}
 return s;
}
function summary(s,bank){
 const by=new Map(bank.map(q=>[q.id,q]));let correct=0,total=0;
 const records=s.history.slice();if(s.active&&s.active.answers.length<SIZE)records.push(s.active);
 const topics={};for(const r of records)r.answers.forEach((answer,i)=>{const q=by.get(r.ids[i]);total++;const ok=answer===q.correct;if(ok)correct++;topics[q.topic]??={total:0,correct:0};topics[q.topic].total++;if(ok)topics[q.topic].correct++;});
 return {correct,total,tests:s.history.length,topics};
}
root.WeldEngine={SIZE,VERSION,BANK,shuffle,queue,fresh,start,answer,validate,summary};
if(typeof module!=='undefined')module.exports=root.WeldEngine;
})(typeof window!=='undefined'?window:globalThis);
