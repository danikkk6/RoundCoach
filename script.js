const form=document.querySelector('#coach-form'), result=document.querySelector('#result'), submit=document.querySelector('#submit');
let lastText='';
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
function section(title,values){result.append(node('h4',title));const list=node('ol');for(const v of values)list.append(node('li',v));result.append(list);}
function render(plan,s){
  result.replaceChildren();
  if(plan.warning)result.append(node('p',plan.warning,'notice'));
  const heading=node('div',undefined,'result-heading');heading.append(node('h3',plan.type),node('span',plan.source==='huggingface'?'ИИ + расчёт закупки':'Демо · без ИИ','source'));result.append(heading,node('p',`${s.map} / ${s.side} / Раунд ${s.round}`,'source'),node('p',plan.reason,'reason'));
  const strip=node('div',undefined,'money-strip');for(const [label,value] of [['Бюджет',s.money],['Потратить',plan.cost],['Останется',plan.balance]]){const box=node('div');box.append(node('small',label),node('strong','$'+value));strip.append(box);}result.append(strip,node('h4','Твоя закупка'));
  result.append(node('p',plan.inventory,'source'));
  if(!plan.items.length)result.append(node('p','Ничего не покупай. Сохрани деньги.','reason'));
  for(const item of plan.items){const row=node('div',undefined,'item');row.append(node('span',item.name),node('span','$'+item.price));result.append(row);}
  section('Роли для пяти игроков',plan.roles);section('Как сыграть раунд',plan.steps);
  result.append(node('p',plan.economy,'source'),node('p',plan.lesson,'lesson'));
  if(plan.aiText){result.append(node('h4','Разбор ИИ-тренера'),node('div',plan.aiText,'ai-text'));}
  const actions=node('div',undefined,'result-actions'),copy=node('button','Копировать план','secondary'),msg=node('span','','source');copy.type='button';
  lastText=`RoundCoach — ${s.map}, ${s.side}, раунд ${s.round}\n${plan.type}\n${plan.reason}\n\nЗакупка:\n${plan.items.map(i=>`${i.name}: $${i.price}`).join('\n') || 'Без покупок'}\nИтого $${plan.cost}, остаток $${plan.balance}\n\n${plan.roles.join('\n')}\n\n${plan.steps.join('\n')}\n\n${plan.aiText || ''}`;
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(lastText);msg.textContent='Скопировано';}catch{msg.textContent='Выдели текст и скопируй вручную.';}});actions.append(copy,msg);result.append(actions);
}
form.addEventListener('submit',async event=>{
  event.preventDefault();const s=Object.fromEntries(new FormData(form));s.last=form.elements.last.checked;
  submit.disabled=true;submit.textContent=s.mode==='ai'?'ИИ составляет план…':'Составляем план…';document.querySelector('#results').setAttribute('aria-busy','true');
  try{const response=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(s)});const plan=await response.json();if(!response.ok)throw Error(plan.error);render(plan,s);}
  catch(error){result.replaceChildren(node('p',error.message || 'Не удалось связаться с сервером.','error'));}
  finally{submit.disabled=false;submit.textContent='Составить план ↗';document.querySelector('#results').setAttribute('aria-busy','false');}
});
const presets={eco:{side:'CT',money:1200,teamMoney:1400,round:8,losses:2,enemy:'buy',last:false},buy:{side:'T',money:5200,teamMoney:5100,round:7,losses:0,enemy:'buy',last:false},force:{side:'CT',money:2600,teamMoney:2500,round:24,losses:2,enemy:'buy',last:true}};
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{for(const [key,value]of Object.entries(presets[button.dataset.preset])){if(key==='last')form.elements[key].checked=value;else form.elements[key].value=value;}form.elements.weapon.value='none';form.elements.armor.value='none';form.elements.notes.value='';form.requestSubmit();}));
fetch('/api/status').then(r=>r.json()).then(s=>{document.querySelector('#status').textContent=s.aiConfigured?'Hugging Face подключён':'Демо работает · ИИ без ключа';if(s.aiConfigured)form.elements.mode.value='ai';}).catch(()=>{document.querySelector('#status').textContent='Запусти node server.js';});
