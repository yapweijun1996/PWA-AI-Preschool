import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyRecord,validateRecord} from '../src/portfolio-model.js';
import {createStore} from '../src/portfolio-store.js';

const KEY='ai-preschool-portfolios-v2';
const PHOTO='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jOvQAAAAASUVORK5CYII=';

function memoryStorage(){
 const values=new Map();
 return {
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value)),
  removeItem:key=>values.delete(key)
 };
}

function record(childId='fictional-child-1',semester='2026-S1'){
 const value=emptyRecord(childId,semester);
 value.domains.english.rating=2;
 value.domains.english.comment='A fictional learner retells a short story.';
 value.domains.english.photos=[{id:'fictional-photo-1',alt:'A fictional learning illustration.',src:PHOTO}];
 value.narratives.english={text:'A fictional draft for teacher review.',source:'mock',edited:false};
 return validateRecord(value);
}

function envelope(records){
 return JSON.stringify({version:2,savedAt:'2026-10-16T00:00:00.000Z',records});
}

function assertFailure(result,store){
 assert.equal(result.ok,false);
 assert.equal(typeof result.error,'string');
 assert.ok(result.error.length>0);
 assert.equal(store.lastError,result.error);
}

test('construction auto-loads missing storage without creating seeds or writing',()=>{
 const storage=memoryStorage(),store=createStore(storage);
 assert.deepEqual(store.load(),[]);
 assert.equal(store.lastError,null);
 assert.equal(store.get('fictional-child-1','2026-S1'),null);
 assert.equal(storage.getItem(KEY),null);
 const exported=JSON.parse(store.exportJson());
 assert.equal(exported.version,2);
 assert.ok(Number.isFinite(Date.parse(exported.savedAt)));
 assert.deepEqual(exported.records,[]);
});

test('save and construction round-trip a normalized versioned envelope',()=>{
 const storage=memoryStorage(),store=createStore(storage),source=record();
 assert.deepEqual(store.save([source]),{ok:true});
 const persisted=JSON.parse(storage.getItem(KEY));
 assert.equal(persisted.version,2);
 assert.ok(Number.isFinite(Date.parse(persisted.savedAt)));
 assert.deepEqual(persisted.records,[source]);
 const reloaded=createStore(storage);
 assert.equal(reloaded.lastError,null);
 assert.deepEqual(reloaded.get(source.childId,source.semester),source);
 assert.deepEqual(reloaded.load(),[source]);
 assert.deepEqual(JSON.parse(reloaded.exportJson()),persisted);
});

test('custom keys isolate stores and upsert replaces only a matching compound identity',()=>{
 const storage=memoryStorage(),store=createStore(storage,'custom-portfolios');
 const first=record(),second=record('fictional-child-2'),nextSemester=record(first.childId,'2026-S2');
 for(const value of [first,second,nextSemester])assert.deepEqual(store.upsert(value),{ok:true});
 const changed=record();
 changed.domains.english.comment='A revised fictional observation.';
 assert.deepEqual(store.upsert(changed),{ok:true});
 assert.deepEqual(store.load(),[changed,second,nextSemester]);
 assert.deepEqual(store.get(first.childId,first.semester),changed);
 assert.deepEqual(store.get(first.childId,'2026-S2'),nextSemester);
 assert.equal(store.get('unknown','2026-S1'),null);
 assert.equal(storage.getItem(KEY),null);
 assert.deepEqual(createStore(storage).load(),[]);
});

test('reset persists an empty envelope without removing unrelated storage',()=>{
 const storage=memoryStorage(),store=createStore(storage);
 storage.setItem('unrelated','keep');
 assert.deepEqual(store.upsert(record()),{ok:true});
 assert.deepEqual(store.reset(),{ok:true});
 assert.deepEqual(store.load(),[]);
 assert.deepEqual(JSON.parse(storage.getItem(KEY)).records,[]);
 assert.equal(JSON.parse(storage.getItem(KEY)).version,2);
 assert.equal(storage.getItem('unrelated'),'keep');
 assert.deepEqual(createStore(storage).load(),[]);
});

test('corrupt JSON, unsupported versions and malformed envelopes are empty and reported',()=>{
 const invalidRecord=record();
 delete invalidRecord.domains.english;
 const cases=[
  '{broken',
  'null',
  '[]',
  JSON.stringify({version:1,savedAt:'2026-10-16T00:00:00.000Z',records:[record()]}),
  JSON.stringify({version:3,savedAt:'2026-10-16T00:00:00.000Z',records:[]}),
  JSON.stringify({version:'2',savedAt:'2026-10-16T00:00:00.000Z',records:[]}),
  JSON.stringify({version:2,records:[]}),
  JSON.stringify({version:2,savedAt:'invalid',records:[]}),
  JSON.stringify({version:2,savedAt:'2026-10-16T00:00:00.000Z',records:{}}),
  envelope([record(),invalidRecord])
 ];
 for(const text of cases){
  const storage=memoryStorage();
  storage.setItem(KEY,text);
  const store=createStore(storage);
  assert.equal(typeof store.lastError,'string');
  assert.deepEqual(JSON.parse(store.exportJson()).records,[]);
  assert.deepEqual(store.load(),[]);
  assert.ok(store.lastError);
  assert.equal(storage.getItem(KEY),text);
 }
});

test('explicit reload clears stale memory after corruption and recovers on valid data',()=>{
 const storage=memoryStorage(),store=createStore(storage),source=record();
 store.save([source]);
 storage.setItem(KEY,'not JSON');
 assert.deepEqual(store.load(),[]);
 assert.equal(store.get(source.childId,source.semester),null);
 assert.ok(store.lastError);
 storage.setItem(KEY,envelope([source]));
 assert.deepEqual(store.load(),[source]);
 assert.equal(store.lastError,null);
 storage.removeItem(KEY);
 assert.deepEqual(store.load(),[]);
 assert.equal(store.lastError,null);
});

test('null, undefined and incomplete storage are handled without throwing',()=>{
 for(const storage of [null,undefined,{}, {getItem:()=>null}]){
  const store=createStore(storage);
  assert.deepEqual(store.load(),[]);
  if(!storage||!storage.getItem)assert.ok(store.lastError);
  assertFailure(store.save([record()]),store);
  assertFailure(store.upsert(record()),store);
  assertFailure(store.reset(),store);
  assertFailure(store.importJson(envelope([record()])),store);
  assert.deepEqual(JSON.parse(store.exportJson()).records,[]);
 }
});

test('throwing storage reads and property access are caught',()=>{
 for(const storage of [
  {getItem(){throw new Error('Storage access denied.')}},
  {get getItem(){throw new Error('Storage getter access denied.')}}
 ]){
  const store=createStore(storage);
  assert.ok(store.lastError.includes('denied'));
  assert.deepEqual(store.load(),[]);
  assert.ok(store.lastError.includes('denied'));
 }
});

test('failed persistence leaves records and savedAt unchanged for every mutation',()=>{
 const storage=memoryStorage(),store=createStore(storage),source=record();
 store.save([source]);
 const before=store.exportJson(),persisted=storage.getItem(KEY),setItem=storage.setItem;
 storage.setItem=()=>{throw new Error('QuotaExceededError: storage is full.');};
 for(const mutate of [
  ()=>store.save([record('replacement')]),
  ()=>store.upsert(record('addition')),
  ()=>store.upsert({...record(),reviewed:true}),
  ()=>store.reset(),
  ()=>store.importJson(envelope([record('imported')]))
 ]){
  assertFailure(mutate(),store);
  assert.match(store.lastError,/QuotaExceededError/);
  assert.equal(store.exportJson(),before);
  assert.equal(storage.getItem(KEY),persisted);
 }
 storage.setItem=setItem;
 assert.deepEqual(store.upsert(record('addition')),{ok:true});
 assert.equal(store.lastError,null);
 assert.equal(JSON.parse(store.exportJson()).records.length,2);
});

test('write property access failures are caught before committing memory',()=>{
 const storage={getItem:()=>null,get setItem(){throw new Error('Writes denied.')}};
 const store=createStore(storage),before=store.exportJson();
 assertFailure(store.save([record()]),store);
 assert.match(store.lastError,/Writes denied/);
 assert.equal(store.exportJson(),before);
});

test('save and upsert reject invalid records without changing persisted or in-memory data',()=>{
 const storage=memoryStorage(),store=createStore(storage),source=record();
 store.save([source]);
 const before=store.exportJson(),persisted=storage.getItem(KEY),invalid=record('invalid');
 invalid.domains.english.rating=5;
 for(const values of [null,{},[source,invalid],[source,source]]){
  assertFailure(store.save(values),store);
  assert.equal(store.exportJson(),before);
  assert.equal(storage.getItem(KEY),persisted);
 }
 assertFailure(store.upsert(invalid),store);
 assert.equal(store.exportJson(),before);
 assert.equal(storage.getItem(KEY),persisted);
});

test('imports validate the entire envelope atomically before replacing existing records',()=>{
 const storage=memoryStorage(),store=createStore(storage),source=record();
 store.save([source]);
 const before=store.exportJson(),persisted=storage.getItem(KEY),invalid=record('invalid');
 delete invalid.narratives.chinese;
 for(const text of [
  '{broken',
  JSON.stringify({version:1,savedAt:'2026-10-16T00:00:00.000Z',records:[]}),
  envelope([record('valid-new-child'),invalid]),
  envelope([record('duplicate'),record('duplicate')])
 ]){
  assertFailure(store.importJson(text),store);
  assert.equal(store.exportJson(),before);
  assert.equal(storage.getItem(KEY),persisted);
 }
 const replacement=record('replacement');
 assert.deepEqual(store.importJson(envelope([replacement])),{ok:true});
 assert.equal(store.lastError,null);
 assert.equal(store.get(source.childId,source.semester),null);
 assert.deepEqual(store.get(replacement.childId,replacement.semester),replacement);
 assert.deepEqual(createStore(storage).load(),[replacement]);
 assert.deepEqual(store.importJson(envelope([])),{ok:true});
 assert.deepEqual(store.load(),[]);
});

test('inputs and returned nested records cannot mutate store state',()=>{
 const storage=memoryStorage(),store=createStore(storage),input=record();
 const expected=validateRecord(input),array=[input];
 store.save(array);
 array.push(record('external'));
 input.domains.english.comment='External mutation.';
 input.domains.english.photos[0].alt='External photo mutation.';
 input.narratives.english.text='External narrative mutation.';
 assert.deepEqual(store.get(expected.childId,expected.semester),expected);
 const fetched=store.get(expected.childId,expected.semester);
 fetched.domains.english.photos[0].src='data:image/png;base64,changed';
 fetched.narratives.english.edited=true;
 assert.deepEqual(store.get(expected.childId,expected.semester),expected);
 const loaded=store.load();
 loaded[0].domains.english.photos.length=0;
 loaded[0].narratives.english.text='Changed load result.';
 loaded.length=0;
 assert.deepEqual(store.get(expected.childId,expected.semester),expected);
 const upserted=record('upserted');
 const expectedUpsert=validateRecord(upserted);
 store.upsert(upserted);
 upserted.domains.english.photos[0].id='changed-id';
 upserted.narratives.english.text='Changed upsert input.';
 assert.deepEqual(store.get(expectedUpsert.childId,expectedUpsert.semester),expectedUpsert);
 const exported=JSON.parse(store.exportJson());
 exported.records[0].domains.english.comment='Changed parsed export.';
 assert.deepEqual(store.get(expected.childId,expected.semester),expected);
});
