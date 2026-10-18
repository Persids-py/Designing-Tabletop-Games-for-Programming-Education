import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';
export type BoosterTaskId='declaration'|'formula'|'return'|'verify';
export const boosterTasks=[
  {id:'declaration',name:'函式啟動控制器',point:point(500,740)},
  {id:'formula',name:'推力公式模組',point:point(760,755)},
  {id:'return',name:'推力回傳控制器',point:point(760,875)},
  {id:'verify',name:'三段式推力測試台',point:point(560,875)}
] as const;
export const boosterRadius=43*SCALE;
export const boosterSpeeds=[0,10,20] as const;
export class BoosterState{
  repaired:Record<BoosterTaskId,boolean>={declaration:false,formula:false,return:false,verify:false};
  testOutputs:number[]=[];
  get ready(){return this.repaired.declaration&&this.repaired.formula&&this.repaired.return;}
  get completed(){return this.ready&&this.repaired.verify;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){return boosterTasks.find(t=>!this.repaired[t.id])??boosterTasks[3];}
  blocked(id:BoosterTaskId){return id==='verify'&&!this.ready?'請先修復函式宣告、推力公式與回傳，再進行三段式測試。':null;}
  submit(id:BoosterTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已修復，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};
    const correct=id==='declaration'?answer===':':id==='formula'?answer==='*':id==='return'?
      typeof answer==='string'&&/^[ \t]*return[ \t]+power[ \t]*(?:\r?\n)?$/.test(answer):
      typeof answer==='string'&&/^\d{1,3}$/.test(answer.trim())&&Number(answer)===boosterSpeeds[this.testOutputs.length]*3;
    if(!correct)return {success:false,message:{declaration:'SyntaxError：def 函式宣告結尾需要冒號 :，才能開始函式區塊。',formula:'推力應為 speed 的 3 倍。請選擇正確運算子，讓速度 20 得到推力 60。',return:'print(power) 只顯示數字，不會回傳結果，thrust 仍會得到 None。請改為 return power。',verify:'本次輸出不正確。請將目前的 speed 代入 speed * 3，並注意速度為 0 時的結果。'}[id]};
    if(id==='verify'){
      const speed=boosterSpeeds[this.testOutputs.length],power=speed*3;this.testOutputs.push(power);
      if(this.testOutputs.length===3)this.repaired.verify=true;
      return {success:true,message:this.completed?'三組推力測試全部通過，副推進器恢復動力！':`速度 ${speed} 測試通過，推力 ${power}。繼續測試下一個模式。`,output:[String(power)]};
    }
    this.repaired[id]=true;
    return {success:true,message:'推進器設備修復成功！',output:id==='declaration'?['函式宣告成立']:id==='formula'?['booster_power(20) → 60']:['thrust = 60']};
  }
}
