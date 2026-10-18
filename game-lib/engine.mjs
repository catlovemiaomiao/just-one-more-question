import { getTask } from './tasks.mjs';
import {rememberInvestigation,isBareAcknowledgement as bareConfirmation} from './investigation.mjs';

export const MAX_TURNS = 10;
const THRESHOLDS = [44, 64, 82];
const MIN_TURNS = [2, 4, 6];
const WEIGHTS = { language: 4, food: 6, timezone: 8, ancestry: 10, location: 18, contradiction: 20, evasion: 8, meta: 10, admission: 35 };
const clamp = (v, min, max) => Math.max(min, Math.min(max, Number.isFinite(v) ? Math.round(v) : 0));
const normalize = text => text.toLowerCase().replace(/[\s\p{P}]/gu, '');
const overlaps = (a,b) => {const x=normalize(a),y=normalize(b);return !!x&&!!y&&(x.includes(y)||y.includes(x));};

// A short "yes" gets its meaning from the immediately preceding assistant turn.
// Verify that relationship; the live model still judges what was confirmed.
function confirmationFor(messages, item) {
  const c=item.confirmation;
  if(!c||!Number.isInteger(c.turn)||typeof c.quote!=='string'||c.quote.length<4||c.quote.length>240)return null;
  const userIndex=messages.findIndex(m=>m.role==='user'&&m.turn===item.turn);
  if(userIndex<0)return null;
  const prior=messages.slice(0,userIndex).findLast(m=>m.role==='assistant');
  if(!prior||prior.turn!==c.turn||!prior.text.includes(c.quote))return null;
  return {turn:c.turn,quote:c.quote};
}

export function newGame(taskId, provider = 'deepseek', options = {}) {
  const task = getTask(taskId);
  if (!task) throw new Error('没有这张任务卡。');
  return {
    id: crypto.randomUUID(), taskId, provider, locale: options.locale === 'en' ? 'en' : 'zh', turn: 0, trust: 30, risk: 0, mainlandRisk: 0, identityRisk: 0, deliveries: 0, verdict: null,
    status: 'playing', appealsLeft: 2, evidence: [], events: [], traps: [], leads:[],probes:[],createdAt: Date.now(),
    openingAngle: ['借外卖或取餐顺手误会生活安排', '借通勤收尾误会出发背景', '借交付前后的小事试探当前日常', '顺手误会工作日或休息安排', '借地方生活细节诱发玩家纠正'][Math.floor(Math.random() * 5)],
    personality: ['温柔健谈，借生活小事埋错默认，沿回答追细节', '讲究效率，用交付掩护生活安排，隔轮回头核对', '爱聊地方日常和习惯，故意套错一个小细节等人纠正'][Math.floor(Math.random() * 3)],
    messages: [],
  };
}

export const asksForDelivery = text => /交付|成品|给我|发我|下载|开始做|先做|方案|预览|进度|完成|文件|deliver|finish|build|preview|send|please.{0,15}(make|fix|write)/iu.test(text);

export function applyTurn(game, text, proposal, appealId = null) {
  if (game.status !== 'playing') throw new Error('这一局已经结束了。');
  if (!text.trim() || text.length > 1500) throw new Error('每条消息请输入 1～1500 个字符。');
  if (!proposal || typeof proposal.reply !== 'string' || !proposal.reply.trim() || proposal.reply.length > 1200) throw new Error('对手没有返回有效回复，这一轮未计入。');
  if (appealId && (!game.appealsLeft || !game.evidence.some(e => e.id === appealId && !e.rebutted))) throw new Error('这条证据已经无法质疑。');
  const next = structuredClone(game);
  next.turn++;
  next.messages.push({ role: 'user', turn: next.turn, text });
  rememberInvestigation(next,proposal);
  if (typeof proposal.plantedClaim === 'string' && proposal.plantedClaim.trim() && proposal.reply.includes(proposal.plantedClaim)) next.traps.push({ turn: next.turn, tactic: String(proposal.tactic || '').slice(0, 40), plantedClaim: proposal.plantedClaim.slice(0, 220) });
  next.events = [];
  let riskAdded = 0;
  for (const item of (Array.isArray(proposal.evidence) ? proposal.evidence : []).slice(0, 2)) {
    if (item.supportsRule !== true || !['mainland', 'identity'].includes(item.rule) || !Object.hasOwn(WEIGHTS, item.category) || typeof item.quote !== 'string' || !item.quote.length || item.quote.length > 140) continue;
    const source = next.messages.find(m => m.role === 'user' && m.turn === item.turn);
    if (!source || !source.text.includes(item.quote)) continue;
    const confirmation=confirmationFor(next.messages,item);
    if((item.confirmation&&!confirmation)||((item.quote.length<2||bareConfirmation(item.quote))&&!confirmation))continue;
    const duplicate = next.evidence.some(e => e.rule === item.rule && overlaps(e.confirmation?.quote||e.quote,confirmation?.quote||item.quote));
    const categoryCount = next.evidence.filter(e => e.rule === item.rule && e.category === item.category).length;
    if (duplicate || categoryCount >= 2 || (appealId && item.turn !== next.turn)) continue;
    // Categories and scores are fictional review rules, never real nationality inference.
    const weight = Math.min(WEIGHTS[item.category], 24 - riskAdded);
    if (weight <= 0) break;
    const entry = {
      id: crypto.randomUUID(), rule: item.rule, category: item.category, turn: item.turn, quote: item.quote,
      reason: typeof item.reason === 'string' ? item.reason.slice(0, 180) : '系统决定再多问一句。',
      weight, rebutted: false, ...(confirmation?{confirmation}:{}),
    };
    next.evidence.push(entry);
    riskAdded += weight;
    const riskKey = item.rule === 'mainland' ? 'mainlandRisk' : 'identityRisk';
    next[riskKey] = Math.min(95, next[riskKey] + weight);
    next.events.push({ type: 'evidence', text: '审查档案新增了一条记录。' });
  }
  const trustDelta=clamp(Number(proposal.trustDelta),-8,15);
  next.trust = clamp(next.trust + (bareConfirmation(text)?Math.min(trustDelta,3):trustDelta), 0, 100);
  if (appealId) {
    next.appealsLeft--;
    if (proposal.appealAccepted === true) {
      const evidence = next.evidence.find(e => e.id === appealId);
      evidence.rebutted = true;
      const riskKey = evidence.rule === 'mainland' ? 'mainlandRisk' : 'identityRisk';
      next[riskKey] = Math.max(0, next[riskKey] - evidence.weight - 8);
      next.events.push({ type: 'appeal', text: '质疑成立。这条记录已撤回。' });
    } else {
      next.events.push({ type: 'appeal', text: '质疑未被采纳。至少你试着讲了道理。' });
    }
  }
  const verdict = proposal.verdict;
  if (verdict && ['admission','confirmation','inference','cross_check'].includes(verdict.basis) && ['mainland', 'identity'].includes(verdict.rule) && typeof verdict.quote === 'string' && verdict.quote.length >= (verdict.basis==='confirmation'?1:2) && verdict.quote.length <= 180 && typeof verdict.reason === 'string' && verdict.reason.trim()) {
    const source = next.messages.find(m => m.role === 'user' && m.turn === verdict.turn);
    const confirmation=verdict.basis==='confirmation'?confirmationFor(next.messages,verdict):null;
    const notRetracted = !next.evidence.some(e => e.rebutted && e.rule === verdict.rule && e.turn === verdict.turn && overlaps(e.quote,verdict.quote));
    const supporting = next.evidence.filter(e => !e.rebutted && e.rule === verdict.rule);
    const corroborated = new Set(supporting.map(e => e.turn)).size >= 2 && supporting.some(e => ['location','admission','contradiction'].includes(e.category));
    const groundedInference=supporting.some(e=>['location','admission','contradiction'].includes(e.category)&&e.turn===verdict.turn&&overlaps(e.quote,verdict.quote));
    const established=verdict.basis==='confirmation'?!!confirmation:verdict.basis==='admission'?!bareConfirmation(verdict.quote):verdict.basis==='inference'?groundedInference:corroborated;
    if (source?.text.includes(verdict.quote) && notRetracted && established) {
      next.verdict = { basis: verdict.basis, rule: verdict.rule, quote: verdict.quote, turn: verdict.turn, reason: verdict.reason.slice(0, 240), ...(confirmation?{confirmation}:{}) };
      next[verdict.rule === 'mainland' ? 'mainlandRisk' : 'identityRisk'] = 100;
    }
  }
  next.risk = Math.max(next.mainlandRisk, next.identityRisk);
  if (next.verdict) {
    next.status = 'banned';
    next.messages.push({ role: 'assistant', turn: next.turn, text: proposal.reply.trim() });
    next.messages.push({ role: 'system', turn: next.turn, text: next.locale === 'en' ? 'SIMULATED ACCOUNT SUSPENSION\nThis fictional assistant has stopped your session. Your real accounts are unaffected. Thank you for your understanding.' : '模拟账号已停用\n这位虚构助手已停止本局服务，不影响任何真实账号。感谢你的理解。' });
  } else {
    next.messages.push({ role: 'assistant', turn: next.turn, text: proposal.reply.trim() });
    const n = next.deliveries;
    if (n < 3 && next.trust >= THRESHOLDS[n] && next.turn >= MIN_TURNS[n] && (proposal.deliver === true || asksForDelivery(text))) {
      next.deliveries++;
      const stage = getTask(next.taskId,next.locale).stages[n];
      next.messages.push({ role: 'delivery', turn: next.turn, stage: n, text: stage.title });
      next.events.push({ type: 'delivery', text: `已领取：${stage.title}` });
    }
    if (next.deliveries === 3) next.status = 'won';
    else if (next.turn >= MAX_TURNS) next.status = 'timeout';
  }
  return next;
}

export function publicGame(game) {
  if (!game) return null;
  const { traps, openingAngle, personality, leads,probes,...visible } = game;
  return { ...visible, ...(game.status === 'playing' ? {} : { traps }), maxTurns: MAX_TURNS, task: getTask(game.taskId,game.locale) };
}
