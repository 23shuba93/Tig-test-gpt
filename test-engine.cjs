const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../engine.js'),bank=JSON.parse(fs.readFileSync(__dirname+'/../data/questions.json','utf8'));
let s=E.fresh(bank);assert.equal(bank.length,800);assert.equal(new Set(bank.map(q=>q.q)).size,800);
for(let cycle=1;cycle<=3;cycle++){
 const seen=new Set();
 for(let test=0;test<40;test++){
  s=E.start(s,bank);assert.equal(s.cycle,cycle);assert.equal(s.active.ids.length,20);
  assert.equal(s.active.ids.filter(id=>id.startsWith('T')).length,12);
  for(let i=0;i<20;i++){
   const id=s.active.ids[i];assert(!seen.has(id));seen.add(id);
   const before=s.cursor;s=E.answer(s,bank,id,i%3);assert.equal(s.cursor,before+1);
   const serialized=JSON.parse(JSON.stringify(s));s=E.validate(serialized,bank);
   assert.equal(s.active.feedback,true);assert.equal(s.active.answers.length,i+1);
   assert.throws(()=>E.answer(structuredClone(s),bank,id,0));
   s.active.feedback=false;
  }
  assert.equal(s.history.length,(cycle-1)*40+test+1);
 }
 assert.equal(seen.size,800);assert.equal(s.cursor,800);
}
assert.equal(E.summary(s,bank).total,2400);
const variants=[x=>x.queue[1]=x.queue[0],x=>x.cursor--,x=>x.active.answers[0]=99,x=>x.active.orders[0]=[0,0,1],x=>x.history.pop(),x=>x.bank='other',x=>x.history[0].ids[0]='unknown'];
for(const f of variants){const x=structuredClone(s);f(x);assert.throws(()=>E.validate(x,bank));}
const round=E.validate(JSON.parse(JSON.stringify(s)),bank);assert.deepEqual(round,s);
console.log('PASS: 3 full cycles / 2400 answers, no repeat within cycle, 12+8 per test, persistence after every answer, duplicate-click rejection, export/import and corrupt-import rejection.');
