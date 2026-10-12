import test from 'node:test';
import assert from 'node:assert/strict';
import {maps,validate,recommend} from './coach.js';
const base={map:'Mirage',side:'CT',money:3200,teamMoney:3200,round:8,losses:2,weapon:'none',armor:'none',enemy:'unknown',last:false,notes:''};
test('all plans respect individual budgets and grenade limits',()=>{
  for(const map of Object.keys(maps))for(const side of ['T','CT'])for(const money of [0,200,800,1200,2600,4300,16000])for(const teamMoney of [800,2500,6000])for(const round of [1,8,13,24]){
    const p=recommend({...base,map,side,money,teamMoney,round});assert.ok(p.cost<=money);assert.equal(p.balance,money-p.cost);assert.ok(p.items.filter(i=>['Smoke','Flash','HE'].includes(i.name)).length<=4);assert.ok(p.items.filter(i=>i.name==='Flash').length<=2);
    if(side==='T')assert.ok(!p.items.some(i=>i.name==='Defuse kit'));assert.ok(p.roles.length>0 && p.steps.length===4);
  }
});
test('eco, full buy and decisive rounds differ',()=>{
  assert.equal(recommend({...base,teamMoney:1000}).type,'Эко');
  assert.equal(recommend({...base,teamMoney:6000}).type,'Фулл-бай');
  assert.equal(recommend({...base,last:true}).type,'Форс');
});
test('saved weapons are not repurchased',()=>{
  const p=recommend({...base,money:6000,teamMoney:6000,weapon:'awp',armor:'helmet'});assert.ok(!p.items.some(i=>/AK|M4|FAMAS|Galil|MP9|MAC|Броня|Шлем/.test(i.name)));
});
test('invalid inputs are rejected',()=>{
  for(const patch of [{money:-1},{money:16001},{round:0},{money:''},{side:'other'},{map:'unknown'},{notes:'x'.repeat(701)}])assert.throws(()=>validate({...base,...patch}));
  assert.equal(validate({...base,money:'3200'}).money,3200);
});
