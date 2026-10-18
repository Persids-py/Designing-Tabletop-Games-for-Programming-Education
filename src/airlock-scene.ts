import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {AirlockState} from './airlock';
export function setupAirlockScene(world:HTMLElement){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='airlock-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<g transform="scale(${SCALE})"><g class="airlock-door" transform="translate(1730 947)"><circle r="31"/><path d="M0 -25 V25"/><path class="door-check" d="M-14 0 L-3 11 L16 -12"/></g><g class="airlock-lamps"><circle cx="1488" cy="933" r="9"/><circle cx="1488" cy="965" r="9"/></g><g class="pressure-monitor" transform="translate(1548 882)"><rect width="110" height="33" rx="6"/><text x="55" y="21">壓力警示</text></g><g class="airlock-ready"><rect x="1500" y="997" width="200" height="28" rx="6"/><text x="1600" y="1016">✓ 壓力正常 · 氣閘門已解鎖</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  return (state:AirlockState)=>{layer.classList.toggle('airlock-unlocked',state.unlocked);layer.dataset.stage=state.unlocked?'unlocked':state.completed?'tested':state.ready?'ready':'fault';layer.querySelector('.pressure-monitor text')!.textContent=state.unlocked?'壓力正常':state.completed?'測試通過':state.ready?'等待壓力測試':'壓力警示';};
}
