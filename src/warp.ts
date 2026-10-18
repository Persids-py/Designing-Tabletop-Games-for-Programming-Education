import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';
export type WarpTaskId='nav'|'manual'|'logic'|'verify';
export type WarpSystems={fuel:boolean;nav:boolean;engine:boolean;radar:boolean;manual:boolean};
export const warpTasks=[
  {id:'nav',name:'導航控制器',point:point(310,430)},
  {id:'manual',name:'人工授權台',point:point(495,480)},
  {id:'logic',name:'躍遷邏輯控制器',point:point(485,630)},
  {id:'verify',name:'最終躍遷啟動台',point:point(260,650)}
] as const;
export const warpRadius=43*SCALE;
export const systemKeys=['fuel','nav','engine','radar','manual'] as const;
export const systemNames={fuel:'燃料充足',nav:'導航就緒',engine:'主引擎正常',radar:'雷達正常',manual:'取得人工授權'};
export const warpCases:readonly {name:string;systems:WarpSystems}[]=[
  {name:'A 正常啟動',systems:{fuel:true,nav:true,engine:true,radar:true,manual:false}},
  {name:'B 導航未就緒',systems:{fuel:true,nav:false,engine:true,radar:true,manual:true}},
  {name:'C 人工授權',systems:{fuel:true,nav:true,engine:true,radar:false,manual:true}},
  {name:'D 引擎異常',systems:{fuel:true,nav:true,engine:false,radar:true,manual:true}}
];
export function warpReady(s:WarpSystems){return s.fuel&&s.nav&&s.engine&&(s.radar||s.manual);}
export class WarpState{
  repaired:Record<WarpTaskId,boolean>={nav:false,manual:false,logic:false,verify:false};
  systems:WarpSystems={fuel:true,nav:false,engine:true,radar:false,manual:true};
  checked=false;launching=false;countdown=0;launched=false;
  get ready(){return this.repaired.nav&&this.repaired.manual&&this.repaired.logic;}
  get tested(){return this.ready&&this.repaired.verify;}
  get completed(){return this.tested&&this.checked&&warpReady(this.systems)&&this.launched;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){if(this.tested&&!this.systems.nav)return warpTasks[0];return warpTasks.find(t=>!this.repaired[t.id])??warpTasks[3];}
  blocked(id:WarpTaskId){return id==='verify'&&!this.ready?'請先修復導航鍵、人工授權與啟動邏輯，再進行安全測試。':null;}
  submit(id:WarpTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這項修復已完成，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};let correct=false;
    if(id==='nav')correct=typeof answer==='string'&&answer.trim()==='nav';
    else if(id==='manual'&&answer&&typeof answer==='object'){
      const value=answer as {reason?:unknown;code?:unknown};
      correct=value.reason==='A'&&typeof value.code==='string'&&['manual_override=(manual_status=="ON")',"manual_override=(manual_status=='ON')",'manual_override=manual_status=="ON"',"manual_override=manual_status=='ON'"].includes(value.code.trim().replace(/[ \t]/g,''));
    }else if(id==='logic')correct=Array.isArray(answer)&&answer.length===4&&['and','and','and','or'].every((op,i)=>answer[i]===op);
    else if(id==='verify')correct=Array.isArray(answer)&&answer.length===4&&warpCases.every((test,i)=>answer[i]===(warpReady(test.systems)?'ALLOW':'LOCK'));
    if(!correct)return {success:false,message:{nav:'KeyError：navigation 不存在。請查看五項系統的字典鍵，改用 nav；目前讀取結果仍為 False。',manual:'非空字串 "OFF" 轉為 bool 也會是 True。請選原因 A，並將第二行改為 manual_override = (manual_status == "ON")。',logic:'燃料、導航、主引擎三者必須全部成立，再加上（雷達正常 or 人工授權）。請檢查三個 and 與括號內的 or。',verify:'請依完整安全規則判斷：A 允許、B 禁止、C 允許、D 禁止；人工授權不能取代導航、燃料或主引擎。'}[id]};
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'四組安全測試通過。請檢查實際狀態，先完成導航準備，再啟動躍遷。':'躍遷設備修復成功！',output:id==='nav'?['False（查詢已修復，導航尚未就緒）']:id==='manual'?['ON → True','OFF → False']:id==='logic'?['fuel and nav and engine and (radar or manual)']:['A: WARP READY','B: WARP LOCKED','C: WARP READY','D: WARP LOCKED']};
  }
  prepareNavigation(){if(!this.tested||this.systems.nav||this.launching||this.launched)return false;this.systems.nav=true;this.checked=false;return true;}
  checkActual(){this.checked=this.tested&&warpReady(this.systems);return this.checked;}
  start(){if(!this.tested||!this.checked||!warpReady(this.systems)||this.launching||this.launched)return false;this.launching=true;this.countdown=3;return true;}
  tick(){if(!this.launching)return false;if(!warpReady(this.systems)||!this.checked){this.checked=false;this.cancel();return false;}this.countdown--;if(this.countdown===0){this.launching=false;this.launched=true;}return this.launched;}
  cancel(){this.launching=false;this.countdown=0;}
}
