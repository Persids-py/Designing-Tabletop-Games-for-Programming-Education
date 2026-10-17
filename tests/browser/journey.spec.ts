import {test,expect,type Page} from '@playwright/test';
import {levels} from '../../src/game';
import {MAP_WIDTH,MAP_HEIGHT,SCALE,speed,walkable,move,type Point} from '../../src/map';

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
test('鍵盤沿通道走完十關、面板、縮放與重玩',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();await page.goto('/');await page.clock.runFor(32);
  await expect(page.locator('#map-image')).toHaveJSProperty('naturalWidth',2752);
  await page.screenshot({path:'test-results/01-map.png',fullPage:true});
  await page.locator('[data-room="room-1"]').click();
  await expect(page.locator('#repair-dialog')).not.toBeVisible();
  await expect(page.locator('#toast')).toContainText('請先靠近');
  await page.locator('[data-room="room-2"]').click();await expect(page.locator('#count')).toHaveText('0 / 10');
  for(const [i,l] of levels.entries()){
    const path=route(await position(page),l.interactionPoint,l.interactionRadius);
    for(const p of path)await walkTo(page,p);
    if(i===0){
      await page.setViewportSize({width:1150,height:850});
      await page.locator(`[data-room="${l.id}"]`).click();
      await expect(page.locator('#repair-dialog')).toBeVisible();
      const before=await position(page);await page.keyboard.down('d');await page.clock.runFor(200);await page.keyboard.up('d');expect(await position(page)).toEqual(before);
      await page.screenshot({path:'test-results/02-repair.png',fullPage:true});
      await page.keyboard.press('Escape');await expect(page.locator('#repair-dialog')).not.toBeVisible();await expect(page.locator('#count')).toHaveText('0 / 10');
      await page.setViewportSize({width:1440,height:1000});
    }
    await page.locator(`[data-room="${l.id}"]`).click();await expect(page.locator('#dialog-title')).toHaveText(l.roomName);
    await page.getByRole('button',{name:'維修 ↗',exact:true}).click();
    await expect(page.locator('#count')).toHaveText(`${i+1} / 10`);
  }
  await expect(page.locator('#complete-dialog')).toBeVisible();
  await page.screenshot({path:'test-results/03-completed.png',fullPage:true});
  await page.getByRole('button',{name:'重新開始 ↻'}).click();await expect(page.locator('#count')).toHaveText('0 / 10');await expect(page.locator('#target-title')).toHaveText(levels[0].roomName);
  expect(errors).toEqual([]);
});
