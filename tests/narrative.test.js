import test from "node:test";
import assert from "node:assert/strict";
import {DOMAINS,RATINGS,emptyRecord,narrativeInputFor} from "../src/portfolio-model.js";
import {mockNarrative,buildNarrativePrompt,validateNarrativeText} from "../src/narrative.js";
import {CHILDREN,seedRecords} from "../src/portfolio-seed.js";

const input=(rating=2,extra={})=>({label:"English",rating,ratingLabel:RATINGS[rating-1]?.label,comment:"  Shared a story exactly as recorded.\nTeacher's own words.  ",...extra});
const noEvidence="No evidence recorded yet - teacher to add a rating and comment.";

test("mock narratives use only a rating template and the verbatim comment",()=>{
  const texts=RATINGS.map(({value,label})=>{
    const source=input(value,{name:"SECRET",photos:[{src:"secret-pixels"}],photoCount:3});
    const result=mockNarrative(source);
    assert.equal(result.source,"mock"); assert.equal(result.edited,false);
    assert.ok(result.text.startsWith(`${label}. `)); assert.ok(result.text.endsWith(source.comment));
    assert.ok(!result.text.includes("SECRET")); assert.ok(!result.text.includes("secret-pixels"));
    assert.ok(!result.text.includes("Rating moved"));
    return result.text;
  });
  assert.equal(new Set(texts).size,4);
});

test("Chinese has four distinct Chinese rating templates and preserves comments",()=>{
  const texts=RATINGS.map(({value,label})=>{
    const comment="能说出老师记录的词语。";
    const result=mockNarrative(input(value,{label:"Chinese",comment}));
    assert.ok(result.text.startsWith(`${label}. `)); assert.ok(/[\p{Script=Han}]/u.test(result.text.slice(label.length+2,-comment.length)));
    assert.ok(result.text.endsWith(comment)); return result.text;
  });
  assert.equal(new Set(texts).size,4);
});

test("mock templates stay neutral for every seed child, domain and semester",()=>{
  const forbidden=/\b(?:he|she|him|her|his|hers|himself|herself|boy|girl)\b|[他她]|男孩|女孩/i;
  const records=seedRecords();
  assert.equal(CHILDREN.length,20);
  for(const child of CHILDREN){
    for(const semester of ["2026-S1","2026-S2"]){
      const record=structuredClone(records.find(item=>item.childId===child.id&&item.semester===semester));
      const previous=semester==="2026-S2"
        ? records.find(item=>item.childId===child.id&&item.semester==="2026-S1") : null;
      for(const {id} of DOMAINS){
        // Supply neutral evidence even for unstarted domains to exercise every template.
        record.domains[id].rating??=2;
        record.domains[id].comment=id==="chinese"?"愿意分享想法。":"Shares ideas with a peer.";
      }
      const source=narrativeInputFor(child,record,previous);
      for(const {id} of DOMAINS){
        const result=mockNarrative(source.domains[id]);
        assert.doesNotMatch(result.text,forbidden,`${child.id} ${semester} ${id}`);
        assert.ok(result.text.includes(record.domains[id].comment));
      }
    }
  }
});

test("mock narratives preserve gendered teacher comments verbatim",()=>{
  for(const [label,comment] of [
    ["English","  She shares her ideas. He listens.\n"],
    ["Chinese","  她分享想法。他认真听。\n"]
  ]){
    assert.ok(mockNarrative(input(2,{label,comment})).text.endsWith(comment));
  }
});

test("missing or partial evidence gets the exact teacher action message",()=>{
  for(const domain of [undefined,{},input(2,{noEvidence:true}),input(null),input(0),input(5),input(1.5),input(2,{comment:" \n "}),input(2,{comment:null})]){
    assert.deepEqual(mockNarrative(domain),{text:noEvidence,source:"mock",edited:false});
  }
});

test("rating changes include exact labels in either direction only when both exist",()=>{
  for(const [previous,current] of [[1,4],[4,1],[2,3],[3,2]]){
    const expected=`Rating moved from ${RATINGS[previous-1].label} to ${RATINGS[current-1].label} since Semester 1.`;
    assert.ok(mockNarrative(input(current),{previousRating:previous}).text.endsWith(expected));
    assert.ok(mockNarrative(input(current,{previousRating:previous})).text.endsWith(expected));
  }
  for(const previousRating of [null,undefined,0,5,1.5,2]) assert.ok(!mockNarrative(input(),{previousRating}).text.includes("Rating moved"));
  assert.ok(!mockNarrative(input(2,{previousRating:1}),{previousRating:null}).text.includes("Rating moved"));
});

test("prompt sends only first name and allowed domain evidence, never surname or photo metadata",()=>{
  const record=emptyRecord("SECRET-ID","2026-S2");
  for(const {id} of DOMAINS) record.domains[id]={rating:2,comment:"Recorded evidence.",photos:[{id:"PHOTO-ID",alt:"PHOTO-ALT",src:"data:image/png,PHOTO-PIXELS"}]};
  const childInput=narrativeInputFor({id:"SECRET-ID",name:"SECRET-FIRST SECRET-LAST"},record,null);
  childInput.name="SECRET-NAME"; childInput.domains.extra={comment:"SECRET-EXTRA"};
  childInput.domains.english.photos=record.domains.english.photos;
  const original=JSON.stringify(childInput), prompt=buildNarrativePrompt(childInput);
  for(const secret of ["SECRET-ID","SECRET-LAST","SECRET-NAME","SECRET-EXTRA","PHOTO-ID","PHOTO-ALT","PHOTO-PIXELS","photoCount","data:image/"]) assert.ok(!prompt.includes(secret),secret);
  const evidence=JSON.parse(prompt.split("Evidence:\n")[1]);
  assert.equal(evidence.firstName,"SECRET-FIRST");
  assert.deepEqual(Object.keys(evidence.domains),DOMAINS.map(domain=>domain.id));
  assert.equal(evidence.domains.english.comment,"Recorded evidence.");
  assert.equal(evidence.domains.english.ratingLabel,"Developing");
  assert.equal(JSON.stringify(childInput),original);
});

test("prompt preserves no-evidence and previous rating without inventing missing input",()=>{
  const prompt=buildNarrativePrompt({domains:{english:{rating:3,comment:"Observed.",previousRating:2},chinese:{noEvidence:true}}});
  const evidence=JSON.parse(prompt.split("Evidence:\n")[1]).domains;
  assert.equal(evidence.english.previousRating,2); assert.equal(evidence.chinese.noEvidence,true);
  assert.equal(evidence.mathematics.ratingLabel,null); assert.equal(evidence.mathematics.comment,""); assert.ok(prompt.includes(noEvidence));
});

test("narrative validation trims and accepts precisely the inclusive length limit",()=>{
  assert.equal(validateNarrativeText(" \n Draft. \t"),"Draft.");
  assert.equal(validateNarrativeText(`  ${"x".repeat(2000)} \n`).length,2000);
  for(const value of [null,undefined,42,{},""," \n\t "]) assert.throws(()=>validateNarrativeText(value),/nonempty/);
  assert.throws(()=>validateNarrativeText("x".repeat(2001)),/2000/);
});
