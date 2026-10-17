import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameraFrame,project,unproject,edgeIndicator} from '../src/camera';
import {MAP_WIDTH,MAP_HEIGHT,spawn} from '../src/map';

test('跟隨視角放大並置中角色，座標轉換可還原',()=>{
  const frame=cameraFrame(1000,600,spawn,false);
  const screen=project(spawn,frame);
  assert.ok(Math.abs(screen.x-500)<.001);assert.ok(Math.abs(screen.y-300)<.001);
  assert.ok(1000/frame.scale<MAP_WIDTH/3);
  const world=unproject(screen,frame);assert.ok(Math.hypot(world.x-spawn.x,world.y-spawn.y)<.001);
  const edge=cameraFrame(1000,600,{x:MAP_WIDTH,y:MAP_HEIGHT},false);
  assert.ok(edge.left+1000/edge.scale<=MAP_WIDTH+.001);
  assert.ok(edge.top+600/edge.scale<=MAP_HEIGHT+.001);
});
test('八方位的畫外提示都留在畫面內，目標可見時不顯示邊緣箭頭',()=>{
  const player={x:500,y:300};
  for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]){
    const hint=edgeIndicator(player,{x:500+dx*2000,y:300+dy*2000},1000,600)!;
    assert.ok(hint);assert.ok(hint.x>=29.99&&hint.x<=970.01);assert.ok(hint.y>=29.99&&hint.y<=570.01);
  }
  assert.equal(edgeIndicator(player,{x:600,y:350},1000,600),null);
});
