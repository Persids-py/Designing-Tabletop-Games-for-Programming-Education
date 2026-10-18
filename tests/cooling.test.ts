import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CoolingState,coolingTasks,coolingRadius,simulateCoolingStep} from '../src/cooling';
import {Game} from '../src/game';
import {spawn} from '../src/map';

test('冷卻單次模擬有界，零降溫不停止、每次降十度及循環計數指令',()=>{
  assert.equal(simulateCoolingStep('0'),100);assert.equal(simulateCoolingStep('10'),90);assert.equal(simulateCoolingStep('100'),0);
  for(const value of ['',null,{},'1e1','10.0','-10','101','while True:','10;alert(1)'])assert.equal(simulateCoolingStep(value),null);
  const state=new CoolingState();
  assert.equal(state.submit('verify',['90','80','70','60','4','60']).success,false);
  for(const value of ['B','C','D'])assert.equal(state.submit('cause',value).success,false);
  assert.equal(state.submit('cause','A').success,true);assert.equal(state.submit('cause','A').success,false);
  for(const value of ['0','20','40'])assert.equal(state.submit('drop',value).success,false);
  assert.equal(state.submit('drop','10').success,true);
  for(const value of ['cycles = 0','cycles -= 1','cycles == 1','cycles += 2','cycles += 1; run()'])assert.equal(state.submit('counter',value).success,false);
  assert.equal(state.submit('counter','    cycles += 1\n').success,true);assert.equal(state.ready,true);assert.equal(state.count,3);
});
test('冷卻最終推理檢查四次輸出、停止溫度與次數，三項可獨立修復',()=>{
  const state=new CoolingState();state.submit('counter','cycles += 1');state.submit('drop','10');state.submit('cause','A');
  const expected=['90','80','70','60','4','60'];
  for(let i=0;i<6;i++){const wrong=[...expected];wrong[i]=i===4?'5':'100';assert.equal(state.submit('verify',wrong).success,false);}
  for(const value of [expected.slice(0,5),[...expected,'50'],['9e1','80','70','60','4','60']])assert.equal(state.submit('verify',value).success,false);
  assert.equal(state.count,3);assert.equal(state.next.id,'verify');assert.equal(state.completed,false);
  const result=state.submit('verify',expected);assert.equal(result.success,true);assert.deepEqual(result.output,['90','80','70','60','循環次數: 4','結束溫度: 60°C']);assert.equal(state.completed,true);
});
test('第五關的關卡、面板與距離守門，關閉保留、禁止占位通關及重置',()=>{
  const game=new Game();assert.ok(game.openCooling('cause'));game.index=4;
  assert.ok(game.openCooling('cause'));game.player={...coolingTasks[0].point};assert.equal(game.submitCooling('cause','A').success,false);
  assert.equal(game.open('room-5'),null);assert.equal(game.repair('room-5'),false);
  assert.equal(game.submitCooling('counter','cycles += 1').success,false);
  game.player={...spawn};assert.equal(game.submitCooling('cause','A').success,false);
  game.player={...coolingTasks[0].point};assert.equal(game.submitCooling('cause','A').success,true);game.close();assert.equal(game.cooling.count,1);assert.ok(game.openCooling('verify'));
  for(const [i,answer] of [[1,'10'],[2,'cycles += 1']] as const){const task=coolingTasks[i];game.player={...task.point};assert.equal(game.openCooling(task.id),null);assert.equal(game.submitCooling(task.id,answer).success,true);game.close();}
  game.player={...coolingTasks[3].point};assert.equal(game.openCooling('verify'),null);assert.equal(game.repair('room-5'),false);
  assert.equal(game.submitCooling('verify',['90','80','70','60','4','60']).success,true);
  game.player.x+=coolingRadius+1;assert.equal(game.repair('room-5'),false);game.player={...coolingTasks[3].point};assert.equal(game.repair('room-5'),true);assert.equal(game.repair('room-5'),false);
  assert.equal(game.index,5);game.reset();assert.equal(game.cooling.count,0);assert.equal(game.cooling.completed,false);
});
