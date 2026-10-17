import { point, spawn, SCALE, type Point } from './map';
import {AlarmState,alarmTasks,alarmRadius,type AlarmTaskId,type AlarmResult} from './alarm';
import {GeneratorState,generatorTasks,generatorRadius,type GeneratorTaskId} from './generator';
export interface Level {
  id: string; roomName: string; repairTheme: string; concept: string;
  interactionPoint: Point; interactionRadius: number;
  challengeType: 'placeholder'|'choice'|'fill'|'matching'|'blocks'|'alarm'|'generator'; challengeConfig: null;
}
const definitions: [string,string,string,number,number][] = [
  ['警報燈光室','警報燈光控制器','基礎語法與輸出',1620,169],
  ['發電機室','發電機電壓設定','變數與賦值',1400,775],
  ['維生系統室','維生系統能量計算','資料型態與轉型',746,237],
  ['氣閘艙','氣閘艙壓力檢測','條件判斷',1594,925],
  ['引擎冷凝室','引擎冷凝液循環','迴圈控制',520,298],
  ['副推進器室','副推進器運算模組','函式設計與回傳',761,866],
  ['資材庫存室','資材庫存探測器','陣列與串列',1205,905],
  ['船員資料庫','船員身分辨識資料庫','字典結構',1260,389],
  ['雷達測量室','雷達距離測量儀','例外處理',1894,566],
  ['主躍遷引擎','主躍遷引擎啟動邏輯','綜合邏輯',480,570]
];
export const levels: Level[] = definitions.map(([roomName,repairTheme,concept,x,y],i)=>({id:`room-${i+1}`,roomName,repairTheme,concept,interactionPoint:point(x,y),interactionRadius:65*SCALE,challengeType:i===0?'alarm':i===1?'generator':'placeholder',challengeConfig:null}));
export class Game {
  index=0;
  player={...spawn};
  opened: string|null=null;
  alarm=new AlarmState();
  alarmTask:AlarmTaskId|null=null;
  generator=new GeneratorState();
  generatorTask:GeneratorTaskId|null=null;
  get completed() { return this.index===levels.length; }
  get current() { return levels[this.index]; }
  get navigation(){
    if(this.index===0)return {point:this.alarm.next.point,name:this.alarm.next.name,radius:alarmRadius};
    if(this.index===1)return {point:this.generator.next.point,name:this.generator.next.name,radius:generatorRadius};
    return this.current?{point:this.current.interactionPoint,name:this.current.roomName,radius:this.current.interactionRadius}:undefined;
  }
  get nearTarget(){const target=this.navigation;return !!target&&Math.hypot(this.player.x-target.point.x,this.player.y-target.point.y)<=target.radius;}
  near(level: Level) { return Math.hypot(this.player.x-level.interactionPoint.x,this.player.y-level.interactionPoint.y)<=level.interactionRadius; }
  open(id: string): string|null {
    if(id===levels[0].id&&this.index===0)return this.openAlarm(this.alarm.next.id);
    if(id===levels[1].id&&this.index===1)return this.openGenerator(this.generator.next.id);
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
  close() { this.opened=null;this.alarmTask=null;this.generatorTask=null; }
  repair(id: string): boolean {
    if(this.completed || this.opened!==id || this.current.id!==id) return false;
    if(this.index===0){
      const console=alarmTasks[3];
      if(!this.alarm.completed||this.alarmTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>alarmRadius)return false;
    }else if(this.index===1){
      const console=generatorTasks[3];
      if(!this.generator.completed||this.generatorTask!=='verify'||Math.hypot(this.player.x-console.point.x,this.player.y-console.point.y)>generatorRadius)return false;
    }else if(!this.near(this.current))return false;
    this.close(); this.index++; return true;
  }
  reset() { this.index=0; this.player={...spawn}; this.close();this.alarm=new AlarmState();this.generator=new GeneratorState(); }
}
