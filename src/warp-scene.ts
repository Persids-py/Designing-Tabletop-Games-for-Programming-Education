import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {WarpState} from './warp';
export function setupWarpScene(world:HTMLElement){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='warp-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<g transform="scale(${SCALE})"><g class="warp-core"><ellipse cx="330" cy="551" rx="77" ry="43"/><path d="M270 530 H386 M270 549 H386 M270 568 H386"/></g><g class="warp-lamps">${[[210,452],[524,452],[524,625],[210,625]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g><g class="warp-monitor" transform="translate(300 628)"><rect width="190" height="38" rx="7"/><text x="95" y="25">WARP LOCKED</text></g><g class="warp-returned"><rect x="235" y="692" width="235" height="32" rx="6"/><text x="352" y="714">✓ 探索者號返航成功</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  return (state:WarpState)=>{layer.dataset.stage=state.launched?'returned':state.launching?'countdown':state.checked?'ready':state.tested?'charging':'fault';layer.classList.toggle('warp-charged',state.tested);layer.classList.toggle('warp-ready',state.checked);layer.classList.toggle('warp-launched',state.launched);layer.querySelector('.warp-monitor text')!.textContent=state.launched?'返航成功':state.launching?`躍遷倒數 ${state.countdown}`:state.checked?'WARP READY':'WARP LOCKED';};
}
