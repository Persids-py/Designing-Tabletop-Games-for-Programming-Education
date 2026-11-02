import {coolingTasks} from '../src/cooling';
import {airlockTasks} from '../src/airlock';
import {lifeSupportTasks} from '../src/life-support';
import {generatorTasks} from '../src/generator';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RepairHintState,alarmHintTasks,generatorHintTasks,lifeSupportHintTasks,airlockHintTasks,coolingHintTasks,hintStorageKey} from '../src/repair-handbook';
import {Game} from '../src/game';
import {alarmTasks} from '../src/alarm';
function store(){const data=new Map<string,string>();return {data,get:()=>({getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);},removeItem:(k:string)=>{data.delete(k);}})};}
test('第一關四題穩定對照與三層提示，禁止跳級及未解鎖診斷',()=>{
  const state=new RepairHintState(store().get);
  assert.deepEqual(Object.values(alarmHintTasks).map(t=>t.taskId),['1-1','1-2','1-3','1-4']);
  for(const id of ['computer','light','broadcast','verify'] as const){
    assert.equal(alarmHintTasks[id].hints.length,3);assert.equal(state.reveal(id,2),false);assert.equal(state.reveal(id,1),true);assert.equal(state.reveal(id,1),false);assert.equal(state.reveal(id,2),true);
    assert.equal(state.reveal(id,3),false);state.recordFailure(id);assert.equal(state.reveal(id,3),false);state.recordFailure(id);assert.equal(state.reveal(id,3),true);assert.equal(state.get(id).diagnosisUnlocked,true);assert.equal(state.reveal(id,3),false);
  }
});
test('提示和錯誤逐題獨立、持久保存與重玩清除',()=>{
  const memory=store(),state=new RepairHintState(memory.get);state.reveal('computer',1);state.recordFailure('computer');state.recordFailure('computer');state.reveal('computer',2);state.reveal('computer',3);
  const loaded=new RepairHintState(memory.get);assert.deepEqual(loaded.get('computer'),{revealedHintLevel:3,attemptCount:2,diagnosisUnlocked:true});assert.equal(loaded.get('light').revealedHintLevel,0);loaded.reset();assert.equal(memory.data.has(hintStorageKey),false);assert.equal(loaded.get('computer').attemptCount,0);
});
test('損毀、異常儲存與偽造診斷旗標不讓遊戲崩潰或跳過門檻',()=>{
  const memory=store();memory.data.set(hintStorageKey,JSON.stringify({'1-1':{revealedHintLevel:3,attemptCount:0,diagnosisUnlocked:true},'1-2':{attemptCount:-5,revealedHintLevel:-1}}));const state=new RepairHintState(memory.get);assert.equal(state.get('computer').revealedHintLevel,2);assert.equal(state.get('computer').diagnosisUnlocked,false);assert.equal(state.get('light').attemptCount,0);
  memory.data.set(hintStorageKey,'broken');assert.equal(new RepairHintState(memory.get).get('computer').revealedHintLevel,0);
  const denied=new RepairHintState(()=>{throw Error('denied');});assert.doesNotThrow(()=>{denied.recordFailure('light');denied.reveal('light',1);denied.reset();});
});
test('只有正式錯誤答案計次：遠距、未開面板、已修好、前置未完成不計次',()=>{
  const game=new Game();assert.equal(game.submitAlarm('computer','B').success,false);assert.equal(game.hints.get('computer').attemptCount,0);
  game.player={...alarmTasks[0].point};game.openAlarm('computer');game.submitAlarm('computer','B');assert.equal(game.hints.get('computer').attemptCount,1);game.close();assert.equal(game.hints.get('computer').attemptCount,1);
  game.openAlarm('computer');game.submitAlarm('computer','A');game.submitAlarm('computer','B');assert.equal(game.hints.get('computer').attemptCount,1);
  game.player={...alarmTasks[3].point};game.submitAlarm('verify',[]);assert.equal(game.hints.get('verify').attemptCount,0);game.reset();assert.equal(game.hints.get('computer').attemptCount,0);
});


test('第二關四題隔離、診斷門檻及跨載入保存，不與第一關 verify 共用',()=>{
  const memory=store(),state=new RepairHintState(memory.get);
  assert.deepEqual(Object.values(generatorHintTasks).map(t=>t.taskId),['2-1','2-2','2-3','2-4']);
  for(const task of Object.values(generatorHintTasks)){
    assert.equal(state.reveal(task.taskId,2),false);
    assert.equal(state.reveal(task.taskId,1),true);assert.equal(state.reveal(task.taskId,2),true);
    state.recordFailure(task.taskId);assert.equal(state.reveal(task.taskId,3),false);
    state.recordFailure(task.taskId);assert.equal(state.reveal(task.taskId,3),true);
  }
  const loaded=new RepairHintState(memory.get);
  assert.equal(loaded.get('2-4').revealedHintLevel,3);assert.equal(loaded.get('verify').revealedHintLevel,0);
  assert.equal(loaded.get('2-1').attemptCount,2);assert.equal(loaded.get('computer').attemptCount,0);
  loaded.reset();assert.equal(loaded.get('2-4').attemptCount,0);
});

test('第二關僅有效正式錯答計次，前置、遠距、未開面板與已完成不計次',()=>{
  const game=new Game();game.index=1;
  game.submitGenerator('main',[]);assert.equal(game.hints.get('2-1').attemptCount,0);
  game.player={...generatorTasks[0].point};game.openGenerator('main');
  game.submitGenerator('main',[]);assert.equal(game.hints.get('2-1').attemptCount,1);
  game.submitGenerator('main',['target_voltage','=','220']);game.submitGenerator('main',[]);
  assert.equal(game.hints.get('2-1').attemptCount,1);
  game.player={x:0,y:0};game.submitGenerator('main',[]);assert.equal(game.hints.get('2-1').attemptCount,1);
  game.player={...generatorTasks[3].point};game.generatorTask='verify';game.submitGenerator('verify','A');
  assert.equal(game.hints.get('2-4').attemptCount,0);game.reset();assert.equal(game.hints.get('2-1').attemptCount,0);
});


test('第三關四題依序解鎖、持久化與跨關隔離，重玩清除',()=>{
  const memory=store(),state=new RepairHintState(memory.get);
  assert.deepEqual(Object.values(lifeSupportHintTasks).map(t=>t.taskId),['3-1','3-2','3-3','3-4']);
  for(const task of Object.values(lifeSupportHintTasks)){
    assert.equal(state.reveal(task.taskId,2),false);
    assert.equal(state.reveal(task.taskId,1),true);assert.equal(state.reveal(task.taskId,2),true);
    state.recordFailure(task.taskId);assert.equal(state.reveal(task.taskId,3),false);
    state.recordFailure(task.taskId);assert.equal(state.reveal(task.taskId,3),true);
  }
  const loaded=new RepairHintState(memory.get);
  assert.equal(loaded.get('3-4').revealedHintLevel,3);assert.equal(loaded.get('2-4').revealedHintLevel,0);assert.equal(loaded.get('verify').revealedHintLevel,0);
  assert.equal(loaded.get('3-1').attemptCount,2);assert.equal(loaded.get('2-1').attemptCount,0);
  loaded.reset();assert.equal(loaded.get('3-4').attemptCount,0);
});

test('第三關正式錯答計次，拒絕遠距、未開面板、前置未完成及重複提交計次',()=>{
  const game=new Game();game.index=2;
  game.submitLifeSupport('main','bad');assert.equal(game.hints.get('3-1').attemptCount,0);
  game.player={...lifeSupportTasks[0].point};game.openLifeSupport('main');
  game.submitLifeSupport('main','bad');assert.equal(game.hints.get('3-1').attemptCount,1);
  game.player={x:0,y:0};game.submitLifeSupport('main','bad');assert.equal(game.hints.get('3-1').attemptCount,1);
  game.player={...lifeSupportTasks[0].point};game.submitLifeSupport('main','total = int(main_energy) + aux_energy');game.submitLifeSupport('main','bad');assert.equal(game.hints.get('3-1').attemptCount,1);
  game.player={...lifeSupportTasks[3].point};game.lifeSupportTask='verify';game.submitLifeSupport('verify','155');assert.equal(game.hints.get('3-4').attemptCount,0);
  game.reset();assert.equal(game.hints.get('3-1').attemptCount,0);
});


test('第四關四題分別保存與依序解鎖，兩次錯答才可診斷且不影響前三關',()=>{
  const memory=store(),state=new RepairHintState(memory.get);
  assert.deepEqual(Object.values(airlockHintTasks).map(t=>t.taskId),['4-1','4-2','4-3','4-4']);
  for(const task of Object.values(airlockHintTasks)){
    assert.equal(state.reveal(task.taskId,3),false);assert.equal(state.reveal(task.taskId,1),true);
    assert.equal(state.reveal(task.taskId,2),true);state.recordFailure(task.taskId);
    assert.equal(state.reveal(task.taskId,3),false);state.recordFailure(task.taskId);assert.equal(state.reveal(task.taskId,3),true);
  }
  const loaded=new RepairHintState(memory.get);
  assert.deepEqual(loaded.get('4-4'),{attemptCount:2,revealedHintLevel:3,diagnosisUnlocked:true});
  for(const id of ['verify','2-4','3-4'])assert.equal(loaded.get(id).attemptCount,0);
  loaded.reset();assert.equal(loaded.get('4-1').revealedHintLevel,0);
});

test('第四關僅正式錯答計次，前置、距離、關閉、成功及重複提交均不誤計',()=>{
  const game=new Game();game.index=3;game.submitAirlock('colon',';');assert.equal(game.hints.get('4-1').attemptCount,0);
  game.player={...airlockTasks[0].point};game.openAirlock('colon');game.submitAirlock('colon',';');assert.equal(game.hints.get('4-1').attemptCount,1);
  game.player={x:0,y:0};game.submitAirlock('colon',';');assert.equal(game.hints.get('4-1').attemptCount,1);
  game.player={...airlockTasks[0].point};game.submitAirlock('colon',':');game.submitAirlock('colon',';');assert.equal(game.hints.get('4-1').attemptCount,1);
  game.player={...airlockTasks[3].point};game.airlockTask='verify';game.submitAirlock('verify',[]);assert.equal(game.hints.get('4-4').attemptCount,0);
  game.close();assert.equal(game.hints.get('4-1').attemptCount,1);game.reset();assert.equal(game.hints.get('4-1').attemptCount,0);
});


test('第五關四題提示依序解鎖、持久保存，與前四關紀錄隔離',()=>{
  const memory=store(),state=new RepairHintState(memory.get);
  assert.deepEqual(Object.values(coolingHintTasks).map(t=>t.taskId),['5-1','5-2','5-3','5-4']);
  for(const task of Object.values(coolingHintTasks)){
    assert.equal(state.reveal(task.taskId,2),false);assert.equal(state.reveal(task.taskId,1),true);
    assert.equal(state.reveal(task.taskId,2),true);state.recordFailure(task.taskId);
    assert.equal(state.reveal(task.taskId,3),false);state.recordFailure(task.taskId);assert.equal(state.reveal(task.taskId,3),true);
  }
  const loaded=new RepairHintState(memory.get);
  assert.deepEqual(loaded.get('5-4'),{attemptCount:2,revealedHintLevel:3,diagnosisUnlocked:true});
  for(const id of ['verify','2-4','3-4','4-4'])assert.equal(loaded.get(id).attemptCount,0);
  loaded.reset();assert.equal(loaded.get('5-1').revealedHintLevel,0);
});

test('第五關只計有效正式錯答，拒絕前置、遠距、未開面板與重複提交計次',()=>{
  const game=new Game();game.index=4;game.submitCooling('cause','B');assert.equal(game.hints.get('5-1').attemptCount,0);
  game.player={...coolingTasks[0].point};game.openCooling('cause');game.submitCooling('cause','B');assert.equal(game.hints.get('5-1').attemptCount,1);
  game.player={x:0,y:0};game.submitCooling('cause','B');assert.equal(game.hints.get('5-1').attemptCount,1);
  game.player={...coolingTasks[0].point};game.submitCooling('cause','A');game.submitCooling('cause','B');assert.equal(game.hints.get('5-1').attemptCount,1);
  game.player={...coolingTasks[3].point};game.coolingTask='verify';game.submitCooling('verify',[]);assert.equal(game.hints.get('5-4').attemptCount,0);
  game.close();assert.equal(game.hints.get('5-1').attemptCount,1);game.reset();assert.equal(game.hints.get('5-1').attemptCount,0);
});
