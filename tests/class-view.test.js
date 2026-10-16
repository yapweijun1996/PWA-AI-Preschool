import test from "node:test";
import assert from "node:assert/strict";
import {readFile, readdir} from "node:fs/promises";
import {DOMAINS, emptyRecord, classProgress} from "../src/portfolio-model.js";
import {filterChildren, domainDot, classSummary, routeParse, routeBuild} from "../src/class-view.js";

const semester = "2026-S2";
const children = [
  {id:"empty", name:"Aster Fable"}, {id:"partial", name:"林小雨"},
  {id:"ready", name:"MILO Reed"}, {id:"draft", name:"Mina Vale"},
  {id:"review", name:"Juniper Cove"}
];
function fixture() {
  const records = children.slice(1).map(child => emptyRecord(child.id, semester));
  records[0].domains.english.comment = "Shared a story.";
  for (const record of records.slice(1)) {
    for (const {id} of DOMAINS) record.domains[id] = {rating:3, comment:"Fictional observation.", photos:[]};
  }
  for (const record of records.slice(2)) {
    for (const {id} of DOMAINS) record.narratives[id] = {text:"Fictional narrative.", source:"mock", edited:false};
  }
  records[3].reviewed = true;
  return records;
}
const ids = rows => rows.map(child => child.id);

test("filters derive progress, retain roster order and do not mutate inputs", () => {
  const records = fixture(), before = JSON.stringify({children, records});
  assert.deepEqual(ids(filterChildren(children, records, semester)), ids(children));
  assert.deepEqual(ids(filterChildren(children, records, semester, {filter:"needs-work"})), ["empty","partial","ready","draft"]);
  for (const [filter, expected] of [["ready-for-draft","ready"],["drafted","draft"],["reviewed","review"]]) {
    assert.deepEqual(ids(filterChildren(children, records, semester, {filter})), [expected]);
  }
  assert.deepEqual(filterChildren(children, records, semester, {filter:"unknown"}), []);
  assert.deepEqual(filterChildren([], records, semester), []);
  assert.equal(JSON.stringify({children, records}), before);
});

test("search handles case, whitespace, Chinese and combined filters", () => {
  const records = fixture();
  assert.deepEqual(ids(filterChildren(children, records, semester, {query:"  milo  "})), ["ready"]);
  assert.deepEqual(ids(filterChildren(children, records, semester, {query:"小雨"})), ["partial"]);
  assert.deepEqual(ids(filterChildren(children, records, semester, {query:"MIN", filter:"drafted"})), ["draft"]);
  assert.deepEqual(filterChildren(children, records, semester, {query:"Mina", filter:"reviewed"}), []);
  assert.deepEqual(filterChildren(children, records, "2026-S1", {filter:"drafted"}), []);
  assert.deepEqual(ids(filterChildren(children, records, "2026-S1", {filter:"needs-work"})), ids(children));
});

test("domain dots expose evidence state and accessible rating labels", () => {
  const entry = {rating:null, comment:"", photos:[]};
  assert.deepEqual(domainDot(entry), {state:"empty", ratingLabel:"Not rated"});
  entry.photos.push({id:"photo"});
  assert.deepEqual(domainDot(entry), {state:"partial", ratingLabel:"Not rated"});
  for (const [index, label] of ["Emerging","Developing","Secure","Extending"].entries()) {
    entry.rating = index + 1;
    entry.comment = "An observation.";
    assert.deepEqual(domainDot(entry), {state:"ready", ratingLabel:label});
  }
});

test("summary equals model totals and counts missing records and semester isolation", () => {
  const records = fixture();
  assert.deepEqual(classSummary(children, records, semester), classProgress(children, records, semester).totals);
  assert.deepEqual(classSummary(children, records, semester).statuses, {"not-started":1,"in-progress":1,"ready-for-draft":1,drafted:1,reviewed:1});
  assert.equal(classSummary(children, records, "2026-S1").statuses["not-started"], 5);
  assert.equal(classSummary([], records, semester).total, 0);
});

test("canonical routes roundtrip both semesters and encoded child identifiers", () => {
  assert.equal(routeBuild({page:"overview"}), "#/");
  assert.deepEqual(routeParse("#/"), {page:"overview"});
  for (const childId of ["ready", "林 小雨", "a/b?c#d%", "<child>"]) {
    for (const semester of ["2026-S1", "2026-S2"]) {
      const route = {page:"child", childId, semester};
      assert.deepEqual(routeParse(routeBuild(route)), route);
    }
  }
  assert.deepEqual(routeParse("#/child/ready", children), {page:"child", childId:"ready", semester:"2026-S2"});
  assert.equal(routeBuild({page:"child", childId:"ready"}), "#/child/ready?sem=2026-S2");
});

test("invalid routes fail closed and unknown children provide an overview message", () => {
  for (const hash of [null, undefined, 42, "#/overview", "#/child/", "#/child/%ZZ", "#/child/%20", "#/child/ready/extra", "#/child/ready?sem=2027-S1", "#/child/ready?sem=2026-S3", "#/child/ready?semester=2026-S2", "#/child/ready?sem=2026-S2&x=1", "#/child/ready#extra"]) {
    assert.deepEqual(routeParse(hash), {page:"overview"});
  }
  for (const hash of ["", "#", "#/"]) assert.deepEqual(routeParse(hash), {page:"overview"});
  const missing = routeParse("#/child/missing?sem=2026-S1", children);
  assert.equal(missing.page, "overview");
  assert.match(missing.message, /child.*not found/i);
  assert.equal(routeParse("#/child/missing").page, "child");
  assert.equal(routeParse("#/child/ready", []).page, "overview");
  for (const route of [null, {}, {page:"other"}, {page:"child",childId:""}, {page:"child",childId:4}, {page:"child",childId:"ready",semester:"2025-S2"}]) assert.equal(routeBuild(route), "#/");
});

test("class UI sources avoid dynamic HTML, inline code and unsafe evaluation", async () => {
  const sourceDirectory = new URL("../src/", import.meta.url);
  const names = (await readdir(sourceDirectory)).filter(name => /^class-.*\.js$/.test(name));
  assert.ok(names.includes("class-view.js"));
  const files = [new URL("../class.html", import.meta.url), new URL("../class.css", import.meta.url), ...names.map(name => new URL(name, sourceDirectory))];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const forbidden of [/\binnerHTML\b/i, /\binsertAdjacentHTML\b/i, /\bstyle\s*=/i, /\beval\s*\(/i]) assert.doesNotMatch(source, forbidden, file.pathname);
    for (const script of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      assert.match(script[1], /\bsrc\s*=/i, file.pathname);
      assert.equal(script[2].trim(), "", file.pathname);
    }
  }
});
