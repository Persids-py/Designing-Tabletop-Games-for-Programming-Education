import {boosterTasks,boosterSpeeds,type BoosterTaskId} from './booster';
import type {Game} from './game';
interface Callbacks{changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
export function setupBoosterUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='booster-dialog';dialog.className='alarm-dialog booster-dialog';dialog.setAttribute('aria-labelledby','booster-title');document.body.append(dialog);
  let selected:BoosterTaskId='declaration',symbol='',operator='+';
  function close(){dialog.close();game.close();callbacks.closed();}
  function feedback(message:string,error=false){const el=dialog.querySelector<HTMLElement>('#booster-feedback')!;el.textContent=message;el.classList.toggle('error',error);}
  function render(){
    const task=boosterTasks.find(t=>t.id===selected)!;
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第六關 / 失去動力的副推進器</p><div class="alarm-stages" aria-label="推進器修復進度">${boosterTasks.map((t,i)=>`<span class="${game.booster.repaired[t.id]?'done':t.id===selected?'current':''}">${game.booster.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>6-${boosterTasks.indexOf(task)+1} / 函式設計與回傳</span><h2 id="booster-title">${task.name}</h2></div><div id="booster-body"></div><p id="booster-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#booster-body')!;
    if(game.booster.repaired[selected]){
      body.innerHTML=`<div class="device-success">✓ 推進器設備已修復</div><pre class="terminal-output">${selected==='declaration'?'函式宣告成立':selected==='formula'?'booster_power(20) → 60':'thrust = 60'}</pre><p class="alarm-note">修復進度已保留，繼續檢查其他設備。</p><button type="button" class="primary" data-action="close">返回船艙 <span>→</span></button>`;return;
    }
    if(selected==='declaration'){
      body.innerHTML=`<p class="alarm-instruction">推進器函式啟動失敗。請補上第一行函式宣告缺少的符號。</p><pre class="code-window"><code>def booster_power(speed)<button type="button" id="def-slot" aria-label="函式宣告結尾符號">？</button>\n    power = speed * 3\n    return power</code></pre><div class="symbol-palette" aria-label="函式宣告符號">${[':', ';', '=', '!'].map(value=>`<button type="button" draggable="true" data-symbol="${value}" aria-label="符號 ${value}">${value}</button>`).join('')}</div><p class="alarm-note">點選符號，或拖到函式宣告結尾。</p><form><button type="submit" class="primary">修復函式宣告 <span>↗</span></button></form>`;
    }else if(selected==='formula'){
      body.innerHTML=`<p class="alarm-instruction">推力公式有誤。當 <code>speed = 20</code> 時應輸出 <strong>60</strong>，請替換第二行的運算子。</p><pre class="code-window"><code>def booster_power(speed):\n    power = speed <b id="booster-operator">+</b> 3\n    return power</code></pre><div class="operator-cards" role="group" aria-label="推力運算子">${['+','-','*','/'].map(value=>`<button type="button" data-operator="${value}" aria-label="運算子 ${value}" aria-pressed="${value===operator}">${value}</button>`).join('')}</div><form><button type="submit" class="primary">修復推力公式 <span>↗</span></button></form>`;
    }else if(selected==='return'){
      body.innerHTML=`<p class="alarm-instruction">程式能計算推力，最後卻印出 <code>None</code>。請把函式中的第三行改為回傳結果，讓 <code>thrust</code> 正確取得數值。</p><form><div class="code-window"><code>def booster_power(speed):<br>    power = speed * 3</code><label class="alarm-note" for="return-code">修改第三行（四空格縮排已提供）</label><input id="return-code" name="return-code" maxlength="100" required autocomplete="off" spellcheck="false" value="print(power)" aria-label="推力回傳指令"><code><br>thrust = booster_power(20)<br>print(thrust)</code></div><button type="submit" class="primary">修復推力回傳 <span>↗</span></button></form>`;
    }else{
      const index=game.booster.testOutputs.length;
      body.innerHTML=`<p class="alarm-instruction">依序預測低速、中速、高速模式的推力。每次測試通過會點亮一盞能源指示燈。</p><div class="booster-modes">${boosterSpeeds.map((speed,i)=>`<div class="${i<index?'done':i===index?'current':''}"><strong>${['低速','中速','高速'][i]}</strong><span>speed = ${speed}</span><b>${i<index?`✓ 推力 ${game.booster.testOutputs[i]}`:'等待測試'}</b></div>`).join('')}</div><pre class="code-window"><code>def booster_power(speed):\n    power = speed * 3\n    return power\n\nprint(booster_power(${boosterSpeeds[index]}))</code></pre><form><label class="alarm-note" for="thrust-output">目前模式：${['低速','中速','高速'][index]}，預測回傳的推力</label><input id="thrust-output" name="thrust-output" type="number" min="0" max="999" step="1" required aria-label="預測推力"><button type="submit" class="primary">測試${['低速','中速','高速'][index]}模式 <span>↗</span></button></form>`;
    }
    dialog.querySelector('form')?.addEventListener('submit',event=>{
      event.preventDefault();const data=new FormData(dialog.querySelector('form')!);const answer=selected==='declaration'?symbol:selected==='formula'?operator:selected==='return'?data.get('return-code'):data.get('thrust-output');
      const result=game.submitBooster(selected,answer);if(!result.success){feedback(result.message,true);return;}
      if(selected==='verify'&&game.booster.completed){if(!game.repair('room-6')){callbacks.notify('請在三段式推力測試台附近完成驗證。');return;}dialog.close();callbacks.completed();return;}
      render();callbacks.changed();feedback(result.message);dialog.querySelector<HTMLElement>('#thrust-output,.primary')?.focus();
    });
    const slot=dialog.querySelector('#def-slot');slot?.addEventListener('dragover',event=>event.preventDefault());slot?.addEventListener('drop',event=>{event.preventDefault();const value=(event as DragEvent).dataTransfer?.getData('text/plain');if(value&&[':',';','=','!'].includes(value))setSymbol(value);});
  }
  function setSymbol(value:string){symbol=value;dialog.querySelector('#def-slot')!.textContent=value;}
  dialog.addEventListener('dragstart',event=>{const value=(event.target as HTMLElement).dataset.symbol;if(value)event.dataTransfer?.setData('text/plain',value);});
  dialog.addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;if(button.dataset.action==='close'){close();return;}if(button.dataset.symbol)setSymbol(button.dataset.symbol);if(button.dataset.operator){operator=button.dataset.operator;dialog.querySelector('#booster-operator')!.textContent=operator;for(const card of dialog.querySelectorAll<HTMLElement>('[data-operator]'))card.setAttribute('aria-pressed',String(card.dataset.operator===operator));}});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:BoosterTaskId){const error=game.openBooster(id);if(error){callbacks.notify(error);return;}selected=id;symbol='';operator='+';render();dialog.showModal();}};
}
