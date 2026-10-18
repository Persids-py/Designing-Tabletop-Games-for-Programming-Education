import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {BoosterState} from './booster';
export function setupBoosterScene(world:HTMLElement){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='booster-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<g transform="scale(${SCALE})">${[760,850].map(y=>`<path class="booster-beam" d="M362 ${y-13} Q285 ${y-26} 205 ${y} Q285 ${y+26} 362 ${y+13}Z"/>`).join('')}<g class="booster-panel" transform="translate(485 790)"><rect width="195" height="55" rx="8"/>${[0,1,2].map(i=>`<g data-booster-lamp="${i}" transform="translate(${35+i*62} 20)"><circle r="9"/><text y="25">${[0,10,20][i]}</text></g>`).join('')}</g><g class="booster-ready"><rect x="480" y="905" width="210" height="28" rx="6"/><text x="585" y="924">✓ 副推進器恢復動力</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  return (state:BoosterState)=>{layer.classList.toggle('booster-powered',state.completed);layer.dataset.stage=state.completed?'powered':state.testOutputs.length?'testing':'fault';for(const [i,lamp] of [...layer.querySelectorAll('[data-booster-lamp]')].entries()){const online=i<state.testOutputs.length;lamp.classList.toggle('online',online);lamp.setAttribute('data-online',String(online));}};
}
