import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LifeSupportState,lifeSupportTasks,evaluateEnergyExpression} from '../src/life-support';
import {Game} from '../src/game';
import {alarmTasks,bootOrder} from '../src/alarm';
import {generatorTasks,assignmentOrder} from '../src/generator';
import {spawn} from '../src/map';

const answers=['total = int(main_energy) + aux_energy','-','backup_energy = int(backup) * cells','120 - 15 + 50'];
function readyState(){const state=new LifeSupportState();for(const [i,task] of lifeSupportTasks.slice(0,3).entries())assert.equal(state.submit(task.id,answers[i]).success,true);return state;}
function reachRoomThree(){
  const game=new Game();for(const [i,task] of alarmTasks.entries()){
    game.player={...task.point};assert.equal(game.openAlarm(task.id),null);assert.equal(game.submitAlarm(task.id,['A','"','SIREN ON',[...bootOrder]][i]).success,true);
  }assert.equal(game.repair('room-1'),true);
  for(const [i,task] of generatorTasks.entries()){
    game.player={...task.point};assert.equal(game.openGenerator(task.id),null);assert.equal(game.submitGenerator(task.id,[[...assignmentOrder],'backup_voltage','print(target_voltage)','B'][i]).success,true);
  }assert.equal(game.repair('room-2'),true);return game;
}
test('主能源整數轉型、消耗運算子、備用字串重複與驗證解鎖',()=>{
  const state=new LifeSupportState();assert.equal(state.submit('verify',answers[3]).success,false);
  for(const code of ['total = main_energy + aux_energy','total = int(main_energy + aux_energy)','total = float(main_energy) + aux_energy','total = 120','total = int(main_ energy) + aux_energy'])assert.equal(state.submit('main',code).success,false);
  assert.deepEqual(state.submit('main',answers[0]).output,['120']);assert.equal(state.total,120);assert.equal(state.submit('main',answers[0]).success,false);
  for(const op of ['+','*','/','B',''])assert.equal(state.submit('used',op).success,false);
  assert.deepEqual(state.submit('used','-').output,['105']);assert.equal(state.remaining,105);
  for(const code of ['backup_energy = backup * cells','backup_energy = int(backup * cells)','backup_energy = 25 * cells','backup_energy = 50'])assert.equal(state.submit('backup',code).success,false);
  assert.deepEqual(state.submit('backup',answers[2]).output,['50']);assert.equal(state.backupEnergy,50);assert.equal(state.ready,true);
  assert.equal(state.submit('verify','120 + 15 + 50').success,false);assert.equal(state.available,null);
  assert.deepEqual(state.submit('verify',answers[3]).output,['155']);assert.equal(state.completed,true);assert.equal(state.available,155);
});
test('能源算式支援括號與既有變數，拒絕裸答案、浮點除法及任意程式',()=>{
  for(const expression of ['120 - 15 + 50','(120 - 15) + 50','total - used + backup_energy','remaining + backup_energy','50 + 120 - 15']){
    assert.equal(readyState().submit('verify',expression).success,true,expression);assert.equal(evaluateEnergyExpression(expression)?.value,155);
  }
  for(const expression of ['155','(155)','150 + 5','(120 - 15 + 50) / 1','120 - 15 + 50.0','120 - 15 + "50"','120 - 15 + 50; alert(1)','globalThis.process.exit()','constructor','__proto__','Infinity','1 / 0','120 + (15','', '('.repeat(161)])assert.equal(readyState().submit('verify',expression).success,false,expression);
  assert.equal(evaluateEnergyExpression('1 / 0'),null);assert.equal(evaluateEnergyExpression('120 ** 5'),null);
});
test('第三關不能提前或用占位按鈕跳過，關閉保留及重玩重置',()=>{
  const locked=new Game();locked.player={...lifeSupportTasks[0].point};assert.ok(locked.openLifeSupport('main'));
  const game=reachRoomThree();game.player={...lifeSupportTasks[3].point};assert.ok(game.openLifeSupport('verify'));
  game.player={...lifeSupportTasks[0].point};assert.equal(game.openLifeSupport('main'),null);assert.equal(game.repair('room-3'),false);
  game.player={...spawn};assert.equal(game.submitLifeSupport('main',answers[0]).success,false);
  for(const [i,task] of lifeSupportTasks.entries()){
    game.player={...task.point};assert.equal(game.openLifeSupport(task.id),null);assert.equal(game.submitLifeSupport(task.id,answers[i]).success,true);
    if(i<3){game.close();assert.equal(game.lifeSupport.count,i+1);assert.equal(game.index,2);}
  }
  assert.equal(game.repair('room-3'),true);assert.equal(game.repair('room-3'),false);assert.equal(game.index,3);assert.equal(game.generator.completed,true);assert.equal(game.alarm.completed,true);
  game.reset();assert.equal(game.lifeSupport.count,0);assert.equal(game.lifeSupportTask,null);assert.equal(game.lifeSupport.available,null);assert.equal(game.index,0);
});
test('前三項計算獨立修復，接受相加與相乘的交換順序',()=>{
  const state=new LifeSupportState();assert.equal(state.submit('backup','backup_energy = cells * int(backup)').success,true);assert.equal(state.next.id,'main');
  assert.equal(state.submit('main','total = aux_energy + int(main_energy)').success,true);assert.equal(state.next.id,'used');state.submit('used','-');assert.equal(state.next.id,'verify');
});
