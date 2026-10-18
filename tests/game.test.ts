import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,levels} from '../src/game';
import {alarmTasks,bootOrder,alarmRadius} from '../src/alarm';
import {generatorTasks,generatorRadius,assignmentOrder} from '../src/generator';
import {lifeSupportTasks,lifeSupportRadius} from '../src/life-support';
import {airlockTasks,airlockRadius} from '../src/airlock';
import {coolingTasks,coolingRadius} from '../src/cooling';
import {boosterTasks,boosterRadius} from '../src/booster';
import {cargoTasks,cargoRadius} from '../src/cargo';
import {crewTasks,crewRadius} from '../src/crew';
import {spawn,point,walkable,move,MAP_WIDTH,MAP_HEIGHT,SCALE,floors,obstacles,floorIds,obstacleIds} from '../src/map';

test('走廊牆面封閉、氣閘入口位置及移除設備的通行',()=>{
  assert.equal(walkable(point(750,380)),false,'F6 左側三角牆不得穿越');
  assert.equal(walkable(point(850,500)),false,'F6 下側三角牆不得穿越');
  assert.equal(walkable(point(720,545)),true,'F6 西南分支銜接主走廊');
  assert.equal(walkable(point(980,548)),true,'F6 東南分支銜接主走廊');
  assert.equal(walkable(point(1510,878)),false,'原 F23 螢幕牆不可通行');
  assert.equal(walkable(point(1610,825)),true,'實際氣閘入口可通行');
  assert.equal(walkable(point(600,810)),true,'原 O9 可通行');
  assert.equal(walkable(point(1800,560)),true,'原 O14 可通行');
  assert.equal(floorIds.includes(23),false);assert.equal(obstacleIds.includes(9),false);assert.equal(obstacleIds.includes(14),false);
  assert.equal(floorIds.length,floors.length);assert.equal(obstacleIds.length,obstacles.length);
});

test('維修順序、遠距限制、關閉與重複結算',()=>{
  const g=new Game();
  assert.ok(g.open(levels[0].id));
  assert.equal(g.repair(levels[0].id),false);
  for(const [i,task] of alarmTasks.slice(0,3).entries()){
    g.player={...task.point};assert.equal(g.openAlarm(task.id),null);
    assert.equal(g.submitAlarm(task.id,['A','"','SIREN ON'][i]).success,true);g.close();
  }
  for(const level of levels){
    if(g.index===1){for(const [i,task] of generatorTasks.slice(0,3).entries()){
      g.player={...task.point};assert.equal(g.openGenerator(task.id),null);
      assert.equal(g.submitGenerator(task.id,[[...assignmentOrder],'backup_voltage','print(target_voltage)'][i]).success,true);g.close();
    }}
    if(g.index===2){for(const [i,task] of lifeSupportTasks.slice(0,3).entries()){
      g.player={...task.point};assert.equal(g.openLifeSupport(task.id),null);
      assert.equal(g.submitLifeSupport(task.id,['total = int(main_energy) + aux_energy','-','backup_energy = int(backup) * cells'][i]).success,true);g.close();
    }}
    if(g.index===3){for(const [i,task] of airlockTasks.slice(0,3).entries()){
      g.player={...task.point};assert.equal(g.openAirlock(task.id),null);
      assert.equal(g.submitAirlock(task.id,[':',4,'print("OPEN")'][i]).success,true);g.close();
    }}
    if(g.index===4){for(const [i,task] of coolingTasks.slice(0,3).entries()){
      g.player={...task.point};assert.equal(g.openCooling(task.id),null);
      assert.equal(g.submitCooling(task.id,['A','10','cycles += 1'][i]).success,true);g.close();
    }}
    if(g.index===5){for(const [i,task] of boosterTasks.slice(0,3).entries()){
      g.player={...task.point};assert.equal(g.openBooster(task.id),null);
      assert.equal(g.submitBooster(task.id,[':','*','return power'][i]).success,true);g.close();
    }}
    if(g.index===6){for(const [i,task] of cargoTasks.slice(0,3).entries()){
      g.player={...task.point};assert.equal(g.openCargo(task.id),null);
      assert.equal(g.submitCargo(task.id,['B','2','1'][i]).success,true);g.close();
    }}
    if(g.index===7){for(const [i,task] of crewTasks.slice(0,3).entries()){
      g.player={...task.point};assert.equal(g.openCrew(task.id),null);
      assert.equal(g.submitCrew(task.id,[{role:'engineer',key:'engineer'},'level','B'][i]).success,true);g.close();
    }}
    g.player={...(g.index===0?alarmTasks[3].point:g.index===1?generatorTasks[3].point:g.index===2?lifeSupportTasks[3].point:g.index===3?airlockTasks[3].point:g.index===4?coolingTasks[3].point:g.index===5?boosterTasks[3].point:g.index===6?cargoTasks[3].point:g.index===7?crewTasks[3].point:level.interactionPoint)};
    if(g.index<9)assert.ok(g.open(levels[g.index+1].id));
    assert.equal(g.open(level.id),null);
    if(g.index===0)assert.equal(g.submitAlarm('verify',[...bootOrder]).success,true);
    if(g.index===1)assert.equal(g.submitGenerator('verify','B').success,true);
    if(g.index===2)assert.equal(g.submitLifeSupport('verify','120 - 15 + 50').success,true);
    if(g.index===3)assert.equal(g.submitAirlock('verify',['LOCK','OPEN','OPEN']).success,true);
    if(g.index===4)assert.equal(g.submitCooling('verify',['90','80','70','60','4','60']).success,true);
    if(g.index===5)for(const value of ['0','30','60'])assert.equal(g.submitBooster('verify',value).success,true);
    if(g.index===6)assert.equal(g.submitCargo('verify',{count:'4',order:['A','E','C','D'],item:'D'}).success,true);
    if(g.index===7)assert.equal(g.submitCrew('verify',{threshold:'2',decisions:['GRANTED','DENIED','DENIED']}).success,true);
    g.close();assert.equal(g.repair(level.id),false);
    assert.equal(g.open(level.id),null);
    assert.equal(g.repair(level.id),true);
    assert.equal(g.repair(level.id),false);
  }
  assert.equal(g.completed,true);
  g.reset();assert.equal(g.index,0);assert.deepEqual(g.player,spawn);assert.equal(g.opened,null);
});

test('出生點、維修點與碰撞邊界',()=>{
  assert.ok(walkable(spawn));
  for(const l of levels)assert.ok(walkable(l.interactionPoint),l.roomName+' 互動點不在地板');
  for(const task of alarmTasks)assert.ok(walkable(task.point),task.name+' 互動點不在地板');
  for(const task of generatorTasks)assert.ok(walkable(task.point),task.name+' 互動點不在地板');
  for(const task of lifeSupportTasks)assert.ok(walkable(task.point),task.name+' 互動點不在地板');
  for(const task of airlockTasks)assert.ok(walkable(task.point),task.name+' 互動點不在地板');
  for(const task of coolingTasks)assert.ok(walkable(task.point),task.name+' 互動點不在地板');
  for(const task of boosterTasks)assert.ok(walkable(task.point),task.name+' 互動點不在地板');
  for(const task of cargoTasks)assert.ok(walkable(task.point),task.name+' 互動點不在地板');
  for(const task of crewTasks)assert.ok(walkable(task.point),task.name+' 互動點不在地板');
  assert.equal(walkable(point(100,100)),false);
  assert.equal(walkable(point(340,550)),false);
  const stop=move(point(660,580),-1000*SCALE,0);
  assert.ok(walkable(stop));assert.ok(stop.x>point(180,0).x);
});

// 以碰撞函式建立可走網格，逐格模擬移動，確認十站不會被門口或障礙物封死。
test('出生點可沿可走區抵達十個維修點',()=>{
  const step=10*SCALE, cols=Math.ceil(MAP_WIDTH/step), rows=Math.ceil(MAP_HEIGHT/step);
  const key=(x:number,y:number)=>y*cols+x;
  const sx=Math.round(spawn.x/step),sy=Math.round(spawn.y/step);
  const queue:[[number,number]]|[number,number][]=[[sx,sy]],seen=new Set([key(sx,sy)]);
  for(let head=0;head<queue.length;head++){
    const [x,y]=queue[head];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny);
      if(nx<0||ny<0||nx>=cols||ny>=rows||seen.has(k))continue;
      const p={x:x*step,y:y*step},q={x:nx*step,y:ny*step};
      if(!walkable(q))continue;
      const moved=move(p,dx*step,dy*step);
      if(Math.hypot(moved.x-q.x,moved.y-q.y)>1)continue;
      seen.add(k);queue.push([nx,ny]);
    }
  }
  const targets=[...levels,...alarmTasks.map(t=>({roomName:t.name,interactionPoint:t.point,interactionRadius:alarmRadius})),...generatorTasks.map(t=>({roomName:t.name,interactionPoint:t.point,interactionRadius:generatorRadius})),...lifeSupportTasks.map(t=>({roomName:t.name,interactionPoint:t.point,interactionRadius:lifeSupportRadius})),...airlockTasks.map(t=>({roomName:t.name,interactionPoint:t.point,interactionRadius:airlockRadius})),...coolingTasks.map(t=>({roomName:t.name,interactionPoint:t.point,interactionRadius:coolingRadius})),...boosterTasks.map(t=>({roomName:t.name,interactionPoint:t.point,interactionRadius:boosterRadius})),...cargoTasks.map(t=>({roomName:t.name,interactionPoint:t.point,interactionRadius:cargoRadius})),...crewTasks.map(t=>({roomName:t.name,interactionPoint:t.point,interactionRadius:crewRadius}))];
  const missing=targets.filter(l=>!queue.some(([x,y])=>Math.hypot(x*step-l.interactionPoint.x,y*step-l.interactionPoint.y)<l.interactionRadius-10*SCALE));
  assert.deepEqual(missing.map(l=>l.roomName),[],`無法抵達：${missing.map(l=>l.roomName).join('、')}`);
});
