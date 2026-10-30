import {alarmTasks,alarmRadius} from './alarm';
import type {Point} from './map';

export const tutorialTarget=alarmTasks[0];
export const movementLines=[
  '「維修工程師，現在請嘗試移動你的角色。」',
  '「使用鍵盤上的 W、A、S、D，可以控制角色在太空船內自由移動。」',
  '「請沿著走廊前進，前往地圖上標示的故障設備。」'
] as const;
export const foundLines=[
  '「偵測到故障設備！」',
  '「這台設備的控制程式似乎受到電磁風暴影響，部分指令已經損壞。」',
  '「別擔心，你只需要找出程式中的錯誤，並依照提示進行修正，就有機會讓設備重新運作。」',
  '「現在，讓我們開始你的第一項維修任務吧！」'
] as const;
export class MovementTutorialState{
  phase:'pending'|'intro'|'moving'|'found'|'ready'|'entered'='pending';
  near(p:Point){return Math.hypot(p.x-tutorialTarget.point.x,p.y-tutorialTarget.point.y)<=alarmRadius;}
  start(){if(this.phase!=='pending')return false;this.phase='intro';return true;}
  move(){if(this.phase==='intro')this.phase='moving';}
  arrive(p:Point,active:boolean){if(this.phase!=='moving'||!active||!this.near(p))return false;this.phase='found';return true;}
  dismiss(){if(this.phase==='found')this.phase='ready';}
  resume(p:Point,active:boolean){if(this.phase!=='ready'||!active||!this.near(p))return false;this.phase='found';return true;}
  enter(opened:boolean){if(this.phase!=='found'||!opened)return false;this.phase='entered';return true;}
  reset(){this.phase='pending';}
}
