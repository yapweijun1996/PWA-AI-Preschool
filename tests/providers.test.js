import test from 'node:test';
import assert from 'node:assert/strict';
import {students,evidenceFor,mockPortfolio} from '../src/data.js';
import {generateRemotePortfolio} from '../src/providers.js';
import {STUDIO_CONFIG} from '../src/config.js';

const student=students[0],evidence=evidenceFor(student);
const key='disposable-test-key-marker';
const remoteBody='REMOTE_PRIVATE_BODY_MARKER';
const portfolio=()=>{const {generationMode,...result}=mockPortfolio(student,evidence);return result};
const request=provider=>({provider,key,student,evidence});
const response=(data,status=200)=>({ok:status>=200&&status<300,status,text:async()=>JSON.stringify(data)});
async function withFetch(t,implementation,run){
 const mock=t.mock.method(globalThis,'fetch',implementation);
 try{return await run()}finally{mock.mock.restore()}
}
function safeError(error){
 assert.ok(error instanceof Error);
 assert.ok(error.message.length<300);
 assert.ok(!error.message.includes(key));
 assert.ok(!error.message.includes(remoteBody));
 return true;
}

test('OpenAI BYOK keeps credentials out of the URL and payload',async t=>{
 const expected=portfolio();let calls=0;
 await withFetch(t,async(url,options)=>{
  calls++;
  assert.equal(new URL(url).hostname,'api.openai.com');
  assert.equal(options.headers.Authorization,`Bearer ${key}`);
  assert.ok(!url.includes(key));assert.ok(!options.body.includes(key));
  const body=JSON.parse(options.body);
  assert.equal(body.store,false);
  assert.equal(options.cache,'no-store');
  return response({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(expected)}]}]});
 },async()=>{await generateRemotePortfolio(request('openai'))});
 assert.equal(calls,1);
});

test('Gemini BYOK keeps credentials out of the URL and payload',async t=>{
 const expected=portfolio();
 await withFetch(t,async(url,options)=>{
  assert.equal(new URL(url).hostname,'generativelanguage.googleapis.com');
  assert.equal(options.headers['x-goog-api-key'],key);
  assert.ok(!url.includes(key));assert.ok(!options.body.includes(key));
  return response({candidates:[{content:{parts:[{text:JSON.stringify(expected)}]}}]});
 },async()=>{await generateRemotePortfolio(request('gemini'))});
});

test('each public Gateway generation obtains its own short-lived session without a BYOK key',async t=>{
 let sessions=0,responses=0;
 await withFetch(t,async(url,options)=>{
  assert.ok(url.startsWith(STUDIO_CONFIG.demoGateway.origin));
  assert.ok(!url.includes(key));assert.ok(!options.body.includes(key));
  if(url.endsWith('/demo/session')){
   sessions++;assert.equal(options.headers.Authorization,undefined);
   assert.equal(JSON.parse(options.body).project_id,STUDIO_CONFIG.demoGateway.projectId);
   return response({token:`temporary-session-${sessions}`},201);
  }
  assert.ok(url.endsWith('/demo/v1/responses'));responses++;
  assert.equal(options.headers.Authorization,`Bearer temporary-session-${sessions}`);
  assert.equal(JSON.parse(options.body).model,STUDIO_CONFIG.demoGateway.modelId);
  return response({output_text:JSON.stringify(portfolio())});
 },async()=>{
  await generateRemotePortfolio(request('gateway'));
  await generateRemotePortfolio(request('gateway'));
 });
 assert.equal(sessions,2);assert.equal(responses,2);
});

test('HTTP failures use bounded status guidance without reading or echoing server error bodies',async t=>{
 for(const [status,guidance] of [[400,/request/],[401,/Credentials/],[403,/permissions/],[404,/model/],[408,/timed out/],[413,/too large/],[422,/format/],[429,/quota/],[500,/unavailable/],[502,/unavailable/],[504,/timed out/]]){
  let calls=0,bodyReads=0;
  await withFetch(t,async()=>{
   calls++;
   return {ok:false,status,text:async()=>{bodyReads++;return JSON.stringify({error:{message:`${key} ${remoteBody}`}})}};
  },async()=>assert.rejects(generateRemotePortfolio(request('openai')),error=>{
   safeError(error);assert.match(error.message,new RegExp(`HTTP ${status}:`));assert.match(error.message,guidance);return true;
  }));
  assert.equal(calls,1);assert.equal(bodyReads,0);
 }
});

test('network and response-read failures never propagate arbitrary exception messages',async t=>{
 await withFetch(t,async()=>{throw new Error(`${key} ${remoteBody}`)},async()=>{
  await assert.rejects(generateRemotePortfolio(request('openai')),error=>{safeError(error);assert.match(error.message,/network.*CORS/);return true});
 });
 await withFetch(t,async()=>({ok:true,status:200,text:async()=>{throw new Error(`${key} ${remoteBody}`)}}),async()=>{
  await assert.rejects(generateRemotePortfolio(request('openai')),error=>{safeError(error);assert.match(error.message,/could not be read/);return true});
 });
});

test('timeout aborts the request and reports only actionable local guidance',async t=>{
 let triggerTimeout;
 const timer=t.mock.method(globalThis,'setTimeout',callback=>{triggerTimeout=callback;return 1});
 const clear=t.mock.method(globalThis,'clearTimeout',()=>{});
 try{
  await withFetch(t,async(url,options)=>new Promise((resolve,reject)=>{
   options.signal.addEventListener('abort',()=>reject(new Error(`${key} ${remoteBody}`)),{once:true});
   triggerTimeout();
  }),async()=>assert.rejects(generateRemotePortfolio(request('openai')),error=>{
   safeError(error);assert.match(error.message,/timed out.*Offline Mock/);return true;
  }));
 }finally{timer.mock.restore();clear.mock.restore()}
});

test('invalid JSON and nonobject provider envelopes fail without exposing server content',async t=>{
 for(const envelope of [null,[],[{}],'provider text']){
  await withFetch(t,async()=>response(envelope),async()=>assert.rejects(generateRemotePortfolio(request('openai')),safeError));
 }
 await withFetch(t,async()=>({ok:true,status:200,text:async()=>`${key} ${remoteBody}`}),async()=>{
  await assert.rejects(generateRemotePortfolio(request('openai')),error=>{safeError(error);assert.match(error.message,/invalid JSON/);return true});
 });
});

test('malformed OpenAI output and unsupported response envelopes are rejected safely',async t=>{
 const validText=JSON.stringify(portfolio());
 const envelopes=[
  {},{output_text:null},{output:{}},{output:'text'},{output:[null]},
  {output:[{content:{text:validText}}]},{output:[{content:[null]}]},
  {output:[{content:[{text:{message:`${key} ${remoteBody}`}}]}]},
  {output_text:validText,output:{}},{choices:{}},{choices:[null]},
  {choices:[{message:{content:[validText]}}]},{output:[]}
 ];
 for(const envelope of envelopes){
  await withFetch(t,async()=>response(envelope),async()=>assert.rejects(generateRemotePortfolio(request('openai')),safeError));
 }
});

test('malformed Gemini candidate and part arrays are rejected safely',async t=>{
 for(const envelope of [
  {},{candidates:{}},{candidates:[null]},{candidates:[{content:null}]},
  {candidates:[{content:{parts:{}}}]},{candidates:[{content:{parts:[null]}}]},
  {candidates:[{content:{parts:[{text:{message:`${key} ${remoteBody}`}}]}}]},
  {candidates:[]},{candidates:[{content:{parts:[]}}]}
 ]){
  await withFetch(t,async()=>response(envelope),async()=>assert.rejects(generateRemotePortfolio(request('gemini')),safeError));
 }
});

test('remote portfolios undergo strict consumer validation and cannot set local generation metadata',async t=>{
 const invalid=[portfolio(),portfolio(),portfolio(),portfolio()];
 invalid[0].generationMode='mock';invalid[1].evidenceIds.push('ST-002-E01');
 invalid[2].domains.Communication='An unsupported factual claim without a citation.';
 invalid[3].domains.Numeracy+=' [ST-001-E01]';
 for(const draft of invalid){
  await withFetch(t,async()=>response({output_text:JSON.stringify(draft)}),async()=>assert.rejects(generateRemotePortfolio(request('openai')),safeError));
 }
});

test('Gateway session and generation failures expose neither temporary token nor server body',async t=>{
 let calls=0;
 await withFetch(t,async()=>{calls++;return response({token:[]},201)},async()=>assert.rejects(generateRemotePortfolio(request('gateway')),safeError));
 assert.equal(calls,1);
 calls=0;
 await withFetch(t,async()=>{
  calls++;
  if(calls===1)return response({token:key},201);
  return response({error:{message:`${key} ${remoteBody}`}},401);
 },async()=>assert.rejects(generateRemotePortfolio(request('gateway')),error=>{safeError(error);assert.match(error.message,/HTTP 401/);return true}));
 assert.equal(calls,2);
});

test('missing keys, invalid model names and unsupported providers fail before network access',async t=>{
 let calls=0;
 await withFetch(t,async()=>{calls++;throw new Error('Unexpected request')},async()=>{
  for(const options of [
   {...request('openai'),key:''},{...request('gemini'),key:''},
   {...request('gemini'),model:`bad/model/${key}`},request(`${key} ${remoteBody}`)
  ])await assert.rejects(generateRemotePortfolio(options),safeError);
 });
 assert.equal(calls,0);
});
