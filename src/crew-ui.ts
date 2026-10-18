import {crewTasks,crewRoles,type CrewTaskId} from './crew';
import type {Game} from './game';
interface Callbacks{changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
export function setupCrewUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='crew-dialog';dialog.className='alarm-dialog crew-dialog';dialog.setAttribute('aria-labelledby','crew-title');document.body.append(dialog);
  let selected:CrewTaskId='lookup',role='';
  const database=`crew = {\n    "captain": {"name": "Lin", "level": 3},\n    "engineer": {"name": "Chen", "level": 2},\n    "medic": {"name": "Wu", "level": 1}\n}`;
  function close(){dialog.close();game.close();callbacks.closed();}
  function feedback(message:string,error=false){const el=dialog.querySelector<HTMLElement>('#crew-feedback')!;el.textContent=message;el.classList.toggle('error',error);}
  function render(){
    const task=crewTasks.find(t=>t.id===selected)!;
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第八關 / 遺失的維修授權</p><div class="alarm-stages" aria-label="資料庫修復進度">${crewTasks.map((t,i)=>`<span class="${game.crew.repaired[t.id]?'done':t.id===selected?'current':''}">${game.crew.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>8-${crewTasks.indexOf(task)+1} / 字典與安全查詢</span><h2 id="crew-title">${task.name}</h2></div><div id="crew-body"></div><p id="crew-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#crew-body')!;
    if(game.crew.repaired[selected]){body.innerHTML=`<div class="device-success">✓ 船員資料設備已修復</div><pre class="terminal-output">${selected==='lookup'?'Chen':selected==='level'?'2':'None'}</pre><p class="alarm-note">${selected==='safe'?'找不到 pilot，安全回傳 None；查詢未中斷。':'查詢成功，修復進度已保留。'}</p><button type="button" class="primary" data-action="close">返回船艙 <span>→</span></button>`;return;}
    if(selected==='lookup'){
      body.innerHTML=`<p class="alarm-instruction">系統正在尋找工程師，卻查詢了不存在的 <code>pilot</code>。請先在全像名單選擇職位，再修正字典鍵，顯示工程師姓名。</p><div class="crew-roster" role="group" aria-label="全像船員名單">${['captain','engineer','medic'].map((key,i)=>`<button type="button" data-role="${key}" aria-pressed="false"><span>${['船長','工程師','醫護員'][i]}</span><code>${key}</code><b>${['Lin','Chen','Wu'][i]}</b></button>`).join('')}</div><p id="crew-selection" class="alarm-note">尚未選擇職位</p><pre class="code-window"><code>${database}</code></pre><form><div class="crew-query"><code>print(crew["</code><input id="crew-key" name="crew-key" value="pilot" maxlength="40" required autocomplete="off" spellcheck="false" aria-label="職位字典鍵"><code>"]["name"])</code></div><button type="submit" class="primary">修復姓名查詢 <span>↗</span></button></form>`;
    }else if(selected==='level'){
      body.innerHTML=`<p class="alarm-instruction">完成內層字典查詢，輸出工程師的授權等級。</p><pre class="code-window"><code>${database}\n\nprint(crew["engineer"][______])</code></pre><form><fieldset class="choice-list"><legend>選擇內層字典鍵</legend>${['name','level','job','password'].map((key,i)=>`<label><input type="radio" name="crew-field" value="${key}" required><b>${'ABCD'[i]}</b><code>"${key}"</code></label>`).join('')}</fieldset><button type="submit" class="primary">讀取授權等級 <span>↗</span></button></form>`;
    }else if(selected==='safe'){
      body.innerHTML=`<p class="alarm-instruction">查詢不存在的 pilot 原本會發生 <code>KeyError</code>。哪種方式能在找不到時回傳 <code>None</code>，而不中斷？</p><pre class="code-window"><code>print(crew["pilot"])</code></pre><form><fieldset class="choice-list"><legend>選擇安全查詢方式</legend>${['crew["pilot"]','crew.get("pilot")','crew.find("pilot")','crew.print("pilot")'].map((code,i)=>`<label><input type="radio" name="safe-query" value="${'ABCD'[i]}" required><b>${'ABCD'[i]}</b><code>${code}</code></label>`).join('')}</fieldset><button type="submit" class="primary">測試安全查詢 <span>↗</span></button></form>`;
    }else{
      body.innerHTML=`<p class="alarm-instruction">維修設備要求授權等級至少為 <strong>2</strong>。填入最低等級，再判斷三位角色能否取得授權。</p><form><div class="code-window"><code>role = "engineer"<br>info = crew.get(role)<br><br>if info is not None and info["level"] &gt;= <input id="crew-threshold" name="crew-threshold" type="number" min="0" max="9" step="1" required aria-label="最低授權等級">:<br>    print("ACCESS GRANTED")<br>else:<br>    print("ACCESS DENIED")</code></div><div class="crew-cases">${crewRoles.map((key,i)=>`<fieldset><legend>${key}${key==='pilot'?'（不存在）':` · level ${i===0?2:1}`}</legend>${['GRANTED','DENIED'].map(value=>`<label><input type="radio" name="access-${i}" value="${value}" required>${value==='GRANTED'?'允許':'拒絕'}</label>`).join('')}</fieldset>`).join('')}</div><p class="alarm-note">找不到角色時，info 為 None；and 會先判斷資料是否存在，避免讀取不存在的資料。</p><button type="submit" class="primary">執行維修授權驗證 <span>↗</span></button></form>`;
    }
    dialog.querySelector('form')?.addEventListener('submit',event=>{
      event.preventDefault();const data=new FormData(dialog.querySelector('form')!);const answer=selected==='lookup'?{role,key:data.get('crew-key')}:selected==='level'?data.get('crew-field'):selected==='safe'?data.get('safe-query'):{threshold:data.get('crew-threshold'),decisions:crewRoles.map((_,i)=>data.get(`access-${i}`))};
      const result=game.submitCrew(selected,answer);if(!result.success){feedback(result.message,true);return;}
      if(selected==='verify'){if(!game.repair('room-8')){callbacks.notify('請在維修授權驗證台附近完成驗證。');return;}dialog.close();callbacks.completed();return;}
      render();callbacks.changed();feedback(result.message);dialog.querySelector<HTMLButtonElement>('.primary')?.focus();
    });
  }
  dialog.addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;if(button.dataset.action==='close'){close();return;}if(button.dataset.role){role=button.dataset.role;for(const card of dialog.querySelectorAll<HTMLElement>('[data-role]'))card.setAttribute('aria-pressed',String(card.dataset.role===role));dialog.querySelector('#crew-selection')!.textContent=`已選擇職位：${role}。請在下方修改查詢鍵。`;}});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:CrewTaskId){const error=game.openCrew(id);if(error){callbacks.notify(error);return;}selected=id;role='';render();dialog.showModal();}};
}
