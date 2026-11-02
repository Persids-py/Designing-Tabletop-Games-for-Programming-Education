import {alarmHandbook,alarmHintTasks,generatorHandbook,lifeSupportHandbook,airlockHandbook,coolingHandbook,type Handbook,type HintTask,type RepairHintState} from './repair-handbook';

export function conceptContent(recap=false,handbook:Handbook=alarmHandbook){
  const content=document.createElement('div');content.className='handbook-concepts';
  const topic=document.createElement('p');topic.className='handbook-topic';topic.textContent=`Python · ${handbook.topic}`;content.append(topic);
  if(recap){const p=document.createElement('p');p.className='handbook-recap';p.textContent=handbook.recap;content.append(p);}
  const list=document.createElement('ol');for(const line of handbook.concepts){const li=document.createElement('li');li.textContent=line;list.append(li);}content.append(list);
  const caption=document.createElement('p');caption.textContent='語法小範例（不同於正式題目）';content.append(caption);
  const example=document.createElement('pre');example.textContent=handbook.example;content.append(example);return content;
}
export function setupRepairHandbook(dialog:HTMLDialogElement,state:RepairHintState,handbook:Handbook=alarmHandbook,tasks:Record<string,HintTask>=alarmHintTasks){
  const panel=document.createElement('aside');panel.className='repair-handbook';panel.id=handbook.levelId===1?'repair-handbook':`repair-handbook-${handbook.levelId}`;panel.setAttribute('aria-label','AI 維修手冊');panel.hidden=true;
  const trigger=document.createElement('button');trigger.type='button';trigger.className='handbook-trigger';trigger.textContent='▤ 維修手冊';trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-expanded','false');
  let selected=Object.keys(tasks)[0],opened=false,tab:'concepts'|'hints'='concepts';
  function close(focus=true){opened=false;panel.hidden=true;dialog.classList.remove('handbook-open');trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus({preventScroll:true});}
  function render(){
    const task=tasks[selected],progress=state.get(task.taskId);
    panel.innerHTML=`<header><div><span>AI 維修手冊</span><h3>第${handbook.levelId}關 · ${handbook.title}</h3></div><button type="button" data-book-action="close" aria-label="收合 AI 維修手冊">×</button></header><div class="handbook-tabs" role="tablist" aria-label="手冊內容"><button id="handbook-${handbook.levelId}-concepts-tab" type="button" role="tab" aria-controls="handbook-${handbook.levelId}-tabpanel" aria-selected="${tab==='concepts'}" data-book-tab="concepts">觀念重點</button><button id="handbook-${handbook.levelId}-hints-tab" type="button" role="tab" aria-controls="handbook-${handbook.levelId}-tabpanel" aria-selected="${tab==='hints'}" data-book-tab="hints">目前任務提示</button></div><div id="handbook-${handbook.levelId}-tabpanel" role="tabpanel" aria-labelledby="handbook-${handbook.levelId}-${tab}-tab"></div>`;
    const body=panel.querySelector('[role=tabpanel]')!;
    if(tab==='concepts')body.append(conceptContent(false,handbook));
    else{
      const title=document.createElement('h4');title.textContent=`${task.taskId}｜${task.title}`;body.append(title);
      const status=document.createElement('p');status.className='handbook-status';status.textContent=`本題正式答錯 ${progress.attemptCount} 次 · 診斷提示於答錯兩次後開放`;body.append(status);
      for(let i=0;i<progress.revealedHintLevel;i++){
        const section=document.createElement('section');section.className='handbook-hint';section.dataset.hintLevel=String(i+1);
        const heading=document.createElement('h4');heading.textContent=['提示 1｜思考方向','提示 2｜檢查方法','診斷提示｜疑似故障位置'][i];
        const p=document.createElement('p');p.textContent=task.hints[i];section.append(heading,p);body.append(section);
      }
      if(progress.revealedHintLevel<3){
        const next=progress.revealedHintLevel+1,button=document.createElement('button');button.type='button';button.dataset.reveal=String(next);
        button.textContent=next===3?'查看診斷提示':`查看提示 ${next}`;button.disabled=next===3&&progress.attemptCount<2;body.append(button);
      }
    }
  }
  trigger.addEventListener('click',()=>{if(opened){close();return;}opened=true;panel.hidden=false;dialog.classList.add('handbook-open');trigger.setAttribute('aria-expanded','true');render();panel.querySelector<HTMLButtonElement>('[role=tab]')?.focus({preventScroll:true});});
  panel.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
    if(button.dataset.bookAction==='close'){close();return;}
    if(button.dataset.bookTab){tab=button.dataset.bookTab as typeof tab;render();panel.querySelector<HTMLButtonElement>('[aria-selected=true]')?.focus({preventScroll:true});}
    if(button.dataset.reveal&&state.reveal(tasks[selected].taskId,Number(button.dataset.reveal))){render();panel.querySelector<HTMLElement>('.handbook-hint:last-of-type')?.scrollIntoView({block:'nearest'});}
  });
  // 先於題目自己的 cancel handler 註冊：第一次 Esc 只收合手冊。
  dialog.addEventListener('cancel',event=>{if(opened){event.preventDefault();event.stopImmediatePropagation();close();}});
  dialog.addEventListener('pointerdown',event=>{if(opened&&!panel.contains(event.target as Node)&&!trigger.contains(event.target as Node))close(false);});
  return {
    mount(id:string){selected=id;dialog.querySelector('.alarm-heading')!.append(trigger);dialog.append(panel);if(opened)render();},
    select(id:string){selected=id;tab='concepts';opened=true;panel.hidden=false;dialog.classList.add('handbook-open');trigger.setAttribute('aria-expanded','true');},
    refresh(){if(opened)render();},close
  };
}

export function setupHandbookReview(){
  const dialog=document.createElement('dialog');dialog.id='handbook-review-dialog';dialog.className='handbook-review-dialog';dialog.setAttribute('aria-labelledby','handbook-review-title');
  dialog.innerHTML='<button type="button" class="close" aria-label="關閉觀念回顧">×</button><h2 id="handbook-review-title">第一關 · 觀念回顧</h2>';
  dialog.append(conceptContent(true));document.body.append(dialog);
  const button=document.createElement('button');button.type='button';button.className='handbook-review-trigger';button.id='handbook-review-trigger';button.textContent='▤ 第一關觀念回顧';button.hidden=true;document.querySelector('.route-card')!.append(button);
  button.onclick=()=>{if(!document.querySelector('dialog[open]'))dialog.showModal();};
  const close=()=>{dialog.close();button.focus({preventScroll:true});};dialog.querySelector('button')!.onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  let reviewedCount=-1;
  return {button,dialog,update(completed:number){
    if(completed===reviewedCount)return;reviewedCount=completed;
    button.hidden=completed<1;
    button.textContent=completed>=2?'▤ 已修復關卡觀念回顧':'▤ 第一關觀念回顧';
    const title=dialog.querySelector('h2')!;title.textContent=completed>=2?'已修復關卡 · 觀念回顧':'第一關 · 觀念回顧';
    dialog.querySelectorAll('.handbook-concepts,.review-level-title').forEach(node=>node.remove());
    for(const book of [alarmHandbook,generatorHandbook,lifeSupportHandbook,airlockHandbook,coolingHandbook]){
      if(completed<book.levelId)continue;
      const heading=document.createElement('h3');heading.className='review-level-title';heading.textContent=`第${book.levelId}關 · ${book.title}`;dialog.append(heading,conceptContent(true,book));
    }
  }};
}
