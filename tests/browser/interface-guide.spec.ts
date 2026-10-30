import {test,expect} from '@playwright/test';
import {interfaceGuideSteps} from '../../src/interface-guide';

test('介面導覽全文、區域框選、示意、鎖定與重看',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'略過開場',exact:true}).click();await page.clock.runFor(64);
  const guide=page.locator('#interface-guide-dialog'),player=page.locator('#player');
  const initial=await player.getAttribute('transform');
  await expect(guide).toBeVisible();await expect(guide.getByRole('button',{name:'上一段'})).toBeDisabled();
  expect(await guide.evaluate(el=>getComputedStyle(el,'::backdrop').backdropFilter)).toBe('none');
  await page.keyboard.down('d');await page.clock.runFor(256);await page.keyboard.up('d');await page.keyboard.press('m');
  await expect(player).toHaveAttribute('transform',initial!);await expect(page.locator('#map')).toHaveAttribute('data-view','follow');
  await page.locator('[data-alarm-task="computer"]').evaluate(el=>(el as HTMLButtonElement).click());await expect(page.locator('#alarm-dialog')).not.toBeVisible();
  for(const [i,step] of interfaceGuideSteps.entries()){
    await expect(guide).toHaveAttribute('data-step',String(i));await expect(page.locator('#interface-guide-title')).toHaveText(step.title);await expect(page.locator('#interface-guide-text p')).toHaveText([...step.paragraphs]);
    const bounds=await page.locator('.guide-card').boundingBox();expect(bounds!.y).toBeGreaterThanOrEqual(0);expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await page.locator('.guide-card').evaluate(el=>el.scrollWidth>el.clientWidth+1)).toBe(false);
    if(i===1){await guide.getByRole('button',{name:'上一段'}).click();await expect(guide).toHaveAttribute('data-step','0');await guide.getByRole('button',{name:'下一段 →'}).click();}
    if(i===2){
      await page.setViewportSize({width:1150,height:850});await page.clock.runFor(64);
      await expect.poll(async()=>{const sidebar=await page.locator('aside').boundingBox(),focus=await page.locator('.guide-highlight').boundingBox();return Math.abs(sidebar!.x-focus!.x);}).toBeLessThan(3);
      await page.screenshot({path:'test-results/guide-02-status.png',fullPage:true});
    }
    if(i===3){
      await expect(page.getByRole('region',{name:'程式維修介面示意'})).toBeVisible();await expect(page.locator('#alarm-dialog')).not.toBeVisible();await expect(guide.locator('input,form')).toHaveCount(0);
      const preview=await page.locator('.guide-preview').boundingBox(),character=await player.boundingBox();expect(preview!.x+preview!.width).toBeLessThan(character!.x);
      await page.screenshot({path:'test-results/guide-03-repair.png',fullPage:true});
    }
    if(i===0)await page.screenshot({path:'test-results/guide-01-welcome.png',fullPage:true});
    if(i===interfaceGuideSteps.length-1){await page.keyboard.down('d');await guide.getByRole('button',{name:'開始探索 →'}).click();}
    else await guide.getByRole('button',{name:'下一段 →'}).click();
  }
  await page.clock.runFor(256);await page.keyboard.up('d');await expect(guide).not.toBeVisible();await expect(player).toHaveAttribute('transform',initial!);
  await expect(page.locator('#count')).toHaveText('0 / 10');await expect(page.locator('#target-status')).toContainText('0 / 4');
  await page.keyboard.down('d');await page.clock.runFor(128);await page.keyboard.up('d');expect(await player.getAttribute('transform')).not.toEqual(initial);
  const moved=await player.getAttribute('transform');await page.locator('#interface-guide-replay').click();await expect(guide).toHaveAttribute('data-step','0');await page.keyboard.press('Escape');await expect(guide).not.toBeVisible();await expect(player).toHaveAttribute('transform',moved!);
  await page.locator('#interface-guide-replay').click();await guide.getByRole('button',{name:'略過導覽'}).click();await expect(guide).not.toBeVisible();await expect(page.locator('#opening-dialog')).not.toBeVisible();expect(errors).toEqual([]);
});
