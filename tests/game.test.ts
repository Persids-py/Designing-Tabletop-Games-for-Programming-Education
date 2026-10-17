import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,levels} from '../src/game';
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
  for(const level of levels){
    g.player={...level.interactionPoint};
    if(g.index<9)assert.ok(g.open(levels[g.index+1].id));
    assert.equal(g.open(level.id),null);
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
  const missing=levels.filter(l=>!queue.some(([x,y])=>Math.hypot(x*step-l.interactionPoint.x,y*step-l.interactionPoint.y)<l.interactionRadius-10*SCALE));
  assert.deepEqual(missing.map(l=>l.roomName),[],`無法抵達：${missing.map(l=>l.roomName).join('、')}`);
});
