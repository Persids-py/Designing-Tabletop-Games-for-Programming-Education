import './style.css';
import './hitbox.css';
import './camera.css';
import './character.css';
import './alarm.css';
import './generator.css';
import './life-support.css';
import './airlock.css';
import {airlockTasks,type AirlockTaskId} from './airlock';
import {setupAirlockUI} from './airlock-ui';
import {setupAirlockScene} from './airlock-scene';
import mapUrl from '../地圖.jpg';
import {Game,levels} from './game';
import {MAP_WIDTH,MAP_HEIGHT,move,speed,type Point} from './map';
import {setupHitbox} from './hitbox';
import {setupCamera} from './camera';
import {setupCharacter} from './character';
import {alarmTasks,type AlarmTaskId} from './alarm';
import {setupAlarmUI} from './alarm-ui';
import {setupAlarmScene} from './alarm-scene';
import {generatorTasks,type GeneratorTaskId} from './generator';
import {setupGeneratorUI} from './generator-ui';
import {setupGeneratorScene} from './generator-scene';
import {lifeSupportTasks,type LifeSupportTaskId} from './life-support';
import {setupLifeSupportUI} from './life-support-ui';
import {setupLifeSupportScene} from './life-support-scene';
const game=new Game();
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<header class="topbar"><a class="brand" href="./" aria-label="太空船維修首頁"><span class="brand-icon">✧</span><span>太空船維修<small>程式設計情境桌遊</small></span></a><div class="session"><span class="status-dot"></span>單人探索 <span class="version">原型 v0.1</span></div></header>
<main><section class="mission-bar"><div><p class="eyebrow">維修任務 / SYSTEM REPAIR</p><h1>讓太空船重新運作。</h1><p class="subtitle">沿著船內通道，逐一修復故障系統。</p></div><div class="progress-card"><div><span>修復進度</span><strong id="count">0 <small>/ 10</small></strong></div><div class="progress-track"><div id="progress"></div></div><span id="progress-note">尚有 10 個系統等待修復</span></div></section>
<div class="workspace"><section class="map-panel" aria-label="太空船探索區"><div class="panel-heading"><span><i class="status-dot"></i>飛船全覽</span><span class="map-caption">俯視地圖 · 即時位置</span></div><div id="map" class="map" tabindex="0" aria-label="遊戲地圖，使用 WASD 或方向鍵移動"><img id="map-image" src="${mapUrl}" alt="太空船內部地圖" draggable="false"><svg id="player-layer" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" aria-hidden="true"><g id="player"><circle r="24" fill="#8ce9ff" opacity=".14"/><circle r="13" fill="#e0faff" stroke="#174b62" stroke-width="4"/><path d="M-6 -2 Q0 -8 6 -2 L6 3 L-6 3Z" fill="#23718d"/><circle cy="19" r="3" fill="#a7ebff"/></g></svg><div id="markers"></div><div id="map-error" hidden>地圖載入失敗。<button id="retry">重新載入</button></div></div><div class="map-footer"><span><b class="legend active"></b>目前故障 <b class="legend repaired"></b>已修復 <b class="legend player"></b>你的位置</span><span id="proximity">移動至閃爍標記附近</span></div></section>
<aside><section class="target-card"><p class="eyebrow">目前目標</p><div class="target-step" id="target-step">01 <span>/ 10</span></div><h2 id="target-title"></h2><p id="target-theme"></p><div class="target-status" id="target-status">● 等待維修</div><p class="target-help" id="target-help">靠近地圖上的故障標記，點擊即可開啟維修面板。</p></section><section class="route-card"><div class="route-heading"><h2>維修路線</h2><span>依序進行</span></div><ol id="route"></ol></section></aside></div>
<footer class="controls"><div><span class="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>或方向鍵移動</span><span class="divider"></span><span>滑鼠點擊故障標記</span><span class="divider"></span><kbd>Esc</kbd><span>關閉面板</span></div><span>第一關 · 警報系統維修</span></footer></main>
<div id="toast" role="status" aria-live="polite"></div>
<dialog id="repair-dialog" aria-labelledby="dialog-title"><button class="close" id="close-dialog" aria-label="關閉維修面板">×</button><p class="eyebrow" id="dialog-step"></p><div class="repair-symbol">⌁</div><h2 id="dialog-title"></h2><p id="dialog-theme"></p><div class="fault-note"><span class="status-dot"></span>設備故障，等待維修</div><p class="dialog-description">抵達維修點。點擊下方按鈕，恢復這個系統的運作。</p><button id="repair" class="primary">維修 <span>↗</span></button></dialog>
<dialog id="complete-dialog" aria-labelledby="complete-title"><p class="eyebrow">任務完成 / MISSION COMPLETE</p><div class="success-symbol">✓</div><h2 id="complete-title">太空船維修完成</h2><p>10 個系統已全數恢復運作。<br>這趟維修旅程，完成了。</p><button id="restart" class="primary">重新開始 <span>↻</span></button></dialog>`;
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const map=el('map');
// 圖片、角色、維修點與碰撞疊圖共用一個世界圖層，鏡頭只改變顯示位置。
const world=document.createElement('div');world.id='map-world';world.className='map-world';
for(const id of ['map-image','player-layer','markers'])world.append(el(id));
map.prepend(world);
document.querySelector('.panel-heading>span:first-child')!.innerHTML='<i class="status-dot"></i>船內探索';
const camera=setupCamera(map,world,game.player);
const drawHitbox=setupHitbox(map,world,camera.toWorld);
const drawCharacter=setupCharacter(el('player'),game.player);
const drawAlarmScene=setupAlarmScene(world,mapUrl);
const drawGeneratorScene=setupGeneratorScene(world);
const drawLifeSupportScene=setupLifeSupportScene(world);
const drawAirlockScene=setupAirlockScene(world);
const repairDialog=el<HTMLDialogElement>('repair-dialog');
const completeDialog=el<HTMLDialogElement>('complete-dialog');
const keys=new Set<string>();
const alarmUI=setupAlarmUI(game,{changed:render,completed:()=>afterRepair('警報燈光室'),closed:()=>{keys.clear();map.focus({preventScroll:true});},notify:toast});
const generatorUI=setupGeneratorUI(game,{changed:render,completed:()=>afterRepair('發電機室'),closed:()=>{keys.clear();map.focus({preventScroll:true});},notify:toast});
const lifeSupportUI=setupLifeSupportUI(game,{changed:render,completed:()=>afterRepair('維生系統室'),closed:()=>{keys.clear();map.focus({preventScroll:true});},notify:toast});
const airlockUI=setupAirlockUI(game,{changed:render,completed:()=>afterRepair('氣閘艙'),closed:()=>{keys.clear();map.focus({preventScroll:true});},notify:toast});
let toastTimer:ReturnType<typeof setTimeout>;
function toast(message:string) { el('toast').textContent=message;el('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el('toast').classList.remove('visible'),3200); }
function closeRepair() { game.close();repairDialog.close();keys.clear();map.focus({preventScroll:true}); }
function openRepair(id:string) {
  if(id==='room-1'&&game.index===0){alarmUI.open(game.alarm.next.id);keys.clear();return;}
  if(id==='room-2'&&game.index===1){generatorUI.open(game.generator.next.id);keys.clear();return;}
  if(id==='room-3'&&game.index===2){lifeSupportUI.open(game.lifeSupport.next.id);keys.clear();return;}
  if(id==='room-4'&&game.index===3){airlockUI.open(game.airlock.next.id);keys.clear();return;}
  const error=game.open(id);if(error){toast(error);return;}
  keys.clear(); const level=game.current;
  el('dialog-step').textContent=`維修站 ${String(game.index+1).padStart(2,'0')} / 10`;
  el('dialog-title').textContent=level.roomName;
  el('dialog-theme').textContent=level.repairTheme;
  repairDialog.showModal();
}
function render() {
  drawAlarmScene(game.alarm);
  drawGeneratorScene(game.generator);
  drawLifeSupportScene(game.lifeSupport);
  drawAirlockScene(game.airlock);
  document.querySelector('.controls>span')!.textContent=game.index===0?'第一關 · 警報系統維修':game.index===1?'第二關 · 供電系統維修':game.index===2?'第三關 · 維生能源修復':game.index===3?'第四關 · 氣閘安全修復':'太空船維修任務';
  el('count').innerHTML=`${game.index} <small>/ 10</small>`;
  el('progress').style.width=`${game.index*10}%`;
  el('progress-note').textContent=game.completed?'所有系統運作正常':`尚有 ${10-game.index} 個系統等待修復`;
  el('target-step').innerHTML=game.completed?'✓':`${String(game.index+1).padStart(2,'0')} <span>/ 10</span>`;
  el('target-title').textContent=game.completed?'所有系統已修復':game.current.roomName;
  el('target-theme').textContent=game.completed?'太空船恢復運作':game.current.repairTheme;
  el('target-status').textContent=game.completed?'✓ 維修完成':'● 等待維修';
  el('target-help').textContent=game.completed?'你已完成十個維修站。可以重新開始，再次探索。':'靠近地圖上的故障標記，點擊即可開啟維修面板。';
  if(game.index===0){
    el('target-theme').textContent=`下一個設備：${game.alarm.next.name}`;
    el('target-status').textContent=`● 設備修復 ${game.alarm.count} / 4`;
    el('target-help').textContent=game.alarm.ready?'三個設備已修復。前往警報啟動台，排序並驗證整個系統。':'前三個設備可分別維修。答錯可重試；三個設備都修好後，才能進行最終驗證。';
  }
  if(game.index===1){
    el('target-theme').textContent=`下一個設備：${game.generator.next.name}`;
    el('target-status').textContent=`● 設備修復 ${game.generator.count} / 4`;
    el('target-help').textContent=game.generator.ready?'三項維修已完成。前往供電測試台，預測輸出並驗證供電。':'先完成主電壓與備用變數設定，再修復顯示器。三項都完成後，才能進行供電驗證。';
  }
  if(game.index===2){
    el('target-theme').textContent=`下一個設備：${game.lifeSupport.next.name}`;
    el('target-status').textContent=`● 設備修復 ${game.lifeSupport.count} / 4`;
    el('target-help').textContent=game.lifeSupport.ready?'三項能源計算已修復。前往驗證台，計算最後可用能源。':'修復型態與運算方式，讓三個能源槽恢復正常；三項完成後才能進行總驗證。';
  }
  if(game.index===3){
    el('target-theme').textContent=`下一個設備：${game.airlock.next.name}`;
    el('target-status').textContent=`● 設備修復 ${game.airlock.count} / 4`;
    el('target-help').textContent=game.airlock.ready?'三項指令已修好。測試 120、100、80 kPa 的安全判斷，通過後解除封鎖。':'修復冒號、縮排與 else 指令。高壓鎖門，正常壓力允許開門。';
  }
  el('markers').innerHTML=levels.map((l,i)=>`<button class="marker ${i<game.index?'repaired':i===game.index?'active':'locked'}" style="left:${l.interactionPoint.x/MAP_WIDTH*100}%;top:${l.interactionPoint.y/MAP_HEIGHT*100}%" data-room="${l.id}" aria-label="${i+1}. ${l.roomName}：${i<game.index?'已修復':i===game.index?'目前目標':'未解鎖'}"><span>${i<game.index?'✓':i===game.index?'!':i+1}</span>${i===game.index?'<i class="marker-label">故障點</i>':''}</button>`).join('');
  el('route').innerHTML=levels.map((l,i)=>`<li class="${i<game.index?'done':i===game.index?'current':''}" ${i===game.index?'aria-current="step"':''}><span class="route-number">${i<game.index?'✓':String(i+1).padStart(2,'0')}</span><span>${l.roomName}</span><span class="route-state">${i<game.index?'完成':i===game.index?'進行中':'·'}</span></li>`).join('');
  if(game.index===0){
    el('markers').querySelector('[data-room="room-1"]')?.remove();
    el('markers').insertAdjacentHTML('beforeend',alarmTasks.map((task,i)=>{
      const repaired=game.alarm.repaired[task.id],locked=task.id==='verify'&&!game.alarm.ready,active=task.id===game.alarm.next.id;
      return `<button class="marker alarm-device ${repaired?'repaired':active?'active':locked?'locked':'ready'}" style="left:${task.point.x/MAP_WIDTH*100}%;top:${task.point.y/MAP_HEIGHT*100}%" data-alarm-task="${task.id}" ${i===0?'data-room="room-1"':''} aria-label="${task.name}：${repaired?'已修復':locked?'需先修好三個設備':'等待維修'}"><span>${repaired?'✓':active?'!':i+1}</span>${active?`<i class="marker-label">${task.name}</i>`:''}</button>`;
    }).join(''));
  }
  if(game.index===1){
    el('markers').querySelector('[data-room="room-2"]')?.remove();
    el('markers').insertAdjacentHTML('beforeend',generatorTasks.map((task,i)=>{
      const repaired=game.generator.repaired[task.id],locked=!!game.generator.blocked(task.id),active=task.id===game.generator.next.id;
      return `<button class="marker generator-device ${repaired?'repaired':active?'active':locked?'locked':'ready'}" style="left:${task.point.x/MAP_WIDTH*100}%;top:${task.point.y/MAP_HEIGHT*100}%" data-generator-task="${task.id}" ${i===0?'data-room="room-2"':''} aria-label="${task.name}：${repaired?'已修復':locked?'尚未解鎖':'等待維修'}"><span>${repaired?'✓':active?'!':i+1}</span>${active?`<i class="marker-label">${task.name}</i>`:''}</button>`;
    }).join(''));
  }
  if(game.index===2){
    el('markers').querySelector('[data-room="room-3"]')?.remove();
    el('markers').insertAdjacentHTML('beforeend',lifeSupportTasks.map((task,i)=>{
      const repaired=game.lifeSupport.repaired[task.id],locked=!!game.lifeSupport.blocked(task.id),active=task.id===game.lifeSupport.next.id;
      return `<button class="marker life-support-device ${repaired?'repaired':active?'active':locked?'locked':'ready'}" style="left:${task.point.x/MAP_WIDTH*100}%;top:${task.point.y/MAP_HEIGHT*100}%" data-life-support-task="${task.id}" ${i===0?'data-room="room-3"':''} aria-label="${task.name}：${repaired?'已修復':locked?'尚未解鎖':'等待維修'}"><span>${repaired?'✓':active?'!':i+1}</span>${active?`<i class="marker-label">${task.name}</i>`:''}</button>`;
    }).join(''));
  }
  if(game.index===3){
    el('markers').querySelector('[data-room="room-4"]')?.remove();
    el('markers').insertAdjacentHTML('beforeend',airlockTasks.map((task,i)=>{
      const repaired=game.airlock.repaired[task.id],locked=!!game.airlock.blocked(task.id),active=task.id===game.airlock.next.id;
      return `<button class="marker airlock-device ${repaired?'repaired':active?'active':locked?'locked':'ready'}" style="left:${task.point.x/MAP_WIDTH*100}%;top:${task.point.y/MAP_HEIGHT*100}%" data-airlock-task="${task.id}" ${i===0?'data-room="room-4"':''} aria-label="${task.name}：${repaired?'已修復':locked?'尚未解鎖':'等待維修'}"><span>${repaired?'✓':active?'!':i+1}</span>${active?`<i class="marker-label">${task.name}</i>`:''}</button>`;
    }).join(''));
  }
}
el('markers').addEventListener('click',event=>{const target=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-room],[data-alarm-task],[data-generator-task],[data-life-support-task],[data-airlock-task]');if(!target)return;if(target.dataset.alarmTask){keys.clear();alarmUI.open(target.dataset.alarmTask as AlarmTaskId);}else if(target.dataset.generatorTask){keys.clear();generatorUI.open(target.dataset.generatorTask as GeneratorTaskId);}else if(target.dataset.lifeSupportTask){keys.clear();lifeSupportUI.open(target.dataset.lifeSupportTask as LifeSupportTaskId);}else if(target.dataset.airlockTask){keys.clear();airlockUI.open(target.dataset.airlockTask as AirlockTaskId);}else openRepair(target.dataset.room!);});
el('close-dialog').onclick=closeRepair;
repairDialog.addEventListener('cancel',event=>{event.preventDefault();closeRepair();});
el('repair').onclick=()=>{
  const id=game.opened;if(!id)return;
  const name=game.current.roomName;
  if(!game.repair(id))return;
  afterRepair(name);
};
function afterRepair(name:string){
  repairDialog.close();keys.clear();render();
  if(game.completed)completeDialog.showModal();else{toast(`${name}已修復，下一站：${game.current.roomName}`);map.focus({preventScroll:true});}
}
el('restart').onclick=()=>{game.reset();keys.clear();completeDialog.close();render();map.focus({preventScroll:true});toast('新的維修旅程開始，前往警報燈光室');};
completeDialog.addEventListener('cancel',event=>event.preventDefault());
const movementKeys=['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'];
document.addEventListener('keydown',event=>{
  if((event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]'))return;
  const key=event.key.toLowerCase();
  if(movementKeys.includes(key)&&!repairDialog.open&&!completeDialog.open&&!alarmUI.dialog.open&&!generatorUI.dialog.open&&!lifeSupportUI.dialog.open&&!airlockUI.dialog.open){event.preventDefault();keys.add(key);}
});
document.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>keys.clear());
const image=el<HTMLImageElement>('map-image');
image.onerror=()=>{el('map-error').hidden=false;};
image.onload=()=>{el('map-error').hidden=true;};
el('retry').onclick=()=>{image.src=`${mapUrl}?retry=${Date.now()}`;};
let previous=performance.now(),wasNear=false;
function frame(now:number) {
  const dt=Math.min((now-previous)/1000,.04);previous=now;
  if(!game.opened&&!game.completed&&!repairDialog.open&&!completeDialog.open){
    let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
    let dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
    const length=Math.hypot(dx,dy);if(length){dx/=length;dy/=length;game.player=move(game.player,dx*speed*dt,dy*speed*dt);}
  }
  drawPlayer(game.player);
  camera.update(game.player,game.navigation?.point,game.navigation?.name);
  const near=game.nearTarget;
  if(near!==wasNear){wasNear=near;map.classList.toggle('in-range',near);}
  el('proximity').textContent=game.completed?'所有系統已修復':near?'已抵達 · 點擊目前故障標記':'移動至閃爍標記附近';
  requestAnimationFrame(frame);
}
function drawPlayer(p:Point){el('player').setAttribute('transform',`translate(${p.x} ${p.y})`);drawCharacter(p);drawHitbox(p);}
render();requestAnimationFrame(frame);
