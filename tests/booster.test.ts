import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BoosterState,boosterTasks,boosterRadius} from '../src/booster';
import {Game} from '../src/game';
import {spawn} from '../src/map';
test('函式宣告、乘法及 return 判定；前三項可獨立修復',()=>{
  const state=new BoosterState();assert.equal(state.submit('verify','0').success,false);
  for(const value of [';', '=', '!', '：'])assert.equal(state.submit('declaration',value).success,false);
  for(const value of ['+', '-', '/', '×'])assert.equal(state.submit('formula',value).success,false);
  for(const value of ['print(power)','return','return "power"','return 60','Return power','return power; run()'])assert.equal(state.submit('return',value).success,false);
  assert.equal(state.submit('return','    return power\n').success,true);
  assert.equal(state.submit('formula','*').success,true);assert.equal(state.submit('declaration',':').success,true);
  assert.equal(state.submit('declaration',':').success,false);assert.equal(state.ready,true);assert.equal(state.count,3);assert.equal(state.next.id,'verify');
});
test('三段推力按速度 0、10、20 依序測試，錯誤不點燈或提前完成',()=>{
  const state=new BoosterState();state.submit('declaration',':');state.submit('formula','*');state.submit('return','return power');
  for(const [i,value] of ['0','30','60'].entries()){
    for(const wrong of ['',null,'None','1e1','-1',value==='0'?'60':'0'])assert.equal(state.submit('verify',wrong).success,false);
    assert.equal(state.testOutputs.length,i);assert.equal(state.completed,false);
    assert.deepEqual(state.submit('verify',value).output,[value]);assert.equal(state.testOutputs.length,i+1);
  }
  assert.equal(state.completed,true);assert.equal(state.count,4);assert.deepEqual(state.testOutputs,[0,30,60]);assert.equal(state.submit('verify','60').success,false);
});
test('第六關守門、近距提交、部分測試保留、禁止占位維修與重玩',()=>{
  const game=new Game();assert.ok(game.openBooster('declaration'));game.index=5;assert.ok(game.openBooster('declaration'));
  game.player={...boosterTasks[0].point};assert.equal(game.submitBooster('declaration',':').success,false);assert.equal(game.open('room-6'),null);assert.equal(game.repair('room-6'),false);
  assert.equal(game.submitBooster('formula','*').success,false);game.player={...spawn};assert.equal(game.submitBooster('declaration',':').success,false);
  game.player={...boosterTasks[0].point};assert.equal(game.submitBooster('declaration',':').success,true);game.close();assert.ok(game.openBooster('verify'));
  for(const [i,value] of [[1,'*'],[2,'return power']] as const){const task=boosterTasks[i];game.player={...task.point};assert.equal(game.openBooster(task.id),null);assert.equal(game.submitBooster(task.id,value).success,true);game.close();}
  game.player={...boosterTasks[3].point};assert.equal(game.openBooster('verify'),null);assert.equal(game.submitBooster('verify','0').success,true);game.close();
  assert.deepEqual(game.booster.testOutputs,[0]);assert.equal(game.openBooster('verify'),null);assert.equal(game.repair('room-6'),false);
  assert.equal(game.submitBooster('verify','30').success,true);assert.equal(game.repair('room-6'),false);assert.equal(game.submitBooster('verify','60').success,true);
  game.player.x+=boosterRadius+1;assert.equal(game.repair('room-6'),false);game.player={...boosterTasks[3].point};assert.equal(game.repair('room-6'),true);assert.equal(game.repair('room-6'),false);
  assert.equal(game.index,6);game.reset();assert.equal(game.booster.count,0);assert.deepEqual(game.booster.testOutputs,[]);
});
