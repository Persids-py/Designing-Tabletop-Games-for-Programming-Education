import {cargoTasks,cargoNames,type CargoTaskId} from './cargo';
import type {Game} from './game';
interface Callbacks{changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
export function setupCargoUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='cargo-dialog';dialog.className='alarm-dialog cargo-dialog';dialog.setAttribute('aria-labelledby','cargo-title');document.body.append(dialog);
  let selected:CargoTaskId='remove',order=['D','C','A','E'],pickup='',dragged='';
  function close(){dialog.close();game.close();callbacks.closed();}
  function feedback(message:string,error=false){const el=dialog.querySelector<HTMLElement>('#cargo-feedback')!;el.textContent=message;el.classList.toggle('error',error);}
  const listCode=(boxes:string[])=>`boxes = [\n${boxes.map(box=>`    "${cargoNames[box]}"`).join(',\n')}\n]`;
  const shelf=(boxes:string[])=>`<div class="cargo-shelf" aria-label="貨架與索引">${boxes.map((box,i)=>`<button type="button" data-shelf-index="${i}" aria-label="${cargoNames[box]} 索引 ${i}"><small>索引 ${i}</small><strong>${box}</strong><span>${cargoNames[box].slice(2)}</span></button>`).join('')}</div>`;
  function renderOrder(){
    dialog.querySelector('#cargo-order')!.innerHTML=order.map((box,i)=>`<li draggable="true" data-box="${box}"><small>索引 ${i}</small><code>${cargoNames[box]}</code><div><button type="button" data-move="-1" data-box="${box}" aria-label="左移 ${cargoNames[box]}" ${i===0?'disabled':''}>←</button><button type="button" data-move="1" data-box="${box}" aria-label="右移 ${cargoNames[box]}" ${i===3?'disabled':''}>→</button></div><label><input type="radio" name="pickup" value="${box}" ${pickup===box?'checked':''} required>領取 ${cargoNames[box]}</label></li>`).join('');
  }
  function render(){
    const task=cargoTasks.find(t=>t.id===selected)!;
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第七關 / 混亂的自動倉儲系統</p><div class="alarm-stages" aria-label="倉儲修復進度">${cargoTasks.map((t,i)=>`<span class="${game.cargo.repaired[t.id]?'done':t.id===selected?'current':''}">${game.cargo.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>7-${cargoTasks.indexOf(task)+1} / 串列與索引</span><h2 id="cargo-title">${task.name}</h2></div><div id="cargo-body"></div><p id="cargo-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#cargo-body')!;
    if(game.cargo.repaired[selected]){
      body.innerHTML=`<div class="device-success">✓ 倉儲設備已修復</div>${shelf(game.cargo.boxes)}<pre class="terminal-output">${selected==='remove'?'已移除 B 氧氣罐':selected==='index'?'D 工具箱':'E 保險絲已插入索引 1'}</pre><button type="button" class="primary" data-action="close">返回船艙 <span>→</span></button>`;return;
    }
    if(selected==='remove'){
      body.innerHTML=`<p class="alarm-instruction">執行以下程式後，哪一個貨箱會被移除？</p><pre class="code-window"><code>${listCode(['A','B','C','D'])}\n\nboxes.pop(1)</code></pre><form><fieldset class="choice-list"><legend>選擇受損貨箱</legend>${['A','B','C','D'].map(box=>`<label><input type="radio" name="damaged-box" value="${box}" required>${cargoNames[box]}</label>`).join('')}</fieldset><button type="submit" class="primary">移除受損貨箱 <span>↗</span></button></form>`;
    }else if(selected==='index'){
      body.innerHTML=`<p class="alarm-instruction">移除受損貨箱後，舊索引造成 <code>IndexError</code>。點選貨架查看索引，再修改程式數字，讓輸出為 <strong>D 工具箱</strong>。</p>${shelf(['A','C','D'])}<p class="alarm-note" id="shelf-inspection">點選貨箱可將索引帶入程式。</p><form><div class="code-window"><code>${listCode(['A','C','D'])}<br><br>print(boxes[<input id="cargo-index" name="cargo-index" type="number" min="0" max="9" step="1" value="3" required aria-label="讀取貨箱索引">])</code></div><button type="submit" class="primary">修復讀取索引 <span>↗</span></button></form>`;
    }else if(selected==='insert'){
      body.innerHTML=`<p class="alarm-instruction">將新的 <strong>E 保險絲</strong> 放到索引 <strong>1</strong> 的位置。請完成 insert()，讓原本的貨箱自動向後排列。</p>${shelf(['A','C','D'])}<form><div class="code-window"><code>${listCode(['A','C','D'])}<br><br>boxes.insert(<input id="cargo-insert" name="cargo-insert" type="number" min="0" max="9" step="1" required aria-label="插入物資索引">, "E 保險絲")</code></div><button type="submit" class="primary">執行入庫 <span>↗</span></button></form>`;
    }else{
      body.innerHTML=`<p class="alarm-instruction">追蹤完整操作，填入最後總數、排列四個貨箱，再選擇 <code>print(boxes[3])</code> 輸出的物資。</p><pre class="code-window"><code>${listCode(['A','B','C','D']).replace(/\n */g,'')}\n\nboxes.pop(1)\nboxes.insert(1, "E 保險絲")\nprint(boxes[3])</code></pre><form><label class="alarm-note" for="cargo-count">最後共有幾個貨箱？</label><input id="cargo-count" name="cargo-count" type="number" min="0" max="9" step="1" required aria-label="最後貨箱總數"><p class="alarm-note">拖曳貨箱或用左右按鈕排列，再勾選要領取的物資。</p><ol id="cargo-order" class="cargo-order" aria-label="排列最終貨箱"></ol><button type="submit" class="primary">驗證並領取物資 <span>↗</span></button></form>`;renderOrder();
    }
    dialog.querySelector('form')?.addEventListener('submit',event=>{
      event.preventDefault();const data=new FormData(dialog.querySelector('form')!);const answer=selected==='remove'?data.get('damaged-box'):selected==='index'?data.get('cargo-index'):selected==='insert'?data.get('cargo-insert'):{count:data.get('cargo-count'),order:[...order],item:data.get('pickup')};
      const result=game.submitCargo(selected,answer);if(!result.success){feedback(result.message,true);return;}
      if(selected==='verify'){if(!game.repair('room-7')){callbacks.notify('請在物資領取控制台附近完成驗證。');return;}dialog.close();callbacks.completed();return;}
      render();callbacks.changed();feedback(result.message);dialog.querySelector<HTMLButtonElement>('.primary')?.focus();
    });
  }
  dialog.addEventListener('change',event=>{const target=event.target as HTMLInputElement;if(target.name==='pickup')pickup=target.value;});
  dialog.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
    if(button.dataset.action==='close'){close();return;}
    if(button.dataset.shelfIndex!==undefined&&selected==='index'&&!game.cargo.repaired.index){dialog.querySelector<HTMLInputElement>('#cargo-index')!.value=button.dataset.shelfIndex;dialog.querySelector('#shelf-inspection')!.textContent=`${['A 電池','C 晶片','D 工具箱'][Number(button.dataset.shelfIndex)]}：索引 ${button.dataset.shelfIndex}`;}
    if(button.dataset.move){const from=order.indexOf(button.dataset.box!),to=from+Number(button.dataset.move);if(to<0||to>=order.length)return;[order[from],order[to]]=[order[to],order[from]];renderOrder();dialog.querySelector<HTMLElement>(`button[data-box="${button.dataset.box}"][data-move="${button.dataset.move}"]`)?.focus();}
  });
  dialog.addEventListener('dragstart',event=>{const box=(event.target as HTMLElement).closest<HTMLElement>('li[data-box]');if(!box)return;dragged=box.dataset.box!;event.dataTransfer?.setData('text/plain',dragged);});
  dialog.addEventListener('dragover',event=>{if((event.target as HTMLElement).closest('#cargo-order li'))event.preventDefault();});
  dialog.addEventListener('drop',event=>{const target=(event.target as HTMLElement).closest<HTMLElement>('#cargo-order li');if(!target)return;event.preventDefault();const box=event.dataTransfer?.getData('text/plain')||dragged,from=order.indexOf(box),to=order.indexOf(target.dataset.box!);if(from<0||to<0||from===to)return;order.splice(from,1);order.splice(to,0,box);renderOrder();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:CargoTaskId){const error=game.openCargo(id);if(error){callbacks.notify(error);return;}selected=id;order=['D','C','A','E'];pickup='';render();dialog.showModal();}};
}
