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
export const lifeSupportHandbook={
  "levelId": 3,
  "title": "維生系統室",
  "topic": "運算子與型態",
  "concepts": [
    "整數 int 與字串 str 是不同的資料型態。",
    "int() 可以將符合格式的數字字串轉為整數。",
    "加法與減法的意義不同，應依據任務選擇運算子。",
    "字串乘以整數會重複文字，不代表數值乘法。"
  ],
  "example": "energy = int(\"8\")\nreserve = 2\nprint(energy + reserve)",
  "recap": "維生系統已恢復正常！你學會了區分字串與整數、使用 int() 轉型，並選擇正確運算子計算能源。"
} as const;
export const lifeSupportHintTasks={
  "main": {
    "taskId": "3-1",
    "title": "主能源計算",
    "hints": [
      "觀察兩個能源數值是否屬於相同的資料型態。",
      "雙引號中的 100 是文字，要先轉成數字才能與整數相加。",
      "檢查 main_energy 的值，以及 total 計算那一行。"
    ]
  },
  "used": {
    "taskId": "3-2",
    "title": "能源消耗計算",
    "hints": [
      "使用能源後，剩餘能源應該增加還是減少？",
      "把「剩餘」理解成原有總量扣除已使用的數量。",
      "檢查 remaining = total + used 中間的運算子。"
    ]
  },
  "backup": {
    "taskId": "3-3",
    "title": "備用能源計算",
    "hints": [
      "數字字串乘上 2，結果可能不是你想要的數值。",
      "要計算兩組能源的總量，先把文字型態轉成整數。",
      "檢查 backup = \"25\" 的資料型態。"
    ]
  },
  "verify": {
    "taskId": "3-4",
    "title": "能源總驗證",
    "hints": [
      "先算出能源消耗後剩下多少，再考慮備用能源。",
      "將計算拆成兩步：總能源減去消耗，再加上備用能源。",
      "檢查你的算式是否同時包含減去 15 和加上 50。"
    ]
  }
} satisfies Record<import('./life-support').LifeSupportTaskId,HintTask>;
export const airlockHandbook={
  "levelId": 4,
  "title": "氣閘艙",
  "topic": "條件判斷",
  "concepts": [
    "if 用來判斷條件是否成立。",
    "條件判斷後面需要冒號 :。",
    "屬於 if 或 else 的程式行需要正確縮排。",
    "大於 > 和大於等於 >= 的判斷範圍不同。"
  ],
  "example": "pressure = 60\nif pressure <= 70:\n    print(\"安全\")\nelse:\n    print(\"警告\")",
  "recap": "氣閘艙已解除封鎖！你學會了使用 if／else 判斷條件，檢查冒號與縮排，並測試比較運算的邊界值。"
} as const;
export const airlockHintTasks={
  "colon": {
    "taskId": "4-1",
    "title": "壓力判斷指令",
    "hints": [
      "Python 條件判斷的開頭有固定語法。",
      "檢查 if 條件的結尾，是否有正確的符號。",
      "檢查 if pressure > 100 這一行最後面。"
    ]
  },
  "indent": {
    "taskId": "4-2",
    "title": "錯誤縮排",
    "hints": [
      "Python 利用縮排分辨哪些程式屬於同一個區塊。",
      "如果 print() 只應在條件成立時執行，它必須位於 if 的內部。",
      "檢查 print(\"壓力過高\") 前面的空格。"
    ]
  },
  "branch": {
    "taskId": "4-3",
    "title": "正常壓力判斷",
    "hints": [
      "當 if 條件不成立時，可以讓程式執行另一個分支。",
      "想想 else 區塊應該輸出哪一種艙門狀態。",
      "檢查 else: 下方缺少的輸出指令。"
    ]
  },
  "verify": {
    "taskId": "4-4",
    "title": "安全開門測試",
    "hints": [
      "請特別留意 100 kPa 這個邊界值。",
      "條件是 pressure > 100，等於 100 時，這個條件是否成立？",
      "比較三組壓力與 100 的大小關係。"
    ]
  }
} satisfies Record<import('./airlock').AirlockTaskId,HintTask>;
export const coolingHandbook={
  "levelId": 5,
  "title": "引擎冷卻室",
  "topic": "迴圈控制",
  "concepts": [
    "while 會在條件成立時重複執行區塊內的程式。",
    "迴圈內必須讓控制條件有機會改變，才能正常停止。",
    "temperature -= 5 等同於 temperature = temperature - 5。",
    "計數器可以記錄迴圈執行的次數。"
  ],
  "example": "count = 0\nwhile count < 3:\n    count += 1\nprint(count)",
  "recap": "冷卻系統已恢復正常！你學會了在迴圈中更新變數、累計次數，並追蹤每輪輸出與停止條件。"
} as const;
export const coolingHintTasks={
  "cause": {
    "taskId": "5-1",
    "title": "無窮迴圈",
    "hints": [
      "如果條件永遠成立，while 就可能無法停止。",
      "觀察迴圈內有沒有改變 temperature 的數值。",
      "檢查 while 區塊中是否只有 print()。"
    ]
  },
  "drop": {
    "taskId": "5-2",
    "title": "降溫程式",
    "hints": [
      "從起始溫度到目標溫度，需要下降多少度？",
      "將總共需要降低的溫度，平均分成四次。",
      "檢查 temperature -= 後面的數字。"
    ]
  },
  "counter": {
    "taskId": "5-3",
    "title": "循環計數器",
    "hints": [
      "計數器應該在每次迴圈執行後更新。",
      "如果每次只增加 1，可以使用 += 運算子。",
      "檢查 while 區塊中有沒有修改 cycles。"
    ]
  },
  "verify": {
    "taskId": "5-4",
    "title": "冷卻總測試",
    "hints": [
      "先觀察溫度每一輪如何變化，再統計執行次數。",
      "注意程式是先降低溫度，然後才印出當次的數值。",
      "追蹤 temperature 和 cycles 兩個變數的變化。"
    ]
  }
} satisfies Record<import('./cooling').CoolingTaskId,HintTask>;
export type Handbook=typeof alarmHandbook|typeof generatorHandbook|typeof lifeSupportHandbook|typeof airlockHandbook|typeof coolingHandbook;
export type HintTask={taskId:string;title:string;hints:readonly [string,string,string]};
const allHintTasks=[...Object.values(alarmHintTasks),...Object.values(generatorHintTasks),...Object.values(lifeSupportHintTasks),...Object.values(airlockHintTasks),...Object.values(coolingHintTasks)];
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
