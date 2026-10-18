import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CargoState,cargoTasks,cargoRadius} from '../src/cargo';
import {Game} from '../src/game';
import {spawn} from '../src/map';
test('串列刪除、重編索引與插入，依序更新貨箱且拒絕錯誤索引',()=>{
  const state=new CargoState();assert.deepEqual(state.boxes,['A','B','C','D']);
  assert.equal(state.submit('index','2').success,false);assert.equal(state.submit('insert','1').success,false);
  for(const value of ['A','C','D'])assert.equal(state.submit('remove',value).success,false);
  assert.equal(state.submit('remove','B').success,true);assert.deepEqual(state.boxes,['A','C','D']);
  assert.equal(state.submit('remove','B').success,false);assert.equal(state.submit('insert','1').success,false);
  for(const value of ['3','1','-1','2.0','2; run()',null])assert.equal(state.submit('index',value).success,false);
  assert.deepEqual(state.submit('index','2').output,['D 工具箱']);
  for(const value of ['0','2','4',1])assert.equal(state.submit('insert',value).success,false);
  assert.equal(state.submit('insert','1').success,true);assert.deepEqual(state.boxes,['A','E','C','D']);assert.equal(state.ready,true);
  const copy=state.boxes;copy.pop();assert.equal(state.boxes.length,4);
});
test('最終總數、四箱順序與領取物資必須全部正確',()=>{
  const state=new CargoState(),answer={count:'4',order:['A','E','C','D'],item:'D'};
  assert.equal(state.submit('verify',answer).success,false);state.submit('remove','B');state.submit('index','2');state.submit('insert','1');
  for(const wrong of [{...answer,count:'3'},{...answer,order:['A','C','E','D']},{...answer,item:'C'},{...answer,order:['A','B','C','D']},{...answer,order:['A','E','D']},{...answer,count:4},null])assert.equal(state.submit('verify',wrong).success,false);
  assert.equal(state.count,3);assert.equal(state.completed,false);assert.equal(state.submit('verify',answer).success,true);assert.equal(state.completed,true);assert.equal(state.submit('verify',answer).success,false);
});
test('第七關守門、距離、關閉保留、不能以占位維修跳過及重置',()=>{
  const game=new Game();assert.ok(game.openCargo('remove'));game.index=6;assert.ok(game.openCargo('remove'));
  game.player={...cargoTasks[0].point};assert.equal(game.submitCargo('remove','B').success,false);assert.equal(game.open('room-7'),null);assert.equal(game.repair('room-7'),false);
  assert.equal(game.submitCargo('index','2').success,false);game.player={...spawn};assert.equal(game.submitCargo('remove','B').success,false);
  game.player={...cargoTasks[0].point};assert.equal(game.submitCargo('remove','B').success,true);game.close();assert.deepEqual(game.cargo.boxes,['A','C','D']);assert.ok(game.openCargo('verify'));
  for(const [i,value] of [[1,'2'],[2,'1']] as const){const task=cargoTasks[i];game.player={...task.point};assert.equal(game.openCargo(task.id),null);assert.equal(game.submitCargo(task.id,value).success,true);game.close();}
  game.player={...cargoTasks[3].point};assert.equal(game.openCargo('verify'),null);assert.equal(game.repair('room-7'),false);assert.equal(game.submitCargo('verify',{count:'4',order:['A','E','C','D'],item:'D'}).success,true);
  game.player.x+=cargoRadius+1;assert.equal(game.repair('room-7'),false);game.player={...cargoTasks[3].point};assert.equal(game.repair('room-7'),true);assert.equal(game.repair('room-7'),false);
  assert.equal(game.index,7);game.reset();assert.equal(game.cargo.count,0);assert.deepEqual(game.cargo.boxes,['A','B','C','D']);
});
