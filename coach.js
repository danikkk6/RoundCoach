// Local teaching rules. Prices can be updated here when the game changes.
export const maps = {
  Mirage: {a:'A ramp / Palace', b:'B apartments', mid:'Mid / Connector', ct:['A site','B site','Window / Connector']},
  'Dust II': {a:'Long / Short', b:'B tunnels', mid:'Mid / Lower tunnels', ct:['Long / A site','B site','Mid / CT']},
  Inferno: {a:'Apps / Short / Long', b:'Banana', mid:'Mid / Second mid', ct:['A site / Pit','B site / Banana','Arch / CT']},
  Nuke: {a:'Hut / Squeaky → A', b:'Ramp → B', mid:'Outside / Secret', ct:['A site / Heaven','Ramp / B','Outside / Garage']},
  Ancient: {a:'A main', b:'B ramp / Cave', mid:'Mid / Donut', ct:['A site / Donut','B site / Cave','Mid']},
  Anubis: {a:'A main', b:'B main', mid:'Mid / Connector', ct:['A site','B site','Mid / Connector']},
  Vertigo: {a:'A ramp', b:'B stairs', mid:'Mid', ct:['A site / Ramp','B site / Stairs','Mid']}
};
export function validate(raw) {
  const number = (key, min, max) => {
    if (raw[key] === '' || raw[key] === null || raw[key] === undefined) throw Error('Заполни поле: '+key);
    const n = Number(raw[key]);
    if (!Number.isInteger(n) || n < min || n > max) throw Error('Недопустимое значение: '+key);
    return n;
  };
  if (!maps[raw.map] || !['T','CT'].includes(raw.side)) throw Error('Выбери карту и сторону.');
  if (!['none','rifle','smg','awp'].includes(raw.weapon) || !['none','vest','helmet'].includes(raw.armor)) throw Error('Проверь снаряжение.');
  if (!['unknown','eco','buy'].includes(raw.enemy)) throw Error('Проверь экономику соперника.');
  if (typeof raw.notes !== 'string' || raw.notes.length > 700) throw Error('Комментарий должен быть короче 700 символов.');
  return {map:raw.map, side:raw.side, money:number('money',0,16000), teamMoney:number('teamMoney',0,16000), round:number('round',1,48), losses:number('losses',0,5), weapon:raw.weapon, armor:raw.armor, enemy:raw.enemy, last: Boolean(raw.last), notes:raw.notes.trim()};
}
export function recommend(s) {
  const threshold = s.side === 'CT' ? 4300 : 4000;
  let type, reason;
  if (s.round === 1 || s.round === 13) {
    type='Пистолетный'; reason='Начало половины: сохрани стартовый пистолет и согласуй броню и гранаты с командой.';
  } else if (s.last) {
    type='Форс'; reason='Ты отметил решающий раунд: сохранение денег сейчас не даёт пользы. Потрать бюджет согласованно с командой.';
  } else if (s.teamMoney >= threshold) {
    type='Фулл-бай'; reason='Среднего бюджета хватает на основную закупку. Если лично денег мало, попроси дроп; проверь деньги каждого игрока.';
  } else if (s.teamMoney >= 2300 && s.enemy === 'eco') {
    type='Форс'; reason='По твоей оценке соперник на эко: ограниченная закупка может дать преимущество. Если оценка неверна, лучше пересмотреть решение.';
  } else if (s.teamMoney >= 2000) {
    type='Полубай'; reason='Командного бюджета мало для полноценного закупа. Ограничь траты, чтобы подготовить следующий раунд.';
  } else {
    type='Эко'; reason='Низкий бюджет команды: сохраняйте деньги вместе, играйте на размен и подбор оружия.';
  }
  const cap = type==='Эко' ? Math.min(s.money,300) : type==='Полубай' ? Math.min(s.money,Math.max(0,s.money+Math.min(3400,1400+s.losses*500)-threshold)) : s.money;
  let remaining=cap; const items=[];
  const add=(name,price)=>{if(price<=remaining){items.push({name,price});remaining-=price;return true;}return false;};
  if (!['Эко','Полубай'].includes(type)) {
    if(s.armor==='none') add('Броня',650);
    if(type!=='Пистолетный' && s.armor!=='helmet' && (s.armor==='vest' || items.some(i=>i.name==='Броня'))) add('Шлем (при полной броне)',350);
  }
  if(s.weapon==='none' && type!=='Пистолетный') {
    if(type==='Фулл-бай' || type==='Форс') {
      if(!add(s.side==='T'?'AK-47':'M4A1-S',s.side==='T'?2700:2900)) {
        if(!add(s.side==='T'?'Galil AR':'FAMAS',s.side==='T'?1800:1950)) add(s.side==='T'?'MAC-10':'MP9',s.side==='T'?1050:1250);
      }
    } else if(type==='Полубай') add(s.side==='T'?'MAC-10':'MP9',s.side==='T'?1050:1250);
  }
  if(type!=='Эко') {
    add('Smoke',300); add('Flash',200);
    if(s.side==='CT' && type!=='Пистолетный') add('Defuse kit',400);
    if(type==='Фулл-бай' || type==='Форс') {add('HE',300);add('Flash',200);}
  }
  const cost=items.reduce((n,i)=>n+i.price,0), m=maps[s.map], cheap=['Эко','Полубай','Пистолетный'].includes(type);
  const hasSmoke=items.some(i=>i.name==='Smoke'),hasFlash=items.some(i=>i.name==='Flash');
  const roles=s.side==='T' ? [`Игроки 1–2: первая пара, ${cheap?m.b:m.a}; первый проверяет угол, второй готов к размену.`,`Игрок 3: поддержка за первой парой${hasFlash?', флеш перед контактом':''}.`,`Игрок 4: ${cheap?'держится с группой':`контролирует ${m.mid}`}.`,`Игрок 5: несёт бомбу за группой, проверяет спину.`] : cheap ? [`Игроки 1–3: осторожный стак на B (${m.ct[1]}), разные углы для размена.`,`Игрок 4: информация на A (${m.ct[0]}), без одиночного пуша.`,`Игрок 5: наблюдение за ${m.ct[2]}, связь и помощь по контакту.`] : [`Игроки 1–2: ${m.ct[0]}, взаимный размен.`,`Игроки 3–4: ${m.ct[1]}, один получает информацию, второй страхует.`,`Игрок 5: ${m.ct[2]}, помощь только после подтверждения выхода.`];
  const steps=s.side==='T' ? [
    `0–20 секунд: ${cheap?'соберитесь для совместного выхода через '+m.b:'займите подходы к '+m.a+' и получите информацию через '+m.mid}. Не отдавайте бомбу первой.`,
    `20–45 секунд: ${hasSmoke?'закройте дымом одну линию обзора на выбранном пленте; договоритесь, кто его бросает':'не планируйте выход под дым без гранат — ищите контакт парой'}${hasFlash?'; дайте флеш по голосовому отсчёту':''}. Точные броски потренируйте отдельно.`,
    'После первого контакта: второй игрок разменивает; если проход перекрыт и есть время, остановитесь и перегруппируйтесь.',
    'После установки: займите разные позиции, играйте от таймера и размена; не ищите лишние дуэли.'
  ] : [
    `0–20 секунд: займите свои позиции; ${cheap?'стак — предположение, а не знание позиции врага':'сохраните возможность помочь соседнему игроку'}.`,
    `Первый контакт: сообщите число замеченных врагов и бомбу${hasSmoke?'; используйте дым, чтобы задержать выход':''}. Не уходите всем составом по одному звуку.`,
    `Подтверждённый выход: ближайший игрок помогает, остальные контролируют обход${hasFlash?'; согласуйте флеш перед повторным пиком':''}.`,
    'После установки: соберитесь для совместного ретейка. Если времени и ресурсов не хватает, обсудите сохранение оружия; в решающем раунде играйте на победу.'
  ];
  return {type,reason,items,cost,balance:s.money-cost,roles,steps,lesson:'Главное правило: закупка и выход должны быть командными. Средний бюджет — упрощение; дропы и инвентарь остальных игроков могут изменить решение.',economy:`Ориентир выплаты за поражение: $${Math.min(3400,1400+s.losses*500)} при указанном уровне серии. Бонусы за убийства и бомбу не учтены.`,inventory:s.weapon==='none'?'Стартовый пистолет':`Сохранённое оружие: ${s.weapon}`,source:'local'};
}
