import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AirlockState,airlockTasks,airlockRadius} from '../src/airlock';
import {Game} from '../src/game';
import {spawn} from '../src/map';

test('氣閘冒號、四空格縮排與 else 輸出，各自修復與重複提交',()=>{
  const state=new AirlockState();
  assert.equal(state.submit('verify',['LOCK','OPEN','OPEN']).success,false);
  for(const value of [';', '=', '!', '：'])assert.equal(state.submit('colon',value).success,false);
  assert.equal(state.submit('colon',':').success,true);
  assert.equal(state.submit('colon',':').success,false);
  for(const value of [0,2,8,'4'])assert.equal(state.submit('indent',value).success,false);
  assert.equal(state.submit('indent',4).success,true);
  for(const value of ['OPEN','Print("OPEN")','print("open")','print(OPEN)','print("LOCK")','print("OPEN");x()'])assert.equal(state.submit('branch',value).success,false);
  assert.equal(state.submit('branch',"    print ( 'OPEN' )\n").success,true);
  assert.equal(state.ready,true);assert.equal(state.count,3);assert.equal(state.next.id,'verify');
});
test('壓力三情境與 100 邊界，驗證全對後仍等待手動解鎖',()=>{
  const state=new AirlockState();
  state.submit('branch','print("OPEN")');state.submit('indent',4);state.submit('colon',':');
  for(const answer of [['OPEN','OPEN','OPEN'],['LOCK','LOCK','OPEN'],['LOCK','OPEN','LOCK'],['LOCK','OPEN'],['LOCK','OPEN','OPEN','OPEN'],null])assert.equal(state.submit('verify',answer).success,false);
  assert.equal(state.count,3);
  const result=state.submit('verify',['LOCK','OPEN','OPEN']);
  assert.deepEqual(result.output,['120 kPa → LOCK','100 kPa → OPEN','80 kPa → OPEN']);
  assert.equal(state.completed,true);assert.equal(state.unlocked,false);assert.equal(state.count,4);
});
test('第四關不能跳過題目與距離限制，關閉保留、解鎖與重置',()=>{
  const game=new Game();assert.ok(game.openAirlock('colon'));
  // 此測試專門檢查第四關守門；完整前四關順序另由十關流程驗證。
  game.index=3;assert.ok(game.openAirlock('colon'));
  game.player={...airlockTasks[0].point};assert.equal(game.submitAirlock('colon',':').success,false);
  assert.equal(game.openAirlock('colon'),null);assert.equal(game.repair('room-4'),false);
  assert.equal(game.submitAirlock('indent',4).success,false);
  game.player={...spawn};assert.equal(game.submitAirlock('colon',':').success,false);
  game.player={...airlockTasks[0].point};assert.equal(game.submitAirlock('colon',':').success,true);game.close();
  assert.equal(game.airlock.count,1);assert.equal(game.openAirlock('colon'),null);game.close();
  assert.ok(game.openAirlock('verify'));
  for(const [i,answer] of [[1,4],[2,'print("OPEN")']] as const){const task=airlockTasks[i];game.player={...task.point};assert.equal(game.openAirlock(task.id),null);assert.equal(game.submitAirlock(task.id,answer).success,true);game.close();}
  game.player={...airlockTasks[3].point};assert.equal(game.open('room-4'),null);assert.equal(game.repair('room-4'),false);
  assert.equal(game.submitAirlock('verify',['LOCK','OPEN','OPEN']).success,true);game.close();
  assert.equal(game.airlock.unlocked,false);assert.equal(game.openAirlock('verify'),null);
  game.player.x+=airlockRadius+1;assert.equal(game.repair('room-4'),false);assert.equal(game.airlock.unlocked,false);
  game.player={...airlockTasks[3].point};assert.equal(game.repair('room-4'),true);assert.equal(game.repair('room-4'),false);
  assert.equal(game.index,4);assert.equal(game.airlock.unlocked,true);
  game.reset();assert.equal(game.airlock.count,0);assert.equal(game.airlock.unlocked,false);
});
