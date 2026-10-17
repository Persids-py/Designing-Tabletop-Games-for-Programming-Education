import { MAP_WIDTH, MAP_HEIGHT, type Point } from './map';

export interface CameraFrame { scale: number; left: number; top: number }
export function cameraFrame(width: number, height: number, player: Point, overview: boolean): CameraFrame {
  const fit = Math.min(width / MAP_WIDTH, height / MAP_HEIGHT);
  const scale = overview ? fit : fit * 3.4;
  const viewWidth = width / scale, viewHeight = height / scale;
  const clamp = (value: number, span: number, size: number) => span >= size ? (size - span) / 2 : Math.max(0, Math.min(size - span, value - span / 2));
  return { scale, left: clamp(player.x, viewWidth, MAP_WIDTH), top: clamp(player.y, viewHeight, MAP_HEIGHT) };
}
export function project(p: Point, frame: CameraFrame): Point { return { x: (p.x - frame.left) * frame.scale, y: (p.y - frame.top) * frame.scale }; }
export function unproject(p: Point, frame: CameraFrame): Point { return { x: p.x / frame.scale + frame.left, y: p.y / frame.scale + frame.top }; }
export function edgeIndicator(player: Point, target: Point, width: number, height: number, margin = 30): (Point & { angle: number }) | null {
  if (target.x >= margin && target.x <= width-margin && target.y >= margin && target.y <= height-margin) return null;
  const dx = target.x-player.x, dy = target.y-player.y;
  if (dx === 0 && dy === 0) return null;
  const tx = dx > 0 ? (width-margin-player.x)/dx : dx < 0 ? (margin-player.x)/dx : Infinity;
  const ty = dy > 0 ? (height-margin-player.y)/dy : dy < 0 ? (margin-player.y)/dy : Infinity;
  const t = Math.min(tx,ty);
  return { x: player.x+dx*t, y: player.y+dy*t, angle: Math.atan2(dy,dx)*180/Math.PI };
}

export function setupCamera(viewport: HTMLElement, world: HTMLElement, initialPlayer: Point) {
  world.style.width = `${MAP_WIDTH}px`; world.style.height = `${MAP_HEIGHT}px`;
  const toggle = document.createElement('button');
  toggle.id = 'camera-toggle'; toggle.className = 'hitbox-toggle camera-toggle'; toggle.type = 'button';
  document.querySelector('.panel-heading')!.append(toggle);
  const arrow = document.createElement('div');
  arrow.id = 'target-arrow'; arrow.className = 'target-arrow'; arrow.hidden = true;
  arrow.setAttribute('role','img');
  arrow.innerHTML = '<span class="direction-triangle"></span>';
  viewport.append(arrow);
  const caption = document.querySelector('.map-caption')!;
  let overview = new URLSearchParams(location.search).get('view') === 'overview';
  let player = initialPlayer, target: Point | undefined, targetName = '';
  let frame = cameraFrame(viewport.clientWidth, viewport.clientHeight, player, overview);
  function draw() {
    const width=viewport.clientWidth,height=viewport.clientHeight;
    if(!width||!height)return;
    frame=cameraFrame(width,height,player,overview);
    world.style.transform=`translate(${-frame.left*frame.scale}px, ${-frame.top*frame.scale}px) scale(${frame.scale})`;
    viewport.dataset.view=overview?'overview':'follow';
    toggle.textContent=overview?'返回角色視角 · M':'全船地圖 · M';
    toggle.setAttribute('aria-pressed',String(overview));
    caption.textContent=overview?'全船地圖':'角色跟隨視角';
    const hint=target&&!overview?edgeIndicator(project(player,frame),project(target,frame),width,height):null;
    arrow.hidden=!hint;
    if(hint){
      arrow.style.left=`${hint.x}px`;arrow.style.top=`${hint.y}px`;
      (arrow.firstElementChild as HTMLElement).style.transform=`rotate(${hint.angle}deg)`;
      arrow.setAttribute('aria-label',`故障方向：${targetName}`);
      arrow.title=`${targetName}在此方向，請沿船內通道前往`;
    }
  }
  function changeView(){overview=!overview;const url=new URL(location.href);if(overview)url.searchParams.set('view','overview');else url.searchParams.delete('view');history.replaceState(null,'',url);draw();}
  toggle.addEventListener('click',changeView);
  document.addEventListener('keydown',event=>{
    if(event.key.toLowerCase()!=='m'||event.repeat||(event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;
    event.preventDefault();changeView();
  });
  new ResizeObserver(draw).observe(viewport);
  draw();
  return {
    update(p:Point,t:Point|undefined,name=''){player=p;target=t;targetName=name;draw();},
    toWorld(p:Point){return unproject(p,frame);}
  };
}
