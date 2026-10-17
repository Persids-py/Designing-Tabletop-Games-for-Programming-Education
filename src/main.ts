import './style.css';
import './hitbox.css';
import './camera.css';
import './character.css';
import mapUrl from '../地圖.jpg';
import {Game,levels} from './game';
import {MAP_WIDTH,MAP_HEIGHT,move,speed,type Point} from './map';
import {setupHitbox} from './hitbox';
import {setupCamera} from './camera';
import {setupCharacter} from './character';
const game=new Game();
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<header class="topbar"><a class="brand" href="./" aria-label="太空船維修首頁"><span class="brand-icon">✧</span><span>太空船維修<small>程式設計情境桌遊</small></span></a><div class="session"><span class="status-dot"></span>單人探索 <span class="version">原型 v0.1</span></div></header>
<main><section class="mission-bar"><div><p class="eyebrow">維修任務 / SYSTEM REPAIR</p><h1>讓太空船重新運作。</h1><p class="subtitle">沿著船內通道，逐一修復故障系統。</p></div><div class="progress-card"><div><span>修復進度</span><strong id="count">0 <small>/ 10</small></strong></div><div class="progress-track"><div id="progress"></div></div><span id="progress-note">尚有 10 個系統等待修復</span></div></section>
<div class="workspace"><section class="map-panel" aria-label="太空船探索區"><div class="panel-heading"><span><i class="status-dot"></i>飛船全覽</span><span class="map-caption">俯視地圖 · 即時位置</span></div><div id="map" class="map" tabindex="0" aria-label="遊戲地圖，使用 WASD 或方向鍵移動"><img id="map-image" src="${mapUrl}" alt="太空船內部地圖" draggable="false"><svg id="player-layer" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" aria-hidden="true"><g id="player"><circle r="24" fill="#8ce9ff" opacity=".14"/><circle r="13" fill="#e0faff" stroke="#174b62" stroke-width="4"/><path d="M-6 -2 Q0 -8 6 -2 L6 3 L-6 3Z" fill="#23718d"/><circle cy="19" r="3" fill="#a7ebff"/></g></svg><div id="markers"></div><div id="map-error" hidden>地圖載入失敗。<button id="retry">重新載入</button></div></div><div class="map-footer"><span><b class="legend active"></b>目前故障 <b class="legend repaired"></b>已修復 <b class="legend player"></b>你的位置</span><span id="proximity">移動至閃爍標記附近</span></div></section>
<aside><section class="target-card"><p class="eyebrow">目前目標</p><div class="target-step" id="target-step">01 <span>/ 10</span></div><h2 id="target-title"></h2><p id="target-theme"></p><div class="target-status" id="target-status">● 等待維修</div><p class="target-help" id="target-help">靠近地圖上的故障標記，點擊即可開啟維修面板。</p></section><section class="route-card"><div class="route-heading"><h2>維修路線</h2><span>依序進行</span></div><ol id="route"></ol></section></aside></div>
<footer class="controls"><div><span class="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>或方向鍵移動</span><span class="divider"></span><span>滑鼠點擊故障標記</span><span class="divider"></span><kbd>Esc</kbd><span>關閉面板</span></div><span>第一版 · 按鈕維修體驗</span></footer></main>
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
const repairDialog=el<HTMLDialogElement>('repair-dialog');
const completeDialog=el<HTMLDialogElement>('complete-dialog');
const keys=new Set<string>();
let toastTimer:ReturnType<typeof setTimeout>;
function toast(message:string) { el('toast').textContent=message;el('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el('toast').classList.remove('visible'),3200); }
function closeRepair() { game.close();repairDialog.close();keys.clear();map.focus({preventScroll:true}); }
function openRepair(id:string) {
  const error=game.open(id);if(error){toast(error);return;}
  keys.clear(); const level=game.current;
  el('dialog-step').textContent=`維修站 ${String(game.index+1).padStart(2,'0')} / 10`;
  el('dialog-title').textContent=level.roomName;
  el('dialog-theme').textContent=level.repairTheme;
  repairDialog.showModal();
}
function render() {
  el('count').innerHTML=`${game.index} <small>/ 10</small>`;
  el('progress').style.width=`${game.index*10}%`;
  el('progress-note').textContent=game.completed?'所有系統運作正常':`尚有 ${10-game.index} 個系統等待修復`;
  el('target-step').innerHTML=game.completed?'✓':`${String(game.index+1).padStart(2,'0')} <span>/ 10</span>`;
  el('target-title').textContent=game.completed?'所有系統已修復':game.current.roomName;
  el('target-theme').textContent=game.completed?'太空船恢復運作':game.current.repairTheme;
  el('target-status').textContent=game.completed?'✓ 維修完成':'● 等待維修';
  el('target-help').textContent=game.completed?'你已完成十個維修站。可以重新開始，再次探索。':'靠近地圖上的故障標記，點擊即可開啟維修面板。';
  el('markers').innerHTML=levels.map((l,i)=>`<button class="marker ${i<game.index?'repaired':i===game.index?'active':'locked'}" style="left:${l.interactionPoint.x/MAP_WIDTH*100}%;top:${l.interactionPoint.y/MAP_HEIGHT*100}%" data-room="${l.id}" aria-label="${i+1}. ${l.roomName}：${i<game.index?'已修復':i===game.index?'目前目標':'未解鎖'}"><span>${i<game.index?'✓':i===game.index?'!':i+1}</span>${i===game.index?'<i class="marker-label">故障點</i>':''}</button>`).join('');
  el('route').innerHTML=levels.map((l,i)=>`<li class="${i<game.index?'done':i===game.index?'current':''}" ${i===game.index?'aria-current="step"':''}><span class="route-number">${i<game.index?'✓':String(i+1).padStart(2,'0')}</span><span>${l.roomName}</span><span class="route-state">${i<game.index?'完成':i===game.index?'進行中':'·'}</span></li>`).join('');
}
el('markers').addEventListener('click',event=>{const target=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-room]');if(target)openRepair(target.dataset.room!);});
el('close-dialog').onclick=closeRepair;
repairDialog.addEventListener('cancel',event=>{event.preventDefault();closeRepair();});
el('repair').onclick=()=>{
  const id=game.opened;if(!id)return;
  const name=game.current.roomName;
  if(!game.repair(id))return;
  repairDialog.close();keys.clear();render();
  if(game.completed)completeDialog.showModal();else{toast(`${name}已修復，下一站：${game.current.roomName}`);map.focus({preventScroll:true});}
};
el('restart').onclick=()=>{game.reset();keys.clear();completeDialog.close();render();map.focus({preventScroll:true});toast('新的維修旅程開始，前往警報燈光室');};
completeDialog.addEventListener('cancel',event=>event.preventDefault());
const movementKeys=['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'];
document.addEventListener('keydown',event=>{
  if((event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]'))return;
  const key=event.key.toLowerCase();
  if(movementKeys.includes(key)&&!repairDialog.open&&!completeDialog.open){event.preventDefault();keys.add(key);}
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
  camera.update(game.player,game.current?.interactionPoint,game.current?.roomName);
  const near=!game.completed&&game.near(game.current);
  if(near!==wasNear){wasNear=near;map.classList.toggle('in-range',near);}
  el('proximity').textContent=game.completed?'所有系統已修復':near?'已抵達 · 點擊目前故障標記':'移動至閃爍標記附近';
  requestAnimationFrame(frame);
}
function drawPlayer(p:Point){el('player').setAttribute('transform',`translate(${p.x} ${p.y})`);drawCharacter(p);drawHitbox(p);}
render();requestAnimationFrame(frame);
