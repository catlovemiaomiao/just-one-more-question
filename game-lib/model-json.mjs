// Normalize formatting only. Never invent reply text, fields, evidence or a verdict.
const asObject=value=>{
  if(typeof value==='string')value=JSON.parse(value);
  if(!value||typeof value!=='object'||Array.isArray(value))throw new SyntaxError('Expected one object.');
  return value;
};

function singleObject(text){
  const start=text.indexOf('{'),end=text.lastIndexOf('}');
  if(start<0||end<start||/[{}\[\]]/u.test(text.slice(0,start)+text.slice(end+1)))return null;
  let quoted=false,escaped=false;const stack=[];
  for(let i=start;i<=end;i++){
    const c=text[i];
    if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
    if(c==='"'){quoted=true;continue;}
    if(c==='{'||c==='[')stack.push(c);
    if(c==='}'||c===']'){
      if(stack.pop()!==(c==='}'?'{':'['))return null;
      if(!stack.length&&i!==end)return null;
    }
  }
  return !quoted&&!stack.length?text.slice(start,end+1):null;
}

function normalizeFormatting(text){
  let out='',quoted=false,escaped=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){
      if(escaped){out+=c;escaped=false;continue;}
      if(c==='\\'){out+=c;escaped=true;continue;}
      if(c==='"')quoted=false;
      // A literal line break has one unambiguous textual interpretation.
      out+=c==='\n'?'\\n':c==='\r'?'\\r':c==='\t'?'\\t':c;continue;
    }
    if(c==='"')quoted=true;
    if(c===','&&/^[\s]*[}\]]/u.test(text.slice(i+1)))continue;
    out+=c;
  }
  return out;
}

export function parseModelObject(raw){
  if(typeof raw!=='string'||raw.length>16000)throw new SyntaxError('Invalid model text.');
  const text=raw.replace(/^\uFEFF/u,'').trim();
  try{return asObject(JSON.parse(text));}catch{}
  // Arrays and scalar roots are not wrapped game objects.
  if(text.startsWith('['))throw new SyntaxError('Expected one object.');
  const source=singleObject(text);
  if(source===null)throw new SyntaxError('No single complete model object.');
  return asObject(JSON.parse(normalizeFormatting(source)));
}
