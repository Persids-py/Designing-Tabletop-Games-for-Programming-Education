import {generatorTasks,type GeneratorTaskId} from './generator';
import type {Game} from './game';

interface Callbacks{changed:()=>void;completed:()=>void;closed:()=>void;notify:(message:string)=>void}
export function setupGeneratorUI(game:Game,callbacks:Callbacks){
  const dialog=document.createElement('dialog');dialog.id='generator-dialog';dialog.className='alarm-dialog generator-dialog';dialog.setAttribute('aria-labelledby','generator-title');document.body.append(dialog);
  let selected:GeneratorTaskId='main',tokens:string[]=['220','=','target_voltage'],dragging:number|null=null;
  const subtitles={main:'2-1 / 賦值積木排列',backup:'2-2 / 變數名稱修正',display:'2-3 / 電壓程式修改',verify:'2-4 / 供電結果推理'};
  function close(){dialog.close();game.close();callbacks.closed();}
  function render(){
    const task=generatorTasks.find(t=>t.id===selected)!;
    dialog.innerHTML=`<button type="button" class="close" data-action="close" aria-label="關閉維修面板">×</button><p class="eyebrow">第二關 / 消失的電力</p><div class="alarm-stages" aria-label="發電機修復進度">${generatorTasks.map((t,i)=>`<span class="${game.generator.repaired[t.id]?'done':selected===t.id?'current':''}">${game.generator.repaired[t.id]?'✓':i+1} ${t.name}</span>`).join('')}</div><div class="alarm-heading"><span>${subtitles[selected]}</span><h2 id="generator-title">${task.name}</h2></div><div id="generator-body"></div><p id="generator-feedback" class="alarm-feedback" role="status" aria-live="polite"></p>`;
    const body=dialog.querySelector<HTMLElement>('#generator-body')!;
    if(game.generator.repaired[selected]){
      const output=selected==='main'?'target_voltage = 220\n主發電機：220V':selected==='backup'?'110\n備用發電機：110V':selected==='display'?'220':'220\n110';
      body.innerHTML=`<div class="device-success">✓ 設備已修復</div><pre class="terminal-output">${output}</pre><p class="alarm-note">設定已保留。返回船艙，繼續修復下一個設備。</p><button type="button" data-action="close" class="primary">返回船艙 <span>→</span></button>`;return;
    }
    if(selected==='main'){
      body.innerHTML=`<p class="alarm-instruction">主發電機的目標電壓是 <strong>220V</strong>，但設定程式寫反了。重新排列三塊積木，組成正確的 Python 賦值程式。</p><pre class="code-window"><span>目前故障程式</span><code>220 = target_voltage</code></pre><p class="alarm-note">拖曳積木排序，或使用左右按鈕移動。等號像把數值存進變數的開關。</p><form id="generator-form"><ol id="assignment-tiles" class="assignment-tiles"></ol><button type="submit" class="primary">設定主電壓 <span>↗</span></button></form>`;renderTiles();
    }else if(selected==='backup'){
      body.innerHTML=`<p class="alarm-instruction">備用發電機需要 <strong>110V</strong>，但讀取時出現 <code>NameError</code>。點選第一行的錯誤變數名稱，改成與第二行一致。</p><form id="generator-form"><div class="code-window variable-editor"><span>備用電壓控制 / Python</span><div><input id="backup-name" name="backup-name" value="back_voltage" aria-label="第一行變數名稱" autocomplete="off" spellcheck="false" maxlength="80"><code> = 110</code></div><code>print(backup_voltage)</code></div><p class="alarm-note">數值已設定為 110；這次要修復的是變數名稱。</p><button type="submit" class="primary">修復備用變數 <span>↗</span></button></form>`;
    }else if(selected==='display'){
      body.innerHTML=`<p class="alarm-instruction">主電壓已設定，但電壓表顯示的是文字 <code>target_voltage</code>。請修改第二行，讓螢幕顯示數字 <strong>220</strong>。</p><form id="generator-form"><div class="code-window"><span>電壓顯示程式 / Python</span><code>target_voltage = 220</code><label class="alarm-note" for="voltage-code">修改第二行</label><textarea id="voltage-code" name="voltage-code" rows="2" maxlength="160" spellcheck="false" aria-label="電壓顯示第二行">print("target_voltage")</textarea></div><button type="submit" class="primary">更新電壓顯示 <span>↗</span></button></form>`;
    }else{
      body.innerHTML=`<p class="alarm-instruction">工程師再次調整了主電壓。閱讀以下程式，預測控制台最後會輸出哪兩個數值。</p><pre class="code-window"><span>供電測試程式 / Python</span><code>main_voltage = 200\nbackup_voltage = 110\n\nmain_voltage = 220\n\nprint(main_voltage)\nprint(backup_voltage)</code></pre><form id="generator-form"><fieldset class="choice-list"><legend>選擇兩行輸出的順序</legend>${[['A','200、110'],['B','220、110'],['C','220、200'],['D','110、220']].map(([id,label])=>`<label><input type="radio" name="power-output" value="${id}" required><span><b>${id}</b> ${label}</span></label>`).join('')}</fieldset><button type="submit" class="primary">執行供電測試 <span>↗</span></button></form>`;
    }
    dialog.querySelector('form')?.addEventListener('submit',submit);
  }
  function renderTiles(){
    const list=dialog.querySelector('#assignment-tiles');if(!list)return;
    list.innerHTML=tokens.map((token,i)=>`<li draggable="true" data-tile="${i}"><span class="drag-grip" aria-hidden="true">⠿</span><code>${token}</code><div><button type="button" data-move="-1" data-index="${i}" aria-label="左移 ${token}" ${i===0?'disabled':''}>←</button><button type="button" data-move="1" data-index="${i}" aria-label="右移 ${token}" ${i===tokens.length-1?'disabled':''}>→</button></div></li>`).join('');
  }
  function reorder(from:number,to:number){if(from===to||from<0||to<0||from>=tokens.length||to>=tokens.length)return;const [token]=tokens.splice(from,1);tokens.splice(to,0,token);renderTiles();}
  function submit(event:Event){
    event.preventDefault();const form=dialog.querySelector<HTMLFormElement>('form')!,data=new FormData(form);
    const answer=selected==='main'?[...tokens]:selected==='backup'?data.get('backup-name'):selected==='display'?data.get('voltage-code'):data.get('power-output');
    const result=game.submitGenerator(selected,answer);
    if(!result.success){const feedback=dialog.querySelector<HTMLElement>('#generator-feedback')!;feedback.textContent=result.message;feedback.classList.add('error');return;}
    if(selected==='verify'){
      if(!game.repair('room-2')){callbacks.notify('請在供電測試台附近完成供電驗證。');return;}
      dialog.close();callbacks.completed();return;
    }
    render();callbacks.changed();dialog.querySelector('#generator-feedback')!.textContent=result.message;
    dialog.querySelector<HTMLElement>('.primary[data-action="close"]')?.focus();
  }
  dialog.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
    if(button.dataset.action==='close'){close();return;}
    if(button.dataset.move)reorder(Number(button.dataset.index),Number(button.dataset.index)+Number(button.dataset.move));
  });
  dialog.addEventListener('dragstart',event=>{const tile=(event.target as HTMLElement).closest<HTMLElement>('[data-tile]');if(tile){dragging=Number(tile.dataset.tile);event.dataTransfer?.setData('text/plain',String(dragging));}});
  dialog.addEventListener('dragover',event=>{if((event.target as HTMLElement).closest('[data-tile]'))event.preventDefault();});
  dialog.addEventListener('drop',event=>{event.preventDefault();const tile=(event.target as HTMLElement).closest<HTMLElement>('[data-tile]');if(tile&&dragging!==null)reorder(dragging,Number(tile.dataset.tile));dragging=null;});
  dialog.addEventListener('dragend',()=>{dragging=null;});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return {dialog,open(id:GeneratorTaskId){const error=game.openGenerator(id);if(error){callbacks.notify(error);return;}selected=id;tokens=['220','=','target_voltage'];render();dialog.showModal();}};
}
