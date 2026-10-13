// Input validation and map vocabulary only; all coaching decisions come from AI.
import {isDecisiveRound} from './match-rules.js';
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
    if (raw[key] === '' || raw[key] === null || raw[key] === undefined) throw Error('Заповни поле: '+key);
    if (!['string','number'].includes(typeof raw[key]) || String(raw[key]).trim() === '') throw Error('Некоректне число: '+key);
    const n = Number(raw[key]);
    if (!Number.isInteger(n) || n < min || n > max) throw Error('Неприпустиме значення: '+key);
    return n;
  };
  if (!Object.hasOwn(maps,raw.map) || !['T','CT'].includes(raw.side)) throw Error('Вибери карту та сторону.');
  if (!['none','rifle','smg','awp'].includes(raw.weapon) || !['none','vest','helmet'].includes(raw.armor)) throw Error('Перевір спорядження.');
  if (!['unknown','eco','buy'].includes(raw.enemy)) throw Error('Перевір економіку суперника.');
  if (typeof raw.notes !== 'string' || raw.notes.length > 700) throw Error('Коментар має містити не більше 700 символів.');
  const round = number('round',1,120);
  return {map:raw.map, side:raw.side, money:number('money',0,16000), teamMoney:number('teamMoney',0,16000), round, losses:number('losses',0,5), weapon:raw.weapon, armor:raw.armor, enemy:raw.enemy, last:isDecisiveRound(round), notes:raw.notes.trim()};
}
