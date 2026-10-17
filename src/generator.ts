import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';

export type GeneratorTaskId='main'|'backup'|'display'|'verify';
export const generatorTasks=[
  {id:'main',name:'主發電機',point:point(1400,775)},
  {id:'backup',name:'備用發電機',point:point(1550,790)},
  {id:'display',name:'電壓顯示器',point:point(1300,660)},
  {id:'verify',name:'供電測試台',point:point(1480,828)}
] as const;
export const generatorRadius=58*SCALE;
export const assignmentOrder=['target_voltage','=','220'] as const;
export class GeneratorState{
  repaired:Record<GeneratorTaskId,boolean>={main:false,backup:false,display:false,verify:false};
  get mainVoltage(){return this.repaired.main?220:null;}
  get backupVoltage(){return this.repaired.backup?110:null;}
  get ready(){return this.repaired.main&&this.repaired.backup&&this.repaired.display;}
  get completed(){return this.ready&&this.repaired.verify;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){return generatorTasks.find(t=>!this.repaired[t.id])??generatorTasks[3];}
  blocked(id:GeneratorTaskId):string|null{
    if(id==='display'&&!this.repaired.main)return '請先設定主發電機電壓，再修復電壓顯示器。';
    if(id==='verify'&&!this.ready)return '請先完成三項設備維修，再執行供電測試。';
    return null;
  }
  submit(id:GeneratorTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已修復，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};
    const correct=id==='main'?Array.isArray(answer)&&answer.length===3&&assignmentOrder.every((token,i)=>answer[i]===token):id==='backup'?typeof answer==='string'&&answer.trim()==='backup_voltage':id==='display'?typeof answer==='string'&&/^[ \t]*print[ \t]*\([ \t]*target_voltage[ \t]*\)[ \t]*(?:\r?\n)?$/.test(answer):answer==='B'&&this.mainVoltage===220&&this.backupVoltage===110;
    if(!correct){
      const message={main:'賦值方向仍然不正確。等號左邊放變數名稱，右邊放要存入的數值。',backup:'NameError：定義與讀取的變數名稱仍不一致。請對照第二行的名稱修正第一行。',display:'電壓表還沒有讀到數值。引號內是文字，請讓 print 讀取變數本身。',verify:'預測結果不符。主電壓被再次賦值後，會保留最後一次設定的數值；備用電壓沒有改變。'}[id];
      return {success:false,message};
    }
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'供電測試通過，發電機室恢復運作！':'設備修復成功！',output:id==='main'?['target_voltage = 220','主發電機：220V']:id==='backup'?['110','備用發電機：110V']:id==='display'?['220']:['220','110']};
  }
}
