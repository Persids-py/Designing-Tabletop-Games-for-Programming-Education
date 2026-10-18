import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';
export type CoolingTaskId='cause'|'drop'|'counter'|'verify';
export const coolingTasks=[
  {id:'cause',name:'冷卻迴圈診斷台',point:point(500,175)},
  {id:'drop',name:'降溫控制器',point:point(535,265)},
  {id:'counter',name:'循環計數器',point:point(520,365)},
  {id:'verify',name:'冷卻系統測試台',point:point(345,210)}
] as const;
export const coolingRadius=43*SCALE;
export const coolingTrace=[90,80,70,60] as const;
// 固定一次運算，絕不執行玩家輸入的 while 程式。
export function simulateCoolingStep(value:unknown):number|null{
  if(typeof value!=='string'&&typeof value!=='number')return null;
  if(typeof value==='string'&&!/^\d{1,3}$/.test(value.trim()))return null;
  const drop=Number(value);return Number.isInteger(drop)&&drop>=0&&drop<=100?100-drop:null;
}
export class CoolingState{
  repaired:Record<CoolingTaskId,boolean>={cause:false,drop:false,counter:false,verify:false};
  get ready(){return this.repaired.cause&&this.repaired.drop&&this.repaired.counter;}
  get completed(){return this.ready&&this.repaired.verify;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){return coolingTasks.find(t=>!this.repaired[t.id])??coolingTasks[3];}
  blocked(id:CoolingTaskId){return id==='verify'&&!this.ready?'請先完成迴圈原因、降溫與計數器修復，再執行完整冷卻。':null;}
  submit(id:CoolingTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已修復，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};
    const correct=id==='cause'?answer==='A':id==='drop'?simulateCoolingStep(answer)===90:id==='counter'?
      typeof answer==='string'&&/^[ \t]*cycles[ \t]*\+=[ \t]*1[ \t]*(?:\r?\n)?$/.test(answer):
      Array.isArray(answer)&&answer.length===6&&answer.every((v,i)=>typeof v==='string'&&/^\d{1,3}$/.test(v.trim())&&Number(v)===[...coolingTrace,4,60][i]);
    if(!correct)return {success:false,message:{cause:'溫度變數沒有在迴圈中改變，條件會一直成立。請檢查哪一項說明符合程式。',drop:'規範要求每次降溫 10°C。請觀察單次模擬，100°C 應降到 90°C；填 0 不會讓迴圈結束。',counter:'計數器應每次增加 1。請填完整 cycles += 1；賦值、減法與比較都不會正確累計。',verify:'請從 100°C 開始，每輪先減 10 再輸出並累計。降到 60 時，temperature > 60 已不成立；請檢查四次輸出、次數與結束溫度。'}[id]};
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'冷卻測試通過：迴圈自行停止，溫度 60°C，循環 4 次。':'冷卻設備修復成功！',output:id==='cause'?['已定位：while 區塊內缺少 temperature 更新']:id==='drop'?['單次模擬：100°C → 90°C']:id==='counter'?['cycles：0 → 1']:['90','80','70','60','循環次數: 4','結束溫度: 60°C']};
  }
}
