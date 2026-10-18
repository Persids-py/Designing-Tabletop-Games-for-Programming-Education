import {airlockTasks,pressureCases,type AirlockTaskId} from './airlock';
import type {Game} from './game';
interface Callbacks{changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
export function setupAirlockUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='airlock-dialog';dialog.className='alarm-dialog airlock-dialog';dialog.setAttribute('aria-labelledby','airlock-title');document.body.append(dialog);
  let selected:AirlockTaskId='colon',symbol='',indent=0;
  function close(){dialog.close();game.close();callbacks.closed();}
  function feedback(message:string,error=false){const el=dialog.querySelector<HTMLElement>('#airlock-feedback')!;el.textContent=message;el.classList.toggle('error',error);}
  function render(){
    const task=airlockTasks.find(t=>t.id===selected)!;
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第四關 / 封鎖的氣閘艙</p><div class="alarm-stages" aria-label="氣閘設備修復進度">${airlockTasks.map((t,i)=>`<span class="${game.airlock.repaired[t.id]?'done':t.id===selected?'current':''}">${game.airlock.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>4-${airlockTasks.indexOf(task)+1} / 條件判斷</span><h2 id="airlock-title">${task.name}</h2></div><div id="airlock-body"></div><p id="airlock-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#airlock-body')!;
    if(game.airlock.repaired[selected]){
      body.innerHTML=selected==='verify'?`<div class="device-success">✓ 三組壓力測試通過</div><pre class="terminal-output">120 kPa → LOCK\n100 kPa → OPEN\n80 kPa → OPEN</pre><p class="alarm-note">高壓保持鎖定，正常壓力允許開門。安全邏輯已驗證。</p><button type="button" class="primary" data-action="unlock">解除封鎖 <span>→</span></button>`:`<div class="device-success">✓ 安全程式已修復</div><pre class="terminal-output">${selected==='colon'?'LOCK':selected==='indent'?'壓力過高':'OPEN'}</pre><p class="alarm-note">修復進度已保留，繼續檢查其他設備。</p><button type="button" class="primary" data-action="close">返回船艙 <span>→</span></button>`;return;
    }
    if(selected==='colon'){
      body.innerHTML=`<p class="alarm-instruction">壓力為 <strong>120 kPa</strong>，控制器卻無法執行。從四個符號中選出缺少的符號，放在 if 條件結尾。</p><pre class="code-window"><span>壓力判斷 / Python</span><code>pressure = 120\n\nif pressure &gt; 100<button type="button" id="colon-slot" aria-label="條件結尾符號">？</button>\n    print("LOCK")</code></pre><div class="symbol-palette" aria-label="選擇條件結尾符號">${[':', ';', '=', '!'].map(s=>`<button type="button" draggable="true" data-symbol="${s}" aria-label="符號 ${s}">${s}</button>`).join('')}</div><p class="alarm-note">點選符號，或拖到條件結尾。</p><form><button class="primary" type="submit">修復壓力判斷 <span>↗</span></button></form>`;
    }else if(selected==='indent'){
      body.innerHTML=`<p class="alarm-instruction">安全程式出現 <code>IndentationError</code>。將 print() 積木向右縮排四個空格，放進 if 區塊。</p><div class="code-window"><span>安全程式 / Python</span><code>pressure = 120<br><br>if pressure &gt; 100:</code><div id="indent-zone" aria-label="if 區塊縮排位置"><code id="indent-line" draggable="true">print("壓力過高")</code></div></div><div class="indent-controls"><button type="button" data-shift="-4">← 向左縮排</button><span id="indent-count">0 個空格</span><button type="button" data-shift="4">向右縮排 →</button></div><p class="alarm-note">也可將程式積木拖進虛線區塊；本題使用四個空格。</p><form><button class="primary" type="submit">修復縮排 <span>↗</span></button></form>`;
    }else if(selected==='branch'){
      body.innerHTML=`<p class="alarm-instruction">高壓判斷已存在，但正常壓力還沒有開門指令。請完成 else 區塊，讓壓力 <strong>80 kPa</strong> 時輸出 <code>OPEN</code>。</p><form><div class="code-window"><span>正常壓力 / Python</span><code>pressure = 80<br><br>if pressure &gt; 100:<br>    print("LOCK")<br>else:</code><label class="alarm-note" for="open-code">else 區塊指令（四空格縮排已提供）</label><input id="open-code" name="open-code" maxlength="160" required autocomplete="off" spellcheck="false" placeholder="輸入完整指令" aria-label="else 區塊開門指令"></div><button type="submit" class="primary">修復正常壓力 <span>↗</span></button></form>`;
    }else{
      body.innerHTML=`<p class="alarm-instruction">為三組壓力選擇修復後程式的輸出。<strong>大於 100 kPa 禁止開門；小於或等於 100 kPa 允許開門。</strong></p><pre class="code-window"><code>if pressure &gt; 100:\n    print("LOCK")\nelse:\n    print("OPEN")</code></pre><form><div class="pressure-cases">${pressureCases.map((p,i)=>`<fieldset><legend>測試 ${'ABC'[i]} · ${p} kPa</legend>${['OPEN','LOCK'].map(value=>`<label><input type="radio" name="case-${i}" value="${value}" required> ${value}</label>`).join('')}</fieldset>`).join('')}</div><button type="submit" class="primary">執行壓力測試 <span>↗</span></button><button type="button" class="primary" disabled>解除封鎖 <span>→</span></button><p class="alarm-note">三組測試全部正確後，才可解除封鎖。</p></form>`;
    }
    dialog.querySelector('form')?.addEventListener('submit',event=>{
      event.preventDefault();const data=new FormData(dialog.querySelector('form')!);
      const answer=selected==='colon'?symbol:selected==='indent'?indent:selected==='branch'?data.get('open-code'):pressureCases.map((_,i)=>data.get(`case-${i}`));
      const result=game.submitAirlock(selected,answer);if(!result.success){feedback(result.message,true);return;}
      render();callbacks.changed();feedback(result.message);dialog.querySelector<HTMLButtonElement>('.primary')?.focus();
    });
    const slot=dialog.querySelector('#colon-slot');slot?.addEventListener('dragover',event=>event.preventDefault());slot?.addEventListener('drop',event=>{event.preventDefault();const value=(event as DragEvent).dataTransfer?.getData('text/plain');if(value&&[':',';','=','!'].includes(value))setSymbol(value);});
    const zone=dialog.querySelector('#indent-zone');zone?.addEventListener('dragover',event=>event.preventDefault());zone?.addEventListener('drop',event=>{event.preventDefault();if((event as DragEvent).dataTransfer?.getData('text/plain')==='airlock-print')setIndent(4);});
  }
  function setSymbol(value:string){symbol=value;dialog.querySelector('#colon-slot')!.textContent=value;}
  function setIndent(value:number){indent=Math.max(0,Math.min(8,value));dialog.querySelector('#indent-line')!.textContent=' '.repeat(indent)+'print("壓力過高")';dialog.querySelector('#indent-count')!.textContent=`${indent} 個空格`;}
  dialog.addEventListener('dragstart',event=>{const target=event.target as HTMLElement;const value=target.dataset.symbol??(target.id==='indent-line'?'airlock-print':'');if(value)event.dataTransfer?.setData('text/plain',value);});
  dialog.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
    if(button.dataset.action==='close'){close();return;}
    if(button.dataset.action==='unlock'){if(!game.repair('room-4')){callbacks.notify('請先通過壓力測試，並在安全測試台附近解除封鎖。');return;}dialog.close();callbacks.completed();return;}
    if(button.dataset.symbol)setSymbol(button.dataset.symbol);
    if(button.dataset.shift)setIndent(indent+Number(button.dataset.shift));
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:AirlockTaskId){const error=game.openAirlock(id);if(error){callbacks.notify(error);return;}selected=id;symbol='';indent=0;render();dialog.showModal();}};
}
