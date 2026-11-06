/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads TypeScript through CommonJS without extra dependencies. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../lib/hand-history-backup.ts');
const loaded = new Module(filename, module);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, filename);
const { BACKUP_KEYS: K, RECOVERY_KEY, MAX_BACKUP_BYTES, createBackup, planRestore, applyRestore, hasPendingRecovery, recoverPendingRestore } = loaded.exports;
class Store {
 constructor(data = {}) { this.data = new Map(Object.entries(data)); this.writes = []; }
 getItem(k) { return this.data.get(k) ?? null; }
 setItem(k,v) { this.data.set(k,v); this.writes.push(k); }
 removeItem(k) { this.data.delete(k); this.writes.push(k); }
}
const raw = v => JSON.stringify(v);
const file = data => raw(createBackup(new Store(data)));
const review = n => ({totalScore:n, summary:'review', extra:{preserve:[1,2]}});
const hands = (...ids) => ids.map(id => ({id,savedAt:'2026-01-01',unknown:{keep:true}}));
for (const mode of [0,1]) {
 const h=K[mode], f=K[mode+2], a=K[4+mode*2], b=K[5+mode*2];
 test(`${mode}: raw backup preserves bytes, unknown fields and null keys`,()=>{
  const s=new Store({[h]:' [ { "id":"A", "custom":true } ] '});
  const backup=createBackup(s); assert.equal(backup.storage[h],s.getItem(h)); assert.equal(backup.storage[b],null); assert.equal(Object.keys(backup.storage).length,8); assert.equal(s.writes.length,0);
 });
 test(`${mode}: merge preserves original keys, adds hands reviews favorites; repeat is no-op`,()=>{
  const s=new Store({[h]:raw(hands('A')),[a]:raw({A:review(50)}),[f]:'["A"]','unrelated':'keep'});
  const incoming=file({[h]:raw(hands('B')),[b]:raw({B:review(90)}),[f]:'["B"]'});
  const plan=planRestore(incoming,s); assert.equal(s.writes.length,0); assert.equal(plan.stats.handsAdded,1); applyRestore(plan,s);
  assert.equal(s.getItem(a),raw({A:review(50)})); assert.equal(s.getItem('unrelated'),'keep'); assert.deepEqual(JSON.parse(s.getItem(f)),['A','B']);
  const repeat=planRestore(incoming,s); assert.deepEqual(repeat.before,repeat.after); assert.equal(repeat.stats.handsAdded,0);
 });
 test(`${mode}: same hand ID with different payload copies and remaps both reviews and favorite`,()=>{
  const s=new Store({[h]:raw(hands('A')),[b]:raw({A:review(90)})});
  const changed={...hands('A')[0],unknown:{keep:false}};
  const incoming=file({[h]:raw([changed]),[a]:raw({A:review(60)}),[b]:raw({A:review(70)}),[f]:'["A"]'});
  const p=planRestore(incoming,s); assert.equal(p.stats.conflictCopies,1); applyRestore(p,s);
  const list=JSON.parse(s.getItem(h)); const id=list[1].id; assert.match(id,/A~import-/); assert.deepEqual(list[0],hands('A')[0]);
  assert.equal(JSON.parse(s.getItem(a))[id].totalScore,60); assert.equal(JSON.parse(s.getItem(b))[id].totalScore,70); assert.equal(JSON.parse(s.getItem(b)).A.totalScore,90); assert.deepEqual(JSON.parse(s.getItem(f)),[id]);
  assert.deepEqual(planRestore(incoming,s).before,planRestore(incoming,s).after);
 });
 test(`${mode}: legacy/current conflicting review copies identical hand instead of hiding existing review`,()=>{
  const s=new Store({[h]:raw(hands('A')),[a]:raw({A:review(60)})});
  const p=planRestore(file({[h]:raw(hands('A')),[b]:raw({A:review(90)})}),s); applyRestore(p,s);
  assert.equal(p.stats.conflictCopies,1); assert.equal(JSON.parse(s.getItem(b)).A,undefined); assert.equal(JSON.parse(s.getItem(a)).A.totalScore,60);
 });
 test(`${mode}: exact backup with distinct legacy/current reviews does not create copies`,()=>{
  const s=new Store({[h]:raw(hands('A')),[a]:raw({A:review(60)}),[b]:raw({A:review(90)})});
  const p=planRestore(raw(createBackup(s)),s); assert.deepEqual(p.before,p.after); assert.equal(p.stats.conflictCopies,0);
 });
 test(`${mode}: orphan conflicting reviews skipped and reported, nonconflicting orphans preserved`,()=>{
  const s=new Store({[a]:raw({orphan:review(60)})});
  const p=planRestore(file({[b]:raw({orphan:review(90),newOrphan:review(77)})}),s); applyRestore(p,s);
  assert.equal(p.stats.skippedReviewConflicts,1); assert.equal(s.getItem(h),null); assert.equal(JSON.parse(s.getItem(b)).orphan,undefined); assert.equal(JSON.parse(s.getItem(b)).newOrphan.totalScore,77);
 });
}
test('strict validation rejects malformed shapes, duplicates, nested renderer hazards and unexpected keys before writes',()=>{
 const invalid=[{[K[0]]:'null'},{[K[0]]:raw(hands('A','A'))},{[K[0]]:raw([{id:'A',flop:{actions:{}}}])},{[K[0]]:raw([{id:'A',heroHand:{notation:{bad:1}}}])},{[K[0]]:raw([{id:'A',flop:{board:[null]}}])},{[K[2]]:'[1]'},{[K[4]]:'[]'},{[K[5]]:raw({A:{totalScore:'wrong'}})}];
 for(const data of invalid){ const s=new Store(); assert.throws(()=>planRestore(file(data),s)); assert.equal(s.writes.length,0); }
 const backup=createBackup(new Store()); backup.storage.evil='[]'; assert.throws(()=>planRestore(raw(backup),new Store()));
 assert.throws(()=>planRestore(' '.repeat(MAX_BACKUP_BYTES+1),new Store()));
 const s=new Store({[K[0]]:'{broken'}); assert.throws(()=>planRestore(file({}),s)); assert.equal(s.getItem(K[0]),'{broken');
});
test('stale preview aborts without a write',()=>{
 const s=new Store(); const p=planRestore(file({[K[0]]:raw(hands('A'))}),s); s.setItem(K[2],'["other"]'); s.writes=[];
 assert.throws(()=>applyRestore(p,s)); assert.deepEqual(s.writes,[]);
});
test('mid-commit quota failure rolls back exact previous bytes',()=>{
 const s=new Store({[K[0]]:' [ ] '}); const p=planRestore(file({[K[0]]:raw(hands('A')),[K[2]]:'["A"]'}),s);
 let failed=false; const base=s.setItem.bind(s); s.setItem=(k,v)=>{if(k===K[2]&&!failed){failed=true;throw Error('quota');}base(k,v);};
 assert.throws(()=>applyRestore(p,s),/quota/); assert.equal(s.getItem(K[0]),' [ ] '); assert.equal(s.getItem(K[2]),null); assert.equal(hasPendingRecovery(s),false);
});
test('journal allocation failure makes no data writes',()=>{
 const s=new Store(); const p=planRestore(file({[K[0]]:raw(hands('A'))}),s); s.setItem=()=>{throw Error('quota');};
 assert.throws(()=>applyRestore(p,s)); assert.equal(s.getItem(K[0]),null);
});
test('interrupted transaction can be explicitly recovered; journal blocks new imports',()=>{
 const s=new Store({[K[0]]:' [] '}); const p=planRestore(file({[K[0]]:raw(hands('A'))}),s);
 s.setItem(RECOVERY_KEY,raw({version:1,before:p.before,after:p.after})); s.setItem(K[0],p.after[K[0]]);
 assert.equal(hasPendingRecovery(s),true); assert.throws(()=>planRestore(file({}),s)); assert.equal(recoverPendingRestore(s),true); assert.equal(s.getItem(K[0]),' [] '); assert.equal(hasPendingRecovery(s),false);
});
test('recovery refuses to overwrite subsequent cross-tab edits and keeps journal',()=>{
 const s=new Store(); const p=planRestore(file({[K[0]]:raw(hands('A'))}),s);
 s.setItem(RECOVERY_KEY,raw({version:1,before:p.before,after:p.after})); s.setItem(K[0],raw(hands('OTHER')));
 assert.throws(()=>recoverPendingRestore(s)); assert.equal(s.getItem(K[0]),raw(hands('OTHER'))); assert.equal(hasPendingRecovery(s),true);
});
test('prototype names remain ordinary data and key ordering does not create conflicts',()=>{
 const s=new Store({[K[0]]:'[{"id":"__proto__","savedAt":"today"}]'});
 const p=planRestore(file({[K[0]]:'[{"savedAt":"today","id":"__proto__"}]',[K[5]]:'{"__proto__":{"totalScore":80}}'}),s); applyRestore(p,s);
 assert.equal(p.stats.handsAdded,0); assert.equal(JSON.parse(s.getItem(K[5])).__proto__.totalScore,80); assert.equal({}.totalScore,undefined);
});
test('blocked storage reads fail instead of returning an empty backup',()=>{
 const s={getItem(){throw Error('SecurityError');}}; assert.throws(()=>createBackup(s)); assert.throws(()=>planRestore(file({}),s));
});
test('failed rollback leaves recoverable journal; retry restores exact bytes',()=>{
 const s=new Store({[K[0]]:' [ ] '}); const p=planRestore(file({[K[0]]:raw(hands('A')),[K[2]]:'["A"]'}),s);
 const base=s.setItem.bind(s); let blocked=false;
 s.setItem=(k,v)=>{if(k===K[2]){blocked=true;throw Error('quota');}if(blocked&&k===K[0])throw Error('security');base(k,v);};
 assert.throws(()=>applyRestore(p,s),/自動復旧/); assert.equal(hasPendingRecovery(s),true);
 s.setItem=base; assert.equal(recoverPendingRestore(s),true); assert.equal(s.getItem(K[0]),' [ ] '); assert.equal(s.getItem(K[2]),null);
});
test('collision with occupied deterministic copy ID never overwrites it',()=>{
 const s=new Store({[K[0]]:raw(hands('A'))}); const imported=file({[K[0]]:raw([{id:'A',custom:'different'}])});
 const first=planRestore(imported,s); const copy=JSON.parse(first.after[K[0]])[1];
 s.setItem(K[0],raw([...hands('A'),{id:copy.id,custom:'occupied'}]));
 const next=planRestore(imported,s); applyRestore(next,s);
 const records=JSON.parse(s.getItem(K[0])); assert.equal(records.length,3); assert.equal(records[1].custom,'occupied'); assert.equal(records[2].id,copy.id+'-1');
 assert.deepEqual(planRestore(imported,s).before,planRestore(imported,s).after);
});
test('review-only import with matching existing hand can preserve conflicting review as a copy',()=>{
 const s=new Store({[K[0]]:raw(hands('A')),[K[5]]:raw({A:review(60)})});
 const incoming=file({[K[5]]:raw({A:review(90)})}); const p=planRestore(incoming,s); applyRestore(p,s);
 assert.equal(p.stats.conflictCopies,1); assert.equal(JSON.parse(s.getItem(K[5])).A.totalScore,60);
 assert.deepEqual(planRestore(incoming,s).before,planRestore(incoming,s).after);
});
test('importance outside the rendered 0–5 integer range is rejected before writes',()=>{
 for (const importance of [-1,6,1e20,1.5]) { const s=new Store(); assert.throws(()=>planRestore(file({[K[0]]:raw([{id:'A',result:{importance}}])}),s)); assert.equal(s.writes.length,0); }
});
test('reviewedAt must be a string when present',()=>{
 const s=new Store(); assert.throws(()=>planRestore(file({[K[5]]:raw({A:{totalScore:80,reviewedAt:{bad:true}}})}),s)); assert.equal(s.writes.length,0);
});
