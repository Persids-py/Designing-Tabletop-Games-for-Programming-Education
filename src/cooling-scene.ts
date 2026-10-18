import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {CoolingState} from './cooling';
export function setupCoolingScene(world:HTMLElement){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='cooling-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<g transform="scale(${SCALE})"><path class="coolant-flow" d="M343 212 V299 H434 Q456 299 456 278 Q456 257 434 257 H360"/><g class="cooling-fan" transform="translate(530 156)"><circle r="19"/><g class="fan-rotor"><path d="M0 0 Q-22 -20 -5 -16 Q5 -15 0 0 Q27 -5 15 10 Q8 19 0 0 Q-8 26 -17 11 Q-21 2 0 0"/></g><circle r="4"/></g><g class="cooling-meter" transform="translate(380 180)"><rect width="150" height="38" rx="7"/><text x="75" y="25">100°C · 冷卻故障</text></g><g class="cooling-ready"><rect x="370" y="225" width="205" height="28" rx="6"/><text x="472" y="244">✓ 冷卻完成 · 循環 4 次</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  let completed:boolean|null=null;let timers:ReturnType<typeof setTimeout>[]=[];
  return (state:CoolingState)=>{
    if(state.completed===completed)return;
    completed=state.completed;for(const timer of timers)clearTimeout(timer);timers=[];
    layer.classList.toggle('cooling-online',completed);layer.classList.remove('cooling-restored');
    layer.dataset.stage=completed?'cooling':'fault';const text=layer.querySelector('.cooling-meter text')!;
    text.textContent=completed?'100°C · 冷卻中':'100°C · 冷卻故障';
    if(completed)for(const [i,value] of [90,80,70,60].entries())timers.push(setTimeout(()=>{text.textContent=`${value}°C · ${i===3?'溫度正常':'冷卻中'}`;if(i===3){layer.dataset.stage='restored';layer.classList.add('cooling-restored');}},(i+1)*300));
  };
}
