import {test,expect} from '@playwright/test';

test('船員踏步、停止、左右轉向及卡牆後停止踏步',async({page})=>{
  await page.clock.install();await page.goto('/');await page.clock.runFor(32);
  await expect(page.locator('#player')).toHaveAttribute('data-motion','idle');
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
