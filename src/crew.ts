import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';
export type CrewTaskId='lookup'|'level'|'safe'|'verify';
export const crewTasks=[
  {id:'lookup',name:'船員查詢終端',point:point(1030,375)},
  {id:'level',name:'授權等級讀取器',point:point(1260,370)},
  {id:'safe',name:'安全查詢控制器',point:point(1180,220)},
  {id:'verify',name:'維修授權驗證台',point:point(1260,440)}
] as const;
export const crewRadius=43*SCALE;
export const crewData={captain:{name:'Lin',level:3},engineer:{name:'Chen',level:2},medic:{name:'Wu',level:1}} as const;
export const crewRoles=['engineer','medic','pilot'] as const;
export function queryCrew(role:string):{name:string;level:number}|null{return Object.hasOwn(crewData,role)?crewData[role as keyof typeof crewData]:null;}
export function crewAccess(role:string,minimum:number){const info=queryCrew(role);return info!==null&&info.level>=minimum;}
export class CrewState{
  repaired:Record<CrewTaskId,boolean>={lookup:false,level:false,safe:false,verify:false};
  get ready(){return this.repaired.lookup&&this.repaired.level&&this.repaired.safe;}
  get completed(){return this.ready&&this.repaired.verify;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){return crewTasks.find(t=>!this.repaired[t.id])??crewTasks[3];}
  blocked(id:CrewTaskId){return id==='verify'&&!this.ready?'請先修復姓名查詢、授權等級與安全查詢，再驗證維修授權。':null;}
  submit(id:CrewTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已修復，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};
    let correct=false;
    if(id==='lookup'&&answer&&typeof answer==='object'){const value=answer as {role?:unknown;key?:unknown};correct=value.role==='engineer'&&typeof value.key==='string'&&value.key.trim()==='engineer';}
    else if(id==='level')correct=answer==='level';
    else if(id==='safe')correct=answer==='B';
    else if(id==='verify'&&answer&&typeof answer==='object'){
      const value=answer as {threshold?:unknown;decisions?:unknown},decisions=value.decisions;
      correct=typeof value.threshold==='string'&&value.threshold.trim()==='2'&&Array.isArray(decisions)&&decisions.length===3&&crewRoles.every((role,i)=>decisions[i]===(crewAccess(role,2)?'GRANTED':'DENIED'));
    }
    if(!correct)return {success:false,message:{lookup:'KeyError：pilot 不在這份字典裡。請從名單選擇工程師，再用正確的職位鍵讀取 name。',level:'授權等級儲存在 level 欄位，不是姓名 name。請選擇正確的內層字典鍵。',safe:'直接使用 crew["pilot"] 會發生 KeyError；get() 找不到鍵時回傳 None，查詢不會中斷。',verify:'最低授權等級是 2（包含 2）。工程師等級 2 可通過，醫護員等級 1 不足；pilot 不存在，應拒絕且不發生 KeyError。'}[id]};
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'維修授權驗證完成：工程師通過，醫護員與不存在的角色安全拒絕。':'船員資料設備修復成功！',output:id==='lookup'?['Chen']:id==='level'?['2']:id==='safe'?['None']:['engineer: ACCESS GRANTED','medic: ACCESS DENIED','pilot: ACCESS DENIED']};
  }
}
