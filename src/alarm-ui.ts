import {alarmTasks,bootOrder,type AlarmTaskId} from './alarm';
import type {Game} from './game';

interface Callbacks {changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function setupAlarmUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='alarm-dialog';dialog.className='alarm-dialog';dialog.setAttribute('aria-labelledby','alarm-title');document.body.append(dialog);
  let selected:AlarmTaskId='computer',symbol='',order:string[]=['SIREN ON','SYSTEM CHECK','RED LIGHT ON'];
  let dragging:number|null=null;
  const subtitle={computer:'1-1 / 指令修復',light:'1-2 / 符號填空',broadcast:'1-3 / 修改廣播',verify:'1-4 / 啟動排序'};
  function close(){dialog.close();game.close();callbacks.closed();}
  function render(){
    const task=alarmTasks.find(t=>t.id===selected)!;
    const done=game.alarm.repaired[selected];
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第一關 / 失控的警報系統</p><div class="alarm-stages" aria-label="設備修復進度">${alarmTasks.map((t,i)=>`<span class="${game.alarm.repaired[t.id]?'done':t.id===selected?'current':''}">${game.alarm.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>${subtitle[selected]}</span><h2 id="alarm-title">${task.name}</h2></div><div id="alarm-body"></div><p id="alarm-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#alarm-body')!;
    if(done){
      const output=selected==='verify'?bootOrder:[bootOrder[selected==='computer'?0:selected==='light'?1:2]];
      body.innerHTML=`<div class="device-success">✓ 設備已修復</div><pre class="terminal-output">${output.join('\n')}</pre><p class="alarm-note">修復狀態已保留。返回船艙，繼續查看其他設備。</p><button type="button" data-action="close" class="primary">返回船艙 <span>→</span></button>`;return;
    }
    if(selected==='computer'){
      body.innerHTML=`<p class="alarm-instruction">主控制電腦無法執行啟動指令。找出正確的修法，讓螢幕重新啟動。</p><pre class="code-window"><span>控制電腦 / Python</span><code>priint("SYSTEM CHECK")</code></pre><form id="alarm-form"><fieldset class="choice-list"><legend>選擇修復方式</legend>${[['A','把 <code>priint</code> 改成 <code>print</code>'],['B','把 <code>priint</code> 改成 <code>Print</code>'],['C','刪除括號 <code>()</code>'],['D','把 <code>priint</code> 改成 <code>input</code>']].map(([id,label])=>`<label><input type="radio" name="fix-command" value="${id}" required><span><b>${id}</b> ${label}</span></label>`).join('')}</fieldset><button type="submit" class="primary">修復電腦 <span>↗</span></button></form>`;
    }else if(selected==='light'){
      body.innerHTML=`<p class="alarm-instruction">警報燈無法接收指令。補上缺少的符號，讓程式顯示 <code>RED LIGHT ON</code>。</p><pre class="code-window"><span>目前故障程式</span><code>print("RED LIGHT ON)</code></pre><form id="alarm-form"><p class="alarm-note">點選或拖曳一塊符號，放進下面的空格。</p><div class="symbol-palette">${['"','(',')',':'].map(s=>`<button type="button" draggable="true" data-symbol="${escape(s)}" aria-label="符號 ${escape(s)}">${escape(s)}</button>`).join('')}</div><div class="symbol-code"><code>print("RED LIGHT ON</code><button type="button" id="symbol-slot" aria-label="缺少的符號" data-action="clear-symbol">${escape(symbol)||'□'}</button><code>)</code></div><button type="submit" class="primary">修復警報燈 <span>↗</span></button></form>`;
    }else if(selected==='broadcast'){
      body.innerHTML=`<p class="alarm-instruction">程式可以執行，但廣播訊息不正確。請直接修改字串，讓輸出精確等於 <code>SIREN ON</code>。</p><pre class="code-window"><span>目前故障程式</span><code>print("SIREN OFF")</code></pre><form id="alarm-form"><label class="alarm-note" for="broadcast-message">編輯引號內的廣播內容</label><div class="broadcast-editor"><code>print("</code><input id="broadcast-message" name="broadcast-message" value="SIREN OFF" maxlength="80" autocomplete="off" spellcheck="false" aria-label="廣播字串內容"><code>")</code></div><button type="submit" class="primary">執行 <span>↗</span></button></form>`;
    }else{
      body.innerHTML=`<p class="alarm-instruction">三個設備已修復。先檢查控制電腦，再啟動紅燈，最後啟動廣播，讓整個系統一起運作。</p><p class="alarm-note">拖曳程式卡片排序，也可使用上下按鈕調整。</p><form id="alarm-form"><ol id="boot-cards" class="boot-cards"></ol><button type="submit" class="primary">啟動警報 <span>↗</span></button></form>`;renderCards();
    }
    dialog.querySelector('form')?.addEventListener('submit',submit);
  }
  function renderCards(){
    const list=dialog.querySelector('#boot-cards');if(!list)return;
    list.innerHTML=order.map((line,i)=>`<li draggable="true" data-card="${i}"><span class="drag-grip" aria-hidden="true">⠿</span><code>print("${line}")</code><div><button type="button" data-move="-1" data-index="${i}" aria-label="上移 ${line}" ${i===0?'disabled':''}>↑</button><button type="button" data-move="1" data-index="${i}" aria-label="下移 ${line}" ${i===order.length-1?'disabled':''}>↓</button></div></li>`).join('');
  }
  function reorder(from:number,to:number){if(from===to||from<0||to<0||from>=order.length||to>=order.length)return;const [line]=order.splice(from,1);order.splice(to,0,line);renderCards();}
  function submit(event:Event){
    event.preventDefault();
    const form=dialog.querySelector<HTMLFormElement>('form')!;
    const answer=selected==='computer'?new FormData(form).get('fix-command'):selected==='light'?symbol:selected==='broadcast'?new FormData(form).get('broadcast-message'):[...order];
    const result=game.submitAlarm(selected,answer);
    if(!result.success){const feedback=dialog.querySelector<HTMLElement>('#alarm-feedback')!;feedback.textContent=result.message;feedback.classList.add('error');return;}
    if(selected==='verify'){
      if(!game.repair('room-1')){callbacks.notify('驗證完成，請在啟動台附近完成修復。');return;}
      dialog.close();callbacks.completed();return;
    }
    render();callbacks.changed();
    const feedback=dialog.querySelector<HTMLElement>('#alarm-feedback')!;feedback.textContent=result.message;
    dialog.querySelector<HTMLElement>('[data-action="close"].primary')?.focus();
  }
  dialog.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
    if(button.dataset.action==='close'){close();return;}
    if(button.dataset.symbol!==undefined){symbol=button.dataset.symbol;const slot=dialog.querySelector('#symbol-slot');if(slot)slot.textContent=symbol;}
    if(button.dataset.action==='clear-symbol'){symbol='';button.textContent='□';}
    if(button.dataset.move)reorder(Number(button.dataset.index),Number(button.dataset.index)+Number(button.dataset.move));
  });
  dialog.addEventListener('dragstart',event=>{
    const target=event.target as HTMLElement;
    if(target.dataset.symbol!==undefined)event.dataTransfer?.setData('text/plain',target.dataset.symbol);
    const card=target.closest<HTMLElement>('[data-card]');if(card){dragging=Number(card.dataset.card);event.dataTransfer?.setData('text/plain',String(dragging));}
  });
  dialog.addEventListener('dragover',event=>{if((event.target as HTMLElement).closest('#symbol-slot,[data-card]'))event.preventDefault();});
  dialog.addEventListener('drop',event=>{
    event.preventDefault();const target=event.target as HTMLElement;
    if(target.closest('#symbol-slot')){const value=event.dataTransfer?.getData('text/plain')??'';if(['"','(',')',':'].includes(value)){symbol=value;dialog.querySelector('#symbol-slot')!.textContent=value;}}
    const card=target.closest<HTMLElement>('[data-card]');if(card&&dragging!==null)reorder(dragging,Number(card.dataset.card));dragging=null;
  });
  dialog.addEventListener('dragend',()=>{dragging=null;});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:AlarmTaskId){const error=game.openAlarm(id);if(error){callbacks.notify(error);return;}selected=id;symbol='';order=['SIREN ON','SYSTEM CHECK','RED LIGHT ON'];render();dialog.showModal();}};
}
