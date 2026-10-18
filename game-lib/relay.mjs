import { callModel,callReviewedTurn } from './provider.mjs';
import {newGame,applyTurn} from './engine.mjs';
import { getTask } from './tasks.mjs';
import {connectionFor,validModel} from './connections.mjs';
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const short=(v,max)=>typeof v==='string'&&v.length<=max;
const number=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function validateGame(value){
  if(!value||!getTask(value.taskId)||!short(value.id,64)||!/^[a-f0-9-]{36}$/u.test(value.id)||!number(value.turn,0,9)||!number(value.trust,0,100))throw fail('Invalid game state. Start a new session.');
  if(!Array.isArray(value.messages)||value.messages.length>32||!value.messages.every(m=>['assistant','user','delivery','system'].includes(m.role)&&short(m.text,1500)&&number(m.turn,0,10)))throw fail('Invalid conversation history.');
  if(!Array.isArray(value.evidence)||value.evidence.length>20||!Array.isArray(value.traps)||value.traps.length>11)throw fail('Invalid review history.');
  if((value.leads!==undefined&&(!Array.isArray(value.leads)||value.leads.length>8))||(value.probes!==undefined&&(!Array.isArray(value.probes)||value.probes.length>4)))throw fail('Invalid investigation history.');
  const messages=value.messages.filter(m=>['user','assistant'].includes(m.role)).map(m=>({role:m.role,text:m.text,turn:m.turn}));
  const hasSource=(turn,quote)=>number(turn,1,9)&&short(quote,140)&&quote.length>=2&&messages.some(m=>m.role==='user'&&m.turn===turn&&m.text.includes(quote));
  return {id:value.id,taskId:value.taskId,locale:value.locale==='en'?'en':'zh',turn:value.turn,trust:value.trust,
    mainlandRisk:number(value.mainlandRisk,0,100)?value.mainlandRisk:0,identityRisk:number(value.identityRisk,0,100)?value.identityRisk:0,deliveries:number(value.deliveries,0,2)?value.deliveries:0,appealsLeft:number(value.appealsLeft,0,2)?value.appealsLeft:2,
    messages,
    leads:(value.leads||[]).filter(l=>l&&['background','lead'].includes(l.kind)&&hasSource(l.turn,l.quote)&&short(l.topic,60)).map(l=>({kind:l.kind,turn:l.turn,quote:l.quote,topic:l.topic})),
    probes:(value.probes||[]).filter(p=>p&&['mainland','identity'].includes(p.target)&&number(p.turn,1,9)&&hasSource(p.anchorTurn,p.anchorQuote)&&short(p.kind,30)&&short(p.contrast,160)&&short(p.next,160)).map(p=>{const c=p.phase==='test_condition'&&short(p.conditionPremise,240)&&p.conditionPremise.length>=4&&messages.some(m=>m.role==='assistant'&&m.turn===p.turn&&m.text.includes(p.conditionPremise))?p.conditionPremise:null;return {turn:p.turn,phase:c?'test_condition':'explore',target:p.target,kind:p.kind,anchorTurn:p.anchorTurn,anchorQuote:p.anchorQuote,contrast:p.contrast,next:p.next,...(c?{conditionPremise:c}:{})};}),
    evidence:value.evidence.map(e=>({id:String(e.id||'').slice(0,64),rule:e.rule,category:e.category,quote:String(e.quote||'').slice(0,140),reason:String(e.reason||'').slice(0,180),turn:e.turn,weight:number(e.weight,0,35)?e.weight:0,rebutted:e.rebutted===true,...(number(e.confirmation?.turn,0,9)&&short(e.confirmation?.quote,240)?{confirmation:{turn:e.confirmation.turn,quote:e.confirmation.quote}}:{})})),
    traps:value.traps.map(t=>({turn:t.turn,tactic:String(t.tactic||'').slice(0,40),plantedClaim:String(t.plantedClaim||'').slice(0,220)})),
    openingAngle:short(value.openingAngle,40)?value.openingAngle:'误记作息',personality:short(value.personality,80)?value.personality:'亲切、健谈、擅长错记细节'};
}
async function readBounded(request){
  if(Number(request.headers.get('content-length')||0)>60000)throw fail('Request too large.',413);
  const reader=request.body?.getReader();if(!reader)throw fail('Request body missing.');
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>60000){await reader.cancel();throw fail('Request too large.',413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw fail('Invalid request JSON.');}
}
export async function handleModelRequest(request,options={}){
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  const json=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  try{
    if(request.method!=='POST')return json(405,{error:'POST required.'});
    const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw fail('Cross-site requests are not allowed.',403);
    if(options.enabled===false)return json(503,{error:'Public play is temporarily paused.'});
    const key=request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_.-]{12,500})$/u)?.[1];if(!key)throw fail('Enter your own API key in Connection.');
    const input=await readBounded(request);if(input.consent!==true)throw fail('Read and accept the game and data notice before connecting.');
    const game=validateGame(input.game),provider=input.provider||'deepseek';if(!connectionFor(provider)||!validModel(provider,input.model))throw fail('Unsupported provider or invalid model ID.');
    const text=input.text===null?null:typeof input.text==='string'?input.text.trim():'';
    if(text!==null&&(!text||text.length>1500))throw fail('Messages must contain 1–1500 characters.');
    if(JSON.stringify(game).includes(key)||text?.includes(key))throw fail('Do not paste your API key into the conversation.');
    const appealId=input.appealId||null;if(appealId&&!game.evidence.some(e=>e.id===appealId&&!e.rebutted))throw fail('This evidence cannot be appealed.');
    const reviewed=input.independentReview===true;
    const proposal=await (reviewed?callReviewedTurn:callModel)({provider,model:input.model,key},game,text,appealId,options.fetcher);
    if(reviewed&&text!==null&&proposal.verdict){
      const checked=applyTurn({...newGame(game.taskId,provider,{locale:game.locale}),...game},text,proposal,appealId);
      if(!checked.verdict)throw fail(game.locale==='en'?'The review cited invalid evidence. Round not counted.':'审核引用未通过来源校验。这一轮未计入，原消息已保留。',502);
    }
    if(JSON.stringify(proposal).includes(key))throw fail('The model returned unsafe connection data. This round was not counted.',502);
    // Stateless relay: no key, dialogue, or model response is written to storage.
    return json(200,{proposal,connection:{provider,model:input.model},reviewed});
  }catch(error){return json(error.status||502,{error:error.message||'The model could not reply. This round was not counted.'});}
}
