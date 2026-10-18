import {test,expect,type Page} from '@playwright/test';
import {levels} from '../../src/game';
import {MAP_WIDTH,MAP_HEIGHT,SCALE,speed,walkable,move,type Point} from '../../src/map';
import {alarmTasks,alarmRadius} from '../../src/alarm';
import {generatorTasks,generatorRadius} from '../../src/generator';
import {lifeSupportTasks,lifeSupportRadius} from '../../src/life-support';
import {airlockTasks,airlockRadius} from '../../src/airlock';
import {coolingTasks,coolingRadius} from '../../src/cooling';

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

async function solveLifeSupportRoom(page:Page){
  await page.keyboard.press('m');await page.locator('[data-life-support-task="verify"]').click();
  await expect(page.locator('#toast')).toContainText('先完成三項能源計算');await page.keyboard.press('m');
  for(const [i,task] of lifeSupportTasks.entries()){
    for(const p of route(await position(page),task.point,lifeSupportRadius))await walkTo(page,p);
    await page.locator(`[data-life-support-task="${task.id}"]`).click();await expect(page.locator('#life-support-title')).toHaveText(task.name);
    const before=await position(page);await page.keyboard.down('d');await page.clock.runFor(100);await page.keyboard.up('d');expect(await position(page)).toEqual(before);
    await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
    if(task.id==='main'){
      await page.screenshot({path:'test-results/life-support-01-main.png',fullPage:true});
      await page.getByRole('button',{name:'修復主能源 ↗'}).click();await expect(page.locator('#life-support-feedback')).toContainText('TypeError');
      await expect(page.locator('#count')).toHaveText('2 / 10');
      await page.locator('#main-energy-code').fill('total = int(main_energy) + aux_energy');
      await page.getByRole('button',{name:'修復主能源 ↗'}).click();await expect(page.locator('#life-support-dialog .terminal-output')).toHaveText('120');
      await expect(page.locator('#life-support-scene [data-tank="0"]')).toHaveAttribute('data-online','true');
    }else if(task.id==='used'){
      await page.getByRole('button',{name:'更新消耗計算 ↗'}).click();await expect(page.locator('#life-support-feedback')).toContainText('扣除 used');
      await page.getByRole('button',{name:'運算子 -',exact:true}).click();await expect(page.locator('#operator-preview')).toHaveText('-');
      await page.getByRole('button',{name:'更新消耗計算 ↗'}).click();await expect(page.locator('#life-support-dialog .terminal-output')).toHaveText('105');
    }else if(task.id==='backup'){
      await page.getByRole('button',{name:'修復備用能源 ↗'}).click();await expect(page.locator('#life-support-feedback')).toContainText('重複文字');
      await page.keyboard.press('Escape');await expect(page.locator('#life-support-dialog')).not.toBeVisible();await expect(page.locator('#target-status')).toContainText('2 / 4');
      await page.locator('[data-life-support-task="backup"]').click();await page.locator('#backup-energy-code').fill('backup_energy = int(backup) * cells');
      await page.screenshot({path:'test-results/life-support-03-backup.png',fullPage:true});
      await page.getByRole('button',{name:'修復備用能源 ↗'}).click();await expect(page.locator('#life-support-dialog .terminal-output')).toHaveText('50');
    }else{
      await page.locator('#available-expression').fill('155');await page.getByRole('button',{name:'能源檢測 ↗'}).click();await expect(page.locator('#life-support-feedback')).toContainText('不要直接填答案');
      await page.locator('#available-expression').fill('120 + 15 + 50');await page.getByRole('button',{name:'能源檢測 ↗'}).click();await expect(page.locator('#count')).toHaveText('2 / 10');
      await page.locator('#available-expression').fill('120 - 15 + 50');await page.screenshot({path:'test-results/life-support-04-verify.png',fullPage:true});
      await page.getByRole('button',{name:'能源檢測 ↗'}).click();await expect(page.locator('#life-support-dialog')).not.toBeVisible();
      await expect(page.locator('#count')).toHaveText('3 / 10');await expect(page.locator('#target-title')).toHaveText('氣閘艙');
      await expect(page.locator('#life-support-scene')).toHaveAttribute('data-stage','restored');
      await expect(page.locator('#life-support-scene .energy-tank.online')).toHaveCount(3);await expect(page.locator('#life-support-scene .life-monitor text')).toHaveText('可用能源 155');
      await page.clock.runFor(600);await page.screenshot({path:'test-results/life-support-05-restored.png',fullPage:true});continue;
    }
    await expect(page.locator('#count')).toHaveText('2 / 10');await expect(page.locator('#life-support-scene .energy-tank.online')).toHaveCount(i+1);
    await page.getByRole('button',{name:'返回船艙 →'}).click();
    if(task.id==='main'){
      await page.locator('[data-life-support-task="main"]').click();await expect(page.locator('#life-support-dialog .device-success')).toContainText('已修復');
      await page.getByRole('button',{name:'返回船艙 →'}).click();
    }
  }
}

async function solveAirlockRoom(page:Page){
  await page.keyboard.press('m');await page.locator('[data-airlock-task="verify"]').click();
  await expect(page.locator('#toast')).toContainText('先修好冒號');await page.keyboard.press('m');
  for(const task of airlockTasks){
    for(const p of route(await position(page),task.point,airlockRadius))await walkTo(page,p);
    await page.locator(`[data-airlock-task="${task.id}"]`).click();await expect(page.locator('#airlock-title')).toHaveText(task.name);
    const before=await position(page);await page.keyboard.down('d');await page.clock.runFor(100);await page.keyboard.up('d');expect(await position(page)).toEqual(before);
    await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
    if(task.id==='colon'){
      await page.getByRole('button',{name:'符號 ;',exact:true}).click();await page.getByRole('button',{name:'修復壓力判斷 ↗'}).click();await expect(page.locator('#airlock-feedback')).toContainText('SyntaxError');
      await page.getByRole('button',{name:'符號 :',exact:true}).dragTo(page.locator('#colon-slot'));
      await expect(page.locator('#colon-slot')).toHaveText(':');await page.screenshot({path:'test-results/airlock-01-colon.png',fullPage:true});
      await page.getByRole('button',{name:'修復壓力判斷 ↗'}).click();await expect(page.locator('#airlock-dialog .terminal-output')).toHaveText('LOCK');
    }else if(task.id==='indent'){
      await page.getByRole('button',{name:'修復縮排 ↗'}).click();await expect(page.locator('#airlock-feedback')).toContainText('IndentationError');
      await page.getByRole('button',{name:'向右縮排 →'}).click();await expect(page.locator('#indent-count')).toHaveText('4 個空格');
      await page.getByRole('button',{name:'← 向左縮排'}).click();await expect(page.locator('#indent-count')).toHaveText('0 個空格');
      await page.locator('#indent-line').dragTo(page.locator('#indent-zone'),{targetPosition:{x:400,y:20}});
      await expect(page.locator('#indent-line')).toHaveText('    print("壓力過高")',{useInnerText:false});
      await expect(page.locator('#indent-count')).toHaveText('4 個空格');await page.screenshot({path:'test-results/airlock-02-indent.png',fullPage:true});
      await page.getByRole('button',{name:'修復縮排 ↗'}).click();await expect(page.locator('#airlock-dialog .terminal-output')).toHaveText('壓力過高');
    }else if(task.id==='branch'){
      await page.keyboard.press('Escape');await expect(page.locator('#target-status')).toContainText('2 / 4');
      await page.locator('[data-airlock-task="branch"]').click();await page.locator('#open-code').fill('print("LOCK")');
      await page.getByRole('button',{name:'修復正常壓力 ↗'}).click();await expect(page.locator('#airlock-feedback')).toContainText('應輸出 OPEN');
      await page.locator('#open-code').fill('print("OPEN")');await page.getByRole('button',{name:'修復正常壓力 ↗'}).click();await expect(page.locator('#airlock-dialog .terminal-output')).toHaveText('OPEN');
      await expect(page.locator('#airlock-scene')).toHaveAttribute('data-stage','ready');
    }else{
      await expect(page.getByRole('button',{name:'解除封鎖 →'})).toBeDisabled();
      for(const [i,value] of ['LOCK','LOCK','OPEN'].entries())await page.locator(`input[name="case-${i}"][value="${value}"]`).check();
      await page.getByRole('button',{name:'執行壓力測試 ↗'}).click();await expect(page.locator('#airlock-feedback')).toContainText('100 的邊界');
      await expect(page.getByRole('button',{name:'解除封鎖 →'})).toBeDisabled();await expect(page.locator('#count')).toHaveText('3 / 10');
      await page.locator('input[name="case-1"][value="OPEN"]').check();await page.screenshot({path:'test-results/airlock-04-test.png',fullPage:true});
      await page.getByRole('button',{name:'執行壓力測試 ↗'}).click();await expect(page.locator('#airlock-dialog .terminal-output')).toContainText('100 kPa → OPEN');
      await expect(page.getByRole('button',{name:'解除封鎖 →'})).toBeEnabled();await expect(page.locator('#airlock-scene')).toHaveAttribute('data-stage','tested');
      await page.keyboard.press('Escape');await page.locator('[data-airlock-task="verify"]').click();
      await expect(page.getByRole('button',{name:'解除封鎖 →'})).toBeEnabled();await expect(page.locator('#count')).toHaveText('3 / 10');
      await page.getByRole('button',{name:'解除封鎖 →'}).click();await expect(page.locator('#airlock-dialog')).not.toBeVisible();
      await expect(page.locator('#count')).toHaveText('4 / 10');await expect(page.locator('#target-title')).toHaveText('引擎冷凝室');
      await expect(page.locator('#airlock-scene')).toHaveAttribute('data-stage','unlocked');await expect(page.locator('.pressure-monitor text')).toHaveText('壓力正常');
      await page.clock.runFor(700);await page.screenshot({path:'test-results/airlock-05-unlocked.png',fullPage:true});continue;
    }
    await expect(page.locator('#count')).toHaveText('3 / 10');await page.getByRole('button',{name:'返回船艙 →'}).click();
  }
}

async function solveCoolingRoom(page:Page){
  await page.keyboard.press('m');await page.locator('[data-cooling-task="verify"]').click();await expect(page.locator('#toast')).toContainText('先完成迴圈原因');await page.keyboard.press('m');
  for(const task of coolingTasks){
    for(const p of route(await position(page),task.point,coolingRadius))await walkTo(page,p);
    await page.locator(`[data-cooling-task="${task.id}"]`).click();await expect(page.locator('#cooling-title')).toHaveText(task.name);
    const before=await position(page);await page.keyboard.down('d');await page.clock.runFor(100);await page.keyboard.up('d');expect(await position(page)).toEqual(before);await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
    if(task.id==='cause'){
      await page.locator('input[name="loop-cause"][value="B"]').check();await page.getByRole('button',{name:'確認迴圈原因 ↗'}).click();await expect(page.locator('#cooling-feedback')).toContainText('溫度變數沒有');
      await page.locator('input[name="loop-cause"][value="A"]').check();await page.screenshot({path:'test-results/cooling-01-cause.png',fullPage:true});await page.getByRole('button',{name:'確認迴圈原因 ↗'}).click();
      await expect(page.locator('#cooling-dialog .terminal-output')).toContainText('temperature -= 10');
    }else if(task.id==='drop'){
      await page.getByRole('button',{name:'單次模擬 ↗'}).click();await expect(page.locator('#cooling-preview')).toContainText('100°C → 100°C');await expect(page.locator('#cooling-feedback')).toContainText('填 0');
      await page.locator('#cooling-drop').fill('20');await page.getByRole('button',{name:'單次模擬 ↗'}).click();await expect(page.locator('#cooling-preview')).toContainText('100°C → 80°C');await expect(page.locator('#count')).toHaveText('4 / 10');
      await page.locator('#cooling-drop').fill('10');await page.getByRole('button',{name:'單次模擬 ↗'}).click();await expect(page.locator('#cooling-dialog .terminal-output')).toContainText('100°C → 90°C');
    }else if(task.id==='counter'){
      await page.keyboard.press('Escape');await expect(page.locator('#target-status')).toContainText('2 / 4');await page.locator('[data-cooling-task="counter"]').click();
      await page.getByRole('button',{name:'cycles == 1',exact:true}).click();await page.getByRole('button',{name:'修復循環計數 ↗'}).click();await expect(page.locator('#cooling-feedback')).toContainText('比較');
      await page.getByRole('button',{name:'cycles += 1',exact:true}).click();await expect(page.locator('#cycles-code')).toHaveValue('cycles += 1');await page.screenshot({path:'test-results/cooling-03-counter.png',fullPage:true});
      await page.getByRole('button',{name:'修復循環計數 ↗'}).click();await expect(page.locator('#cooling-dialog .terminal-output')).toContainText('0 → 1');
    }else{
      for(const [i,value] of ['100','90','80','70','4','60'].entries())await page.locator(`input[name="result-${i}"]`).fill(value);
      await page.getByRole('button',{name:'執行完整冷卻 ↗'}).click();await expect(page.locator('#cooling-feedback')).toContainText('每輪先減 10');await expect(page.locator('#count')).toHaveText('4 / 10');
      for(const [i,value] of ['90','80','70','60','4','60'].entries())await page.locator(`input[name="result-${i}"]`).fill(value);
      await page.screenshot({path:'test-results/cooling-04-verify.png',fullPage:true});await page.getByRole('button',{name:'執行完整冷卻 ↗'}).click();await expect(page.locator('#cooling-dialog')).not.toBeVisible();
      await expect(page.locator('#count')).toHaveText('5 / 10');await expect(page.locator('#target-title')).toHaveText('副推進器室');
      await expect(page.locator('#cooling-scene')).toHaveAttribute('data-stage','cooling');await page.clock.runFor(320);await expect(page.locator('.cooling-meter text')).toHaveText('90°C · 冷卻中');
      await page.clock.runFor(1000);await expect(page.locator('#cooling-scene')).toHaveAttribute('data-stage','restored');await expect(page.locator('.cooling-meter text')).toHaveText('60°C · 溫度正常');
      await page.clock.runFor(500);await page.screenshot({path:'test-results/cooling-05-restored.png',fullPage:true});continue;
    }
    await expect(page.locator('#count')).toHaveText('4 / 10');await page.getByRole('button',{name:'返回船艙 →'}).click();
    if(task.id==='cause'){await page.locator('[data-cooling-task="cause"]').click();await expect(page.locator('#cooling-dialog .device-success')).toContainText('已修復');await page.getByRole('button',{name:'返回船艙 →'}).click();}
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
    if(i===2){await solveLifeSupportRoom(page);continue;}
    if(i===3){await solveAirlockRoom(page);continue;}
    if(i===4){await solveCoolingRoom(page);continue;}
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
  await expect(page.locator('#life-support-scene')).toHaveAttribute('data-stage','fault');await expect(page.locator('#life-support-scene .energy-tank.online')).toHaveCount(0);
  await expect(page.locator('#airlock-scene')).toHaveAttribute('data-stage','fault');await expect(page.locator('.pressure-monitor text')).toHaveText('壓力警示');
  await expect(page.locator('#cooling-scene')).toHaveAttribute('data-stage','fault');await expect(page.locator('.cooling-meter text')).toHaveText('100°C · 冷卻故障');
  expect(errors).toEqual([]);
});
