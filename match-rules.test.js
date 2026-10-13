import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePurchases} from './equipment.js';
import {isDecisiveRound} from './match-rules.js';
import {validate} from './coach.js';
const buy = (...ids) => ids.map(id => ({id,price:200}));

test('four grenades including two flashes are accepted',()=>{
  const items=normalizePurchases(buy('flash','flash','smoke','molotov'),'T');
  assert.equal(items.length,4);assert.equal(items[0].name,'Світлошумова граната');
  assert.equal(normalizePurchases(buy('flash','smoke','he','incendiary'),'CT').length,4);
});
test('grenade limits cannot be bypassed by alternative item names or quantities',()=>{
  for(const ids of [['flash','flash','flash'],['smoke','smoke'],['he','he'],['decoy','decoy'],['molotov','molotov'],['flash','flash','smoke','he','molotov']])assert.throws(()=>normalizePurchases(buy(...ids),'T'));
  assert.throws(()=>normalizePurchases([{id:'smoke',name:'Two smoke grenades',price:300}, {id:'smoke',name:'Дым',price:300}],'T'));
  assert.throws(()=>normalizePurchases([{id:'grenade bundle',price:900}],'T'));
  assert.throws(()=>normalizePurchases([{id:'smoke',quantity:2,price:600}],'T'));
});
test('fire grenades and side-specific equipment respect side',()=>{
  assert.throws(()=>normalizePurchases(buy('molotov'),'CT'));
  assert.throws(()=>normalizePurchases(buy('incendiary'),'T'));
  assert.throws(()=>normalizePurchases(buy('kit'),'T'));
  assert.throws(()=>normalizePurchases(buy('ak47'),'CT'));
  assert.equal(normalizePurchases(buy('incendiary','kit','m4a1s'),'CT').length,3);
});
test('all grenade multisets obey carrying limits',()=>{
  for(let flash=0;flash<=3;flash++)for(let smoke=0;smoke<=2;smoke++)for(let he=0;he<=2;he++)for(let decoy=0;decoy<=2;decoy++)for(let fire=0;fire<=2;fire++){
    const ids=[...Array(flash).fill('flash'),...Array(smoke).fill('smoke'),...Array(he).fill('he'),...Array(decoy).fill('decoy'),...Array(fire).fill('molotov')];
    const legal=flash<=2&&smoke<=1&&he<=1&&decoy<=1&&fire<=1&&ids.length<=4;
    if(legal)assert.equal(normalizePurchases(buy(...ids),'T').length,ids.length);
    else assert.throws(()=>normalizePurchases(buy(...ids),'T'));
  }
});
test('end-of-period rounds are derived by server, never chosen by caller',()=>{
  const raw={map:'Mirage',side:'CT',money:3200,teamMoney:3200,round:8,losses:2,weapon:'none',armor:'none',enemy:'unknown',notes:''};
  const expected=[12,24,30,36,42,48,54,60,66,72,78,84,90,96,102,108,114,120];
  for(let round=1;round<=120;round++){
    const decisive=expected.includes(round);assert.equal(isDecisiveRound(round),decisive);
    assert.equal(validate({...raw,round,last:!decisive}).last,decisive);
  }
  assert.equal(isDecisiveRound(12.5),false);
  assert.throws(()=>validate({...raw,round:121}));
});
