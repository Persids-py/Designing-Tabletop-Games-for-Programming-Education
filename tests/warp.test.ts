import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WarpState,warpTasks,warpRadius,warpReady,type WarpSystems} from '../src/warp';
import {Game} from '../src/game';
import {spawn} from '../src/map';
function solve(state:WarpState){state.submit('nav','nav');state.submit('manual',{reason:'A',code:'manual_override = (manual_status == "ON")'});state.submit('logic',['and','and','and','or']);state.submit('verify',['ALLOW','LOCK','ALLOW','LOCK']);}
test('躍遷安全邏輯完整檢查 32 種狀態，不能以人工授權忽略核心系統',()=>{
  for(let mask=0;mask<32;mask++){
    const [fuel,nav,engine,radar,manual]=Array.from({length:5},(_,i)=>Boolean(mask&(1<<i)));
    const state:WarpSystems={fuel,nav,engine,radar,manual};
    const expected=[fuel,nav,engine].every(Boolean)&&[radar,manual].some(Boolean);assert.equal(warpReady(state),expected,JSON.stringify(state));
  }
});
test('導航鍵與人工布林修正，驗證原因與 ON／OFF 比較指令',()=>{
  const state=new WarpState();assert.equal(state.prepareNavigation(),false);
  for(const value of ['navigation','NAV','systems["nav"]'])assert.equal(state.submit('nav',value).success,false);
  assert.equal(state.submit('nav','nav').success,true);assert.equal(state.systems.nav,false);
  for(const answer of [{reason:'B',code:'manual_override = (manual_status == "ON")'},{reason:'A',code:'manual_override = bool(manual_status)'},{reason:'A',code:'manual_override = True'},{reason:'A',code:'manual_override = (manual_status == "OFF")'}])assert.equal(state.submit('manual',answer).success,false);
  assert.deepEqual(state.submit('manual',{reason:'A',code:"manual_override = manual_status == 'ON'"}).output,['ON → True','OFF → False']);
  for(const ops of [['or','and','and','or'],['and','and','or','or'],['and','and','and','and']])assert.equal(state.submit('logic',ops).success,false);
  assert.equal(state.submit('logic',['and','and','and','or']).success,true);assert.equal(state.ready,true);
});
test('四組安全測試全對仍不能跳過導航準備、實際檢查與三秒倒數',()=>{
  const state=new WarpState();assert.equal(state.submit('verify',['ALLOW','LOCK','ALLOW','LOCK']).success,false);solve(state);
  assert.equal(state.tested,true);assert.equal(state.completed,false);assert.equal(state.next.id,'nav');assert.equal(state.checkActual(),false);assert.equal(state.start(),false);
  assert.equal(state.prepareNavigation(),true);assert.equal(state.prepareNavigation(),false);assert.equal(state.next.id,'verify');assert.equal(state.start(),false);
  assert.equal(state.checkActual(),true);assert.equal(state.start(),true);assert.equal(state.start(),false);assert.equal(state.countdown,3);
  assert.equal(state.tick(),false);assert.equal(state.countdown,2);state.cancel();assert.equal(state.launching,false);assert.equal(state.completed,false);
  assert.equal(state.start(),true);assert.equal(state.tick(),false);assert.equal(state.tick(),false);assert.equal(state.completed,false);assert.equal(state.tick(),true);assert.equal(state.completed,true);assert.equal(state.start(),false);
});
test('最終測試四項缺一不可，啟動後實際條件失效即取消',()=>{
  const state=new WarpState();state.submit('nav','nav');state.submit('manual',{reason:'A',code:'manual_override=(manual_status=="ON")'});state.submit('logic',['and','and','and','or']);
  const answers=['ALLOW','LOCK','ALLOW','LOCK'];for(let i=0;i<4;i++){const wrong=[...answers];wrong[i]=wrong[i]==='ALLOW'?'LOCK':'ALLOW';assert.equal(state.submit('verify',wrong).success,false);}
  assert.equal(state.submit('verify',answers).success,true);state.prepareNavigation();state.checkActual();state.start();state.systems.engine=false;assert.equal(state.tick(),false);assert.equal(state.checked,false);assert.equal(state.launching,false);assert.equal(state.completed,false);
});
test('最終關卡、面板與距離守門，關閉取消倒數且重玩還原',()=>{
  const game=new Game();assert.ok(game.openWarp('nav'));game.index=9;assert.ok(game.openWarp('nav'));assert.equal(game.prepareWarpNavigation(),false);game.player={...warpTasks[0].point};assert.equal(game.submitWarp('nav','nav').success,false);
  assert.equal(game.openWarp('nav'),null);assert.equal(game.repair('room-10'),false);game.player={...spawn};assert.equal(game.submitWarp('nav','nav').success,false);game.player={...warpTasks[0].point};assert.equal(game.submitWarp('nav','nav').success,true);game.close();assert.ok(game.openWarp('verify'));
  for(const [i,answer] of [[1,{reason:'A',code:'manual_override=(manual_status=="ON")'}],[2,['and','and','and','or']]] as const){const task=warpTasks[i];game.player={...task.point};assert.equal(game.openWarp(task.id),null);assert.equal(game.submitWarp(task.id,answer).success,true);game.close();}
  game.player={...warpTasks[3].point};assert.equal(game.openWarp('verify'),null);assert.equal(game.submitWarp('verify',['ALLOW','LOCK','ALLOW','LOCK']).success,true);assert.equal(game.checkWarpActual(),false);assert.equal(game.startWarp(),false);game.close();
  game.player={...warpTasks[0].point};assert.equal(game.openWarp('nav'),null);assert.equal(game.prepareWarpNavigation(),true);game.close();game.player={...warpTasks[3].point};assert.equal(game.openWarp('verify'),null);assert.equal(game.checkWarpActual(),true);assert.equal(game.startWarp(),true);game.tickWarp();game.close();assert.equal(game.warp.launching,false);assert.equal(game.warp.systems.nav,true);assert.equal(game.warp.tested,true);
  assert.equal(game.openWarp('verify'),null);assert.equal(game.startWarp(),true);game.player.x+=warpRadius+1;game.tickWarp();assert.equal(game.warp.launching,false);game.player={...warpTasks[3].point};assert.equal(game.startWarp(),true);game.tickWarp();game.tickWarp();assert.equal(game.repair('room-10'),false);game.tickWarp();assert.equal(game.repair('room-10'),true);assert.equal(game.repair('room-10'),false);assert.equal(game.completed,true);
  game.reset();assert.equal(game.warp.count,0);assert.equal(game.warp.systems.nav,false);assert.equal(game.warp.checked,false);assert.equal(game.warp.launched,false);
});
