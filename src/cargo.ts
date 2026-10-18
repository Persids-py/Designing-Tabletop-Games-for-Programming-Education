import {point,SCALE} from './map';
import type {AlarmResult} from './alarm';
export type CargoTaskId='remove'|'index'|'insert'|'verify';
export const cargoTasks=[
  {id:'remove',name:'受損貨箱檢查台',point:point(1135,720)},
  {id:'index',name:'貨架索引控制器',point:point(1270,800)},
  {id:'insert',name:'備用物資入庫台',point:point(1290,925)},
  {id:'verify',name:'物資領取控制台',point:point(1190,950)}
] as const;
export const cargoRadius=43*SCALE;
export const cargoNames:Record<string,string>={A:'A 電池',B:'B 氧氣罐',C:'C 晶片',D:'D 工具箱',E:'E 保險絲'};
export const initialCargo=['A','B','C','D'] as const;
export const finalCargo=['A','E','C','D'] as const;
export class CargoState{
  repaired:Record<CargoTaskId,boolean>={remove:false,index:false,insert:false,verify:false};
  get boxes():string[]{return this.repaired.insert?[...finalCargo]:this.repaired.remove?['A','C','D']:[...initialCargo];}
  get ready(){return this.repaired.remove&&this.repaired.index&&this.repaired.insert;}
  get completed(){return this.ready&&this.repaired.verify;}
  get count(){return Object.values(this.repaired).filter(Boolean).length;}
  get next(){return cargoTasks.find(t=>!this.repaired[t.id])??cargoTasks[3];}
  blocked(id:CargoTaskId){
    if((id==='index'||id==='insert')&&!this.repaired.remove)return '請先確認並移除受損貨箱，再修復索引或插入物資。';
    if(id==='insert'&&!this.repaired.index)return '請先修復貨架讀取索引，再插入備用物資。';
    if(id==='verify'&&!this.ready)return '請先完成受損貨箱、索引與備用物資修復，再領取物資。';
    return null;
  }
  submit(id:CargoTaskId,answer:unknown):AlarmResult{
    if(this.repaired[id])return {success:false,message:'這個設備已修復，不需要重複提交。'};
    const blocked=this.blocked(id);if(blocked)return {success:false,message:blocked};
    let correct=false;
    if(id==='remove')correct=answer==='B';
    else if(id==='index'||id==='insert')correct=typeof answer==='string'&&/^\d$/.test(answer.trim())&&Number(answer)===(id==='index'?2:1);
    else if(answer&&typeof answer==='object'){
      const value=answer as {count?:unknown;order?:unknown;item?:unknown};
      const order=value.order;
      correct=typeof value.count==='string'&&value.count.trim()==='4'&&Array.isArray(order)&&order.length===4&&finalCargo.every((box,i)=>order[i]===box)&&value.item==='D';
    }
    if(!correct)return {success:false,message:{remove:'串列索引從 0 開始：pop(1) 會移除第二個貨箱。請重新追蹤受損貨箱。',index:'IndexError：刪除後只剩三箱，索引是 0、1、2。請找出 D 工具箱現在的位置。',insert:'insert() 的第一個參數是插入索引。請把 E 保險絲放在索引 1，原本的貨箱會向後移動。',verify:'請重新追蹤 pop(1) 與 insert(1, ...)：確認總數、四箱順序與索引 3 的輸出。三項都正確才能出庫。'}[id]};
    this.repaired[id]=true;
    return {success:true,message:id==='verify'?'清單驗證通過，機械手臂領取 D 工具箱並完成出庫！':'倉儲設備修復成功！',output:id==='remove'?['已移除 B 氧氣罐','0: A 電池','1: C 晶片','2: D 工具箱']:id==='index'?['D 工具箱']:id==='insert'?finalCargo.map((box,i)=>`${i}: ${cargoNames[box]}`):['共 4 箱','A 電池 → E 保險絲 → C 晶片 → D 工具箱','D 工具箱']};
  }
}
