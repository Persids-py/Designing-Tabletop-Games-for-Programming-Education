import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AlarmState,alarmTasks,bootOrder} from '../src/alarm';
import {Game} from '../src/game';
import {spawn} from '../src/map';

test('四種題型判題、錯誤重試、輸出順序與解鎖條件',()=>{
  const alarm=new AlarmState();
  assert.equal(alarm.submit('verify',[...bootOrder]).success,false);
  for(const choice of ['B','C','D',''])assert.equal(alarm.submit('computer',choice).success,false);
  assert.equal(alarm.count,0);assert.deepEqual(alarm.submit('computer','A').output,['SYSTEM CHECK']);
  assert.equal(alarm.submit('computer','A').success,false);assert.equal(alarm.count,1);
  for(const symbol of ['(',')',':',''])assert.equal(alarm.submit('light',symbol).success,false);
  assert.equal(alarm.submit('light','"').success,true);
  for(const text of ['SIREN OFF','siren on',' SIREN ON','SIREN ON '])assert.equal(alarm.submit('broadcast',text).success,false);
  assert.equal(alarm.submit('broadcast','SIREN ON').success,true);assert.equal(alarm.ready,true);
  assert.equal(alarm.submit('verify',['SIREN ON','SYSTEM CHECK','RED LIGHT ON']).success,false);
  assert.equal(alarm.submit('verify',['SYSTEM CHECK','SYSTEM CHECK','SIREN ON']).success,false);
  assert.deepEqual(alarm.submit('verify',[...bootOrder]).output,[...bootOrder]);assert.equal(alarm.completed,true);
});
test('不能按占位維修跳過第一關，近距離提交、關閉保留與重玩重置',()=>{
  const game=new Game();game.player={...alarmTasks[0].point};assert.equal(game.open('room-1'),null);
  assert.equal(game.repair('room-1'),false);assert.equal(game.index,0);
  game.player={...spawn};assert.equal(game.submitAlarm('computer','A').success,false);
  for(const [i,task] of alarmTasks.slice(0,3).entries()){
    game.player={...task.point};assert.equal(game.openAlarm(task.id),null);
    assert.equal(game.submitAlarm(task.id,['A','"','SIREN ON'][i]).success,true);game.close();
    assert.equal(game.alarm.count,i+1);assert.equal(game.index,0);
  }
  game.player={...alarmTasks[3].point};assert.equal(game.openAlarm('verify'),null);
  assert.equal(game.submitAlarm('verify',[...bootOrder]).success,true);assert.equal(game.repair('room-1'),true);assert.equal(game.repair('room-1'),false);assert.equal(game.index,1);
  game.reset();assert.equal(game.alarm.count,0);assert.equal(game.alarm.ready,false);assert.equal(game.index,0);assert.equal(game.alarmTask,null);
});
test('前三個設備可獨立修復，導航持續指向尚未完成的設備',()=>{
  const state=new AlarmState();assert.equal(state.submit('broadcast','SIREN ON').success,true);
  assert.equal(state.next.id,'computer');assert.equal(state.ready,false);
  state.submit('computer','A');assert.equal(state.next.id,'light');
  state.submit('light','"');assert.equal(state.next.id,'verify');assert.equal(state.ready,true);
});
