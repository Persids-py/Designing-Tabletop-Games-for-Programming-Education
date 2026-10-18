import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {LifeSupportState} from './life-support';

export function setupLifeSupportScene(world:HTMLElement){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='life-support-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<g transform="scale(${SCALE})">${[691,738,783].map((x,i)=>`<g class="energy-tank tank-${i}" data-tank="${i}"><rect class="tank-dim" x="${x-17}" y="42" width="34" height="77" rx="10"/><rect class="tank-glow" x="${x-17}" y="42" width="34" height="77" rx="10"/><path class="tank-glow" d="M${x+4} 63 L${x-7} 84 H${x+1} L${x-4} 101 L${x+9} 78 H${x+2}Z"/></g>`).join('')}<g class="life-monitor" transform="translate(663 315)"><rect width="165" height="38" rx="7"/><text x="82" y="25">等待能源檢測</text></g><g class="life-ready"><rect x="660" y="356" width="180" height="29" rx="6"/><text x="750" y="376">✓ 能源計算恢復正常</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  return (state:LifeSupportState)=>{
    for(const [i,key] of (['main','used','backup'] as const).entries()){
      const tank=layer.querySelector(`[data-tank="${i}"]`)!;tank.classList.toggle('online',state.repaired[key]);tank.setAttribute('data-online',String(state.repaired[key]));
    }
    layer.classList.toggle('life-restored',state.completed);
    layer.querySelector('.life-monitor text')!.textContent=state.completed?'可用能源 155':`設備修復 ${Math.min(state.count,3)} / 3`;
    layer.dataset.stage=state.completed?'restored':state.repaired.backup?'backup':state.repaired.used?'used':state.repaired.main?'main':'fault';
  };
}
