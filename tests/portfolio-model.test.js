import test from "node:test";
import assert from "node:assert/strict";
import {DOMAINS,RATINGS,semesterId,semesterOfDate,parseSemester,previousSemesterId,emptyRecord,validateRecord,domainState,recordProgress,computeStatus,classProgress,adjacentChildId,nextChildNeedingWork,progressComparison,narrativeInputFor} from "../src/portfolio-model.js";
const fresh=()=>emptyRecord("C-01","2026-S2");
function ready(){ const r=fresh(); for(const d of DOMAINS) r.domains[d.id]={rating:2,comment:"Shared a story.",photos:[]}; return r; }
function drafted(){ const r=ready(); for(const d of DOMAINS) r.narratives[d.id]={text:"Fictional draft.",source:"mock",edited:false}; return r; }
test("fixed domain and rating definitions are immutable",()=>{
  assert.deepEqual(DOMAINS.map(d=>d.id),["english","chinese","mathematics","social-emotional"]);
  assert.deepEqual(RATINGS.map(r=>r.label),["Emerging","Developing","Secure","Extending"]);
  assert.ok(Object.isFrozen(DOMAINS) && Object.isFrozen(DOMAINS[0]) && Object.isFrozen(RATINGS) && Object.isFrozen(RATINGS[0]));
});
test("semester boundaries and strict calendar validation",()=>{
  for(const [date,id] of [["2026-06-30","2026-S1"],["2026-07-01","2026-S2"],["2026-12-31","2026-S2"],["2027-01-01","2027-S1"],["2024-02-29","2024-S1"]]) assert.equal(semesterOfDate(date),id);
  assert.equal(semesterId(2026,1),"2026-S1"); assert.deepEqual(parseSemester("2026-S2"),{year:2026,half:2});
  assert.equal(previousSemesterId("2026-S2"),"2026-S1"); assert.equal(previousSemesterId("2026-S1"),null);
  for(const date of ["2026-02-29","2026-04-31","bad","2026-13-01"]) assert.throws(()=>semesterOfDate(date),/date/i);
  for(const id of ["2026-S3","26-S1",null]) assert.throws(()=>parseSemester(id),/semester/i);
  assert.throws(()=>semesterId(2026,3)); assert.throws(()=>semesterId(26,1));
});
test("validation rejects each malformed record field",()=>{
  const cases=[
    [r=>delete r.domains.english,/domain keys/], [r=>r.domains.extra={},/domain keys/],
    [r=>delete r.narratives.english,/domain keys/], [r=>r.narratives.extra=null,/domain keys/],
    ...[undefined,0,5,1.5,"2",NaN].map(v=>[r=>r.domains.english.rating=v,/rating/]),
    ...[null,4,"x".repeat(1001)].map(v=>[r=>r.domains.english.comment=v,/comment/]),
    [r=>r.domains.english.photos={},/photos/],
    [r=>r.domains.english.photos=Array(7).fill({id:"p",alt:"Shape",src:"data:image/svg+xml,a"}),/photos/],
    ...[{alt:"Shape",src:"data:image/png,a"},{id:"",alt:"Shape",src:"data:image/png,a"},{id:"p",src:"data:image/png,a"},{id:"p",alt:"  ",src:"data:image/png,a"},{id:"p",alt:"Shape",src:"https://example.invalid/a"}].map(p=>[r=>r.domains.english.photos=[p],/photo/]),
    ...[undefined,"draft",{}, {text:"x".repeat(2001),source:"ai",edited:false},{text:4,source:"ai",edited:false},{text:"x",source:"other",edited:false},{text:"x",source:"ai",edited:"yes"}].map(n=>[r=>r.narratives.english=n,/narrative/]),
    [r=>r.childId="",/Child/], [r=>r.semester="bad",/semester/], [r=>r.reviewed="yes",/Reviewed/]
  ];
  for(const [mutate,pattern] of cases){ const r=fresh(); mutate(r); assert.throws(()=>validateRecord(r),pattern); }
  assert.throws(()=>validateRecord(null),/Record/);
});
test("normalization copies nested inputs and accepts inclusive limits",()=>{
  const r=ready(); r.domains.english.comment="x".repeat(1000);
  r.domains.english.photos=Array.from({length:6},(_,i)=>({id:String(i),alt:"Shape",src:"data:image/svg+xml,a"}));
  r.narratives.english={text:"x".repeat(2000),source:"teacher",edited:true};
  const copy=validateRecord(r); copy.domains.english.photos[0].alt="Changed"; copy.narratives.english.text="Changed";
  assert.equal(r.domains.english.photos[0].alt,"Shape"); assert.equal(r.narratives.english.text.length,2000);
});
test("status transitions derive from evidence, photos and narratives",()=>{
  const r=fresh(); assert.equal(computeStatus(r),"not-started");
  r.domains.english.comment="   "; assert.equal(domainState(r.domains.english),"empty");
  r.domains.english.photos=[{id:"p",alt:"Shape",src:"data:image/png,a"}]; assert.equal(domainState(r.domains.english),"partial"); assert.equal(computeStatus(r),"in-progress");
  const complete=ready(); assert.deepEqual(recordProgress(complete),{ratedCount:4,commentedCount:4,readyCount:4,narrativeCount:0,total:4,status:"ready-for-draft"});
  complete.narratives.english={text:"Draft",source:"ai",edited:false}; assert.equal(computeStatus(complete),"in-progress");
  const draft=drafted(); assert.equal(computeStatus(draft),"drafted"); draft.reviewed=true; assert.equal(computeStatus(draft),"reviewed");
  draft.narratives.english=null; assert.equal(computeStatus(draft),"in-progress");
});
test("class navigation wraps, skips reviewed and respects semester",()=>{
  const children=[{id:"C-01"},{id:"C-02"},{id:"C-03"}];
  assert.equal(adjacentChildId(children,"C-01","previous"),"C-03"); assert.equal(adjacentChildId(children,"C-03","next"),"C-01"); assert.equal(adjacentChildId([],"x",1),null);
  const records=children.map(c=>({...drafted(),childId:c.id,reviewed:true}));
  assert.equal(nextChildNeedingWork(children,records,"2026-S2","C-01"),null);
  records[2].reviewed=false; assert.equal(nextChildNeedingWork(children,records,"2026-S2","C-01"),"C-03");
  assert.equal(nextChildNeedingWork(children,records,"2026-S1","C-03"),"C-01");
  const progress=classProgress(children,records,"2026-S2"); assert.equal(progress.totals.statuses.reviewed,2); assert.equal(progress.totals.narrativeCount,12); assert.equal(progress.rows[2].status,"drafted");
  assert.equal(classProgress(children,[],"2026-S1").totals.statuses["not-started"],3);
});
test("comparison supports absent evidence and signed changes",()=>{
  const r=ready(); assert.deepEqual(progressComparison(null,r)[0],{domain:"english",previous:null,current:2,change:null});
  const prev=ready(); prev.domains.english.rating=4; assert.equal(progressComparison(prev,r)[0].change,-2);
  r.domains.english.rating=null; assert.equal(progressComparison(prev,r)[0].change,null);
});
test("prompt projection excludes identity and image payloads and flags missing evidence",()=>{
  const r=ready(); r.domains.english.photos=[{id:"secret-id",alt:"secret-alt",src:"data:image/png,secret-pixels"}]; r.domains.chinese.comment="";
  const result=narrativeInputFor({id:"private-id",name:"Aster Fable"},r,null), json=JSON.stringify(result);
  assert.equal(result.firstName,"Aster"); for(const secret of ["Fable","Aster Fable","private-id","secret-id","secret-alt","data:image/","secret-pixels"]) assert.ok(!json.includes(secret));
  assert.equal(result.domains.english.photoCount,1); assert.equal(result.domains.english.ratingLabel,"Developing"); assert.equal(result.domains.chinese.noEvidence,true); assert.equal(result.domains.english.noEvidence,undefined);
});
