import { point, spawn, SCALE, type Point } from './map';
import {AlarmState,alarmTasks,alarmRadius,type AlarmTaskId,type AlarmResult} from './alarm';
import {GeneratorState,generatorTasks,generatorRadius,type GeneratorTaskId} from './generator';
import {LifeSupportState,lifeSupportTasks,lifeSupportRadius,type LifeSupportTaskId} from './life-support';
import {AirlockState,airlockTasks,airlockRadius,type AirlockTaskId} from './airlock';
import {CoolingState,coolingTasks,coolingRadius,type CoolingTaskId} from './cooling';
import {BoosterState,boosterTasks,boosterRadius,type BoosterTaskId} from './booster';
import {CargoState,cargoTasks,cargoRadius,type CargoTaskId} from './cargo';
import {CrewState,crewTasks,crewRadius,type CrewTaskId} from './crew';
import {RadarState,radarTasks,radarRadius,type RadarTaskId} from './radar';
import {WarpState,warpTasks,warpRadius,type WarpTaskId} from './warp';
export interface Level {
  id: string; roomName: string; repairTheme: string; concept: string;
  interactionPoint: Point; interactionRadius: number;
  challengeType: 'placeholder'|'choice'|'fill'|'matching'|'blocks'|'alarm'|'generator'|'life-support'|'airlock'|'cooling'|'booster'|'cargo'|'crew'|'radar'|'warp'; challengeConfig: null;
}
const definitions: [string,string,string,number,number][] = [
  ['警報燈光室','警報燈光控制器','基礎語法與輸出',1620,169],
  ['發電機室','發電機電壓設定','變數與賦值',1400,775],
  ['維生系統室','維生系統能量計算','資料型態與轉型',643,180],
  ['氣閘艙','氣閘艙壓力檢測','條件判斷',1535,920],
  ['引擎冷凝室','引擎冷凝液循環','迴圈控制',500,175],
  ['副推進器室','副推進器運算模組','函式設計與回傳',500,740],
  ['資材庫存室','資材庫存探測器','陣列與串列',1135,720],
  ['船員資料庫','船員身分辨識資料庫','字典結構',1030,375],
  ['雷達測量室','雷達距離測量儀','例外處理',1780,475],
  ['主躍遷引擎','主躍遷引擎啟動邏輯','綜合邏輯',310,430]
];
export const levels: Level[] = definitions.map(([roomName,repairTheme,concept,x,y],i)=>({id:`room-${i+1}`,roomName,repairTheme,concept,interactionPoint:point(x,y),interactionRadius:65*SCALE,challengeType:i===0?'alarm':i===1?'generator':i===2?'life-support':i===3?'airlock':i===4?'cooling':i===5?'booster':i===6?'cargo':i===7?'crew':i===8?'radar':'warp',challengeConfig:null}));
export class Game {
  index=0;
  player={...spawn};
  opened: string|null=null;
  alarm=new AlarmState();
  alarmTask:AlarmTaskId|null=null;
  generator=new GeneratorState();
  generatorTask:GeneratorTaskId|null=null;
  lifeSupport=new LifeSupportState();
  lifeSupportTask:LifeSupportTaskId|null=null;
  airlock=new AirlockState();
  airlockTask:AirlockTaskId|null=null;
  cooling=new CoolingState();
  coolingTask:CoolingTaskId|null=null;
  booster=new BoosterState();
  boosterTask:BoosterTaskId|null=null;
  cargo=new CargoState();
  cargoTask:CargoTaskId|null=null;
  crew=new CrewState();
  crewTask:CrewTaskId|null=null;
  radar=new RadarState();
  radarTask:RadarTaskId|null=null;
  warp=new WarpState();
  warpTask:WarpTaskId|null=null;
  get completed() { return this.index===levels.length; }
  get current() { return levels[this.index]; }
  get navigation(){
    if(this.index===0)return {point:this.alarm.next.point,name:this.alarm.next.name,radius:alarmRadius};
    if(this.index===1)return {point:this.generator.next.point,name:this.generator.next.name,radius:generatorRadius};
    if(this.index===2)return {point:this.lifeSupport.next.point,name:this.lifeSupport.next.name,radius:lifeSupportRadius};
    if(this.index===3)return {point:this.airlock.next.point,name:this.airlock.next.name,radius:airlockRadius};
    if(this.index===4)return {point:this.cooling.next.point,name:this.cooling.next.name,radius:coolingRadius};
    if(this.index===5)return {point:this.booster.next.point,name:this.booster.next.name,radius:boosterRadius};
    if(this.index===6)return {point:this.cargo.next.point,name:this.cargo.next.name,radius:cargoRadius};
    if(this.index===7)return {point:this.crew.next.point,name:this.crew.next.name,radius:crewRadius};
    if(this.index===8)return {point:this.radar.next.point,name:this.radar.next.name,radius:radarRadius};
    if(this.index===9)return {point:this.warp.next.point,name:this.warp.next.name,radius:warpRadius};
    return this.current?{point:this.current.interactionPoint,name:this.current.roomName,radius:this.current.interactionRadius}:undefined;
  }
  get nearTarget(){const target=this.navigation;return !!target&&Math.hypot(this.player.x-target.point.x,this.player.y-target.point.y)<=target.radius;}
  near(level: Level) { return Math.hypot(this.player.x-level.interactionPoint.x,this.player.y-level.interactionPoint.y)<=level.interactionRadius; }
  open(id: string): string|null {
    if(id===levels[0].id&&this.index===0)return this.openAlarm(this.alarm.next.id);
    if(id===levels[1].id&&this.index===1)return this.openGenerator(this.generator.next.id);
    if(id===levels[2].id&&this.index===2)return this.openLifeSupport(this.lifeSupport.next.id);
    if(id===levels[3].id&&this.index===3)return this.openAirlock(this.airlock.next.id);
    if(id===levels[4].id&&this.index===4)return this.openCooling(this.cooling.next.id);
    if(id===levels[5].id&&this.index===5)return this.openBooster(this.booster.next.id);
    if(id===levels[6].id&&this.index===6)return this.openCargo(this.cargo.next.id);
    if(id===levels[7].id&&this.index===7)return this.openCrew(this.crew.next.id);
    if(id===levels[8].id&&this.index===8)return this.openRadar(this.radar.next.id);
    if(id===levels[9].id&&this.index===9)return this.openWarp(this.warp.next.id);
    const i=levels.findIndex(l=>l.id===id);
    if(i<0) return '找不到維修點';
    if(i<this.index) return '這個系統已修復';
    if(i!==this.index || this.completed) return '請依照目前的任務順序維修';
    if(!this.near(levels[i])) return '請先靠近故障點，再點擊開啟';
    this.opened=id;
    return null;
  }
  openAlarm(id:AlarmTaskId):string|null{
    const task=alarmTasks.find(t=>t.id===id);
    if(this.index!==0||!task)return '目前沒有這個設備的維修任務';
    if(id==='verify'&&!this.alarm.ready)return '請先完成三個設備維修，再啟動最終驗證';
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>alarmRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[0].id;this.alarmTask=id;return null;
  }
  submitAlarm(id:AlarmTaskId,answer:unknown):AlarmResult{
    const task=alarmTasks.find(t=>t.id===id);
    if(this.index!==0||this.opened!==levels[0].id||this.alarmTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>alarmRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.alarm.submit(id,answer);
  }
  openGenerator(id:GeneratorTaskId):string|null{
    const task=generatorTasks.find(t=>t.id===id);
    if(this.index!==1||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.generator.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>generatorRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[1].id;this.generatorTask=id;return null;
  }
  submitGenerator(id:GeneratorTaskId,answer:unknown):AlarmResult{
    const task=generatorTasks.find(t=>t.id===id);
    if(this.index!==1||this.opened!==levels[1].id||this.generatorTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>generatorRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.generator.submit(id,answer);
  }
  openLifeSupport(id:LifeSupportTaskId):string|null{
    const task=lifeSupportTasks.find(t=>t.id===id);
    if(this.index!==2||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.lifeSupport.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>lifeSupportRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[2].id;this.lifeSupportTask=id;return null;
  }
  submitLifeSupport(id:LifeSupportTaskId,answer:unknown):AlarmResult{
    const task=lifeSupportTasks.find(t=>t.id===id);
    if(this.index!==2||this.opened!==levels[2].id||this.lifeSupportTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>lifeSupportRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.lifeSupport.submit(id,answer);
  }
  openAirlock(id:AirlockTaskId):string|null{
    const task=airlockTasks.find(t=>t.id===id);
    if(this.index!==3||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.airlock.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>airlockRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[3].id;this.airlockTask=id;return null;
  }
  submitAirlock(id:AirlockTaskId,answer:unknown):AlarmResult{
    const task=airlockTasks.find(t=>t.id===id);
    if(this.index!==3||this.opened!==levels[3].id||this.airlockTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>airlockRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.airlock.submit(id,answer);
  }
  openCooling(id:CoolingTaskId):string|null{
    const task=coolingTasks.find(t=>t.id===id);
    if(this.index!==4||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.cooling.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>coolingRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[4].id;this.coolingTask=id;return null;
  }
  submitCooling(id:CoolingTaskId,answer:unknown):AlarmResult{
    const task=coolingTasks.find(t=>t.id===id);
    if(this.index!==4||this.opened!==levels[4].id||this.coolingTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>coolingRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.cooling.submit(id,answer);
  }
  openBooster(id:BoosterTaskId):string|null{
    const task=boosterTasks.find(t=>t.id===id);
    if(this.index!==5||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.booster.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>boosterRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[5].id;this.boosterTask=id;return null;
  }
  submitBooster(id:BoosterTaskId,answer:unknown):AlarmResult{
    const task=boosterTasks.find(t=>t.id===id);
    if(this.index!==5||this.opened!==levels[5].id||this.boosterTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>boosterRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.booster.submit(id,answer);
  }
  openCargo(id:CargoTaskId):string|null{
    const task=cargoTasks.find(t=>t.id===id);
    if(this.index!==6||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.cargo.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>cargoRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[6].id;this.cargoTask=id;return null;
  }
  submitCargo(id:CargoTaskId,answer:unknown):AlarmResult{
    const task=cargoTasks.find(t=>t.id===id);
    if(this.index!==6||this.opened!==levels[6].id||this.cargoTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>cargoRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.cargo.submit(id,answer);
  }
  openCrew(id:CrewTaskId):string|null{
    const task=crewTasks.find(t=>t.id===id);
    if(this.index!==7||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.crew.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>crewRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[7].id;this.crewTask=id;return null;
  }
  submitCrew(id:CrewTaskId,answer:unknown):AlarmResult{
    const task=crewTasks.find(t=>t.id===id);
    if(this.index!==7||this.opened!==levels[7].id||this.crewTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>crewRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.crew.submit(id,answer);
  }
  openRadar(id:RadarTaskId):string|null{
    const task=radarTasks.find(t=>t.id===id);
    if(this.index!==8||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.radar.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>radarRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[8].id;this.radarTask=id;return null;
  }
  submitRadar(id:RadarTaskId,answer:unknown):AlarmResult{
    const task=radarTasks.find(t=>t.id===id);
    if(this.index!==8||this.opened!==levels[8].id||this.radarTask!==id||!task||Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>radarRadius)return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.radar.submit(id,answer);
  }
  openWarp(id:WarpTaskId):string|null{
    const task=warpTasks.find(t=>t.id===id);
    if(this.index!==9||!task)return '目前沒有這個設備的維修任務';
    const blocked=this.warp.blocked(id);if(blocked)return blocked;
    if(Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)>warpRadius)return '請先靠近故障點，再點擊開啟';
    this.opened=levels[9].id;this.warpTask=id;return null;
  }
  private warpControl(id:WarpTaskId){const task=warpTasks.find(t=>t.id===id)!;return this.index===9&&this.opened===levels[9].id&&this.warpTask===id&&Math.hypot(this.player.x-task.point.x,this.player.y-task.point.y)<=warpRadius;}
  submitWarp(id:WarpTaskId,answer:unknown):AlarmResult{
    if(!warpTasks.some(t=>t.id===id)||!this.warpControl(id))return {success:false,message:'請先抵達設備並開啟維修面板。'};
    return this.warp.submit(id,answer);
  }
  prepareWarpNavigation(){return this.warpControl('nav')&&this.warp.prepareNavigation();}
  checkWarpActual(){return this.warpControl('verify')&&this.warp.checkActual();}
  startWarp(){return this.warpControl('verify')&&this.warp.start();}
  tickWarp(){if(!this.warpControl('verify')){this.warp.cancel();return false;}return this.warp.tick();}
  close() { if(this.warp.launching)this.warp.cancel(); this.opened=null;this.alarmTask=null;this.generatorTask=null;this.lifeSupportTask=null;this.airlockTask=null;this.coolingTask=null;this.boosterTask=null;this.cargoTask=null;this.crewTask=null;this.radarTask=null;this.warpTask=null; }
  repair(id: string): boolean {
    if(this.completed || this.opened!==id || this.current.id!==id) return false;
    if(this.index===0){
      const console=alarmTasks[3];
      if(!this.alarm.completed||this.alarmTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>alarmRadius)return false;
    }else if(this.index===1){
      const console=generatorTasks[3];
      if(!this.generator.completed||this.generatorTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>generatorRadius)return false;
    }else if(this.index===2){
      const console=lifeSupportTasks[3];
      if(!this.lifeSupport.completed||this.lifeSupportTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>lifeSupportRadius)return false;
    }else if(this.index===3){
      const console=airlockTasks[3];
      if(!this.airlock.completed||this.airlockTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>airlockRadius)return false;
      this.airlock.unlocked=true;
    }else if(this.index===4){
      const console=coolingTasks[3];
      if(!this.cooling.completed||this.coolingTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>coolingRadius)return false;
    }else if(this.index===5){
      const console=boosterTasks[3];
      if(!this.booster.completed||this.boosterTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>boosterRadius)return false;
    }else if(this.index===6){
      const console=cargoTasks[3];
      if(!this.cargo.completed||this.cargoTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>cargoRadius)return false;
    }else if(this.index===7){
      const console=crewTasks[3];
      if(!this.crew.completed||this.crewTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>crewRadius)return false;
    }else if(this.index===8){
      const console=radarTasks[3];
      if(!this.radar.completed||this.radarTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>radarRadius)return false;
    }else if(this.index===9){
      if(!this.warp.completed||!this.warpControl('verify'))return false;
    }else if(!this.near(this.current))return false;
    this.close(); this.index++; return true;
  }
  reset() { this.index=0; this.player={...spawn}; this.close();this.alarm=new AlarmState();this.generator=new GeneratorState();this.lifeSupport=new LifeSupportState();this.airlock=new AirlockState();this.cooling=new CoolingState();this.booster=new BoosterState();this.cargo=new CargoState();this.crew=new CrewState();this.radar=new RadarState();this.warp=new WarpState(); }
}
