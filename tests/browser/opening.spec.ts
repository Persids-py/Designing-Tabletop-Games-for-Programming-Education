import {test,expect} from '@playwright/test';
import {openingPages} from '../../src/opening';

test('開場全文、AI 台詞、返回、略過與操作鎖定',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install();await page.goto('/');await page.clock.runFor(32);
  const dialog=page.locator('#opening-dialog'),player=page.locator('#player');
  const initial=await player.getAttribute('transform');
  await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'上一段'})).toBeDisabled();
  await page.keyboard.down('d');await page.clock.runFor(200);await page.keyboard.up('d');
  await page.keyboard.press('m');await page.clock.runFor(32);await expect(player).toHaveAttribute('transform',initial!);await expect(page.locator('#map')).toHaveAttribute('data-view','follow');
  await page.locator('[data-room="room-1"]').evaluate(el=>(el as HTMLButtonElement).click());await expect(page.locator('#alarm-dialog')).not.toBeVisible();await expect(page.locator('#count')).toHaveText('0 / 10');
  await page.screenshot({path:'test-results/opening-01-background.png',fullPage:true});
  for(const [i,story] of openingPages.entries()){
    await expect(dialog).toHaveAttribute('data-step',String(i));await expect(page.locator('#opening-title')).toHaveText(story.title);await expect(page.locator('#opening-text p')).toHaveText([...story.paragraphs]);
    const overflow=await page.locator('#opening-text').evaluate(el=>el.scrollWidth>el.clientWidth+1);expect(overflow).toBe(false);
    if(i===1){await dialog.getByRole('button',{name:'上一段'}).click();await expect(dialog).toHaveAttribute('data-step','0');await dialog.getByRole('button',{name:'下一段 →'}).click();}
    if(i===2)await page.screenshot({path:'test-results/opening-02-storm.png',fullPage:true});
    if(i===4){await page.setViewportSize({width:1150,height:850});await page.screenshot({path:'test-results/opening-03-ai.png',fullPage:true});}
    if(i===openingPages.length-1){
      await page.screenshot({path:'test-results/opening-04-mission.png',fullPage:true});await page.keyboard.down('d');await dialog.getByRole('button',{name:'進入探索者號 →'}).click();
    }else await dialog.getByRole('button',{name:'下一段 →'}).click();
  }
  await expect(dialog).not.toBeVisible();await page.clock.runFor(200);await expect(player).toHaveAttribute('transform',initial!);await page.keyboard.up('d');
  await expect(page.locator('#target-title')).toHaveText('警報燈光室');await expect(page.locator('#target-status')).toContainText('0 / 4');
  await page.keyboard.down('d');await page.clock.runFor(128);await page.keyboard.up('d');expect(await player.getAttribute('transform')).not.toEqual(initial);
  await page.reload();await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'略過開場',exact:true}).click();await expect(dialog).not.toBeVisible();
  await page.reload();await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();expect(errors).toEqual([]);
});
