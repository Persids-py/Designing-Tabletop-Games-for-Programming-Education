import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GeneratorState,generatorTasks,assignmentOrder} from '../src/generator';
import {Game} from '../src/game';
import {alarmTasks,bootOrder} from '../src/alarm';
import {spawn} from '../src/map';

function reachRoomTwo(){const game=new Game();for(const [i,task] of alarmTasks.entries()){
  game.player={...task.point};assert.equal(game.openAlarm(task.id),null);assert.equal(game.submitAlarm(task.id,['A','"','SIREN ON',[...bootOrder]][i]).success,true);
}assert.equal(game.repair('room-1'),true);return game;}
test('賦值方向、變數拼字、讀取數值及覆寫後輸出',()=>{
  const state=new GeneratorState();
  assert.equal(state.submit('display','print(target_voltage)').success,false);
  assert.equal(state.submit('verify','B').success,false);
  for(const answer of [['220','=','target_voltage'],['target_voltage','220','='],['target_voltage','=','110']])assert.equal(state.submit('main',answer).success,false);
  assert.equal(state.mainVoltage,null);assert.equal(state.submit('main',[...assignmentOrder]).success,true);assert.equal(state.mainVoltage,220);
  for(const name of ['back_voltage','Backup_voltage','backup voltage','backup_voltage = 110'])assert.equal(state.submit('backup',name).success,false);
  assert.equal(state.submit('backup','backup_voltage').success,true);assert.equal(state.backupVoltage,110);
  for(const code of ['print("target_voltage")','print(220)','print(backup_voltage)','print(target_voltage); anything()','print\n(target_voltage)'])assert.equal(state.submit('display',code).success,false);
  assert.equal(state.submit('display','print ( target_voltage )').success,true);assert.equal(state.ready,true);
  for(const answer of ['A','C','D',''])assert.equal(state.submit('verify',answer).success,false);
  assert.deepEqual(state.submit('verify','B').output,['220','110']);assert.equal(state.completed,true);assert.equal(state.submit('verify','B').success,false);
});
test('第一關解鎖、近距提交、設備保留、禁止占位通關與重玩重置',()=>{
  const locked=new Game();locked.player={...generatorTasks[0].point};assert.ok(locked.openGenerator('main'));
  const game=reachRoomTwo();game.player={...generatorTasks[3].point};assert.ok(game.openGenerator('verify'));assert.ok(game.openGenerator('display'));
  game.player={...generatorTasks[0].point};assert.equal(game.openGenerator('main'),null);assert.equal(game.repair('room-2'),false);
  game.player={...spawn};assert.equal(game.submitGenerator('main',[...assignmentOrder]).success,false);
  for(const [i,task] of generatorTasks.slice(0,3).entries()){
    game.player={...task.point};assert.equal(game.openGenerator(task.id),null);
    assert.equal(game.submitGenerator(task.id,[[...assignmentOrder],'backup_voltage','print(target_voltage)'][i]).success,true);game.close();
    assert.equal(game.generator.count,i+1);assert.equal(game.index,1);
  }
  game.player={...generatorTasks[3].point};assert.equal(game.openGenerator('verify'),null);assert.equal(game.submitGenerator('verify','B').success,true);
  assert.equal(game.repair('room-2'),true);assert.equal(game.repair('room-2'),false);assert.equal(game.index,2);
  assert.equal(game.alarm.completed,true);game.reset();assert.equal(game.generator.count,0);assert.equal(game.generatorTask,null);assert.equal(game.generator.mainVoltage,null);assert.equal(game.generator.backupVoltage,null);assert.equal(game.alarm.count,0);
});
test('備用設備可先修復，主電壓未設定前不開放顯示器',()=>{
  const state=new GeneratorState();assert.equal(state.submit('backup','backup_voltage').success,true);assert.equal(state.next.id,'main');
  assert.ok(state.blocked('display'));state.submit('main',[...assignmentOrder]);assert.equal(state.blocked('display'),null);assert.equal(state.next.id,'display');
});
