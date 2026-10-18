import {coolingTasks,simulateCoolingStep,type CoolingTaskId} from './cooling';
import type {Game} from './game';
interface Callbacks{changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
export function setupCoolingUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='cooling-dialog';dialog.className='alarm-dialog cooling-dialog';dialog.setAttribute('aria-labelledby','cooling-title');document.body.append(dialog);
  let selected:CoolingTaskId='cause';
  function close(){dialog.close();game.close();callbacks.closed();}
  function feedback(message:string,error=false){const el=dialog.querySelector<HTMLElement>('#cooling-feedback')!;el.textContent=message;el.classList.toggle('error',error);}
  function render(){
    const task=coolingTasks.find(t=>t.id===selected)!;
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第五關 / 無法停止的冷卻循環</p><div class="alarm-stages" aria-label="冷卻設備修復進度">${coolingTasks.map((t,i)=>`<span class="${game.cooling.repaired[t.id]?'done':t.id===selected?'current':''}">${game.cooling.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>5-${coolingTasks.indexOf(task)+1} / 迴圈控制</span><h2 id="cooling-title">${task.name}</h2></div><div id="cooling-body"></div><p id="cooling-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#cooling-body')!;
    if(game.cooling.repaired[selected]){
      body.innerHTML=`<div class="device-success">✓ 冷卻設備已修復</div><pre class="terminal-output">${selected==='cause'?'已定位缺少的溫度更新\nwhile 區塊內新增：\n    temperature -= 10':selected==='drop'?'單次模擬：100°C → 90°C':'cycles：0 → 1'}</pre><p class="alarm-note">修復進度已保留。${selected==='cause'?'前往降溫控制器設定每輪的降溫量。':'繼續檢查其他設備，最後執行完整冷卻。'}</p><button type="button" class="primary" data-action="close">返回船艙 <span>→</span></button>`;return;
    }
    if(selected==='cause'){
      body.innerHTML=`<p class="alarm-instruction">冷卻器不斷執行相同指令，溫度卻一直維持 <strong>100°C</strong>。為什麼這段程式不會停止？</p><pre class="code-window"><code>temperature = 100\n\nwhile temperature &gt; 60:\n    print(temperature)</code></pre><form><fieldset class="choice-list"><legend>找出無窮迴圈原因</legend>${['temperature 沒有在迴圈中改變','while 不能用來判斷溫度','print() 會使溫度上升','100 不能與 60 比較'].map((text,i)=>`<label><input type="radio" name="loop-cause" value="${'ABCD'[i]}" required><b>${'ABCD'[i]}</b>${text}</label>`).join('')}</fieldset><button type="submit" class="primary">確認迴圈原因 <span>↗</span></button></form>`;
    }else if(selected==='drop'){
      body.innerHTML=`<p class="alarm-instruction">設定每輪下降的溫度，讓引擎從 <strong>100°C</strong> 每次降溫 <strong>10°C</strong>，直到 60°C。先按單次模擬觀察變化。</p><form><div class="code-window"><code>temperature = 100<br><br>while temperature &gt; 60:<br>    temperature -= <input id="cooling-drop" name="cooling-drop" type="number" min="0" max="100" step="1" value="0" required aria-label="每次降溫量"><br>    print(temperature)</code></div><button type="submit" class="primary">單次模擬 <span>↗</span></button></form><pre class="terminal-output" id="cooling-preview" role="status">尚未模擬</pre><p class="alarm-note">只模擬一次運算，每次從 100°C 開始，不會卡在無窮迴圈。</p>`;
    }else if(selected==='counter'){
      body.innerHTML=`<p class="alarm-instruction">冷卻程式需要記錄執行次數，計數器卻停在 0。補上一行，讓 <code>cycles</code> 每輪增加 1。</p><form><div class="code-window"><code>temperature = 100<br>cycles = 0<br><br>while temperature &gt; 60:<br>    temperature -= 10</code><label class="alarm-note" for="cycles-code">迴圈內指令（四空格縮排已提供）</label><input id="cycles-code" name="cycles-code" maxlength="100" required autocomplete="off" spellcheck="false" placeholder="輸入完整指令" aria-label="循環次數更新指令"></div><div class="counter-options" role="group" aria-label="計數器程式積木">${['cycles += 1','cycles = 0','cycles -= 1','cycles == 1'].map(value=>`<button type="button" data-counter="${value}"><code>${value}</code></button>`).join('')}</div><p class="alarm-note">可自行輸入，或點選程式積木放入空格。</p><button type="submit" class="primary">修復循環計數 <span>↗</span></button></form>`;
    }else{
      body.innerHTML=`<p class="alarm-instruction">預測這段程式每輪輸出的溫度、最後循環次數和結束溫度，再執行完整冷卻。</p><pre class="code-window"><code>temperature = 100\ncycles = 0\n\nwhile temperature &gt; 60:\n    temperature -= 10\n    cycles += 1\n    print(temperature)\n\nprint("循環次數:", cycles)</code></pre><form><fieldset class="cooling-predictions"><legend>四次溫度輸出（°C）</legend>${[1,2,3,4].map((n,i)=>`<label>第 ${n} 次<input type="number" name="result-${i}" min="0" max="100" step="1" required aria-label="第 ${n} 次溫度"></label>`).join('')}</fieldset><div class="cooling-summary"><label>最後循環次數<input type="number" name="result-4" min="0" max="100" required aria-label="最後循環次數"></label><label>結束溫度（°C）<input type="number" name="result-5" min="0" max="100" required aria-label="結束溫度"></label></div><button type="submit" class="primary">執行完整冷卻 <span>↗</span></button></form>`;
    }
    dialog.querySelector('form')?.addEventListener('submit',event=>{
      event.preventDefault();const data=new FormData(dialog.querySelector('form')!);
      const answer=selected==='cause'?data.get('loop-cause'):selected==='drop'?data.get('cooling-drop'):selected==='counter'?data.get('cycles-code'):Array.from({length:6},(_,i)=>data.get(`result-${i}`));
      const preview=selected==='drop'?simulateCoolingStep(answer):null;
      const result=game.submitCooling(selected,answer);
      if(!result.success){if(selected==='drop')dialog.querySelector('#cooling-preview')!.textContent=preview===null?'請輸入 0 至 100 的整數。':`單次模擬：100°C → ${preview}°C${preview===100?'（溫度沒有改變）':''}`;feedback(result.message,true);return;}
      if(selected==='verify'){if(!game.repair('room-5')){callbacks.notify('請在冷卻系統測試台附近完成驗證。');return;}dialog.close();callbacks.completed();return;}
      render();callbacks.changed();feedback(result.message);dialog.querySelector<HTMLButtonElement>('.primary')?.focus();
    });
  }
  dialog.addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;if(button.dataset.action==='close'){close();return;}if(button.dataset.counter)dialog.querySelector<HTMLInputElement>('#cycles-code')!.value=button.dataset.counter;});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:CoolingTaskId){const error=game.openCooling(id);if(error){callbacks.notify(error);return;}selected=id;render();dialog.showModal();}};
}
