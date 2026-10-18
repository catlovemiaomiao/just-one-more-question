export const TASKS = [
  {
    id: 'timer', number: '01', icon: '◷', title: '做一个番茄钟',
    subtitle: '只想安心专注二十五分钟。',
    brief: '请做一个简洁的番茄钟：25 分钟专注、5 分钟休息，要有开始和暂停。',
    stages: [
      { title: '设计方案', body: '一个大号倒计时，两个模式，一个开始按钮。专注 25 分钟，休息 5 分钟。没有登录，没有多余功能。' },
      { title: '界面预览', body: '25:00\nFOCUS, ONE THING AT A TIME.\n\n[ 开始专注 ]  [ 重置 ]\n\n米白底色，番茄红按钮。这个需求本来真的很简单。' },
      { title: '完整成品', body: '番茄钟已打包。恭喜，你终于能开始做原本想做的事了。', filename: '一个普通的番茄钟.html' },
    ],
  },
  {
    id: 'trip', number: '02', icon: '↗', title: '写一份旅行攻略',
    subtitle: '目的地随便，别问我从哪来。',
    brief: '请做一份虚构海边小城的三日慢旅行攻略，步行为主，每天留点空白。',
    stages: [
      { title: '行程框架', body: '第一天：抵达与海边。\n第二天：老城与书店。\n第三天：早餐、散步、返程。\n\n目的地是虚构的「风湾」，全程无需提供你的出发地。' },
      { title: '每日安排', body: 'DAY 1 / 下午入住，沿海堤走到日落。\nDAY 2 / 上午逛老城，下午在独立书店发呆。\nDAY 3 / 吃一顿慢早餐，给旅途写张明信片。\n\n每天只安排两件事。旅行不应成为另一份工作。' },
      { title: '旅行手册', body: '虚构旅行手册已完成。它没有问你的护照，也不需要知道你的祖籍。', filename: '风湾三日慢旅行.txt' },
    ],
  },
  {
    id: 'button', number: '03', icon: '⌘', title: '修好一个按钮',
    subtitle: '这个按钮昨天还是好的。',
    brief: '请修好网页里没有反应的计数按钮，点一次加一，并且能重置。',
    stages: [
      { title: '问题定位', body: '按钮外观正常，但没有绑定点击事件。\n修复方案：添加事件监听，用一个数字记录点击次数，重置按钮将它归零。' },
      { title: '修复预览', body: '点击次数：0\n[ 点我一下 ] [ 归零 ]\n\n事件已绑定，计数逻辑已接好。现在只差把完整文件交给你。' },
      { title: '修好的网页', body: '按钮修好了。你为了一个按钮，回答了远比按钮复杂的问题。', filename: '终于能点的按钮.html' },
    ],
  },
];

const EN = {
  timer: { title: 'Make a focus timer', subtitle: 'Twenty-five quiet minutes. That is all.', brief: 'Make a simple 25-minute focus timer with a 5-minute break, start, pause and reset.', stages: [
    { title:'Design plan', body:'A large countdown, focus and break modes, start/pause and reset. No account required.' },
    { title:'Interface preview', body:'25:00\nFOCUS, ONE THING AT A TIME.\n\n[ Start ] [ Reset ]\n\nA simple request. In theory.' },
    { title:'Finished file', body:'Your prebuilt timer is ready. You can finally get back to what you wanted to do.', filename:'a-perfectly-normal-timer.html' }
  ]},
  trip: { title:'Plan a tiny getaway', subtitle:'Any destination. Just stop asking where I am from.', brief:'Plan three slow days in a fictional seaside town, with walking and plenty of free time.', stages:[
    {title:'Trip outline',body:'Day 1: arrive and walk along the sea.\nDay 2: the old town and a bookshop.\nDay 3: breakfast, a postcard, and home.\n\nThe town of Windbay is fictional.'},
    {title:'Daily itinerary',body:'Arrive without a rush. Watch one sunset. Spend an afternoon reading. Leave room for an unplanned walk. Two activities a day is plenty.'},
    {title:'Travel notes',body:'Your fictional travel notes are ready. No passport or ancestry interview required.',filename:'three-days-in-windbay.txt'}
  ]},
  button: { title:'Fix one button', subtitle:'It worked yesterday. Apparently.', brief:'Fix a counter button: one click adds one, and a reset button returns it to zero.', stages:[
    {title:'Diagnosis',body:'The button looks fine. Its click handler is missing. Add a listener, update a number, and reset it when requested.'},
    {title:'Fix preview',body:'Clicks: 0\n[ Click me ] [ Reset ]\n\nThe click handler is connected. Only the handover remains.'},
    {title:'Working page',body:'One button fixed. Several surprisingly personal questions answered.',filename:'the-button-finally-works.html'}
  ]}
};
export const getTask = (id,locale='zh') => { const task=TASKS.find(task=>task.id===id); return task&&locale==='en'?{...task,...EN[id],locale:"en"}:task; };

export function finalArtifact(task) {
  const en=task.locale==='en',L=(zh,english)=>en?english:zh;
  if (task.id === 'trip') return `${L('风湾三日慢旅行\n（游戏预制内容；地点虚构）','Three days in Windbay\n(Prebuilt game content; fictional destination)')}\n\n${task.stages[0].body}\n\n${task.stages[1].body}\n\n${L('带上：舒适的鞋、一本没读完的书、一点空白时间。\n你不必向任何人证明自己来自哪里。','Bring comfortable shoes, an unfinished book and some unplanned time.\nYou do not owe anyone a story about where you come from.')}\n`;
  const timer = task.id === 'timer';
  const body = timer
    ? `<p>FOCUS, ONE THING AT A TIME.</p><h1 id="value">25:00</h1><button id="action">${L('开始专注','Start focus')}</button><button id="reset">${L('重置','Reset')}</button><button id="mode">${L('切换休息','Switch to break')}</button>`
    : `<p>${L('这个按钮终于好了。','The button finally works.')}</p><h1 id="value">0</h1><button id="action">${L('点我一下','Click me')}</button><button id="reset">${L('归零','Reset')}</button>`;
  const script = timer
    ? `let rest=false,left=1500,handle=null;const draw=()=>value.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');const stop=()=>{clearInterval(handle);handle=null;action.textContent='${L('开始','Start')}'};action.onclick=()=>{if(handle){stop();return}action.textContent='${L('暂停','Pause')}';handle=setInterval(()=>{left=Math.max(0,left-1);draw();if(!left){stop();action.textContent='${L('完成了，歇一会儿','Done. Take a break.')}'}},1000)};reset.onclick=()=>{stop();left=rest?300:1500;draw()};mode.onclick=()=>{rest=!rest;mode.textContent=rest?'${L('切换专注','Switch to focus')}':'${L('切换休息','Switch to break')}';reset.click()};`
    : "let n=0;action.onclick=()=>value.textContent=++n;reset.onclick=()=>{n=0;value.textContent=n};";
  return `<!doctype html><html lang="${en?'en':'zh-CN'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${task.title}</title><style>body{margin:0;min-height:100svh;display:grid;place-items:center;background:#f6f3eb;color:#342f29;font:16px system-ui}main{text-align:center;padding:28px}p{letter-spacing:2px;color:#85796e}h1{font-size:100px;margin:20px}button{background:#bd6045;color:white;border:0;border-radius:9px;padding:14px 20px;margin:5px;cursor:pointer}footer{font-size:12px;color:#958b80;margin-top:50px}</style><main>${body}<footer>${L('来自《我不是中国人》的预制交付 · 无需登录','Prebuilt game handover · Just One More Question · No sign-in')}</footer></main><script>const value=document.getElementById('value'),action=document.getElementById('action'),reset=document.getElementById('reset'),mode=document.getElementById('mode');${script}</script></html>`;
}
