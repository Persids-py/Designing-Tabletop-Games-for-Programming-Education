import { floors, obstacles, floorIds, obstacleIds, MAP_WIDTH, MAP_HEIGHT, radius, inside, walkable, type Point } from './map';

// 直接讀取移動判定用的資料，避免另外畫一份與碰撞邏輯不一致的示意圖。
export function setupHitbox(map: HTMLElement, world: HTMLElement, toWorld: (p:Point)=>Point) {
  const toggle = document.createElement('button');
  toggle.id = 'hitbox-toggle'; toggle.className = 'hitbox-toggle'; toggle.type = 'button';
  toggle.setAttribute('aria-controls', 'hitbox-layer hitbox-help');
  toggle.setAttribute('aria-pressed', 'false'); toggle.textContent = '顯示碰撞範圍';
  document.querySelector('.panel-heading')!.append(toggle);
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  layer.id = 'hitbox-layer';
  layer.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
  layer.setAttribute('aria-hidden', 'true');
  const shapes = (polys: Point[][], ids: number[], prefix: string, kind: string) => polys.map((poly, i) => {
    const center = poly.reduce((sum, p) => ({ x: sum.x + p.x / poly.length, y: sum.y + p.y / poly.length }), { x: 0, y: 0 });
    return `<g class="hitbox-${kind}" data-region="${prefix}${ids[i]}"><polygon points="${poly.map(p => `${p.x},${p.y}`).join(' ')}"/><text x="${center.x}" y="${center.y}">${prefix}${ids[i]}</text></g>`;
  }).join('');
  const samples = Array.from({ length: 8 }, (_, i) => {
    const angle = i * Math.PI / 4;
    return `<circle cx="${Math.cos(angle) * radius}" cy="${Math.sin(angle) * radius}" r="2.5"/>`;
  }).join('');
  layer.innerHTML = `${shapes(floors, floorIds, 'F', 'floor')}${shapes(obstacles, obstacleIds, 'O', 'obstacle')}<g id="hitbox-probe" visibility="hidden"><circle class="probe-outline" r="${radius}"/>${samples}</g><g id="hitbox-player"><circle class="player-outline" r="${radius}"/>${samples}</g>`;
  world.insertBefore(layer, document.getElementById('player-layer'));
  const help = document.createElement('div');
  help.id = 'hitbox-help'; help.className = 'hitbox-help'; help.hidden = true;
  help.innerHTML = `<div><span class="floor-key">綠色 F：地板範圍</span><span class="obstacle-key">紅色 O：障礙物</span><span class="player-key">藍圈：角色碰撞範圍</span></div><p>未上色處也不能走。角色邊緣的 8 個判定點都要在地板內、障礙外；靠牆時需留出角色半徑。移動滑鼠可檢查該位置。</p><output>座標使用原圖像素，F／O 編號對應目前實際碰撞資料。</output>`;
  map.closest('.map-panel')!.append(help);
  const probe = layer.querySelector<SVGGElement>('#hitbox-probe')!;
  const player = layer.querySelector<SVGGElement>('#hitbox-player')!;
  const readout = help.querySelector('output')!;
  let enabled = false;
  function setEnabled(value: boolean) {
    enabled = value; map.classList.toggle('show-hitbox', value); help.hidden = !value;
    toggle.setAttribute('aria-pressed', String(value));
    toggle.textContent = value ? '隱藏碰撞範圍' : '顯示碰撞範圍';
    probe.setAttribute('visibility', 'hidden');
    const url = new URL(location.href);
    if (value) url.searchParams.set('hitbox', '1'); else url.searchParams.delete('hitbox');
    history.replaceState(null, '', url);
  }
  toggle.addEventListener('click', () => setEnabled(!enabled));
  map.addEventListener('pointermove', event => {
    if (!enabled) return;
    const rect = map.getBoundingClientRect();
    const p = toWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    const allowed = walkable(p);
    probe.setAttribute('transform', `translate(${p.x} ${p.y})`); probe.setAttribute('visibility', 'visible');
    probe.classList.toggle('blocked', !allowed);
    const f = floors.flatMap((poly, i) => inside(p, poly) ? [`F${floorIds[i]}`] : []);
    const o = obstacles.flatMap((poly, i) => inside(p, poly) ? [`O${obstacleIds[i]}`] : []);
    readout.textContent = `X ${Math.round(p.x)} / Y ${Math.round(p.y)} · ${allowed ? '角色可站立' : '角色無法站立'} · 地板 ${f.join('、') || '無'} · 障礙 ${o.join('、') || '無'}`;
  });
  map.addEventListener('pointerleave', () => probe.setAttribute('visibility', 'hidden'));
  setEnabled(new URLSearchParams(location.search).get('hitbox') === '1');
  return (p: Point) => { if (enabled) player.setAttribute('transform', `translate(${p.x} ${p.y})`); };
}
