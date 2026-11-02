import type {AlarmTaskId} from './alarm';

export const alarmHandbook={
  levelId:1,title:'警報燈光室',topic:'環境與基本語法',
  concepts:[
    'print() 是 Python 的輸出指令，可以在畫面顯示文字或數值。',
    '文字需要放在成對的單引號或雙引號中。',
    'Python 區分大小寫，也不能任意增加或省略函式名稱的字母。',
    '程式通常會依照由上而下的順序執行。'
  ],
  example:'print("Hello")\nprint("System Ready")',
  recap:'警報系統已恢復正常！這次你學會了如何使用 print() 輸出訊息，以及指令拼字、引號和執行順序的重要性。'
} as const;
export const alarmHintTasks:Record<AlarmTaskId,{taskId:string;title:string;hints:readonly [string,string,string]}>= {
  computer:{taskId:'1-1',title:'主控制電腦',hints:[
    '這台設備需要將文字顯示在螢幕上，想想 Python 使用哪一個輸出指令。',
    '仔細檢查函式名稱的每個字母，尤其是有沒有多打一個字母。',
    '檢查 priint("SYSTEM CHECK") 開頭的函式名稱。'
  ]},
  light:{taskId:'1-2',title:'紅色警報燈',hints:[
    'Python 的文字必須有明確的開始與結束。',
    '數一數字串左右兩邊的雙引號，看看是否成對。',
    '檢查 RED LIGHT ON 文字結束的位置。'
  ]},
  broadcast:{taskId:'1-3',title:'緊急廣播',hints:[
    '程式能執行，不一定代表顯示的訊息正確。',
    '比較目前顯示的文字與系統要求的文字，找出不同的單字。',
    '檢查 print() 括號中的 SIREN OFF。'
  ]},
  verify:{taskId:'1-4',title:'啟動順序',hints:[
    '程式會按照由上往下的順序執行。',
    '先做系統檢查，確定設備可以運作，再啟動燈光和廣播。',
    '注意三張指令卡的先後順序，而不是函式的拼字。'
  ]}
};
export const generatorHandbook={
  levelId:2,title:'發電機室',topic:'變數與命名',
  concepts:[
    '變數可以儲存數值，例如 voltage = 110。',
    '賦值時，左邊放變數名稱，右邊放要儲存的值。',
    '變數名稱必須一致，且 Python 區分大小寫。',
    '對同一變數重新賦值，會覆蓋之前儲存的值。'
  ],
  example:'voltage = 80\nvoltage = 90\nprint(voltage)',
  recap:'供電系統已恢復正常！你學會了使用變數儲存數值，並確認變數名稱一致、賦值方向與重新賦值後的結果。'
} as const;
export const generatorHintTasks={
  main:{taskId:'2-1',title:'主電壓設定',hints:[
    '你要把數值存入一個有名稱的變數中。',
    '檢查等號左右兩邊，哪一邊應該放變數名稱？',
    '檢查 220 = target_voltage 的等號左側。'
  ]},
  backup:{taskId:'2-2',title:'備用電壓變數',hints:[
    'NameError 常與找不到變數名稱有關。',
    '比較儲存電壓時的名稱，與 print() 讀取時的名稱。',
    '檢查 back_voltage 和 backup_voltage 兩個名稱是否一致。'
  ]},
  display:{taskId:'2-3',title:'電壓顯示器',hints:[
    '輸出字串和輸出變數，顯示結果可能不同。',
    '如果要顯示變數裡的數值，不應該把變數名稱當成普通文字。',
    '檢查 print() 中 target_voltage 外面的雙引號。'
  ]},
  verify:{taskId:'2-4',title:'供電驗證',hints:[
    '同一個變數可以被重新設定。',
    '依照程式執行順序，觀察 main_voltage 最後一次被設定的數值。',
    '注意第二次賦值 main_voltage = 220。'
  ]}
} satisfies Record<import('./generator').GeneratorTaskId,{taskId:string;title:string;hints:readonly [string,string,string]}>;
export type Handbook=typeof alarmHandbook|typeof generatorHandbook;
export type HintTask={taskId:string;title:string;hints:readonly [string,string,string]};
const allHintTasks=[...Object.values(alarmHintTasks),...Object.values(generatorHintTasks)];
// 保留第一關既有設備 ID 呼叫介面；跨關使用完整 taskId，避免 verify 名稱衝突。
const taskKey=(id:string)=>alarmHintTasks[id as AlarmTaskId]?.taskId??id;
export interface HintProgress{revealedHintLevel:number;attemptCount:number;diagnosisUnlocked:boolean}
export const hintStorageKey='space-debugger.hints.v1';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export class RepairHintState{
  private progress:Record<string,HintProgress>={};
  constructor(private storage:()=>Store=()=>localStorage){
    try{
      const saved=JSON.parse(storage().getItem(hintStorageKey)??'{}');
      for(const {taskId} of allHintTasks){
        const p=saved?.[taskId];if(!p||typeof p!=='object')continue;
        const attempts=Number.isSafeInteger(p.attemptCount)&&p.attemptCount>=0?Math.min(p.attemptCount,1000000):0;
        const level=Number.isInteger(p.revealedHintLevel)?Math.max(0,Math.min(attempts>=2?3:2,p.revealedHintLevel)):0;
        this.progress[taskId]={attemptCount:attempts,revealedHintLevel:level,diagnosisUnlocked:level===3};
      }
    }catch{/* 儲存停用或損毀時使用本局記憶體狀態。 */}
  }
  get(id:string):HintProgress{return {...(this.progress[taskKey(id)]??{revealedHintLevel:0,attemptCount:0,diagnosisUnlocked:false})};}
  private put(id:string,p:HintProgress){this.progress[taskKey(id)]=p;try{this.storage().setItem(hintStorageKey,JSON.stringify(this.progress));}catch{/* 閱讀與判題不因儲存失敗而中斷。 */}}
  recordFailure(id:string){const p=this.get(id);p.attemptCount=Math.min(1000000,p.attemptCount+1);this.put(id,p);}
  reveal(id:string,level:number){
    const p=this.get(id);
    if(!Number.isInteger(level)||level!==p.revealedHintLevel+1||level>3||level<1||(level===3&&p.attemptCount<2))return false;
    p.revealedHintLevel=level;p.diagnosisUnlocked=level===3;this.put(id,p);return true;
  }
  reset(){this.progress={};try{this.storage().removeItem(hintStorageKey);}catch{/* 本局仍清除。 */}}
}
