import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {GeneratorState} from './generator';

export function setupGeneratorScene(world:HTMLElement){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='generator-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<g transform="scale(${SCALE})"><g class="generator-core main-core"><circle cx="1421" cy="674" r="38"/><path d="M1427 650 L1409 674 H1420 L1415 696 L1436 669 H1424 Z"/></g><g class="generator-core backup-core"><circle cx="1518" cy="674" r="38"/><path d="M1524 650 L1506 674 H1517 L1512 696 L1533 669 H1521 Z"/></g><g class="voltage-meter main-meter" transform="translate(1378 731)"><rect width="87" height="34" rx="5"/><text x="43" y="23">---</text></g><g class="voltage-meter backup-meter" transform="translate(1476 731)"><rect width="87" height="34" rx="5"/><text x="43" y="23">---</text></g><g class="power-ready"><rect x="1390" y="850" width="210" height="34" rx="6"/><text x="1495" y="873">✓ 供電系統運作正常</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  return (state:GeneratorState)=>{
    layer.classList.toggle('main-online',state.repaired.main);layer.classList.toggle('backup-online',state.repaired.backup);layer.classList.toggle('display-online',state.repaired.display);layer.classList.toggle('power-restored',state.completed);
    layer.querySelector('.main-meter text')!.textContent=state.repaired.display?'220V':state.repaired.main?'待校正':'---';
    layer.querySelector('.backup-meter text')!.textContent=state.repaired.backup?'110V':'---';
    layer.dataset.stage=state.completed?'powered':state.repaired.display?'display':state.repaired.backup?'backup':state.repaired.main?'main':'fault';
  };
}
