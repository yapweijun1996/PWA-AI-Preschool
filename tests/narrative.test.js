import test from "node:test";
import assert from "node:assert/strict";
import {DOMAINS,RATINGS,emptyRecord,narrativeInputFor} from "../src/portfolio-model.js";
import {mockNarrative,buildNarrativePrompt,validateNarrativeText} from "../src/narrative.js";

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

test("prompt allowlists four domains and excludes identity and all photo metadata",()=>{
  const record=emptyRecord("SECRET-ID","2026-S2");
  for(const {id} of DOMAINS) record.domains[id]={rating:2,comment:"Recorded evidence.",photos:[{id:"PHOTO-ID",alt:"PHOTO-ALT",src:"data:image/png,PHOTO-PIXELS"}]};
  const childInput=narrativeInputFor({id:"SECRET-ID",name:"SECRET-FIRST SECRET-LAST"},record,null);
  childInput.name="SECRET-NAME"; childInput.domains.extra={comment:"SECRET-EXTRA"};
  childInput.domains.english.photos=record.domains.english.photos;
  const original=JSON.stringify(childInput), prompt=buildNarrativePrompt(childInput);
  for(const secret of ["SECRET-ID","SECRET-FIRST","SECRET-LAST","SECRET-NAME","SECRET-EXTRA","PHOTO-ID","PHOTO-ALT","PHOTO-PIXELS","photoCount","data:image/"]) assert.ok(!prompt.includes(secret),secret);
  const evidence=JSON.parse(prompt.split("Evidence:\n")[1]);
  assert.deepEqual(Object.keys(evidence),DOMAINS.map(domain=>domain.id));
  assert.equal(evidence.english.comment,"Recorded evidence."); assert.equal(evidence.english.ratingLabel,"Developing");
  assert.match(prompt,/Do not invent/); assert.match(prompt,/warm, neutral/); assert.match(prompt,/short paragraphs/); assert.match(prompt,/exactly these four keys/);
  assert.equal(JSON.stringify(childInput),original);
});

test("prompt preserves no-evidence and previous rating without inventing missing input",()=>{
  const prompt=buildNarrativePrompt({domains:{english:{rating:3,comment:"Observed.",previousRating:2},chinese:{noEvidence:true}}});
  const evidence=JSON.parse(prompt.split("Evidence:\n")[1]);
  assert.equal(evidence.english.previousRating,2); assert.equal(evidence.chinese.noEvidence,true);
  assert.equal(evidence.mathematics.rating,null); assert.equal(evidence.mathematics.comment,""); assert.ok(prompt.includes(noEvidence));
});

test("narrative validation trims and accepts precisely the inclusive length limit",()=>{
  assert.equal(validateNarrativeText(" \n Draft. \t"),"Draft.");
  assert.equal(validateNarrativeText(`  ${"x".repeat(2000)} \n`).length,2000);
  for(const value of [null,undefined,42,{},""," \n\t "]) assert.throws(()=>validateNarrativeText(value),/nonempty/);
  assert.throws(()=>validateNarrativeText("x".repeat(2001)),/2000/);
});
