import test from "node:test";
import assert from "node:assert/strict";
import {validateImageFile,fitWithin,fileToDataUri} from "../src/photo.js";

const file={type:"image/png",size:100};
const prefix="data:image/jpeg;base64,";
function browser(t,{width=1280,height=960,decodeError=false,noContext=false,encode=()=>`${prefix}YWJj`,drawError=false}={}){
  const descriptors=Object.fromEntries(["Image","document"].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const calls={qualities:[],revoked:[],draws:[],fills:[]};
  const context={fillStyle:"",fillRect:(...args)=>calls.fills.push(args),drawImage:(...args)=>{ if(drawError) throw new Error("Draw failed"); calls.draws.push(args); }};
  const canvas={getContext:type=>{assert.equal(type,"2d"); return noContext?null:context;},toDataURL:(type,quality)=>{assert.equal(type,"image/jpeg"); calls.qualities.push(quality); return encode(quality);}};
  class FakeImage {
    naturalWidth=width; naturalHeight=height;
    set src(value){ assert.equal(value,"blob:test-photo"); queueMicrotask(()=>decodeError?this.onerror():this.onload()); }
  }
  Object.defineProperty(globalThis,"Image",{value:FakeImage,configurable:true,writable:true});
  Object.defineProperty(globalThis,"document",{value:{createElement:tag=>{assert.equal(tag,"canvas"); return canvas;}},configurable:true,writable:true});
  t.mock.method(URL,"createObjectURL",value=>{assert.equal(value,file); return "blob:test-photo";});
  t.mock.method(URL,"revokeObjectURL",value=>calls.revoked.push(value));
  t.after(()=>{for(const [key,descriptor] of Object.entries(descriptors)){if(descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key];}});
  return {calls,canvas,context};
}

test("image validation permits only the three MIME types at the inclusive 8 MB boundary",()=>{
  for(const type of ["image/png","image/jpeg","image/webp"]){
    for(const size of [1,8*1024*1024]){const candidate={type,size}; assert.equal(validateImageFile(candidate),candidate);}
  }
  for(const type of ["image/gif","image/svg+xml","image/jpg","text/plain","",undefined]) assert.throws(()=>validateImageFile({type,size:1}),/PNG, JPEG, or WebP/);
  for(const size of [0,-1,8*1024*1024+1,Infinity,NaN,undefined,"100"]) assert.throws(()=>validateImageFile({type:"image/png",size}),/8 MB/);
  assert.throws(()=>validateImageFile(null),/PNG/);
});

test("fitWithin keeps aspect ratio within rounding, caps both orientations and never upscales",()=>{
  for(const [width,height,expected] of [[1280,960,{width:640,height:480}],[960,1280,{width:480,height:640}],[640,640,{width:640,height:640}],[320,240,{width:320,height:240}],[1,1,{width:1,height:1}],[2000,1,{width:640,height:1}],[1001,500,{width:640,height:319}]]) assert.deepEqual(fitWithin(width,height),expected);
  assert.deepEqual(fitWithin(1000,500,200),{width:200,height:100});
  for(const value of [0,-1,NaN,Infinity,undefined,"640"]){
    assert.throws(()=>fitWithin(value,100),/positive/); assert.throws(()=>fitWithin(100,value),/positive/); assert.throws(()=>fitWithin(100,100,value===undefined?NaN:value),/positive/);
  }
});

test("browser conversion renders bounded JPEG on white at initial quality .72",async t=>{
  const {calls,canvas,context}=browser(t);
  assert.equal(await fileToDataUri(file),`${prefix}YWJj`);
  assert.equal(canvas.width,640); assert.equal(canvas.height,480); assert.equal(context.fillStyle,"#ffffff");
  assert.deepEqual(calls.fills,[[0,0,640,480]]); assert.deepEqual(calls.draws[0].slice(1),[0,0,640,480]);
  assert.deepEqual(calls.qualities,[.72]); assert.deepEqual(calls.revoked,["blob:test-photo"]);
});

test("small photos remain native size and exactly 300 KB encoded URI is accepted",async t=>{
  const uri=prefix+"A".repeat(300*1024-prefix.length);
  const {canvas,calls}=browser(t,{width:40,height:30,encode:()=>uri});
  assert.equal(await fileToDataUri(file),uri); assert.equal(canvas.width,40); assert.equal(canvas.height,30); assert.deepEqual(calls.qualities,[.72]);
});

test("oversized encoding decreases quality until the storage limit is met",async t=>{
  const {calls}=browser(t,{encode:quality=>quality>.42?prefix+"A".repeat(300*1024):`${prefix}YWJj`});
  assert.equal(await fileToDataUri(file),`${prefix}YWJj`); assert.deepEqual(calls.qualities,[.72,.62,.52,.42]);
});

test("incompressible images fail clearly after bounded decreasing quality attempts",async t=>{
  const {calls}=browser(t,{encode:()=>prefix+"A".repeat(300*1024)});
  await assert.rejects(fileToDataUri(file),/compress.*300 KB/);
  assert.deepEqual(calls.qualities,[.72,.62,.52,.42,.32,.22,.12,.1]); assert.deepEqual(calls.revoked,["blob:test-photo"]);
});

for(const [name,options,pattern] of [
  ["decode failure",{decodeError:true},/decode/],
  ["invalid decoded dimensions",{width:0},/dimensions/],
  ["missing canvas context",{noContext:true},/canvas context/],
  ["unsupported JPEG encoder",{encode:()=>"data:image/png;base64,YWJj"},/encode.*JPEG/],
  ["drawing failure",{drawError:true},/Draw failed/],
  ["encoder exception",{encode:()=>{throw new Error("Encoding failed");}},/Encoding failed/]
]) test(`conversion revokes temporary URL after ${name}`,async t=>{
  const {calls}=browser(t,options); await assert.rejects(fileToDataUri(file),pattern); assert.deepEqual(calls.revoked,["blob:test-photo"]);
});

test("invalid files fail before browser decoding",async()=>{
  await assert.rejects(fileToDataUri({type:"image/gif",size:100}),/PNG/);
});
