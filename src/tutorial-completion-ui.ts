import {tutorialCompletionLines} from './tutorial-completion';

export function setupTutorialCompletion(callbacks:{opened:()=>void;closed:()=>void}){
  const dialog=document.createElement('dialog');dialog.id='tutorial-completion-dialog';dialog.className='tutorial-completion-dialog';dialog.setAttribute('aria-labelledby','tutorial-completion-title');document.body.append(dialog);
  let index=0;
  function render(){
    const last=index===tutorialCompletionLines.length;
    dialog.dataset.step=String(index);
    dialog.innerHTML=`<header><span>05 / 新手教學完成</span><button type="button" data-completion-action="close">進入任務</button></header><div class="tutorial-completion-symbol" aria-hidden="true">✓</div><p class="tutorial-completion-speaker">太空船 AI 助手</p><h2 id="tutorial-completion-title">${last?'【新手教學完成｜正式開始維修任務】':'新手教學完成'}</h2><p id="tutorial-completion-text"></p><footer><span>${index+1} / ${tutorialCompletionLines.length+1}</span><div><button type="button" data-completion-action="previous" ${index===0?'disabled':''}>上一段</button><button type="button" data-completion-action="next">${last?'正式開始維修任務':'下一段'} →</button></div></footer>`;
    dialog.querySelector('#tutorial-completion-text')!.textContent=last?'':tutorialCompletionLines[index];
    dialog.scrollTop=0;dialog.querySelector<HTMLButtonElement>('[data-completion-action="next"]')!.focus({preventScroll:true});
  }
  function close(){dialog.close();callbacks.closed();}
  dialog.addEventListener('click',event=>{
    const action=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-completion-action]')?.dataset.completionAction;
    if(action==='close'){close();return;}
    if(action==='previous'&&index>0)index--;
    else if(action==='next'){if(index===tutorialCompletionLines.length){close();return;}index++;}
    else return;
    render();
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(){if(dialog.open)return;index=0;callbacks.opened();render();dialog.showModal();dialog.querySelector<HTMLButtonElement>('[data-completion-action="next"]')!.focus({preventScroll:true});},reset(){dialog.close();index=0;}};
}
