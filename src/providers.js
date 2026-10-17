import {STUDIO_CONFIG} from './config.js';
import {maskProviderText} from './privacy-mask.js';
/**
 * Public demo transport. Never embeds credentials. BYOK secrets exist in page memory only.
 * Browser BYOK is for disposable sandbox/test keys and fictional data ONLY.
 */
const GATEWAY=STUDIO_CONFIG.demoGateway.origin;
export const providerModels={openai:'gpt-5-mini',gemini:'gemini-2.5-flash'};
export const connectionProbePrompt='Connection probe only. Return only this JSON: {"ok":true}.';
const deadline=30000;
function httpError(status){
 const messages={
  400:'The provider rejected the request. Check the model and fictional input.',
  401:'Credentials or the demo session were rejected. Check the test key or start a new generation for a fresh session.',
  403:'Access was denied. Check provider permissions and demo-origin restrictions.',
  404:'The endpoint or model is unavailable. Check provider settings.',
  408:'The provider timed out. Retry explicitly or select Offline Mock.',
  413:'The input is too large. Reduce the fictional evidence before retrying.',
  422:'The provider rejected the request format. Check the model and input.',
  429:'The rate limit or quota was reached. Wait before retrying or check the test account quota.',
  504:'The provider timed out. Retry explicitly or select Offline Mock.'
 };
 const safeStatus=Number.isInteger(status)&&status>=100&&status<=599?status:null;
 const message=messages[safeStatus]||(safeStatus>=500?'The provider is temporarily unavailable. Retry later or select Offline Mock.':'The provider rejected the request. Check provider settings before retrying.');
 return new Error(`${safeStatus?`HTTP ${safeStatus}: `:""}${message}`);
}
async function postJson(url,headers,body,fetchImpl=globalThis.fetch){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),deadline);
 try {
  let res;
  try {
   res=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
  }catch{
   if(controller.signal.aborted)throw new Error('AI request timed out (30 seconds). Retry explicitly or select Offline Mock.');
   throw new Error('AI request could not reach the provider. Check the network and browser CORS restrictions, or select Offline Mock.');
  }
  // Never read or display error bodies: a server can echo credentials or prompt data.
  if(!res.ok)throw httpError(res.status);
  let raw;
  try{raw=await res.text()}catch{
   if(controller.signal.aborted)throw new Error('AI request timed out (30 seconds). Retry explicitly or select Offline Mock.');
   throw new Error('The provider response could not be read. Retry explicitly or select Offline Mock.');
  }
  let data;
  try{data=JSON.parse(raw)}catch{throw new Error('The provider returned invalid JSON. Retry explicitly or select Offline Mock.')}
  if(!isRecord(data))throw invalidEnvelope();
  return data;
 }finally{clearTimeout(timer)}
}
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const invalidEnvelope=()=>new Error('The provider returned an invalid response structure. Retry explicitly or select another provider.');
const noVisibleText=()=>new Error('The provider returned no visible text. Retry explicitly or select Offline Mock.');
function getResponseText(data){
 const chunks=[];
 if(Object.hasOwn(data,'output_text')&&typeof data.output_text!=='string')throw invalidEnvelope();
 if(Object.hasOwn(data,'output')){
  if(!Array.isArray(data.output))throw invalidEnvelope();
  for(const block of data.output){
   if(!isRecord(block))throw invalidEnvelope();
   if(!Object.hasOwn(block,'content'))continue;
   if(!Array.isArray(block.content))throw invalidEnvelope();
   for(const piece of block.content){
    if(!isRecord(piece)||(Object.hasOwn(piece,'text')&&typeof piece.text!=='string'))throw invalidEnvelope();
    if(typeof piece.text==='string')chunks.push(piece.text);
   }
  }
 }
 const text=data.output_text?.trim()?data.output_text:chunks.join('\n');
 if(typeof text!=='string'||!text.trim())throw noVisibleText();
 return text;
}
function getGeminiText(data){
 if(!Array.isArray(data.candidates))throw invalidEnvelope();
 const chunks=[];
 for(const candidate of data.candidates){
  if(!isRecord(candidate)||!isRecord(candidate.content)||!Array.isArray(candidate.content.parts))throw invalidEnvelope();
  for(const part of candidate.content.parts){
   if(!isRecord(part)||(Object.hasOwn(part,'text')&&typeof part.text!=='string'))throw invalidEnvelope();
   if(typeof part.text==='string')chunks.push(part.text);
  }
 }
 const text=chunks.join('\n');
 if(!text.trim())throw noVisibleText();
 return text;
}
export async function requestProviderText({provider,key,model,prompt,fetchImpl=globalThis.fetch}){
 // A final pattern scan also protects callers without a child-record context.
 const safePrompt=maskProviderText(prompt);
 let raw;
 switch(provider){
  case 'gateway': {
   // Existing personal public-demo gateway: short-lived browser session, no bundled API key.
   const session=await postJson(`${GATEWAY}/demo/session`,{}, {project_id:STUDIO_CONFIG.demoGateway.projectId},fetchImpl);
   const token=session.token;
   if(typeof token!=='string'||!token.trim())throw new Error('Gateway session returned no usable token. Verify the demo-session API schema.');
   const result=await postJson(`${GATEWAY}/demo/v1/responses`,{Authorization:`Bearer ${token}`},{model:STUDIO_CONFIG.demoGateway.modelId,input:[{role:'user',content:[{type:'input_text',text:safePrompt}]}],stream:false},fetchImpl);
   raw=getResponseText(result);break;
  }
  case 'openai': {
   if(!key)throw new Error('Enter an OpenAI test API key in Provider settings.');
   const result=await postJson('https://api.openai.com/v1/responses',{Authorization:`Bearer ${key}`},{model:model||providerModels.openai,input:[{role:'user',content:[{type:'input_text',text:safePrompt}]}],store:false},fetchImpl);
   raw=getResponseText(result);break;
  }
  case 'gemini': {
   if(!key)throw new Error('Enter a Gemini test API key in Provider settings.');
   const chosen=model||providerModels.gemini;
   if(!/^[a-z0-9][a-z0-9._-]{0,100}$/i.test(chosen))throw new Error('Invalid Gemini model name.');
   const result=await postJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosen)}:generateContent`,{'x-goog-api-key':key},{contents:[{role:'user',parts:[{text:safePrompt}]}],generationConfig:{responseMimeType:'application/json'}},fetchImpl);
   raw=getGeminiText(result);break;
  }
  default:throw new Error('Unsupported provider. Select a provider from settings.');
 }
 return raw;
}

export async function probeProviderConnection({ provider, key = '', fetchImpl = globalThis.fetch }) {
  if (provider === 'mock') return;
  if (provider === 'gateway') {
    const session = await postJson(`${GATEWAY}/demo/session`, {},
      { project_id: STUDIO_CONFIG.demoGateway.projectId }, fetchImpl);
    if (typeof session.token !== 'string' || !session.token.trim()) {
      throw new Error('Gateway session returned no usable token.');
    }
    return;
  }
  await requestProviderText({ provider, key, fetchImpl,
    prompt: connectionProbePrompt });
}
