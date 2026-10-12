import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from './server.js';
const input={map:'Mirage',side:'CT',money:3200,teamMoney:3200,round:8,losses:2,weapon:'none',armor:'none',enemy:'unknown',last:false,notes:''};
async function withServer(options,run){
  const server=createServer(options);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{await run('http://127.0.0.1:'+server.address().port);}finally{await new Promise(resolve=>server.close(resolve));}
}
const post=(url,body,headers={})=>fetch(url+'/api/coach',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
test('no-key status and old local mode cannot bypass AI-only path',async()=>withServer({apiKey:''},async url=>{
  const status=await (await fetch(url+'/api/status')).json();assert.equal(status.aiConfigured,false);
  const res=await post(url,{...input,mode:'local'});assert.equal(res.status,503);const body=await res.json();assert.match(body.error,/GROQ_API_KEY/);assert.equal(body.type,undefined);
}));
test('validation and origin errors do not call provider',async()=>withServer({apiKey:'secret',fetchImpl:()=>assert.fail('no provider call')},async url=>{
  assert.equal((await post(url,{...input,money:-1})).status,400);
  assert.equal((await post(url,input,{Origin:'https://other.example'})).status,403);
  assert.equal((await post(url,{...input,notes:'x'.repeat(11000)})).status,413);
}));
test('provider errors propagate without leaking a key or local fallback',async()=>withServer({apiKey:'secret',fetchImpl:async()=>new Response('{}',{status:429})},async url=>{
  const res=await post(url,input);assert.equal(res.status,429);const body=await res.text();assert.ok(!body.includes('secret'));assert.ok(!body.includes('roles'));
}));
test('AI plan reaches frontend and sources are server controlled',async()=>withServer({apiKey:'secret',fetchImpl:async()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({type:'Эко',reason:'Сохранить',items:[],roles:['1','2','3','4','5'],steps:['a','b','c'],fallback:'Отойти',assumptions:['Инвентарь команды неизвестен'],call:'Вместе',lesson:'Размен',economy:'Следующий раунд',inventory:'Пистолет',proBasis:'Общий принцип',referenceIds:[]})}}]}))},async url=>{
  const res=await post(url,input);assert.equal(res.status,200);const body=await res.json();assert.equal(body.source,'groq');assert.equal(body.cost,0);assert.equal(body.balance,3200);assert.equal(body.roles.length,5);
  const page=await (await fetch(url)).text();assert.ok(!page.includes('name="mode"'));assert.ok(!page.includes('Hugging Face'));
  assert.ok(!page.includes('name="last"'));assert.ok(page.includes('id="round-context"'));assert.ok(page.includes('type="module"'));
  const shared=await fetch(url+'/match-rules.js');assert.equal(shared.status,200);assert.match(await shared.text(),/isDecisiveRound/);
  assert.equal((await fetch(url+'/.env')).status,404);assert.equal((await fetch(url+'/ai-coach.js')).status,404);
}));
test('round context reaching AI is authoritative for regulation and overtime',async()=>withServer({apiKey:'secret',fetchImpl:async(_,init)=>{
  const context=JSON.parse(JSON.parse(init.body).messages[1].content);
  assert.equal(context.situation.last,[12,24,30,36,54].includes(context.situation.round));
  return new Response('{}',{status:429});
}},async url=>{
  for(const round of [8,12,13,24,25,30,31,36,54])assert.equal((await post(url,{...input,round,last:false})).status,429);
}));
