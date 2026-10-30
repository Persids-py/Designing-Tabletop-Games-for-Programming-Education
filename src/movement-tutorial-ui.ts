import type {Game} from './game';
import {MovementTutorialState,movementLines,foundLines} from './movement-tutorial';

export function setupMovementTutorial(game:Game,map:HTMLElement,callbacks:{paused:()=>void;released:()=>void;repair:()=>boolean;notify:(text:string)=>void}){
  const state=new MovementTutorialState();
  const dialog=document.createElement('dialog');dialog.id='movement-tutorial-dialog';dialog.className='movement-tutorial-dialog';dialog.setAttribute('aria-labelledby','movement-tutorial-title');
  const hud=document.createElement('div');hud.id='movement-tutorial-hud';hud.className='movement-tutorial-hud';hud.hidden=true;map.append(hud);document.body.append(dialog);
  let page=0;
  const active=()=>game.index===0&&!game.alarm.repaired.computer;
  function updateHud(){
    const visible=state.phase==='moving'||state.phase==='ready';hud.hidden=!visible;
    if(visible)hud.innerHTML=`<span>03 / 新手教學 2 · 角色移動</span><strong>${state.phase==='ready'?'已抵達主控制電腦':'前往警報燈光室 · 主控制電腦'}</strong><p>${state.phase==='ready'?'點擊主控制電腦，繼續維修提示':'W ↑　A ←　S ↓　D →　沿走廊靠近三角形標記'}</p>`;
  }
  function render(){
    const found=state.phase==='found',last=found?page===foundLines.length:page===movementLines.length-1;
    dialog.dataset.phase=found?'found':'intro';dialog.dataset.step=String(page);
    dialog.innerHTML=`<header><div><span>${found?'04 / 首次抵達故障設備':'03 / 新手教學 2'}</span><p>太空船 AI 助手</p></div><button type="button" data-move-action="close">${found?'稍後維修':'略過說明'}</button></header><h2 id="movement-tutorial-title">${found?'【已發現故障設備】':'角色移動 · WASD'}</h2><div id="movement-tutorial-text"></div><footer><span>${page+1} / ${found?foundLines.length+1:movementLines.length}</span><div><button type="button" data-move-action="previous" ${page===0?'disabled':''}>上一段</button><button type="button" data-move-action="next">${last?(found?'開始維修':'開始移動'):'下一段'} →</button></div></footer>`;
    const content=dialog.querySelector('#movement-tutorial-text')!;
    if(found&&last){
      const destination=document.createElement('p');destination.textContent='即將進入「第 1 關：警報燈光室」';content.append(destination);
      const mission=document.createElement('p');mission.textContent='修復損壞的警報控制程式，重新啟動太空船的警報系統。';content.append(mission);
    }else{const p=document.createElement('p');p.textContent=found?foundLines[page]:movementLines[page];content.append(p);}
    if(!found){
      const keys=document.createElement('dl');keys.className='movement-key-grid';keys.setAttribute('aria-label','移動按鍵');
      for(const [key,direction] of [['W','向上'],['A','向左'],['S','向下'],['D','向右']]){const item=document.createElement('div');const dt=document.createElement('dt');dt.textContent=key;const dd=document.createElement('dd');dd.textContent=direction;item.append(dt,dd);keys.append(item);}content.append(keys);
      const task=document.createElement('p');task.className='movement-task';task.textContent='使用 WASD 移動角色，靠近第一個指定的故障設備。';content.append(task);
    }
    dialog.scrollTop=0;dialog.querySelector<HTMLButtonElement>('[data-move-action="next"]')!.focus({preventScroll:true});
  }
  function show(){callbacks.paused();hud.hidden=true;if(!dialog.open)dialog.showModal();render();}
  function dismiss(){dialog.close();if(state.phase==='intro')state.move();else state.dismiss();updateHud();callbacks.released();}
  function found(){page=0;map.classList.add('tutorial-device-found');show();}
  dialog.addEventListener('click',event=>{
    const action=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-move-action]')?.dataset.moveAction;
    if(action==='close'){dismiss();return;}
    if(action==='previous'&&page>0)page--;
    else if(action==='next'){
      if(state.phase==='intro'&&page===movementLines.length-1){dismiss();return;}
      if(state.phase==='found'&&page===foundLines.length){
        if(!active()||!state.near(game.player)){dismiss();callbacks.notify('請先靠近主控制電腦，再開始維修。');return;}
        dialog.close();callbacks.paused();
        const opened=callbacks.repair();
        if(state.enter(opened)){map.classList.remove('tutorial-device-found');updateHud();}
        else{state.dismiss();updateHud();callbacks.released();}
        return;
      }
      page++;
    }else return;
    render();
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  return {
    dialog,
    start(){if(state.start()){page=0;show();}},
    update(){if(!dialog.open&&state.arrive(game.player,active()))found();},
    deviceClick(id:string){
      if(state.phase==='pending'||state.phase==='entered')return false;
      if(id==='computer'&&state.resume(game.player,active())){show();return true;}
      if(id==='computer'&&state.arrive(game.player,active())){found();return true;}
      callbacks.notify('請先沿走廊前往主控制電腦，依維修提示開始第一項任務。');return true;
    },
    reset(){dialog.close();state.reset();page=0;hud.hidden=true;map.classList.remove('tutorial-device-found');}
  };
}
