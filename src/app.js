import {STUDIO_CONFIG} from './config.js';
import {students,domains,teacherAssignments,evidenceFor,mockPortfolio,validatePortfolio,period} from './data.js';
import {providerLabels,providerModels,generateRemotePortfolio} from './providers.js';
import {initPwa} from './pwa.js';

const state={page:'overview',studentId:'ST-001',teacher:'jordan',provider:'gateway',apiKey:'',model:'',extra:[],drafts:new Map(),busy:false};
const byId=id=>document.getElementById(id);
const el=(tag,klass,text)=>{const node=document.createElement(tag);if(klass)node.className=klass;if(text!=null)node.textContent=String(text);return node};
const selected=()=>students.find(s=>s.id===state.studentId)||students[0];
const allowed=()=>teacherAssignments[state.teacher]||[];
const evidence=()=>evidenceFor(selected(),state.extra);
const draft=()=>state.drafts.get(state.studentId);
const shortDate=d=>new Date(`${d}T00:00:00`).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'});
const firstName=s=>s.name.split(' ')[0];
let toastTimer;
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior=()=>motionPreference.matches?'auto':'smooth';
function toast(message){const box=byId('toast');box.textContent=message;box.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.hidden=true,4700)}
function setPage(page){if(page==='settings'){openProvider();return}state.page=page;document.querySelectorAll('.nav-item').forEach(b=>{const active=b.dataset.page===page;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});byId('breadcrumb-current').textContent=({overview:'Overview',students:'Students',portfolio:'AI Portfolio',observations:'Evidence library'})[page];const target=page==='portfolio'?'portfolio-pane':page==='observations'?'evidence-list':page==='students'?'student-list':null;if(target)byId(target).scrollIntoView({behavior:scrollBehavior(),block:'start'});else window.scrollTo({top:0,behavior:scrollBehavior()})}
function avatar(student,extra=''){const span=el('span',`student-avatar ${student.color} ${extra}`,student.initials);return span}
function brandLogo(){const image=el('img','brand-logo');image.src=STUDIO_CONFIG.logoUrl;image.alt='';return image}
function renderStudents(){const container=byId('student-list');container.replaceChildren();const visible=students.filter(s=>allowed().includes(s.id));byId('metric-students').childNodes[0].textContent=String(visible.length).padStart(2,'0')+' ';
 for(const s of visible){const btn=el('button',`student-card ${s.id===state.studentId?'selected':''}`);btn.type='button';btn.dataset.studentId=s.id;btn.append(avatar(s));const body=el('span','student-body');body.append(el('strong','',s.name),el('small','',`${s.className} · ${s.age}`));const chips=el('span','student-chips');for(const tag of s.strengths)chips.append(el('span','student-chip',tag));body.append(chips);btn.append(body,el('span','card-arrow','↗'));container.append(btn)}
 if(!visible.length)container.append(el('p','empty-list','No students assigned to this demo teacher.'));
}
function renderEvidence(){
 const s=selected(),records=evidence();byId('evidence-heading').textContent=`${firstName(s)}’s learning moments`;
 byId('evidence-coverage').textContent=`${records.length} fictional observations · ${new Set(records.map(r=>r.domain)).size}/${domains.length} domains · ${period}`;
 const container=byId('evidence-list');container.replaceChildren();
 for(const record of records){const row=el('article','evidence-row');row.id=`evidence-${record.id}`;row.tabIndex=-1;const date=el('div','evidence-date');date.append(el('strong','',shortDate(record.date).split(' ')[0]),el('small','',shortDate(record.date).split(' ').slice(1).join(' ')));const body=el('div','evidence-body');body.append(el('span','evidence-tag',record.domain),el('p','',record.text),el('small','evidence-id',record.id));row.append(date,body);container.append(row)}
}
function textBlock(label,text){const d=el('div','portfolio-text-block');d.append(el('h5','',label),el('p','',text));return d}
function renderPortfolio(){const s=selected(),current=draft();byId('chosen-name').textContent=s.name;byId('chosen-period').textContent=period;const photo=byId('chosen-avatar');photo.className=`student-avatar selected-avatar ${s.color}`;photo.textContent=s.initials;byId('provider-name').textContent=providerLabels[state.provider];const status=byId('portfolio-status');status.textContent=current?(current.approved?'EDUCATOR REVIEWED':current.data.generationMode==='mock'?'SIMULATED DRAFT':'AI DRAFT'):'NOT GENERATED';status.className=`status-chip ${current?(current.approved?'approved':current.data.generationMode==='mock'?'mock':'generated'):''}`;
 const target=byId('portfolio-preview');target.replaceChildren();byId('review-button').disabled=!current||state.busy;byId('print-button').disabled=!current||state.busy;
 if(!current){const empty=el('div','empty-portfolio');const illustration=el('div','empty-visual');illustration.append(el('span','','✦'),el('span','empty-lines'),el('span','empty-lines short'));empty.append(illustration,el('h4','','Every story starts here.'),el('p','','Select a student and generate a personalized portfolio from their learning observations.'),el('span','empty-caption','Uses fictional data for demonstration only'));target.append(empty);return;}
 const paper=el('article','portfolio-paper');const top=el('div','paper-heading');top.append(el('small','',`${STUDIO_CONFIG.organizationName ? STUDIO_CONFIG.organizationName.toUpperCase()+' • ' : ''}${STUDIO_CONFIG.portfolioTitle.toUpperCase()}`),el('span','folio-mark','✦'));paper.append(top);const intro=el('div','portfolio-intro');intro.append(avatar(s,'portfolio-avatar'),el('div','portfolio-student-info'));intro.lastChild.append(el('h4','',s.name),el('p','',`${s.className}  •  ${period}`));paper.append(intro);
 if(STUDIO_CONFIG.logoUrl)top.querySelector('.folio-mark').replaceWith(brandLogo());
 const ribbon=el('div','portfolio-ribbon',current.data.generationMode==='mock'?'SIMULATED OUTPUT — NO AI CALL':'AI-ASSISTED DRAFT — VERIFY ALL FACTS');paper.append(ribbon);
 paper.append(textBlock('Learning journey',current.data.summary));
 for(const domain of domains)paper.append(textBlock(domain,current.data.domains[domain]));
 paper.append(textBlock('Recommended next steps',current.data.nextSteps));
 const source=el('div','paper-sources');source.append(el('strong','','Evidence references: '));
 for(const id of current.data.evidenceIds){const link=el('button','source-link',id);link.type='button';link.addEventListener('click',()=>{const row=byId(`evidence-${id}`);row.scrollIntoView({behavior:scrollBehavior(),block:'center'});row.focus({preventScroll:true})});source.append(link,document.createTextNode(' '))}
 paper.append(source);
 paper.append(el('div','folio-review',current.approved?`Educator reviewed locally · ${current.reviewedBy} · ${new Date(current.reviewedAt).toLocaleString('en-SG')}`:'Unreviewed draft — educator verification required'));
 paper.append(el('div','folio-disclaimer','Fictional student • Educational demonstration only • Local review is not authenticated approval'));target.append(paper);
}
function selectStudent(id){if(state.busy)return;if(!allowed().includes(id)){toast('This demo teacher is not assigned to that student.');return;}state.studentId=id;makeGenerationMessage('');renderStudents();renderEvidence();renderPortfolio()}
function switchTeacher(value){if(state.busy)return;state.teacher=value;const first=allowed()[0];if(first&&!allowed().includes(state.studentId))state.studentId=first;makeGenerationMessage('');renderStudents();renderEvidence();renderPortfolio();const name=byId('teacher-select').selectedOptions[0].textContent;document.querySelector('.profile-text strong').textContent=name;document.querySelectorAll('.avatar-profile,.avatar-small').forEach(node=>node.textContent=({jordan:'MJ',lee:'ML',all:'AD'})[value]);toast('Teacher access is a frontend simulation — not production security.')}
function maskKey(){byId('user-api-key').type='password';byId('toggle-key').textContent='Show';byId('toggle-key').setAttribute('aria-pressed','false')}
function openProvider(){
 if(state.busy)return;byId('byok-ack').checked=false;maskKey();byId('provider-message').textContent='';
 const modal=byId('provider-dialog');modal.querySelector(`input[name="provider"][value="${state.provider}"]`).checked=true;
 byId('user-api-key').value=state.apiKey;byId('user-model').value=state.model||providerModels[state.provider]||'';showByokFields();modal.showModal();
}
function showByokFields(){const choice=document.querySelector('input[name="provider"]:checked').value;byId('byok-fields').hidden=!['openai','gemini'].includes(choice);byId('user-model').value=(choice===state.provider&&state.model)||providerModels[choice]||''}
function storeProvider(){
 const choice=document.querySelector('input[name="provider"]:checked').value,byok=['openai','gemini'].includes(choice),message=byId('provider-message');
 if(byok&&!byId('byok-ack').checked){message.textContent='Acknowledge the disposable-key warning before applying this provider.';return false}
 if(byok&&!byId('user-api-key').value.trim()){message.textContent='Enter a disposable test API key, or choose Offline Mock.';return false}
 state.provider=choice;state.apiKey=byok?byId('user-api-key').value.trim():'';state.model=byok?byId('user-model').value.trim():'';
 byId('user-api-key').value='';maskKey();makeGenerationMessage('');renderPortfolio();updateGenerateButton();toast(`Provider selected: ${providerLabels[choice]}. Keys are not stored.`);return true;
}
function buildReview(){
 const current=draft();if(!current||state.busy)return;const fields=byId('review-fields');fields.replaceChildren();
 const specs=[['summary','Learning journey'],...domains.map(d=>[`domain:${d}`,d]),['nextSteps','Recommended next steps']];
 for(const [key,label] of specs){const l=el('label','',label),textarea=el('textarea','review-textarea');textarea.id=`review-${fields.childElementCount}`;l.htmlFor=textarea.id;textarea.rows=key==='summary'?4:3;textarea.maxLength=key.startsWith('domain:')?3000:4000;textarea.dataset.field=key;textarea.value=key.startsWith('domain:')?current.data.domains[key.slice(7)]:current.data[key];fields.append(l,textarea);textarea.addEventListener('input',()=>{byId('teacher-approved').checked=false;byId('review-message').textContent='Content changed. Verify the revised draft before approving again.';updateEdits()})}
 byId('teacher-approved').checked=current.approved;byId('review-message').textContent='';updateEdits();byId('review-dialog').showModal();
}
function getReviewText(){return [...document.querySelectorAll('.review-textarea')].map(x=>x.value).join(' ')}
function draftText(current){return [current.original.summary,...domains.map(d=>current.original.domains[d]),current.original.nextSteps].join(' ')}
export function estimateEditPercent(original,edited){const a=(original.toLowerCase().match(/\S+/g)||[]),b=(edited.toLowerCase().match(/\S+/g)||[]);if(!a.length)return 0;const row=Array.from({length:b.length+1},(_,j)=>j);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const tmp=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=tmp}}return Math.round((row[b.length]/Math.max(a.length,1))*100)}
function updateEdits(){const current=draft();if(!current)return;byId('edit-percent').textContent=`${estimateEditPercent(draftText(current),getReviewText())}%`}
function saveReview(){
 const current=draft();if(!current)return false;const revised=structuredClone(current.data);
 for(const input of document.querySelectorAll('.review-textarea')){const k=input.dataset.field;if(k.startsWith('domain:'))revised.domains[k.slice(7)]=input.value;else revised[k]=input.value}
 try{current.data=validatePortfolio(revised,evidence())}catch(err){byId('review-message').textContent=`Cannot save: ${err.message}`;return false}
 current.approved=byId('teacher-approved').checked;current.reviewedAt=current.approved?new Date().toISOString():null;current.reviewedBy=current.approved?byId('teacher-select').selectedOptions[0].textContent:null;
 renderPortfolio();toast(current.approved?'Reviewed draft saved locally.':'Draft edits saved. Still requires educator approval.');return true;
}
function makeGenerationMessage(msg,error=false){const box=byId('generation-message');box.textContent=msg;box.className=`generation-message ${error?'error':''}`}
function updateGenerateButton(){const offline=state.provider!=='mock'&&!navigator.onLine;byId('generate-button').disabled=state.busy||offline;byId('generate-button').textContent=state.busy?'Generating portfolio…':offline?'Cloud generation unavailable offline':state.provider==='mock'?'✦ Generate simulated draft →':'✦ Generate with AI →'}
function setBusy(busy){
 state.busy=busy;
 for(const id of ['generate-button','teacher-select','header-settings','change-provider','add-observation'])byId(id).disabled=busy;
 document.querySelectorAll('#student-list button,[data-page="settings"]').forEach(button=>button.disabled=busy);
 byId('review-button').disabled=busy||!draft();byId('print-button').disabled=busy||!draft();byId('portfolio-pane').setAttribute('aria-busy',String(busy));updateGenerateButton();
}
async function generate(){
 if(state.busy)return;if(state.provider!=='mock'&&!navigator.onLine){makeGenerationMessage('Cloud generation is unavailable offline. No request was sent and no simulated output was substituted. Choose Offline Mock explicitly in provider settings.',true);return}setBusy(true);makeGenerationMessage('Preparing fictional observations and evidence for the selected student…');
 const s=selected(),records=evidence(),chosen=state.provider;
 try{
  let result;if(chosen==='mock'){await new Promise(r=>setTimeout(r,450));result=mockPortfolio(s,records)}else result=await generateRemotePortfolio({provider:chosen,key:state.apiKey,model:state.model,student:s,evidence:records});
  const data=validatePortfolio(result,records);data.generationMode=chosen==='mock'?'mock':'ai';
  state.drafts.set(s.id,{data,original:structuredClone(data),approved:false,generatedAt:new Date().toISOString()});
  renderPortfolio();makeGenerationMessage(chosen==='mock'?'Offline example generated. This is simulated output, not an AI response.':'AI response received. Verify every claim, citation and student identity before approval.');
  toast('Draft ready for educator review.');byId('portfolio-pane').scrollIntoView({behavior:scrollBehavior(),block:'center'});
 }catch(err){makeGenerationMessage(`Generation failed: ${err.message} No new draft was created; any previous draft is unchanged. Select Offline Mock in settings to explore without an API.`,true);toast('AI call failed; no simulated result was substituted.')}
 finally{setBusy(false)}
}
function addObservation(){if(state.busy)return;byId('observation-text').value='';byId('observation-message').textContent='';byId('observation-dialog').showModal()}
function saveObservation(){const text=byId('observation-text').value.trim();if(text.length<8){byId('observation-message').textContent='Add at least eight characters of fictional observation text.';return false}const s=selected();state.extra.push({studentId:s.id,id:`${s.id}-EX${String(state.extra.length+1).padStart(2,'0')}`,date:'2026-09-30',domain:byId('observation-area').value,text});state.drafts.delete(s.id);makeGenerationMessage('Evidence changed. Regenerate the portfolio to include this session-only observation.');renderEvidence();renderPortfolio();toast('Fictional observation added to this session.');return true}
function printPortfolio(){if(!draft())return;window.print()}
function bind(){document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));byId('header-settings').addEventListener('click',openProvider);byId('change-provider').addEventListener('click',openProvider);byId('hero-generate').addEventListener('click',()=>setPage('portfolio'));byId('hero-evidence').addEventListener('click',()=>setPage('observations'));byId('teacher-select').addEventListener('change',e=>switchTeacher(e.target.value));byId('student-list').addEventListener('click',e=>{const card=e.target.closest('[data-student-id]');if(card)selectStudent(card.dataset.studentId)});byId('generate-button').addEventListener('click',generate);byId('print-button').addEventListener('click',printPortfolio);byId('review-button').addEventListener('click',buildReview);byId('add-observation').addEventListener('click',addObservation);
 for(const input of document.querySelectorAll('input[name="provider"]'))input.addEventListener('change',()=>{byId('user-api-key').value='';byId('byok-ack').checked=false;byId('provider-message').textContent='';maskKey();showByokFields()});
 byId('toggle-key').addEventListener('click',()=>{const f=byId('user-api-key'),show=f.type==='password';f.type=show?'text':'password';byId('toggle-key').textContent=show?'Hide':'Show';byId('toggle-key').setAttribute('aria-pressed',String(show))});
 byId('provider-dialog').addEventListener('close',()=>{byId('user-api-key').value='';byId('byok-ack').checked=false;maskKey()});
 byId('provider-form').addEventListener('submit',e=>{if(e.submitter?.value==='save'&&!storeProvider())e.preventDefault()});
 byId('observation-form').addEventListener('submit',e=>{if(e.submitter?.value==='save'&&!saveObservation())e.preventDefault()});
 byId('review-form').addEventListener('submit',e=>{if(e.submitter?.value==='save'&&!saveReview())e.preventDefault()});
}
function applyBranding(){
 byId('app-brand').textContent=STUDIO_CONFIG.organizationName || STUDIO_CONFIG.productName;
 if(STUDIO_CONFIG.logoUrl)document.querySelector('.brand-icon').replaceWith(brandLogo());
 byId('app-brand-subtitle').textContent=STUDIO_CONFIG.productName.toUpperCase();
 byId('footer-brand').textContent=`${STUDIO_CONFIG.productName} · Independent concept demo`;
 byId('metric-baseline').replaceChildren(document.createTextNode(`~${STUDIO_CONFIG.metrics.illustrativeHoursPerPortfolio}h `),el('small','','per portfolio*'));
 byId('metric-edit-target').replaceChildren(document.createTextNode(`<${STUDIO_CONFIG.metrics.hypotheticalEditingTargetPercent}% `),el('small','','edits (unproven)'));
 document.title=`${STUDIO_CONFIG.productName} — Student Growth, Simplified`;
}
function initShell(){
 const colorPreference=window.matchMedia('(prefers-color-scheme: dark)');
 const updateTheme=()=>{
  const dark=colorPreference.matches;
  document.querySelector('meta[name="theme-color"]').content=dark?'#10272f':'#f8f8f4';
  document.querySelector('link[rel="manifest"]').href=dark?'./manifest-dark.webmanifest':'./manifest.webmanifest';
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]').content=dark?'black':'default';
 };
 colorPreference.addEventListener('change',updateTheme);updateTheme();
 // A CSSOM custom property keeps dialog sheets within the keyboard's visual viewport.
 if(window.visualViewport){
  const updateViewport=()=>{
   document.documentElement.style.setProperty('--visual-viewport-height',`${window.visualViewport.height}px`);
   if(document.activeElement?.closest('dialog[open]'))document.activeElement.scrollIntoView({block:'nearest',behavior:'auto'});
  };
  window.visualViewport.addEventListener('resize',updateViewport,{passive:true});updateViewport();
 }
 const scrollTop=byId('scroll-top');
 const updateScrollTop=()=>{scrollTop.hidden=window.scrollY<Math.max(400,window.innerHeight*.75)};
 window.addEventListener('scroll',updateScrollTop,{passive:true});
 scrollTop.addEventListener('click',()=>{window.scrollTo({top:0,behavior:scrollBehavior()});byId('hero-generate').focus({preventScroll:true})});
 updateScrollTop();
 window.addEventListener('online',updateGenerateButton);
 window.addEventListener('offline',()=>{updateGenerateButton();if(state.provider!=='mock'&&!state.busy)makeGenerationMessage('You are offline. Cloud generation is disabled; choose Offline Mock explicitly to explore simulated output. Existing drafts remain in this session.')});
}
applyBranding();bind();renderStudents();renderEvidence();renderPortfolio();updateGenerateButton();initShell();
initPwa({isBusy:()=>state.busy});
