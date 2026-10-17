import { point, SCALE } from './map';

export type AlarmTaskId = 'computer'|'light'|'broadcast'|'verify';
export const alarmTasks = [
  {id:'computer',name:'主控制電腦',kind:'指令修復',point:point(1620,169)},
  {id:'light',name:'紅色警報燈',kind:'符號填空',point:point(1500,234)},
  {id:'broadcast',name:'緊急廣播',kind:'修改訊息',point:point(1740,263)},
  {id:'verify',name:'警報啟動台',kind:'最終排序驗證',point:point(1620,371)}
] as const;
export const alarmRadius=58*SCALE;
export const bootOrder=['SYSTEM CHECK','RED LIGHT ON','SIREN ON'] as const;
export interface AlarmResult {success:boolean; message:string; output?:string[]}
export class AlarmState {
  repaired:Record<AlarmTaskId,boolean>={computer:false,light:false,broadcast:false,verify:false};
  get ready(){return this.repaired.computer&&this.repaired.light&&this.repaired.broadcast;}
  get completed(){return this.ready&&this.repaired.verify;}
  get next(){return alarmTasks.find(t=>!this.repaired[t.id])??alarmTasks[3];}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  submit(id:AlarmTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已經修復，不需要重複提交。'};
    if(id==='verify'&&!this.ready)return {success:false,message:'請先修好主控制電腦、紅色警報燈與緊急廣播。'};
    const correct=id==='computer'?answer==='A':id==='light'?answer==='"':id==='broadcast'?answer==='SIREN ON':Array.isArray(answer)&&answer.length===3&&bootOrder.every((line,i)=>answer[i]===line);
    if(!correct){
      const message={computer:'找不到正確的輸出指令。Python 會區分大小寫，請再檢查指令名稱。',light:'字串還沒有正確結束。請檢查文字前後的符號是否成對。',broadcast:'程式能執行，但廣播訊息仍不符要求。請讓輸出精確等於 SIREN ON。',verify:'啟動順序不正確。先確認系統，再啟動燈光，最後啟動廣播。'}[id];
      return {success:false,message};
    }
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'驗證成功，警報系統恢復運作！':'設備修復成功！',output:id==='verify'?[...bootOrder]:[bootOrder[id==='computer'?0:id==='light'?1:2]]};
  }
}
