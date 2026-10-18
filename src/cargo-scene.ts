import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {CargoState} from './cargo';
export function setupCargoScene(world:HTMLElement){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='cargo-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<g transform="scale(${SCALE})"><g class="cargo-rack"><rect x="1115" y="850" width="200" height="66" rx="7"/>${['A','B','C','D','E'].map(box=>`<g class="cargo-crate" data-crate="${box}"><text class="crate-index" x="20" y="-6"/><rect width="38" height="33" rx="4"/><path d="M4 5 L34 28 M34 5 L4 28"/><text x="19" y="23">${box}</text></g>`).join('')}</g><g class="cargo-arm"><circle cx="1078" cy="862" r="12"/><path id="cargo-arm-path" d="M1078 862 L1115 833 L1160 850"/><circle class="arm-grip" r="6"/></g><g class="cargo-shipped"><rect x="1120" y="1005" width="195" height="28" rx="6"/><text x="1217" y="1024">✓ D 工具箱已出庫</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  return (state:CargoState)=>{
    layer.classList.toggle('cargo-completed',state.completed);layer.dataset.stage=state.completed?'shipped':state.repaired.insert?'inserted':state.repaired.remove?'removed':'fault';
    const boxes=state.boxes;
    for(const crate of layer.querySelectorAll<SVGElement>('[data-crate]')){const id=crate.dataset.crate!,index=boxes.indexOf(id),shipped=id==='D'&&state.completed;crate.style.opacity=index<0?'0':'1';crate.style.transform=`translate(${shipped?1150:1128+Math.max(index,0)*46}px, ${shipped?960:870}px)`;crate.querySelector('.crate-index')!.textContent=shipped?'出庫':String(index);}
    layer.querySelector('#cargo-arm-path')!.setAttribute('d',state.completed?'M1078 862 L1110 915 L1168 950':'M1078 862 L1115 833 L1160 850');
    layer.querySelector('.arm-grip')!.setAttribute('transform',state.completed?'translate(1168 950)':'translate(1160 850)');
  };
}
