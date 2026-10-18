import {warpTasks,systemKeys,systemNames,warpCases,warpReady,type WarpTaskId} from './warp';
import type {Game} from './game';
interface Callbacks{changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
export function setupWarpUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='warp-dialog';dialog.className='alarm-dialog warp-dialog';dialog.setAttribute('aria-labelledby','warp-title');document.body.append(dialog);
  let selected:WarpTaskId='nav',timer:ReturnType<typeof setInterval>|undefined;
  const stop=()=>{if(timer!==undefined)clearInterval(timer);timer=undefined;};
  function close(){stop();game.close();dialog.close();callbacks.changed();callbacks.closed();}
  function feedback(message:string,error=false){const el=dialog.querySelector<HTMLElement>('#warp-feedback')!;el.textContent=message;el.classList.toggle('error',error);}
  function systems(){return `<div class="warp-systems" aria-label="實際五項系統狀態">${systemKeys.map(key=>`<div class="${game.warp.systems[key]?'online':'offline'}"><span>${systemNames[key]} <code>${key}</code></span><b>${game.warp.systems[key]?'True':'False'}</b></div>`).join('')}</div>`;}
  function render(){
    const state=game.warp,task=warpTasks.find(t=>t.id===selected)!;
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第十關 / 探索者號的最終躍遷</p><div class="alarm-stages" aria-label="最終修復進度">${warpTasks.map((t,i)=>`<span class="${state.repaired[t.id]?'done':t.id===selected?'current':''}">${state.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>10-${warpTasks.indexOf(task)+1} / 綜合邏輯專案</span><h2 id="warp-title">${task.name}</h2></div><div id="warp-body"></div><p id="warp-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#warp-body')!;
    if(state.launching){body.innerHTML=`<p class="alarm-instruction">五項實際狀態符合安全規則，藍色能源核心充能中。</p><div class="warp-countdown" role="status" aria-live="polite"><span>躍遷倒數</span><strong id="warp-countdown">${state.countdown}</strong></div><p class="alarm-note">關閉面板會取消倒數，已完成的修復與導航準備仍保留。</p>`;return;}
    if(state.repaired[selected]){
      if(selected==='verify'){
        body.innerHTML=`<div class="device-success">✓ 四組安全測試通過</div>${systems()}<pre id="warp-actual-output" class="terminal-output">${state.checked&&warpReady(state.systems)?'WARP READY':!state.systems.nav?'WARP LOCKED · 導航尚未就緒':'等待實際狀態檢查'}</pre><p class="alarm-note">${!state.systems.nav?'請關閉面板，前往導航控制器完成準備，再回到此處檢查實際狀態。':'雷達為 False，但人工授權為 True；燃料、導航與主引擎都正常，才允許啟動。'}</p><button type="button" class="primary" data-action="check">檢查實際狀態 <span>↗</span></button><button type="button" class="primary" data-action="launch" ${state.checked&&warpReady(state.systems)?'':'disabled'}>啟動躍遷 <span>→</span></button>`;
      }else if(selected==='nav'){
        body.innerHTML=`<div class="device-success">✓ 導航查詢已修復</div>${systems()}<pre class="terminal-output">systems["nav"] → ${state.systems.nav?'True':'False'}</pre><p class="alarm-note">修好查詢不代表導航已就緒。四組安全測試通過後，才能在此完成導航準備。</p><button type="button" class="primary" data-action="prepare" ${state.tested&&!state.systems.nav?'':'disabled'}>${state.systems.nav?'導航已準備完成':'完成導航準備'} <span>↗</span></button><button type="button" class="primary" data-action="close">返回船艙 <span>→</span></button>`;
      }else body.innerHTML=`<div class="device-success">✓ 躍遷設備已修復</div><pre class="terminal-output">${selected==='manual'?'ON → True\nOFF → False':'fuel and nav and engine\nand (radar or manual)'}</pre><button type="button" class="primary" data-action="close">返回船艙 <span>→</span></button>`;
      return;
    }
    if(selected==='nav'){
      body.innerHTML=`<p class="alarm-instruction">查詢導航狀態時發生 KeyError。查看五項實際系統狀態，找出正確的字典鍵。</p>${systems()}<form><div class="warp-key-editor"><code>print(systems["</code><input id="warp-nav-key" name="nav-key" value="navigation" required maxlength="40" spellcheck="false" autocomplete="off" aria-label="導航字典鍵"><code>"])</code></div><button type="submit" class="primary">修復導航查詢 <span>↗</span></button></form>`;
    }else if(selected==='manual'){
      body.innerHTML=`<p class="alarm-instruction">人工授權台以 ON 表示已授權、OFF 表示未授權，程式卻連 OFF 都顯示 True。先選原因，再修改第二行，只有 ON 才為 True。</p><form><div class="code-window"><code>manual_status = "OFF"</code><label class="alarm-note" for="manual-code">修改第二行</label><input id="manual-code" name="manual-code" value="manual_override = bool(manual_status)" required maxlength="160" spellcheck="false" autocomplete="off" aria-label="人工授權判斷程式"><code>print(manual_override)</code></div><fieldset class="choice-list"><legend>為什麼 OFF 也為 True？</legend>${['非空字串轉成布林值會得到 True','OFF 是 Python 保留字','bool() 一律回傳 False','print() 會改變資料型態'].map((text,i)=>`<label><input type="radio" name="manual-reason" value="${'ABCD'[i]}" required><b>${'ABCD'[i]}</b>${text}</label>`).join('')}</fieldset><button type="submit" class="primary">測試 ON 與 OFF <span>↗</span></button></form>`;
    }else if(selected==='logic'){
      body.innerHTML=`<p class="alarm-instruction">燃料、導航、主引擎必須全部正常；另外，雷達正常或人工授權至少一項成立。填入 and／or 重建條件，括號保留雷達與人工授權的群組。</p><pre class="code-window"><code>ready = (\n    systems["fuel"]\n    ${op(0)} systems["nav"]\n    ${op(1)} systems["engine"]\n    ${op(2)} (systems["radar"] ${op(3)} systems["manual"])\n)\n\nif ready:\n    print("WARP READY")\nelse:\n    print("WARP LOCKED")</code></pre><form id="logic-form"><button type="submit" class="primary">重建啟動條件 <span>↗</span></button></form>`;
    }else{
      body.innerHTML=`<p class="alarm-instruction">依修復後規則判斷四組安全測試。✓ 代表 True，— 代表 False；人工授權不能忽略燃料、導航或主引擎。</p><form><div class="warp-test-scroll"><table class="warp-tests"><caption>四組躍遷安全測試</caption><thead><tr><th scope="col">系統</th>${warpCases.map(test=>`<th scope="col">${test.name}</th>`).join('')}</tr></thead><tbody>${systemKeys.map(key=>`<tr><th scope="row">${key}</th>${warpCases.map(test=>`<td>${test.systems[key]?'✓':'—'}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">玩家判斷</th>${warpCases.map((_,i)=>`<td><label><input type="radio" name="case-${i}" value="ALLOW" required>允許</label><label><input type="radio" name="case-${i}" value="LOCK" required>禁止</label></td>`).join('')}</tr></tbody></table></div><p class="alarm-note">四組全對後，還需要檢查實際系統狀態，完成導航準備，才能啟動最終躍遷。</p><button type="submit" class="primary">執行四組安全測試 <span>↗</span></button></form>`;
    }
    dialog.querySelector('form')?.addEventListener('submit',event=>{
      event.preventDefault();const data=new FormData(dialog.querySelector('form')!);const answer=selected==='nav'?data.get('nav-key'):selected==='manual'?{reason:data.get('manual-reason'),code:data.get('manual-code')}:selected==='logic'?Array.from({length:4},(_,i)=>dialog.querySelector<HTMLSelectElement>(`#warp-op-${i}`)!.value):Array.from({length:4},(_,i)=>data.get(`case-${i}`));
      const result=game.submitWarp(selected,answer);if(!result.success){feedback(result.message,true);return;}render();callbacks.changed();feedback(result.message);dialog.querySelector<HTMLButtonElement>('.primary')?.focus();
    });
  }
  function op(index:number){return `<select id="warp-op-${index}" aria-label="邏輯運算子 ${index+1}"><option value="">？</option><option value="and">and</option><option value="or">or</option></select>`;}
  dialog.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;const action=button.dataset.action;
    if(action==='close'){close();return;}
    if(action==='prepare'){const ok=game.prepareWarpNavigation();render();callbacks.changed();feedback(ok?'導航準備完成，nav 已變為 True。請返回啟動台檢查實際狀態。':'請先通過四組安全測試，並靠近導航控制器。',!ok);}
    if(action==='check'){const ok=game.checkWarpActual();render();callbacks.changed();feedback(ok?'實際狀態檢查通過，WARP READY。':'WARP LOCKED：導航尚未就緒，請先完成導航準備。',!ok);}
    if(action==='launch'){
      if(!game.startWarp()){feedback('安全條件尚未完成，無法啟動躍遷。',true);return;}
      render();callbacks.changed();stop();timer=setInterval(()=>{game.tickWarp();if(!game.warp.launching&&!game.warp.launched){stop();render();callbacks.changed();feedback('倒數已取消，請重新檢查實際狀態。',true);return;}if(game.warp.launched){stop();if(!game.repair('room-10')){feedback('啟動位置或安全狀態不符，請重新檢查。',true);return;}dialog.close();callbacks.completed();return;}render();callbacks.changed();},1000);
    }
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:WarpTaskId){const error=game.openWarp(id);if(error){callbacks.notify(error);return;}stop();selected=id;render();dialog.showModal();}};
}
