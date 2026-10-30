import {interfaceGuideSteps} from './interface-guide';

export function setupInterfaceGuide(callbacks:{opened:()=>void;closed:()=>void}){
  const dialog=document.createElement('dialog');
  dialog.id='interface-guide-dialog';dialog.className='interface-guide-dialog';
  dialog.setAttribute('aria-labelledby','interface-guide-title');
  dialog.innerHTML=`<div class="guide-highlight" aria-hidden="true"></div>
    <section class="guide-preview" aria-label="程式維修介面示意" hidden><p>程式維修介面 · 示意</p><h3>設備修復任務</h3><div>任務說明與故障程式顯示區</div><ul><li>選擇／填空</li><li>程式排列</li><li>錯誤修正</li></ul><small>抵達設備後才會開啟實際題目</small></section>
    <section class="guide-card"><header><div><span>02 / 新手教學 1</span><p>太空船 AI 助手</p></div><button type="button" data-guide-action="skip">略過導覽</button></header><h2 id="interface-guide-title"></h2><div id="interface-guide-text"></div><footer><span id="interface-guide-progress"></span><div><button type="button" data-guide-action="previous">上一段</button><button type="button" data-guide-action="next">下一段 →</button></div></footer></section>`;
  document.body.append(dialog);
  const highlight=dialog.querySelector<HTMLElement>('.guide-highlight')!;
  const preview=dialog.querySelector<HTMLElement>('.guide-preview')!;
  const card=dialog.querySelector<HTMLElement>('.guide-card')!;
  const next=dialog.querySelector<HTMLButtonElement>('[data-guide-action="next"]')!;
  const previous=dialog.querySelector<HTMLButtonElement>('[data-guide-action="previous"]')!;
  const map=document.getElementById('map')!;
  const status=document.querySelector<HTMLElement>('aside')!;
  let index=0,returnScroll=0;
  function position(){
    if(!dialog.open)return;
    const step=interfaceGuideSteps[index];
    const mapRect=map.getBoundingClientRect();
    preview.style.left=`${Math.max(12,mapRect.left+20)}px`;
    preview.style.top=`${Math.max(12,mapRect.top+16)}px`;
    preview.style.width=`${Math.max(180,Math.min(320,mapRect.width*.4,window.innerWidth-24))}px`;
    const target=step.target==='status'?status:step.target==='repair'?preview:map;
    const rect=target.getBoundingClientRect();
    const left=Math.max(6,rect.left),top=Math.max(6,rect.top);
    highlight.style.left=`${left}px`;highlight.style.top=`${top}px`;
    highlight.style.width=`${Math.max(0,Math.min(window.innerWidth-6,rect.right)-left)}px`;
    highlight.style.height=`${Math.max(0,Math.min(window.innerHeight-6,rect.bottom)-top)}px`;
  }
  function render(){
    const step=interfaceGuideSteps[index];
    dialog.dataset.step=String(index);dialog.dataset.target=step.target;
    dialog.querySelector('#interface-guide-title')!.textContent=step.title;
    const text=dialog.querySelector('#interface-guide-text')!;text.replaceChildren();
    for(const paragraph of step.paragraphs){const p=document.createElement('p');p.textContent=paragraph;text.append(p);}
    dialog.querySelector('#interface-guide-progress')!.textContent=`${index+1} / ${interfaceGuideSteps.length}`;
    previous.disabled=index===0;next.textContent=index===interfaceGuideSteps.length-1?'開始探索 →':'下一段 →';
    preview.hidden=step.target!=='repair';
    const target=step.target==='status'?status:map;
    // 每段只定位一次；不將導覽版面計算加入遊戲的逐幀移動迴圈。
    target.scrollIntoView({block:'center',behavior:'instant'});
    position();card.scrollTop=0;next.focus({preventScroll:true});
  }
  function close(){dialog.close();preview.hidden=true;window.scrollTo({top:returnScroll,behavior:'instant'});callbacks.closed();}
  dialog.addEventListener('click',event=>{
    const action=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-guide-action]')?.dataset.guideAction;
    if(action==='skip'){close();return;}
    if(action==='previous'&&index>0)index--;
    else if(action==='next'){if(index===interfaceGuideSteps.length-1){close();return;}index++;}
    else return;
    render();
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  window.addEventListener('resize',position);
  window.addEventListener('scroll',position,{passive:true});
  const observer=new ResizeObserver(position);observer.observe(map);observer.observe(status);
  return {dialog,open(){if(dialog.open)return;returnScroll=window.scrollY;index=0;callbacks.opened();dialog.showModal();render();}};
}
