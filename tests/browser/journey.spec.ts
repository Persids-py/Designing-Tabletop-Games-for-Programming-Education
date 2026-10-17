import {test,expect,type Page} from '@playwright/test';
import {levels} from '../../src/game';
import {MAP_WIDTH,MAP_HEIGHT,SCALE,speed,walkable,move,type Point} from '../../src/map';
import {alarmTasks,alarmRadius} from '../../src/alarm';
import {generatorTasks,generatorRadius} from '../../src/generator';

async function position(page:Page):Promise<Point>{
  const raw=await page.locator('#player').getAttribute('transform');
  const [x,y]=raw!.match(/[\d.]+/g)!.map(Number);return{x,y};
}
function route(start:Point,target:Point,range:number):Point[]{
  const step=10*SCALE,cols=Math.ceil(MAP_WIDTH/step),rows=Math.ceil(MAP_HEIGHT/step);
  const sx=Math.round(start.x/step),sy=Math.round(start.y/step),key=(x:number,y:number)=>y*cols+x;
  const queue:[number,number][]=[[sx,sy]],previous=new Map<number,number|null>([[key(sx,sy),null]]);
  let end:number|undefined;
  for(let h=0;h<queue.length;h++){
    const [x,y]=queue[h],p={x:x*step,y:y*step};
    if(Math.hypot(p.x-target.x,p.y-target.y)<range-22*SCALE){end=key(x,y);break;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny),q={x:nx*step,y:ny*step};
      // 鍵盤逐幀移動有數像素誤差，測試路線保留餘裕，避免沿牆角擦邊。
      const clearance=5*SCALE;
      const safe=[q,{x:q.x+clearance,y:q.y},{x:q.x-clearance,y:q.y},{x:q.x,y:q.y+clearance},{x:q.x,y:q.y-clearance}].every(walkable);
      if(nx<0||ny<0||nx>=cols||ny>=rows||previous.has(k)||!safe)continue;
      const m=move(p,dx*step,dy*step);if(Math.hypot(m.x-q.x,m.y-q.y)>1)continue;
      previous.set(k,key(x,y));queue.push([nx,ny]);
    }
  }
  if(end===undefined)throw Error('無路徑');
  const points:Point[]=[];
  for(let k:number|null=end;k!==null;k=previous.get(k)!){points.unshift({x:(k%cols)*step,y:Math.floor(k/cols)*step});}
  // 只保留轉角；仍經由鍵盤與正式碰撞函式移動，不直接設定遊戲狀態。
  return points.filter((p,i)=>i===0||i===points.length-1||(points[i-1].x!==points[i+1].x&&points[i-1].y!==points[i+1].y));
}
async function walkTo(page:Page,target:Point){
  for(const axis of ['x','y'] as const){
    for(let attempt=0;attempt<3;attempt++){
      const p=await position(page),delta=target[axis]-p[axis];if(Math.abs(delta)<3*SCALE)break;
      const key=axis==='x'?(delta>0?'d':'a'):(delta>0?'s':'w');
      await page.keyboard.down(key);
      await page.clock.runFor(Math.max(16,Math.round(Math.abs(delta)/speed*1000/16)*16));
      await page.keyboard.up(key);
    }
  }
  const p=await position(page);expect(Math.hypot(p.x-target.x,p.y-target.y),JSON.stringify({p,target})).toBeLessThan(9*SCALE);
}
async function solveAlarmRoom(page:Page){
  for(const task of alarmTasks){
    for(const p of route(await position(page),task.point,alarmRadius))await walkTo(page,p);
    await page.locator(`[data-alarm-task="${task.id}"]`).click();
    await expect(page.locator('#alarm-title')).toHaveText(task.name);
    const before=await position(page);await page.keyboard.down('d');await page.clock.runFor(200);await page.keyboard.up('d');expect(await position(page)).toEqual(before);
    await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
    if(task.id==='computer'){
      await page.setViewportSize({width:1150,height:850});await page.clock.runFor(32);
      await page.screenshot({path:'test-results/alarm-01-computer.png',fullPage:true});
      await page.locator('input[value="B"]').check();await page.getByRole('button',{name:'修復電腦 ↗'}).click();
      await expect(page.locator('#alarm-feedback')).toContainText('區分大小寫');await expect(page.locator('#count')).toHaveText('0 / 10');
      await page.keyboard.press('Escape');await expect(page.locator('#alarm-dialog')).not.toBeVisible();
      await page.locator('[data-alarm-task="computer"]').click();
      await page.locator('input[value="A"]').check();await page.getByRole('button',{name:'修復電腦 ↗'}).click();
      await expect(page.locator('.terminal-output')).toHaveText('SYSTEM CHECK');
      await expect(page.locator('#alarm-scene')).toHaveClass(/computer-online/);
      await page.setViewportSize({width:1440,height:1000});await page.clock.runFor(32);
    }else if(task.id==='light'){
      await page.getByRole('button',{name:'符號 )',exact:true}).click();await page.getByRole('button',{name:'修復警報燈 ↗'}).click();
      await expect(page.locator('#alarm-feedback')).toContainText('成對');
      await page.getByRole('button',{name:'符號 "',exact:true}).dragTo(page.locator('#symbol-slot'));
      await expect(page.locator('#symbol-slot')).toHaveText('"');
      await page.screenshot({path:'test-results/alarm-02-light.png',fullPage:true});
      await page.getByRole('button',{name:'修復警報燈 ↗'}).click();
      await expect(page.locator('#alarm-scene')).toHaveClass(/lights-online/);
    }else if(task.id==='broadcast'){
      await page.getByRole('button',{name:'執行 ↗'}).click();await expect(page.locator('#alarm-feedback')).toContainText('不符要求');
      await page.locator('#broadcast-message').fill('SIREN ON');await page.getByRole('button',{name:'執行 ↗'}).click();
      await expect(page.locator('.terminal-output')).toHaveText('SIREN ON');await expect(page.locator('#alarm-scene')).toHaveClass(/broadcast-online/);
    }else{
      await page.getByRole('button',{name:'啟動警報 ↗'}).click();await expect(page.locator('#alarm-feedback')).toContainText('順序不正確');
      await expect(page.locator('#count')).toHaveText('0 / 10');
      await page.locator('#boot-cards li').nth(0).dragTo(page.locator('#boot-cards li').nth(2));
      await expect(page.locator('#boot-cards li code')).toHaveText(['print("SYSTEM CHECK")','print("RED LIGHT ON")','print("SIREN ON")']);
      await page.getByRole('button',{name:'上移 SIREN ON',exact:true}).click();
      await page.getByRole('button',{name:'下移 SIREN ON',exact:true}).click();
      await page.screenshot({path:'test-results/alarm-04-verify.png',fullPage:true});
      await page.getByRole('button',{name:'啟動警報 ↗'}).click();
      await expect(page.locator('#alarm-dialog')).not.toBeVisible();await expect(page.locator('#count')).toHaveText('1 / 10');
      await expect(page.locator('#alarm-scene')).toHaveAttribute('data-stage','repaired');
      await page.clock.runFor(800);await page.screenshot({path:'test-results/alarm-05-restored.png',fullPage:true});
      continue;
    }
    await expect(page.locator('#count')).toHaveText('0 / 10');
    await page.getByRole('button',{name:'返回船艙 →'}).click();
    if(task.id==='computer'){
      await page.locator('[data-alarm-task="computer"]').click();await expect(page.locator('.device-success')).toContainText('已修復');
      await page.getByRole('button',{name:'返回船艙 →'}).click();
    }
  }
}
async function solveGeneratorRoom(page:Page){
  await page.keyboard.press('m');
  await page.locator('[data-generator-task="display"]').click();await expect(page.locator('#toast')).toContainText('先設定主發電機');
  await page.locator('[data-generator-task="verify"]').click();await expect(page.locator('#toast')).toContainText('先完成三項');
  await page.keyboard.press('m');
  for(const task of generatorTasks){
    for(const p of route(await position(page),task.point,generatorRadius))await walkTo(page,p);
    await page.locator(`[data-generator-task="${task.id}"]`).click();await expect(page.locator('#generator-title')).toHaveText(task.name);
    const before=await position(page);await page.keyboard.down('d');await page.clock.runFor(100);await page.keyboard.up('d');expect(await position(page)).toEqual(before);
    await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
    if(task.id==='main'){
      await page.screenshot({path:'test-results/generator-01-assignment.png',fullPage:true});
      await page.getByRole('button',{name:'設定主電壓 ↗'}).click();await expect(page.locator('#generator-feedback')).toContainText('賦值方向');
      await expect(page.locator('#count')).toHaveText('1 / 10');
      await page.locator('#assignment-tiles li').nth(2).dragTo(page.locator('#assignment-tiles li').nth(0));
      await page.getByRole('button',{name:'左移 =',exact:true}).click();
      await expect(page.locator('#assignment-tiles li code')).toHaveText(['target_voltage','=','220']);
      await page.getByRole('button',{name:'設定主電壓 ↗'}).click();await expect(page.locator('.generator-dialog .terminal-output')).toContainText('220V');
      await expect(page.locator('#generator-scene')).toHaveClass(/main-online/);
    }else if(task.id==='backup'){
      await page.getByRole('button',{name:'修復備用變數 ↗'}).click();await expect(page.locator('#generator-feedback')).toContainText('NameError');
      await page.keyboard.press('Escape');await expect(page.locator('#generator-dialog')).not.toBeVisible();await expect(page.locator('#target-status')).toContainText('1 / 4');
      await page.locator('[data-generator-task="backup"]').click();await page.locator('#backup-name').fill('backup_voltage');
      await page.getByRole('button',{name:'修復備用變數 ↗'}).click();await expect(page.locator('#generator-scene .backup-meter text')).toHaveText('110V');
    }else if(task.id==='display'){
      await page.getByRole('button',{name:'更新電壓顯示 ↗'}).click();await expect(page.locator('#generator-feedback')).toContainText('引號內是文字');
      await page.locator('#voltage-code').fill('print(target_voltage)');await page.screenshot({path:'test-results/generator-03-display.png',fullPage:true});
      await page.getByRole('button',{name:'更新電壓顯示 ↗'}).click();await expect(page.locator('#generator-scene .main-meter text')).toHaveText('220V');
    }else{
      await page.locator('input[name="power-output"][value="A"]').check();await page.getByRole('button',{name:'執行供電測試 ↗'}).click();
      await expect(page.locator('#generator-feedback')).toContainText('最後一次');await expect(page.locator('#count')).toHaveText('1 / 10');
      await page.locator('input[name="power-output"][value="B"]').check();await page.screenshot({path:'test-results/generator-04-verify.png',fullPage:true});
      await page.getByRole('button',{name:'執行供電測試 ↗'}).click();await expect(page.locator('#generator-dialog')).not.toBeVisible();
      await expect(page.locator('#count')).toHaveText('2 / 10');await expect(page.locator('#generator-scene')).toHaveAttribute('data-stage','powered');
      await expect(page.locator('#target-title')).toHaveText('維生系統室');await page.clock.runFor(500);
      await page.screenshot({path:'test-results/generator-05-powered.png',fullPage:true});continue;
    }
    await expect(page.locator('#count')).toHaveText('1 / 10');await page.getByRole('button',{name:'返回船艙 →'}).click();
    if(task.id==='main'){
      await page.locator('[data-generator-task="main"]').click();await expect(page.locator('#generator-dialog .device-success')).toContainText('已修復');
      await page.getByRole('button',{name:'返回船艙 →'}).click();
    }
  }
}

test('鍵盤沿通道走完十關、面板、縮放與重玩',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();await page.goto('/');await page.clock.runFor(32);
  await expect(page.locator('#map-image')).toHaveJSProperty('naturalWidth',2752);
  await expect(page.locator('#map')).toHaveAttribute('data-view','follow');
  await expect(page.locator('#target-arrow')).toBeVisible();
  await page.screenshot({path:'test-results/01-map.png',fullPage:true});
  await page.locator('#camera-toggle').click();
  await page.locator('[data-room="room-1"]').click();
  await expect(page.locator('#repair-dialog')).not.toBeVisible();
  await expect(page.locator('#toast')).toContainText('請先靠近');
  await page.locator('[data-room="room-2"]').click();await expect(page.locator('#count')).toHaveText('0 / 10');
  await page.locator('[data-alarm-task="verify"]').click();await expect(page.locator('#toast')).toContainText('先完成三個設備');
  await page.keyboard.press('m');
  await expect(page.locator('#map')).toHaveAttribute('data-view','follow');
  for(const [i,l] of levels.entries()){
    if(i===0){await solveAlarmRoom(page);continue;}
    if(i===1){await solveGeneratorRoom(page);continue;}
    const path=route(await position(page),l.interactionPoint,l.interactionRadius);
    for(const p of path)await walkTo(page,p);
    await page.locator(`[data-room="${l.id}"]`).click();await expect(page.locator('#dialog-title')).toHaveText(l.roomName);
    await page.getByRole('button',{name:'維修 ↗',exact:true}).click();
    await expect(page.locator('#count')).toHaveText(`${i+1} / 10`);
  }
  await expect(page.locator('#complete-dialog')).toBeVisible();
  await expect(page.locator('#target-arrow')).toBeHidden();
  await page.screenshot({path:'test-results/03-completed.png',fullPage:true});
  await page.getByRole('button',{name:'重新開始 ↻'}).click();await expect(page.locator('#count')).toHaveText('0 / 10');await expect(page.locator('#target-title')).toHaveText(levels[0].roomName);
  await expect(page.locator('#alarm-scene')).toHaveAttribute('data-stage','fault');await expect(page.locator('#target-status')).toContainText('0 / 4');
  await expect(page.locator('#generator-scene')).toHaveAttribute('data-stage','fault');
  await expect(page.locator('#generator-scene .main-meter text')).toHaveText('---');await expect(page.locator('#generator-scene .backup-meter text')).toHaveText('---');
  expect(errors).toEqual([]);
});
