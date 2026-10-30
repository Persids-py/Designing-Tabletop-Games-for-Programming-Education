import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MovementTutorialState,tutorialTarget} from '../src/movement-tutorial';
import {alarmRadius} from '../src/alarm';

test('移動教學只由待開始啟動，說明結束後須真正抵達既有設備範圍',()=>{
  const s=new MovementTutorialState(),p=tutorialTarget.point;
  assert.equal(s.arrive(p,true),false);assert.equal(s.start(),true);assert.equal(s.start(),false);
  assert.equal(s.arrive(p,true),false);s.move();
  assert.equal(s.arrive({x:p.x+alarmRadius+.01,y:p.y},true),false);
  assert.equal(s.arrive(p,false),false);
  assert.equal(s.arrive({x:p.x+alarmRadius,y:p.y},true),true);
  assert.equal(s.arrive(p,true),false);
});
test('關閉提示不反覆自動觸發；須近距點設備接續，成功開題才進入 entered',()=>{
  const s=new MovementTutorialState(),p=tutorialTarget.point;s.start();s.move();s.arrive(p,true);s.dismiss();
  assert.equal(s.phase,'ready');assert.equal(s.arrive(p,true),false);
  assert.equal(s.resume({x:p.x+alarmRadius+1,y:p.y},true),false);assert.equal(s.resume(p,false),false);
  assert.equal(s.resume(p,true),true);assert.equal(s.enter(false),false);assert.equal(s.phase,'found');
  assert.equal(s.enter(true),true);assert.equal(s.phase,'entered');assert.equal(s.start(),false);assert.equal(s.arrive(p,true),false);
  s.reset();assert.equal(s.phase,'pending');assert.equal(s.start(),true);
});
