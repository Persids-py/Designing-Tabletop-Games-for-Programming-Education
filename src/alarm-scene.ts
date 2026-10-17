import {MAP_WIDTH,MAP_HEIGHT,SCALE} from './map';
import type {AlarmState} from './alarm';

export function setupAlarmScene(world:HTMLElement,mapUrl:string){
  const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.id='alarm-scene';layer.setAttribute('viewBox',`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<defs><clipPath id="alarm-room-clip"><path transform="scale(${SCALE})" d="M1395 134 L1475 62 H1750 L1850 161 V333 L1752 417 H1690 V444 H1674 V555 H1352 V478 L1408 425 Z"/></clipPath></defs><image class="room-restored" href="${mapUrl}" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" clip-path="url(#alarm-room-clip)"/><g transform="scale(${SCALE})"><g class="computer-glow"><rect x="1587" y="105" width="79" height="31" rx="2"/><path d="M1597 116 H1622 M1597 124 H1651"/></g><g class="warning-lamps">${[[1531,133],[1726,132],[1459,194],[1795,195],[1631,260]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${x===1631?25:13}"/>`).join('')}</g><g class="broadcast-waves" transform="translate(1741 278)"><path d="M0-12 Q15 0 0 12 M7-20 Q31 0 7 20 M16-28 Q47 0 16 28"/><text x="-12" y="47">SIREN ON</text></g><g class="room-ready"><rect x="1480" y="400" width="205" height="37" rx="7"/><text x="1582" y="425">✓ 警報系統已修復</text></g></g>`;
  world.insertBefore(layer,document.getElementById('player-layer'));
  return (state:AlarmState)=>{
    layer.classList.toggle('computer-online',state.repaired.computer);layer.classList.toggle('lights-online',state.repaired.light);layer.classList.toggle('broadcast-online',state.repaired.broadcast);layer.classList.toggle('room-repaired',state.completed);
    layer.dataset.stage=state.completed?'repaired':state.repaired.broadcast?'broadcast':state.repaired.light?'light':state.repaired.computer?'computer':'fault';
  };
}
