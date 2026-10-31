import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RepairHintState,alarmHintTasks,hintStorageKey} from '../src/repair-handbook';
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
