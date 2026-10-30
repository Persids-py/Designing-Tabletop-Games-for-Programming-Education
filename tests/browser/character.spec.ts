import {test,expect} from '@playwright/test';

test('船員踏步、停止、左右轉向及卡牆後停止踏步',async({page})=>{
  await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'略過開場',exact:true}).click();await page.getByRole('button',{name:'略過導覽',exact:true}).click();if(await page.locator('#movement-tutorial-dialog').isVisible())await page.getByRole('button',{name:'略過說明',exact:true}).click();await page.clock.runFor(32);
  await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
  // 陰影限於角色，避免每張全船 SVG 都建立整幅地圖的濾鏡圖層。
  expect(await page.locator('#player-layer').evaluate(el=>getComputedStyle(el).filter)).toBe('none');
  expect(await page.locator('#generator-scene').evaluate(el=>getComputedStyle(el).filter)).toBe('none');
  expect(await page.locator('#player').evaluate(el=>getComputedStyle(el).filter)).toContain('drop-shadow');
  // 靜止畫面不應每幀重寫角色、相機文字與提示，避免無效版面計算。
  await page.clock.runFor(64);
  const idle=await page.evaluateHandle(()=>{
    const state={count:0,observer:new MutationObserver(records=>{state.count+=records.length;})};
    for(const selector of ['#player','#map-world','#camera-toggle','.map-caption','#proximity']){
      state.observer.observe(document.querySelector(selector)!,{attributes:true,childList:true,characterData:true,subtree:true});
    }
    return state;
  });
  await page.clock.runFor(512);
  expect(await idle.evaluate(state=>{state.observer.disconnect();return state.count;})).toBe(0);
  await idle.dispose();
  await page.keyboard.down('d');await page.clock.runFor(128);
  await expect(page.locator('#player')).toHaveAttribute('data-motion','walking');
  const pose=await page.locator('#crew-leg-front').getAttribute('transform');
  await page.clock.runFor(64);
  expect(await page.locator('#crew-leg-front').getAttribute('transform')).not.toEqual(pose);
  await expect(page.locator('#crew-facing')).toHaveAttribute('data-facing','right');
  await page.screenshot({path:'test-results/crewmate-walking.png',fullPage:true});
  await page.keyboard.up('d');await page.clock.runFor(32);
  await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
  await expect(page.locator('#crew-leg-front')).toHaveAttribute('transform','rotate(0 9 -14) translate(0 0)');
  await page.keyboard.down('a');await page.clock.runFor(128);
  await expect(page.locator('#crew-facing')).toHaveAttribute('data-facing','left');
  await page.keyboard.up('a');
  await page.keyboard.down('w');await page.clock.runFor(1200);
  await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
  await page.keyboard.up('w');
});
