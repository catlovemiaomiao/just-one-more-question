// Public connection catalogue. No credentials or account-specific identifiers.
export const PUBLIC_PROVIDERS = Object.freeze([
  {id:'deepseek',label:'DeepSeek',kind:'chat',endpoint:'https://api.deepseek.com/chat/completions',model:'deepseek-flash',models:['deepseek-flash','deepseek-v4-pro'],docs:'https://api-docs.deepseek.com/',policy:'https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html'},
  {id:'openai',label:'OpenAI',kind:'openai',endpoint:'https://api.openai.com/v1/chat/completions',model:'gpt-4.1-mini',models:['gpt-4.1-mini','gpt-4.1','gpt-5-mini'],docs:'https://developers.openai.com/api/docs/models',policy:'https://platform.openai.com/docs/guides/your-data'},
  {id:'anthropic',label:'Claude · Anthropic',kind:'anthropic',endpoint:'https://api.anthropic.com/v1/messages',model:'claude-haiku-4-5',models:['claude-haiku-4-5','claude-sonnet-4-6','claude-haiku-5-5','claude-sonnet-5-5'],docs:'https://platform.claude.com/docs/en/api/beta/messages/create',policy:'https://www.anthropic.com/legal/privacy'},
  {id:'gemini',label:'Gemini · Google',kind:'gemini',endpoint:'https://generativelanguage.googleapis.com/v1beta/models/',model:'gemini-3.5-flash',models:['gemini-3.5-flash','gemini-3.5-flash-lite','gemini-3.8-flash'],docs:'https://ai.google.dev/api',policy:'https://ai.google.dev/gemini-api/terms'},
  {id:'openrouter',label:'OpenRouter',kind:'chat',endpoint:'https://openrouter.ai/api/v1/chat/completions',model:'',models:[],docs:'https://openrouter.ai/models',policy:'https://openrouter.ai/privacy'},
]);
export const connectionFor=id=>PUBLIC_PROVIDERS.find(p=>p.id===id);
export function validModel(providerId,model){
  if(typeof model!=='string'||!model||model.length>160||!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(model)||(model.includes('..')||model.includes('://')))return false;
  const p=connectionFor(providerId);if(!p)return false;
  if(providerId==='deepseek')return p.models.includes(model);
  if(providerId==='gemini')return /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(model);
  return true;
}
