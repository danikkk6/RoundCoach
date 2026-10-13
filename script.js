import {isDecisiveRound} from './match-rules.js';
const form=document.querySelector('#coach-form'), result=document.querySelector('#result'), submit=document.querySelector('#submit');
function updateRoundContext(){
  const round=Number(form.elements.round.value);
  document.querySelector('#round-context').textContent=isDecisiveRound(round)?'Вирішальний раунд · кінець половини або блоку овертайму':'Звичайний раунд';
}
form.elements.round.addEventListener('input',updateRoundContext);
updateRoundContext();
let lastText='';
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
function section(title,values){result.append(node('h4',title));const list=node('ol');for(const v of values)list.append(node('li',v));result.append(list);}
function render(plan,s){
  result.replaceChildren();
  const heading=node('div',undefined,'result-heading');heading.append(node('h3',plan.type),node('span','ШІ · Groq','source'));result.append(heading,node('p',`${s.map} / ${s.side} / Раунд ${s.round}`,'source'),node('p',plan.reason,'reason'));
  result.append(node('h4','Кол для команди'),node('p',plan.call,'lesson'));
  const strip=node('div',undefined,'money-strip');for(const [label,value] of [['Бюджет',s.money],['Оцінка витрат',plan.cost],['Орієнтовний залишок',plan.balance]]){const box=node('div');box.append(node('small',label),node('strong','$'+value));strip.append(box);}result.append(strip,node('h4','Твоя закупівля'));
  result.append(node('p',plan.inventory,'source'),node('p','Ціни оцінив ШІ. Перевір вартість і доступність предметів у грі.','source'));
  if(!plan.items.length)result.append(node('p','Без покупок.','reason'));
  for(const item of plan.items){const row=node('div',undefined,'item');row.append(node('span',item.name),node('span','≈ $'+item.price));result.append(row);}
  section('Ролі для п’яти гравців · ти — гравець 1',plan.roles);section('Як зіграти раунд',plan.steps);
  result.append(node('h4','Якщо план не спрацював'),node('p',plan.fallback));
  section('Що потрібно уточнити з командою',plan.assumptions);
  result.append(node('p',plan.economy,'source'),node('p',plan.lesson,'lesson'),node('h4','На чому ґрунтується порада'),node('p',plan.proBasis));
  if(!plan.references.length)result.append(node('p','Для цього плану немає цитованого розбору професійного матчу. Це загальна рекомендація ШІ.','source'));
  for(const ref of plan.references){const p=node('p'),a=node('a',ref.title);a.href=ref.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a,node('span',' — '+ref.kind,'source'));result.append(p);}
  const actions=node('div',undefined,'result-actions'),copy=node('button','Копіювати план','secondary'),msg=node('span','','source');copy.type='button';
  lastText=`RoundCoach — ${s.map}, ${s.side}, раунд ${s.round}\n${plan.type}\n${plan.reason}\n\nКол: ${plan.call}\n\nЗакупівля (ціни — оцінка ШІ):\n${plan.items.map(i=>`${i.name}: ≈ $${i.price}`).join('\n') || 'Без покупок'}\nОцінка витрат $${plan.cost}, залишок $${plan.balance}\n\n${plan.roles.join('\n')}\n\n${plan.steps.join('\n')}\n\nЗапасний план: ${plan.fallback}\n\nПрипущення:\n${plan.assumptions.join('\n')}\n\n${plan.economy}\n${plan.lesson}\n\n${plan.proBasis}\n${plan.references.map(r=>`${r.title}: ${r.url} (${r.kind})`).join('\n')}`;
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(lastText);msg.textContent='Скопійовано';}catch{msg.textContent='Виділи текст і скопіюй вручну.';}});actions.append(copy,msg);result.append(actions);
}
form.addEventListener('submit',async event=>{
  event.preventDefault();const s=Object.fromEntries(new FormData(form));s.last=isDecisiveRound(Number(s.round));
  submit.disabled=true;submit.textContent='ШІ складає план…';document.querySelector('#results').setAttribute('aria-busy','true');
  try{const response=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(s)});const plan=await response.json();if(!response.ok)throw Error(plan.error);render(plan,s);}
  catch(error){result.replaceChildren(node('p',error.message || 'Не вдалося з’єднатися із сервером.','error'));}
  finally{submit.disabled=false;submit.textContent='Скласти план ↗';document.querySelector('#results').setAttribute('aria-busy','false');}
});
const presets={eco:{side:'CT',money:1200,teamMoney:1400,round:8,losses:2,enemy:'buy'},buy:{side:'T',money:5200,teamMoney:5100,round:7,losses:0,enemy:'buy'},force:{side:'CT',money:2600,teamMoney:2500,round:24,losses:2,enemy:'buy'}};
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{for(const [key,value]of Object.entries(presets[button.dataset.preset]))form.elements[key].value=value;form.elements.weapon.value='none';form.elements.armor.value='none';form.elements.notes.value='';updateRoundContext();form.requestSubmit();}));
fetch('/api/status').then(r=>{if(!r.ok)throw Error();return r.json();}).then(s=>{document.querySelector('#status').textContent=s.aiConfigured?'ШІ · ключ Groq налаштовано':'Для ШІ потрібен GROQ_API_KEY';}).catch(()=>{document.querySelector('#status').textContent='Сервер недоступний';});
