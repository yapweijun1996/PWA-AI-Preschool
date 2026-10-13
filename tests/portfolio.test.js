import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {students,domains,evidenceFor,mockPortfolio,validatePortfolio,teacherAssignments} from '../src/data.js';
import {parsePortfolio} from '../src/providers.js';

const student=students[0];
const evidence=evidenceFor(student);
const portfolio=()=>mockPortfolio(student,evidence);
const providerPortfolio=()=>{const {generationMode,...result}=portfolio();return result};
const references=text=>[...text.matchAll(/\[([^\]]+)\]/g)].map(match=>match[1]);

test('teacher visibility partitions the fictional roster',()=>{
 const a=new Set(teacherAssignments.jordan),b=new Set(teacherAssignments.lee);
 assert.equal(a.size+b.size,students.length);
 for(const id of a)assert.ok(!b.has(id));
 assert.deepEqual(new Set(teacherAssignments.all),new Set(students.map(x=>x.id)));
});

test('all five deterministic mocks are labelled and cite only their own domain evidence',()=>{
 assert.equal(students.length,5);
 for(const s of students){
  const records=evidenceFor(s),byId=new Map(records.map(x=>[x.id,x]));
  const result=validatePortfolio(mockPortfolio(s,records),records);
  assert.deepEqual(result,mockPortfolio(s,records));
  assert.equal(result.generationMode,'mock');
  assert.match(result.summary,/SIMULATED DRAFT/);
  assert.ok(result.summary.includes(s.name));
  assert.deepEqual(result.evidenceIds,records.map(x=>x.id));
  for(const domain of domains){
   const ids=references(result.domains[domain]);
   assert.ok(ids.length>0);
   for(const id of ids){assert.ok(id.startsWith(`${s.id}-`));assert.equal(byId.get(id).domain,domain)}
  }
  for(const id of references(`${result.summary} ${result.nextSteps}`))assert.ok(byId.has(id));
 }
});

test('unsupported mock domains never borrow another domain citation',()=>{
 const records=evidence.filter(x=>x.domain==='Communication');
 const result=validatePortfolio(mockPortfolio(student,records),records);
 for(const domain of domains.filter(x=>x!=='Communication')){
  assert.deepEqual(references(result.domains[domain]),[]);
 }
});

test('extra evidence is isolated by selected student',()=>{
 const extra=[
  {studentId:student.id,id:'ST-001-EX01',date:'2026-09-30',domain:'Literacy',text:'Fictional reading observation.'},
  {studentId:students[1].id,id:'ST-002-EX01',date:'2026-09-30',domain:'Literacy',text:'Another fictional reading observation.'}
 ];
 const records=evidenceFor(student,extra);
 assert.ok(records.some(x=>x.id==='ST-001-EX01'));
 assert.ok(!records.some(x=>x.id==='ST-002-EX01'));
 validatePortfolio(mockPortfolio(student,records),records);
});

test('missing or nonobject portfolios never receive fallback content',()=>{
 for(const value of [null,undefined,[],[providerPortfolio()],true,1,'portfolio',{}])assert.throws(()=>validatePortfolio(value,evidence));
 for(const field of ['summary','domains','nextSteps','evidenceIds']){
  const value=portfolio();delete value[field];assert.throws(()=>validatePortfolio(value,evidence));
 }
});

test('empty and malformed required sections are rejected',()=>{
 for(const field of ['summary','nextSteps'])for(const value of ['', ' \n\t ',null,[],{},23]){
  const draft=portfolio();draft[field]=value;assert.throws(()=>validatePortfolio(draft,evidence));
 }
 for(const value of [null,[],{},'text']){const draft=portfolio();draft.domains=value;assert.throws(()=>validatePortfolio(draft,evidence))}
 for(const domain of domains){
  const missing=portfolio();delete missing.domains[domain];assert.throws(()=>validatePortfolio(missing,evidence));
  for(const value of ['', ' \t ',null,[],{}]){const draft=portfolio();draft.domains[domain]=value;assert.throws(()=>validatePortfolio(draft,evidence))}
 }
 for(const value of [[],null,{},'ST-001-E01']){const draft=portfolio();draft.evidenceIds=value;assert.throws(()=>validatePortfolio(draft,evidence))}
});

test('unknown fields and invalid local generation labels are rejected',()=>{
 const extra=portfolio();extra.providerDebug='unexpected';assert.throws(()=>validatePortfolio(extra,evidence));
 const extraDomain=portfolio();extraDomain.domains.Physical='unexpected';assert.throws(()=>validatePortfolio(extraDomain,evidence));
 for(const label of ['remote','',null,{},[]]){const draft=portfolio();draft.generationMode=label;assert.throws(()=>validatePortfolio(draft,evidence))}
 const ai=portfolio();ai.generationMode='ai';assert.equal(validatePortfolio(ai,evidence).generationMode,'ai');
 assert.deepEqual(validatePortfolio(providerPortfolio(),evidence),providerPortfolio());
});

test('schema text bounds apply without truncating valid content',()=>{
 for(const field of ['summary','nextSteps']){
  const valid=portfolio();valid[field]='x'.repeat(4000);assert.equal(validatePortfolio(valid,evidence)[field].length,4000);
  valid[field]+='x';assert.throws(()=>validatePortfolio(valid,evidence));
 }
 const valid=portfolio(),suffix=' [ST-001-E01]';
 valid.domains.Communication='x'.repeat(3000-suffix.length)+suffix;
 assert.equal(validatePortfolio(valid,evidence).domains.Communication.length,3000);
 valid.domains.Communication='x'+valid.domains.Communication;assert.throws(()=>validatePortfolio(valid,evidence));
});

test('evidence arrays reject duplicates, unknown, cross-student and invalid IDs',()=>{
 for(const id of [evidence[0].id,'UNKNOWN-ID',evidenceFor(students[1])[0].id,'lowercase-id',null,{},'X'.repeat(81)]){
  const draft=portfolio();draft.evidenceIds.push(id);assert.throws(()=>validatePortfolio(draft,evidence));
 }
 const records=Array.from({length:251},(_,i)=>({id:`ST-001-EX${i}`,domain:'Communication',text:'Fictional observation.',date:'2026-09-30'}));
 const draft=portfolio();draft.evidenceIds=records.map(x=>x.id);assert.throws(()=>validatePortfolio(draft,records),/250/);
});

test('inline references in every section must be known and listed',()=>{
 for(const field of ['summary','nextSteps','Communication'])for(const id of ['UNKNOWN-ID',evidenceFor(students[1])[0].id]){
  const draft=portfolio();if(field==='Communication')draft.domains[field]+=` [${id}]`;else draft[field]+=` [${id}]`;
  assert.throws(()=>validatePortfolio(draft,evidence));
 }
 const unlisted=portfolio();unlisted.evidenceIds=unlisted.evidenceIds.filter(id=>id!=='ST-001-E01');
 assert.throws(()=>validatePortfolio(unlisted,evidence));
});

test('domain cross-mixing and uncited observed domains are rejected',()=>{
 for(const domain of domains){
  const uncited=portfolio();uncited.domains[domain]='A claimed learning moment without a citation.';
  assert.throws(()=>validatePortfolio(uncited,evidence));
  const mixed=portfolio();const wrong=evidence.find(x=>x.domain!==domain);
  mixed.domains[domain]=`A learning moment [${wrong.id}]`;assert.throws(()=>validatePortfolio(mixed,evidence));
 }
});

test('validation leaves the input unchanged and returns detached editable fields',()=>{
 const source=portfolio(),original=structuredClone(source);
 const validated=validatePortfolio(source,evidence);
 validated.summary='Edited';validated.domains.Communication='Edited';validated.evidenceIds.pop();
 assert.deepEqual(source,original);
 const invalid=portfolio();invalid.evidenceIds.push('UNKNOWN-ID');const before=structuredClone(invalid);
 assert.throws(()=>validatePortfolio(invalid,evidence));assert.deepEqual(invalid,before);
});

test('provider JSON accepts a complete fenced portfolio but rejects arrays, prose and metadata',()=>{
 const source=providerPortfolio();
 assert.deepEqual(parsePortfolio(`\`\`\`json\n${JSON.stringify(source)}\n\`\`\``),source);
 for(const value of ['[]','null',JSON.stringify([source]),'{}',`Explanation: ${JSON.stringify(source)}`,JSON.stringify(portfolio())]){
  assert.throws(()=>parsePortfolio(value));
 }
 for(const value of [null,[],{}])assert.throws(()=>parsePortfolio(value));
});

test('published portfolio example passes the strict consumer validator',()=>{
 const sample=JSON.parse(readFileSync(new URL('../examples/portfolio.sample.json',import.meta.url),'utf8'));
 assert.deepEqual(validatePortfolio(sample,evidence),sample);
});
