import {lifeSupportTasks,type LifeSupportTaskId} from './life-support';
import type {Game} from './game';

interface Callbacks{changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
export function setupLifeSupportUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='life-support-dialog';dialog.className='alarm-dialog life-support-dialog';dialog.setAttribute('aria-labelledby','life-support-title');document.body.append(dialog);
  let selected:LifeSupportTaskId='main',operator='+';
  const subtitles={main:'3-1 / 主能源型態轉換',used:'3-2 / 消耗運算子選擇',backup:'3-3 / 備用能源除錯',verify:'3-4 / 可用能源總驗證'};
  function close(){dialog.close();game.close();callbacks.closed();}
  function render(){
    const task=lifeSupportTasks.find(t=>t.id===selected)!;
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第三關 / 維生能源危機</p><div class="alarm-stages" aria-label="維生設備修復進度">${lifeSupportTasks.map((t,i)=>`<span class="${game.lifeSupport.repaired[t.id]?'done':t.id===selected?'current':''}">${game.lifeSupport.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>${subtitles[selected]}</span><h2 id="life-support-title">${task.name}</h2></div><div id="life-support-body"></div><p id="life-support-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#life-support-body')!;
    if(game.lifeSupport.repaired[selected]){
      const output=selected==='main'?'120':selected==='used'?'105':selected==='backup'?'50':'155';
      body.innerHTML=`<div class="device-success">✓ 能源設備已修復</div><pre class="terminal-output">${output}</pre><p class="alarm-note">輸出型態：整數。此設備已恢復計算，修復進度已保留。</p><button type="button" class="primary" data-action="close">返回船艙 <span>→</span></button>`;return;
    }
    if(selected==='main'){
      body.innerHTML=`<p class="alarm-instruction">主能源有 <strong>100</strong> 單位，輔助能源有 <strong>20</strong> 單位，但程式發生 <code>TypeError</code>。請修改第三行，加入適當轉型，讓總能源正確相加。</p><form id="life-support-form"><div class="code-window"><span>主能源計算 / Python</span><code>main_energy = "100"<br>aux_energy = 20</code><label for="main-energy-code" class="alarm-note">修改第三行</label><textarea id="main-energy-code" name="energy-code" rows="2" maxlength="160" spellcheck="false" aria-label="主能源計算第三行">total = main_energy + aux_energy</textarea><code>print(total)</code></div><button type="submit" class="primary">修復主能源 <span>↗</span></button></form>`;
    }else if(selected==='used'){
      body.innerHTML=`<p class="alarm-instruction">原本有 <strong>120</strong> 單位能源，設備消耗了 <strong>15</strong> 單位，剩餘能源卻增加了。選一張運算子卡片，取代原本的加號。</p><pre class="code-window"><span>消耗計算 / Python</span><code>total = 120\nused = 15\n\nremaining = total <b id="operator-preview">+</b> used\nprint(remaining)</code></pre><form id="life-support-form"><div class="operator-cards" role="group" aria-label="選擇能源消耗運算子">${['+','-','*','/'].map((op,i)=>`<button type="button" data-operator="${op}" aria-label="運算子 ${op}" aria-pressed="${op===operator}"><small>${'ABCD'[i]}</small>${op}</button>`).join('')}</div><button type="submit" class="primary">更新消耗計算 <span>↗</span></button></form>`;
    }else if(selected==='backup'){
      body.innerHTML=`<p class="alarm-instruction">兩組備用模組，每組提供 <strong>25</strong> 單位。程式卻顯示 <code>2525</code>，請修正第三行，讓總量以整數 <strong>50</strong> 顯示。</p><form id="life-support-form"><div class="code-window"><span>備用能源計算 / Python</span><code>backup = "25"<br>cells = 2</code><label for="backup-energy-code" class="alarm-note">修改第三行需要轉型的變數</label><textarea id="backup-energy-code" name="energy-code" rows="2" maxlength="160" spellcheck="false" aria-label="備用能源計算第三行">backup_energy = backup * cells</textarea><code>print(backup_energy)</code></div><button type="submit" class="primary">修復備用能源 <span>↗</span></button></form>`;
    }else{
      body.innerHTML=`<p class="alarm-instruction">三項計算已修復。根據監測資料，先扣除已消耗能源，再加上備用能源，計算最後的可用總量。</p><table class="energy-monitor"><caption>維生系統能源監測表</caption><thead><tr><th scope="col">監測項目</th><th scope="col">能源單位</th></tr></thead><tbody><tr><th scope="row">主能源與輔助能源總和 <code>total</code></th><td>120</td></tr><tr><th scope="row">已消耗能源 <code>used</code></th><td>15</td></tr><tr><th scope="row">備用能源總量 <code>backup_energy</code></th><td>50</td></tr></tbody></table><form id="life-support-form"><label class="alarm-note" for="available-expression">填入可用能源算式</label><div class="available-editor"><code>available_energy =</code><input id="available-expression" name="available-expression" maxlength="160" required autocomplete="off" spellcheck="false" placeholder="填入算式" aria-label="可用能源算式"></div><pre class="code-window"><code>print(available_energy)</code></pre><p class="alarm-note">可以使用表中的數值或變數名稱；也可用已修好的 remaining（105）加上備用能源。請填算式，不要只填答案。</p><button type="submit" class="primary">能源檢測 <span>↗</span></button></form>`;
    }
    dialog.querySelector('form')?.addEventListener('submit',submit);
  }
  function submit(event:Event){
    event.preventDefault();const data=new FormData(dialog.querySelector<HTMLFormElement>('form')!);
    const answer=selected==='used'?operator:selected==='verify'?data.get('available-expression'):data.get('energy-code');
    const result=game.submitLifeSupport(selected,answer);
    if(!result.success){const feedback=dialog.querySelector<HTMLElement>('#life-support-feedback')!;feedback.textContent=result.message;feedback.classList.add('error');return;}
    if(selected==='verify'){
      if(!game.repair('room-3')){callbacks.notify('請在維生能源驗證台附近完成檢測。');return;}
      dialog.close();callbacks.completed();return;
    }
    render();callbacks.changed();dialog.querySelector('#life-support-feedback')!.textContent=result.message;
    dialog.querySelector<HTMLElement>('.primary[data-action="close"]')?.focus();
  }
  dialog.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
    if(button.dataset.action==='close'){close();return;}
    if(button.dataset.operator){operator=button.dataset.operator;dialog.querySelector('#operator-preview')!.textContent=operator;for(const card of dialog.querySelectorAll<HTMLElement>('[data-operator]'))card.setAttribute('aria-pressed',String(card.dataset.operator===operator));}
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:LifeSupportTaskId){const error=game.openLifeSupport(id);if(error){callbacks.notify(error);return;}selected=id;operator='+';render();dialog.showModal();}};
}
