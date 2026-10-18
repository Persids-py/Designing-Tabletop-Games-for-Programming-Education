import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RadarState,radarTasks,radarRadius,radarSignals,noiseSignals,summarizeSignals} from '../src/radar';
import {Game} from '../src/game';
import {spawn} from '../src/map';
test('訊號整數轉換、ValueError 與例外積木，不接受錯誤順序',()=>{
  assert.deepEqual(summarizeSignals(radarSignals),{total:50,errors:2,valid:[true,false,true,false,true]});
  assert.deepEqual(summarizeSignals(noiseSignals),{total:0,errors:2,valid:[false,false]});assert.deepEqual(summarizeSignals([]),{total:0,errors:0,valid:[]});
  assert.deepEqual(summarizeSignals(['0',' -3 ','+5','15x','1.5','']),{total:2,errors:3,valid:[true,true,true,false,false,false]});
  const state=new RadarState();for(const value of ['A','B','D'])assert.equal(state.submit('error',value).success,false);
  for(const answer of [['except ValueError:','try:'],['try:','else:'],['try:','finally:'],['try'],['try:','except ValueError:','else:']])assert.equal(state.submit('blocks',answer).success,false);
  assert.equal(state.submit('blocks',['try:','except ValueError:']).success,true);assert.equal(state.submit('error','C').success,true);assert.equal(state.submit('error','C').success,false);
});
test('五張訊號分類與總和全對，最後修復計數器且兩組資料皆通過',()=>{
  const state=new RadarState(),sum={labels:['valid','noise','valid','noise','valid'],total:'50'},verify={code:'errors += 1',outputs:['50','2','0','2']};
  assert.equal(state.submit('verify',verify).success,false);
  for(const wrong of [{...sum,total:'40'},{...sum,labels:['valid','valid','valid','noise','valid']},{...sum,labels:['valid','noise','valid','noise']},{...sum,total:50}])assert.equal(state.submit('sum',wrong).success,false);
  assert.equal(state.submit('sum',sum).success,true);state.submit('blocks',['try:','except ValueError:']);state.submit('error','C');assert.equal(state.ready,true);
  for(const code of ['pass','errors = 1','errors -= 1','errors == 1','errors += 1;run()'])assert.equal(state.submit('verify',{...verify,code}).success,false);
  for(let i=0;i<4;i++){const outputs=[...verify.outputs];outputs[i]='9';assert.equal(state.submit('verify',{...verify,outputs}).success,false);}
  assert.equal(state.count,3);assert.equal(state.submit('verify',{...verify,code:'    errors += 1\n'}).success,true);assert.equal(state.completed,true);
});
test('第九關前置、距離與面板守門，關閉保留、重複結算與重置',()=>{
  const game=new Game();assert.ok(game.openRadar('error'));game.index=8;assert.ok(game.openRadar('error'));game.player={...radarTasks[0].point};assert.equal(game.submitRadar('error','C').success,false);assert.equal(game.open('room-9'),null);assert.equal(game.repair('room-9'),false);
  assert.equal(game.submitRadar('blocks',['try:','except ValueError:']).success,false);game.player={...spawn};assert.equal(game.submitRadar('error','C').success,false);game.player={...radarTasks[0].point};assert.equal(game.submitRadar('error','C').success,true);game.close();assert.equal(game.radar.count,1);assert.ok(game.openRadar('verify'));
  for(const [i,answer] of [[1,['try:','except ValueError:']],[2,{labels:['valid','noise','valid','noise','valid'],total:'50'}]] as const){const task=radarTasks[i];game.player={...task.point};assert.equal(game.openRadar(task.id),null);assert.equal(game.submitRadar(task.id,answer).success,true);game.close();}
  game.player={...radarTasks[3].point};assert.equal(game.openRadar('verify'),null);assert.equal(game.repair('room-9'),false);assert.equal(game.submitRadar('verify',{code:'errors += 1',outputs:['50','2','0','2']}).success,true);
  game.player.x+=radarRadius+1;assert.equal(game.repair('room-9'),false);game.player={...radarTasks[3].point};assert.equal(game.repair('room-9'),true);assert.equal(game.repair('room-9'),false);assert.equal(game.index,9);game.reset();assert.equal(game.radar.count,0);assert.equal(game.radar.completed,false);
});
