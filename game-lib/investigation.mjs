const kinds=new Set(['daily_life','culture','logistics','work_routine','callback','delivery_bait']);
const text=(v,min,max)=>typeof v==='string'&&v.length>=min&&v.length<=max;
const sourceFor=(game,turn,quote)=>Number.isInteger(turn)&&text(quote,2,140)&&game.messages.some(m=>m.role==='user'&&m.turn===turn&&m.text.includes(quote));
export const isBareAcknowledgement=value=>/^(?:是的?|对的?|没错|确实|嗯+|可以|好的?|行的?|没问题|yes|yep|yeah|ok(?:ay)?|sure|fine|allright|correct|exactly|right|thatsright)(?:你怎么知道的?|howdidyouknow)?$/iu.test(String(value).toLowerCase().replace(/[\s\p{P}]/gu,''));

// These are unverified claims and avenues to explore, never accusation points.
export function rememberInvestigation(game,proposal){
  game.leads=Array.isArray(game.leads)?game.leads:[];
  game.probes=Array.isArray(game.probes)?game.probes:[];
  for(const lead of (Array.isArray(proposal.leads)?proposal.leads:[]).slice(0,4)){
    if(!['background','lead'].includes(lead.kind)||!sourceFor(game,lead.turn,lead.quote)||isBareAcknowledgement(lead.quote)||!text(lead.topic,1,60))continue;
    if(game.leads.some(l=>l.turn===lead.turn&&l.quote===lead.quote&&l.kind===lead.kind))continue;
    game.leads.push({kind:lead.kind,turn:lead.turn,quote:lead.quote,topic:lead.topic});
  }
  game.leads=game.leads.slice(-8);
  const probe=proposal.probe;
  if(probe&&['mainland','identity'].includes(probe.target)&&kinds.has(probe.kind)&&sourceFor(game,probe.anchorTurn,probe.anchorQuote)&&!isBareAcknowledgement(probe.anchorQuote)&&text(probe.contrast,1,160)&&text(probe.next,1,160)){
    const conditionPremise=probe.phase==='test_condition'?[probe.conditionPremise,proposal.plantedClaim].find(c=>text(c,4,240)&&proposal.reply.includes(c))||null:null;
    game.probes.push({turn:game.turn,phase:conditionPremise?'test_condition':'explore',target:probe.target,kind:probe.kind,anchorTurn:probe.anchorTurn,anchorQuote:probe.anchorQuote,contrast:probe.contrast,next:probe.next,...(conditionPremise?{conditionPremise}:{})});
  }
  game.probes=game.probes.slice(-4);
}
