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
export interface HintProgress{revealedHintLevel:number;attemptCount:number;diagnosisUnlocked:boolean}
export const hintStorageKey='space-debugger.hints.v1';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export class RepairHintState{
  private progress:Record<string,HintProgress>={};
  constructor(private storage:()=>Store=()=>localStorage){
    try{
      const saved=JSON.parse(storage().getItem(hintStorageKey)??'{}');
      for(const {taskId} of Object.values(alarmHintTasks)){
        const p=saved?.[taskId];if(!p||typeof p!=='object')continue;
        const attempts=Number.isSafeInteger(p.attemptCount)&&p.attemptCount>=0?Math.min(p.attemptCount,1000000):0;
        const level=Number.isInteger(p.revealedHintLevel)?Math.max(0,Math.min(attempts>=2?3:2,p.revealedHintLevel)):0;
        this.progress[taskId]={attemptCount:attempts,revealedHintLevel:level,diagnosisUnlocked:level===3};
      }
    }catch{/* 儲存停用或損毀時使用本局記憶體狀態。 */}
  }
  get(id:AlarmTaskId):HintProgress{return {...(this.progress[alarmHintTasks[id].taskId]??{revealedHintLevel:0,attemptCount:0,diagnosisUnlocked:false})};}
  private put(id:AlarmTaskId,p:HintProgress){this.progress[alarmHintTasks[id].taskId]=p;try{this.storage().setItem(hintStorageKey,JSON.stringify(this.progress));}catch{/* 閱讀與判題不因儲存失敗而中斷。 */}}
  recordFailure(id:AlarmTaskId){const p=this.get(id);p.attemptCount=Math.min(1000000,p.attemptCount+1);this.put(id,p);}
  reveal(id:AlarmTaskId,level:number){
    const p=this.get(id);
    if(!Number.isInteger(level)||level!==p.revealedHintLevel+1||level>3||level<1||(level===3&&p.attemptCount<2))return false;
    p.revealedHintLevel=level;p.diagnosisUnlocked=level===3;this.put(id,p);return true;
  }
  reset(){this.progress={};try{this.storage().removeItem(hintStorageKey);}catch{/* 本局仍清除。 */}}
}
