import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CrewState,crewTasks,crewRadius,queryCrew,crewAccess} from '../src/crew';
import {Game} from '../src/game';
import {spawn} from '../src/map';
test('巢狀字典姓名、level 與 get 查詢；未知角色安全拒絕',()=>{
  assert.deepEqual(queryCrew('engineer'),{name:'Chen',level:2});
  for(const role of ['pilot','toString','__proto__','Engineer']){assert.equal(queryCrew(role),null);assert.equal(crewAccess(role,2),false);}
  assert.equal(crewAccess('engineer',2),true);assert.equal(crewAccess('medic',2),false);assert.equal(crewAccess('captain',2),true);
  const state=new CrewState();
  for(const answer of [{role:'engineer',key:'pilot'},{role:'captain',key:'engineer'},{key:'engineer'},'engineer'])assert.equal(state.submit('lookup',answer).success,false);
  for(const key of ['name','job','password'])assert.equal(state.submit('level',key).success,false);
  for(const value of ['A','C','D'])assert.equal(state.submit('safe',value).success,false);
  assert.deepEqual(state.submit('safe','B').output,['None']);assert.deepEqual(state.submit('level','level').output,['2']);
  assert.deepEqual(state.submit('lookup',{role:'engineer',key:'engineer'}).output,['Chen']);assert.equal(state.ready,true);assert.equal(state.submit('lookup',{role:'engineer',key:'engineer'}).success,false);
});
test('最低等級必須為 2，三組允許／拒絕結果皆須正確',()=>{
  const state=new CrewState(),answer={threshold:'2',decisions:['GRANTED','DENIED','DENIED']};
  assert.equal(state.submit('verify',answer).success,false);state.submit('lookup',{role:'engineer',key:'engineer'});state.submit('level','level');state.submit('safe','B');
  for(const wrong of [{...answer,threshold:'1'},{...answer,threshold:'3'},{...answer,threshold:2},{...answer,threshold:'2;run()'},...answer.decisions.map((_,i)=>({...answer,decisions:answer.decisions.map((v,j)=>i===j?(v==='GRANTED'?'DENIED':'GRANTED'):v)})),{...answer,decisions:['GRANTED','DENIED']},null])assert.equal(state.submit('verify',wrong).success,false);
  assert.equal(state.count,3);assert.deepEqual(state.submit('verify',answer).output,['engineer: ACCESS GRANTED','medic: ACCESS DENIED','pilot: ACCESS DENIED']);assert.equal(state.completed,true);
});
test('第八關守門、面板與距離限制、關閉保留及重玩重置',()=>{
  const game=new Game();assert.ok(game.openCrew('lookup'));game.index=7;assert.ok(game.openCrew('lookup'));game.player={...crewTasks[0].point};assert.equal(game.submitCrew('lookup',{role:'engineer',key:'engineer'}).success,false);
  assert.equal(game.open('room-8'),null);assert.equal(game.repair('room-8'),false);assert.equal(game.submitCrew('level','level').success,false);
  game.player={...spawn};assert.equal(game.submitCrew('lookup',{role:'engineer',key:'engineer'}).success,false);game.player={...crewTasks[0].point};assert.equal(game.submitCrew('lookup',{role:'engineer',key:'engineer'}).success,true);game.close();assert.equal(game.crew.count,1);assert.ok(game.openCrew('verify'));
  for(const [i,value] of [[1,'level'],[2,'B']] as const){const task=crewTasks[i];game.player={...task.point};assert.equal(game.openCrew(task.id),null);assert.equal(game.submitCrew(task.id,value).success,true);game.close();}
  game.player={...crewTasks[3].point};assert.equal(game.openCrew('verify'),null);assert.equal(game.repair('room-8'),false);assert.equal(game.submitCrew('verify',{threshold:'2',decisions:['GRANTED','DENIED','DENIED']}).success,true);
  game.player.x+=crewRadius+1;assert.equal(game.repair('room-8'),false);game.player={...crewTasks[3].point};assert.equal(game.repair('room-8'),true);assert.equal(game.repair('room-8'),false);assert.equal(game.index,8);game.reset();assert.equal(game.crew.count,0);assert.equal(game.crew.completed,false);
});
