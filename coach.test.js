import test from 'node:test';
import assert from 'node:assert/strict';
import {validate} from './coach.js';
const base={map:'Mirage',side:'CT',money:3200,teamMoney:3200,round:8,losses:2,weapon:'none',armor:'none',enemy:'unknown',last:false,notes:''};
test('valid form values normalize without choosing a strategy',()=>{
  assert.deepEqual(validate({...base,money:'3200',notes:'  enemy pushes B  '}),{...base,notes:'enemy pushes B'});
  assert.equal(validate({...base,money:0}).money,0);
});
test('invalid and coercible nonnumeric inputs are rejected',()=>{
  for(const patch of [{money:-1},{money:16001},{round:0},{money:''},{money:' '},{money:[]},{money:true},{side:'other'},{map:'unknown'},{map:'__proto__'},{map:'constructor'},{notes:'x'.repeat(701)},{weapon:'other'},{armor:'other'},{enemy:'other'}])assert.throws(()=>validate({...base,...patch}));
});
