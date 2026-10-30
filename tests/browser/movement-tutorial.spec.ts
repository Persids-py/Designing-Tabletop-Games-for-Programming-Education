import {test,expect} from '@playwright/test';
import {movementLines} from '../../src/movement-tutorial';

test('移動說明全文、WASD 四方向、導覽重看不重置教學',async({page})=>{
  await page.clock.install({time:new Date('2026-10-30T00:00:00Z')});await page.goto('/');await page.clock.pauseAt(new Date('2026-10-30T00:01:00Z'));
  await page.getByRole('button',{name:'略過開場',exact:true}).click();await page.getByRole('button',{name:'略過導覽',exact:true}).click();
  const dialog=page.locator('#movement-tutorial-dialog'),player=page.locator('#player');await expect(dialog).toHaveAttribute('data-phase','intro');
  await expect(page.locator('.movement-key-grid dt')).toHaveText(['W','A','S','D']);await expect(page.locator('.movement-key-grid dd')).toHaveText(['向上','向左','向下','向右']);
  const initial=await player.getAttribute('transform');await page.keyboard.down('d');await page.clock.runFor(128);await page.keyboard.up('d');await expect(player).toHaveAttribute('transform',initial!);
  for(const [i,line] of movementLines.entries()){
    await expect(page.locator('#movement-tutorial-text')).toContainText(line);
    if(i===1){await page.setViewportSize({width:1150,height:850});const card=await dialog.boundingBox(),character=await player.boundingBox();expect(card!.y+card!.height).toBeLessThan(character!.y);await page.screenshot({path:'test-results/tutorial-03-controls.png',fullPage:true});await dialog.getByRole('button',{name:'上一段'}).click();await expect(dialog).toHaveAttribute('data-step','0');await dialog.getByRole('button',{name:'下一段 →'}).click();}
    await dialog.getByRole('button',{name:i===movementLines.length-1?'開始移動 →':'下一段 →'}).click();
  }
  await expect(dialog).not.toBeVisible();await expect(page.locator('#movement-tutorial-hud')).toBeVisible();
  const position=async()=>{const raw=await player.getAttribute('transform');return raw!.match(/[\d.]+/g)!.map(Number);};
  for(const [key,axis,sign] of [['w',1,-1],['s',1,1],['a',0,-1],['d',0,1]] as const){const before=await position();await page.keyboard.down(key);await page.clock.runFor(96);await page.keyboard.up(key);const after=await position();expect((after[axis]-before[axis])*sign).toBeGreaterThan(0);}
  await page.locator('#interface-guide-replay').click();await page.getByRole('button',{name:'略過導覽'}).click();await expect(dialog).not.toBeVisible();await expect(page.locator('#movement-tutorial-hud')).toBeVisible();await expect(page.locator('#count')).toHaveText('0 / 10');
});
