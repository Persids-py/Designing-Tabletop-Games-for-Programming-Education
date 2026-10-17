import type { Point } from './map';

// 手繪 SVG 船員；碰撞錨點維持在腳底，不以美術外框取代走行碰撞。
export function setupCharacter(root: HTMLElement, initial: Point) {
  root.innerHTML = `
    <ellipse class="crew-shadow" cy="2" rx="19" ry="6" fill="#000" opacity=".3"/>
    <g id="crew-facing" data-facing="right">
      <g id="crew-bob" stroke="#251c2b" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
        <path d="M-14-37 H-23 Q-27-37-27-32 V-13 Q-27-8-22-8 H-14 Z" fill="#8e203b"/>
        <path d="M-24-31 V-15" stroke="#e85564" stroke-width="2.5"/>
        <g id="crew-leg-back"><path d="M-15-17 H-2 V-1 Q-2 3-6 3 H-13 Q-17 3-17-1 Z" fill="#991e39"/></g>
        <g id="crew-leg-front"><path d="M4-17 H17 V-1 Q17 3 13 3 H6 Q2 3 2-1 Z" fill="#d92b43"/></g>
        <path d="M-17-13 V-36 Q-17-57 2-57 Q20-57 20-38 V-13 Q20-8 14-8 H-10 Q-17-8-17-13 Z" fill="#d92b43"/>
        <path d="M-15-36 Q-13-49-6-51 L-6-15 Q-6-11 4-10 H-11 Q-15-10-15-14 Z" fill="#ab203d" stroke="none"/>
        <path d="M-7-52 Q3-56 12-50" fill="none" stroke="#f86a70" stroke-width="3"/>
        <path d="M0-43 Q7-46 20-43 Q27-41 26-34 Q25-26 17-25 L2-26 Q-5-27-5-34 Q-5-41 0-43 Z" fill="#84b8d0"/>
        <path d="M-1-33 Q8-28 24-33 Q22-26 16-27 L2-28 Q-1-28-1-33 Z" fill="#4c819e" stroke="none"/>
        <path d="M1-40 Q10-43 19-40 L19-36 Q10-34 0-36 Z" fill="#d7f5ff" stroke="none"/>
      </g>
    </g>`;
  const facing = root.querySelector<SVGGElement>('#crew-facing')!;
  const bob = root.querySelector<SVGGElement>('#crew-bob')!;
  const back = root.querySelector<SVGGElement>('#crew-leg-back')!;
  const front = root.querySelector<SVGGElement>('#crew-leg-front')!;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let previous = { ...initial }, phase = 0, direction = 1;
  return (p: Point) => {
    const dx = p.x-previous.x, dy = p.y-previous.y, distance = Math.hypot(dx,dy);
    const moving = distance > .01 && distance < 100;
    if (distance >= 100) { phase = 0; direction = 1; }
    if (moving && Math.abs(dx) > .01) direction = dx < 0 ? -1 : 1;
    if (moving) phase += distance / 10;
    const stride = moving && !reduceMotion.matches ? Math.sin(phase) : 0;
    root.dataset.motion = moving ? 'walking' : 'idle';
    facing.dataset.facing = direction === 1 ? 'right' : 'left';
    facing.setAttribute('transform', `scale(${direction} 1)`);
    bob.setAttribute('transform', `translate(0 ${-Math.abs(stride)*2})`);
    back.setAttribute('transform', `rotate(${-stride*19} -8 -14) translate(0 ${Math.max(0,stride)*-2})`);
    front.setAttribute('transform', `rotate(${stride*19} 9 -14) translate(0 ${Math.max(0,-stride)*-2})`);
    previous = { ...p };
  };
}
