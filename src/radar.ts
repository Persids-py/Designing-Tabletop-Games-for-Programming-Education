import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';
export type RadarTaskId='error'|'blocks'|'sum'|'verify';
export const radarTasks=[
  {id:'error',name:'雷達異常分析器',point:point(1780,475)},
  {id:'blocks',name:'例外處理控制器',point:point(1870,520)},
  {id:'sum',name:'有效訊號分析台',point:point(1900,600)},
  {id:'verify',name:'完整雷達診斷台',point:point(1780,640)}
] as const;
export const radarRadius=43*SCALE;
export const radarSignals=['15','雜訊','25','?','10'] as const;
export const noiseSignals=['ERR','?'] as const;
// 固定資料的有限次數模擬；不執行玩家輸入的 Python。
export function summarizeSignals(signals:readonly string[]){
  let total=0,errors=0;const valid:boolean[]=[];
  for(const signal of signals){const value=/^[+-]?\d+$/.test(signal.trim())?Number(signal):NaN,ok=Number.isSafeInteger(value);valid.push(ok);if(ok)total+=value;else errors++;}
  return {total,errors,valid};
}
export class RadarState{
  repaired:Record<RadarTaskId,boolean>={error:false,blocks:false,sum:false,verify:false};
  get ready(){return this.repaired.error&&this.repaired.blocks&&this.repaired.sum;}
  get completed(){return this.ready&&this.repaired.verify;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){return radarTasks.find(t=>!this.repaired[t.id])??radarTasks[3];}
  blocked(id:RadarTaskId){return id==='verify'&&!this.ready?'請先完成錯誤分析、例外積木與有效訊號計算，再執行完整診斷。':null;}
  submit(id:RadarTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已修復，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};
    let correct=false;
    if(id==='error')correct=answer==='C';
    else if(id==='blocks')correct=Array.isArray(answer)&&answer.length===2&&answer[0]==='try:'&&answer[1]==='except ValueError:';
    else if(id==='sum'&&answer&&typeof answer==='object'){
      const value=answer as {labels?:unknown;total?:unknown},labels=value.labels,result=summarizeSignals(radarSignals);
      correct=Array.isArray(labels)&&labels.length===5&&result.valid.every((valid,i)=>labels[i]===(valid?'valid':'noise'))&&typeof value.total==='string'&&value.total.trim()===String(result.total);
    }else if(id==='verify'&&answer&&typeof answer==='object'){
      const value=answer as {code?:unknown;outputs?:unknown},outputs=value.outputs,normal=summarizeSignals(radarSignals),noise=summarizeSignals(noiseSignals);
      correct=typeof value.code==='string'&&/^[ \t]*errors[ \t]*\+=[ \t]*1[ \t]*(?:\r?\n)?$/.test(value.code)&&Array.isArray(outputs)&&outputs.length===4&&[normal.total,normal.errors,noise.total,noise.errors].every((expected,i)=>typeof outputs[i]==='string'&&outputs[i].trim()===String(expected));
    }
    if(!correct)return {success:false,message:{error:'int("雜訊") 無法把非數字文字轉成整數，會發生 ValueError。請檢查錯誤類型。',blocks:'請把 try: 放在轉換指令前，except ValueError: 放在 pass 前，兩者同層縮排。else 與 finally 不會捕捉這個轉換錯誤。',sum:'請逐張判斷是否可轉成整數；雜訊與 ? 應跳過，僅累加數字資料。請檢查五張分類與總和。',verify:'except 區塊應使用 errors += 1。一般資料輸出總和 50、異常 2；全雜訊也應正常結束，輸出總和 0、異常 2。'}[id]};
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'兩組雷達診斷通過，異常已跳過並統計，導航系統收到修復通知！':'雷達設備修復成功！',output:id==='error'?['ValueError：無法轉換「雜訊」']:id==='blocks'?['已跳過「雜訊」','有效訊號總和：40']:id==='sum'?['50']:['一般資料：50 / 2','全雜訊：0 / 2','程式正常結束']};
  }
}
