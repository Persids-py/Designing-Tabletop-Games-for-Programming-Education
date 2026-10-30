import {test,expect} from '@playwright/test';

test('一般筆電尺寸的導覽不遮住角色與右側任務',async({page})=>{
  for(const [width,height] of [[1366,768],[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});await page.goto('/');await page.getByRole('button',{name:'略過開場',exact:true}).click();
  const guide=page.locator('#interface-guide-dialog');
  for(let step=0;step<5;step++){
    const card=await page.locator('.guide-card').boundingBox(),player=await page.locator('#player').boundingBox();
    const overlaps=card!.x<player!.x+player!.width&&card!.x+card!.width>player!.x&&card!.y<player!.y+player!.height&&card!.y+card!.height>player!.y;
    expect(overlaps,`導覽第 ${step+1} 段遮住角色`).toBe(false);
    const sidebar=await page.locator('aside').boundingBox();expect(card!.x+card!.width).toBeLessThan(sidebar!.x);
    await guide.getByRole('button',{name:step===4?'開始探索 →':'下一段 →'}).click();
  }
  }
});
