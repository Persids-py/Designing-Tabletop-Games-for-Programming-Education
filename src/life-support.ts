import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';

export type LifeSupportTaskId='main'|'used'|'backup'|'verify';
export const lifeSupportTasks=[
  {id:'main',name:'主能源計算器',point:point(643,180)},
  {id:'used',name:'能源消耗監測器',point:point(738,215)},
  {id:'backup',name:'備用能源模組',point:point(832,178)},
  {id:'verify',name:'維生能源驗證台',point:point(742,270)}
] as const;
export const lifeSupportRadius=48*SCALE;

// 僅解析本題的數值算式與已知監測變數，不使用 eval 或執行 Python。
export function evaluateEnergyExpression(source:string):{value:number;division:boolean;sources:number[];hasOperator:boolean}|null{
  if(!source.trim()||source.length>160)return null;
  const bindings:Record<string,number>={total:120,used:15,backup_energy:50,remaining:105};
  const tokens:string[]=[];const input=source.trim();let position=0;
  while(position<input.length){
    const match=/^(?:\s+|\d+|[A-Za-z_][A-Za-z_0-9]*|[()+*/-])/.exec(input.slice(position));
    if(!match)return null;position+=match[0].length;if(!/^\s+$/.test(match[0]))tokens.push(match[0]);
  }
  if(tokens.length>80)return null;
  let index=0,division=false,hasOperator=false;const sources:number[]=[];
  const safe=(value:number)=>{if(!Number.isFinite(value)||Math.abs(value)>1e9)throw Error('算式超出範圍');return value;};
  function factor():number{
    const token=tokens[index++];
    if(token==='+'||token==='-'){const value=factor();return token==='-'?-value:value;}
    if(token==='('){const value=expression();if(tokens[index++]!==')')throw Error('括號不成對');return value;}
    const value=/^\d+$/.test(token??'')?Number(token):Object.hasOwn(bindings,token)?bindings[token]:NaN;
    if(!Number.isSafeInteger(value))throw Error('不是監測數值');sources.push(value);return safe(value);
  }
  function term():number{
    let value=factor();while(tokens[index]==='*'||tokens[index]==='/'){
      hasOperator=true;const operator=tokens[index++],right=factor();
      if(operator==='/'){division=true;if(right===0)throw Error('除以零');value=safe(value/right);}else value=safe(value*right);
    }return value;
  }
  function expression():number{
    let value=term();while(tokens[index]==='+'||tokens[index]==='-'){
      hasOperator=true;const operator=tokens[index++],right=term();value=safe(operator==='+'?value+right:value-right);
    }return value;
  }
  try{const value=expression();if(index!==tokens.length)return null;return {value,division,sources,hasOperator};}catch{return null;}
}

export class LifeSupportState{
  repaired:Record<LifeSupportTaskId,boolean>={main:false,used:false,backup:false,verify:false};
  get total(){return this.repaired.main?120:null;}
  get remaining(){return this.repaired.used?105:null;}
  get backupEnergy(){return this.repaired.backup?50:null;}
  get available(){return this.completed?155:null;}
  get ready(){return this.repaired.main&&this.repaired.used&&this.repaired.backup;}
  get completed(){return this.ready&&this.repaired.verify;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){return lifeSupportTasks.find(t=>!this.repaired[t.id])??lifeSupportTasks[3];}
  blocked(id:LifeSupportTaskId){return id==='verify'&&!this.ready?'請先完成三項能源計算，再進行維生系統總驗證。':null;}
  submit(id:LifeSupportTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已修復，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};
    let correct=false;
    if(id==='main')correct=typeof answer==='string'&&/^[ \t]*total[ \t]*=[ \t]*(?:int[ \t]*\([ \t]*main_energy[ \t]*\)[ \t]*\+[ \t]*aux_energy|aux_energy[ \t]*\+[ \t]*int[ \t]*\([ \t]*main_energy[ \t]*\))[ \t]*(?:\r?\n)?$/.test(answer);
    else if(id==='used')correct=answer==='-';
    else if(id==='backup')correct=typeof answer==='string'&&/^[ \t]*backup_energy[ \t]*=[ \t]*(?:int[ \t]*\([ \t]*backup[ \t]*\)[ \t]*\*[ \t]*cells|cells[ \t]*\*[ \t]*int[ \t]*\([ \t]*backup[ \t]*\))[ \t]*(?:\r?\n)?$/.test(answer);
    else if(typeof answer==='string'){
      const result=evaluateEnergyExpression(answer);
      if(result){
        const fromMonitor=result.sources.every(value=>[120,15,50,105].includes(value));
        const allSources=result.sources.includes(50)&&((result.sources.includes(120)&&result.sources.includes(15))||result.sources.includes(105));
        correct=this.total===120&&this.remaining===105&&this.backupEnergy===50&&result.value===155&&!result.division&&result.hasOperator&&Number.isSafeInteger(result.value)&&fromMonitor&&allSources;
      }
    }
    if(!correct){
      const message={main:'TypeError：字串與整數不能直接相加。請先把 main_energy 轉成整數，再加上 aux_energy。',used:'剩餘能源不正確。設備消耗了能源，請選擇能扣除 used 的運算子。',backup:'目前仍不是整數 50。字串乘以 2 會重複文字；請先將 backup 轉成整數，再乘以 cells。',verify:'請使用監測表的數值計算：扣除消耗，再加備用能源，得到整數 155。不要直接填答案或使用除法。'}[id];
      return {success:false,message};
    }
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'能源檢測通過，維生系統能源計算恢復正常！':'能源設備修復成功！',output:[String(id==='main'?120:id==='used'?105:id==='backup'?50:155)]};
  }
}
