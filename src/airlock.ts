import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';

export type AirlockTaskId='colon'|'indent'|'branch'|'verify';
export const airlockTasks=[
  {id:'colon',name:'壓力判斷控制器',point:point(1535,920)},
  {id:'indent',name:'安全程式模組',point:point(1635,868)},
  {id:'branch',name:'正常壓力控制器',point:point(1730,850)},
  {id:'verify',name:'艙門安全測試台',point:point(1620,960)}
] as const;
export const airlockRadius=43*SCALE;
export const pressureCases=[120,100,80] as const;
export class AirlockState{
  repaired:Record<AirlockTaskId,boolean>={colon:false,indent:false,branch:false,verify:false};
  unlocked=false;
  get ready(){return this.repaired.colon&&this.repaired.indent&&this.repaired.branch;}
  get completed(){return this.ready&&this.repaired.verify;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){return airlockTasks.find(t=>!this.repaired[t.id])??airlockTasks[3];}
  blocked(id:AirlockTaskId){return id==='verify'&&!this.ready?'請先修好冒號、縮排與正常壓力指令，再進行安全測試。':null;}
  submit(id:AirlockTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已修復，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};
    const correct=id==='colon'?answer===':':id==='indent'?answer===4:id==='branch'?
      typeof answer==='string'&&/^[ \t]*print[ \t]*\([ \t]*(["'])OPEN\1[ \t]*\)[ \t]*(?:\r?\n)?$/.test(answer):
      Array.isArray(answer)&&answer.length===3&&answer.every((value,i)=>value===(pressureCases[i]>100?'LOCK':'OPEN'));
    if(!correct)return {success:false,message:{colon:'SyntaxError：if 條件結尾需要冒號 :，才能開始區塊。',indent:'IndentationError：請將 print() 向右縮排四個空格，放進 if 區塊。',branch:'壓力正常時應輸出 OPEN。請輸入完整 print() 指令，注意大小寫與引號。',verify:'壓力大於 100 kPa 才 LOCK；等於或小於 100 kPa 都 OPEN。請檢查三組測試，尤其是 100 的邊界。'}[id]};
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'三組壓力測試全部通過，可以解除封鎖。':'安全程式修復成功！',output:id==='verify'?['120 kPa → LOCK','100 kPa → OPEN','80 kPa → OPEN']:[id==='colon'?'LOCK':id==='indent'?'壓力過高':'OPEN']};
  }
}
