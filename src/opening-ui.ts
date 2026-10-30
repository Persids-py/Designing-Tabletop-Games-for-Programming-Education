import {openingPages} from './opening';
export function setupOpeningUI(mapUrl:string,callbacks:{opened:()=>void;closed:()=>void}){
  const dialog=document.createElement('dialog');dialog.id='opening-dialog';dialog.className='opening-dialog';dialog.setAttribute('aria-labelledby','opening-title');document.body.append(dialog);
  let index=0;
  function finish(){dialog.close();callbacks.closed();}
  function render(){
    const page=openingPages[index],ai=index>=4&&index<=7,last=index===openingPages.length-1;
    dialog.dataset.step=String(index);dialog.dataset.tone=page.tone;
    dialog.innerHTML=`<header class="opening-header"><div><span class="opening-kicker">太空船除錯大冒險</span><p>01 / 開場背景故事</p></div><button type="button" class="opening-skip" data-action="skip">略過開場</button></header><div class="opening-layout"><div class="opening-visual" aria-hidden="true"><div class="opening-orbit"></div><img src="${mapUrl}" alt=""><div class="opening-ai-emblem"><span>✧</span><small>備用 AI</small></div><div class="opening-ship-label"><span>探索者號</span><small>${page.tone==='space'?'星際探勘任務':page.tone==='danger'?'中央控制系統異常':page.tone==='ai'?'備用人工智慧系統':'維修任務待命'}</small></div></div><section class="opening-copy"><p class="opening-speaker">${ai?'太空船 AI 助手':page.tone==='mission'?'任務簡報':'探索者號 · 航行紀錄'}</p><h2 id="opening-title">${page.title}</h2><div id="opening-text" ${ai?'class="opening-dialogue"':''}></div></section></div><footer class="opening-footer"><div class="opening-progress" aria-label="開場閱讀進度"><span id="opening-progress">${index+1} / ${openingPages.length}</span><div><i style="width:${(index+1)/openingPages.length*100}%"></i></div></div><div class="opening-actions"><button type="button" data-action="previous" ${index===0?'disabled':''}>上一段</button><button type="button" class="primary" data-action="next">${last?'進入探索者號':'下一段'} <span>→</span></button></div></footer>`;
    const content=dialog.querySelector('#opening-text')!;
    for(const paragraph of page.paragraphs){const p=document.createElement('p');p.textContent=paragraph;content.append(p);}
    dialog.scrollTop=0;
  }
  dialog.addEventListener('click',event=>{
    const action=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]')?.dataset.action;
    if(action==='skip'){finish();return;}
    if(action==='previous'&&index>0)index--;
    else if(action==='next'){if(index===openingPages.length-1){finish();return;}index++;}
    else return;
    render();dialog.querySelector<HTMLButtonElement>('[data-action="next"]')?.focus({preventScroll:true});
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
  return {dialog,open(){index=0;callbacks.opened();render();dialog.showModal();dialog.querySelector<HTMLButtonElement>('[data-action="next"]')?.focus({preventScroll:true});}};
}
