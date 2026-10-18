import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {RadarState} from './radar';
export function setupRadarScene(world:HTMLElement){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='radar-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<g transform="scale(${SCALE})"><g class="radar-display" transform="translate(1795 563)"><circle r="41"/><g class="radar-sweep"><path d="M0 0 L0 -39 A39 39 0 0 1 34 -19Z"/><path d="M0 0 V-39"/></g><g class="radar-noise"><circle cx="-16" cy="-18" r="4"/><circle cx="23" cy="11" r="5"/><path d="M-30 18 L-15 9 L-4 19 L8 0 L25 -9"/></g></g><g class="radar-monitor" transform="translate(1810 605)"><rect width="160" height="38" rx="6"/><text x="80" y="24">雷達訊號受干擾</text></g><g class="radar-notice"><rect x="1750" y="688" width="225" height="31" rx="6"/><text x="1862" y="709">✓ 導航系統已收到修復通知</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  return (state:RadarState)=>{layer.classList.toggle('radar-restored',state.completed);layer.dataset.stage=state.completed?'restored':state.ready?'ready':'fault';layer.querySelector('.radar-monitor text')!.textContent=state.completed?'有效總和 50 · 異常 2':`設備修復 ${state.count} / 4`;};
}
