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
export const boosterHandbook={
  "levelId": 6,
  "title": "副推進器室",
  "topic": "函式設計",
  "concepts": [
    "def 可以定義可重複使用的函式。",
    "函式名稱後可接收參數，例如 def double(n):。",
    "return 會把計算結果傳回呼叫函式的位置。",
    "print() 只會顯示結果，不等於回傳結果。"
  ],
  "example": "def square(n):\n    return n * n\nprint(square(4))",
  "recap": "副推進器已恢復動力！你學會了定義函式、傳入參數，並使用 return 將計算結果交回呼叫處。"
} as const;
export const boosterHintTasks={
  "declaration": {
    "taskId": "6-1",
    "title": "函式宣告",
    "hints": [
      "函式定義與條件判斷一樣，有固定的起始語法。",
      "檢查 def 函式名稱(參數) 的最後是否缺少符號。",
      "檢查 def booster_power(speed) 這一行結尾。"
    ]
  },
  "formula": {
    "taskId": "6-2",
    "title": "推力公式",
    "hints": [
      "請確認程式中的運算方式是否符合推力規則。",
      "規則要求速度乘以 3，而不是將速度加上 3。",
      "檢查 power = speed + 3 的運算子。"
    ]
  },
  "return": {
    "taskId": "6-3",
    "title": "推力回傳",
    "hints": [
      "在函式中顯示數字，不代表外部變數可以取得它。",
      "若要把 power 的值交給 thrust，應使用回傳指令。",
      "檢查函式最後使用 print() 還是 return。"
    ]
  },
  "verify": {
    "taskId": "6-4",
    "title": "三段式測試",
    "hints": [
      "函式每被呼叫一次，都會使用新的輸入參數重新計算。",
      "將 0、10、20 依序代入相同的推力公式。",
      "檢查三次 booster_power() 的輸入值與乘數。"
    ]
  }
} satisfies Record<import('./booster').BoosterTaskId,HintTask>;
export const cargoHandbook={
  "levelId": 7,
  "title": "資材庫存室",
  "topic": "基礎資料結構",
  "concepts": [
    "list 是可以依序保存多個資料的串列。",
    "串列索引從 0 開始，第一項的索引為 0。",
    "pop(index) 可移除指定位置的項目。",
    "insert(index, value) 會插入資料，後面的索引可能改變。"
  ],
  "example": "items = [\"甲\", \"乙\", \"丙\"]\nprint(items[0])\nitems.pop(1)",
  "recap": "倉儲系統已恢復正常！你學會了從 0 追蹤串列索引，並在刪除與插入資料後重新確認項目位置。"
} as const;
export const cargoHintTasks={
  "remove": {
    "taskId": "7-1",
    "title": "受損貨箱",
    "hints": [
      "Python 串列的第一個元素並不是索引 1。",
      "從 0 開始數，觀察 pop(1) 指向哪個貨箱。",
      "檢查 boxes.pop(1) 的索引數字。"
    ]
  },
  "index": {
    "taskId": "7-2",
    "title": "索引超界",
    "hints": [
      "刪掉一個貨箱後，串列長度也會改變。",
      "重新從 0 開始標記剩下三個貨箱的位置。",
      "檢查 boxes[3] 是否超過目前最後一個有效索引。"
    ]
  },
  "insert": {
    "taskId": "7-3",
    "title": "插入備用物資",
    "hints": [
      "insert() 的第一個參數指定新資料插入的位置。",
      "如果想把新貨箱放在第二個位置，要從索引 0 開始計算。",
      "檢查 boxes.insert(______, \"E保險絲\") 的第一個參數。"
    ]
  },
  "verify": {
    "taskId": "7-4",
    "title": "最終物資領取",
    "hints": [
      "刪除與插入都會讓貨箱的位置發生變化。",
      "請依照程式順序，先刪除，再插入，最後重新列出索引。",
      "逐步檢查 pop()、insert() 完成後的整個 boxes 清單。"
    ]
  }
} satisfies Record<import('./cargo').CargoTaskId,HintTask>;
export const crewHandbook={
  "levelId": 8,
  "title": "船員資料庫",
  "topic": "進階資料結構",
  "concepts": [
    "dict 透過鍵 key 來查找相對應的值 value。",
    "巢狀字典需要一層一層查詢資料。",
    "使用不存在的鍵搭配中括號查詢，可能發生 KeyError。",
    "get() 可在鍵不存在時回傳 None，適合安全查詢。"
  ],
  "example": "person = {\"name\": \"Lee\", \"level\": 1}\nprint(person.get(\"job\"))",
  "recap": "船員資料庫已恢復正常！你學會了查詢巢狀字典、使用 get() 安全讀取資料，並根據授權等級判斷權限。"
} as const;
export const crewHintTasks={
  "lookup": {
    "taskId": "8-1",
    "title": "船員資料查詢",
    "hints": [
      "字典只能直接讀取實際存在的鍵。",
      "比較查詢時的職位名稱與船員資料庫裡的職位。",
      "檢查 crew[\"pilot\"] 是否為資料庫中的有效鍵。"
    ]
  },
  "level": {
    "taskId": "8-2",
    "title": "授權等級",
    "hints": [
      "同一位船員的姓名與權限等級，是兩種不同資料。",
      "進入 engineer 這層資料後，尋找代表授權等級的欄位。",
      "檢查 crew[\"engineer\"] 底下的 name 與 level。"
    ]
  },
  "safe": {
    "taskId": "8-3",
    "title": "安全查詢",
    "hints": [
      "當查詢的鍵可能不存在時，需要避免程式直接報錯。",
      "Python 字典提供一種方法，能在找不到鍵時回傳預設值。",
      "檢查是否可以用 get() 代替中括號取值。"
    ]
  },
  "verify": {
    "taskId": "8-4",
    "title": "維修授權",
    "hints": [
      "先確認查得到船員資料，再判斷其授權等級。",
      "授權要求至少為 2，請確認程式使用的比較條件。",
      "檢查 info is not None 和 info[\"level\"] >= ...。"
    ]
  }
} satisfies Record<import('./crew').CrewTaskId,HintTask>;
export const radarHandbook={
  "levelId": 9,
  "title": "雷達測量室",
  "topic": "例外與除錯",
  "concepts": [
    "int() 無法把任意文字都轉成整數。",
    "當轉型失敗時，可能出現 ValueError。",
    "try 放可能出錯的程式，except 處理指定異常。",
    "發生錯誤後，可以記錄錯誤並繼續處理後續資料。"
  ],
  "example": "try:\n    n = int(\"unknown\")\nexcept ValueError:\n    print(\"無法讀取數字\")",
  "recap": "雷達系統已恢復正常！你學會了使用 try／except 處理轉型失敗，繼續累加有效資料並統計異常次數。"
} as const;
export const radarHintTasks={
  "error": {
    "taskId": "9-1",
    "title": "雷達錯誤分析",
    "hints": [
      "先確認每一筆訊號是否都能轉換成整數。",
      "如果把一般文字送進 int()，會發生哪一種轉型異常？",
      "檢查 int(s) 遇到「雜訊」時的結果。"
    ]
  },
  "blocks": {
    "taskId": "9-2",
    "title": "例外處理排列",
    "hints": [
      "可能出錯的程式碼應放在 try 區塊內。",
      "處理轉換失敗時，要接住正確的錯誤類型。",
      "檢查 try: 與 except ValueError: 的位置及縮排。"
    ]
  },
  "sum": {
    "taskId": "9-3",
    "title": "有效訊號加總",
    "hints": [
      "只有成功轉換成數字的資料，才能加入總和。",
      "先標出不能轉換的訊號，再計算其餘數字。",
      "檢查 signals 中的「雜訊」與「?」是否被忽略。"
    ]
  },
  "verify": {
    "taskId": "9-4",
    "title": "異常計數器",
    "hints": [
      "錯誤次數應該只在發生異常時增加。",
      "把更新 errors 的程式放在處理 ValueError 的區塊。",
      "檢查 except ValueError: 下方缺少的計數器更新指令。"
    ]
  }
} satisfies Record<import('./radar').RadarTaskId,HintTask>;
export const warpHandbook={
  "levelId": 10,
  "title": "主躍遷引擎",
  "topic": "綜合邏輯專案",
  "concepts": [
    "and 表示兩邊條件都必須成立，or 表示至少一邊成立。",
    "括號能清楚指定複合邏輯的計算順序。",
    "非空字串轉成 bool 時通常是 True，不能把 \"OFF\" 當成 False。",
    "最終系統必須通過正常與異常情境測試，不能只驗證一組資料。"
  ],
  "example": "has_key = True\ndoor_open = False\nadmin_ok = True\ncan_enter = has_key and (door_open or admin_ok)",
  "recap": "探索者號返航成功！你學會了結合字典查詢、布林判斷與複合條件，並以不同情境驗證系統安全。"
} as const;
export const warpHintTasks={
  "nav": {
    "taskId": "10-1",
    "title": "五大系統檢查",
    "hints": [
      "字典查詢必須使用實際存在的系統名稱。",
      "比較 navigation 與資料庫裡的導航系統鍵名。",
      "檢查 systems[\"navigation\"] 的鍵是否存在。"
    ]
  },
  "manual": {
    "taskId": "10-2",
    "title": "人工授權判斷",
    "hints": [
      "字串 OFF 不會因為英文意思是否定，就自動變成 False。",
      "若要判定授權是否開啟，應直接比較文字是否等於 ON。",
      "檢查 bool(manual_status) 這行的判斷方式。"
    ]
  },
  "logic": {
    "taskId": "10-3",
    "title": "躍遷啟動條件",
    "hints": [
      "先區分「一定要成立」與「可以二選一」的條件。",
      "燃料、導航、主引擎必須同時正常；只有雷達與人工授權允許擇一。",
      "檢查 and、or 的組合及括號位置，避免 engine_ready 繞過其他必要條件。"
    ]
  },
  "verify": {
    "taskId": "10-4",
    "title": "最終安全測試",
    "hints": [
      "不要只看有多少 True，要檢查是否滿足全部必要規則。",
      "先檢查燃料、導航和引擎，再檢查雷達或人工授權。",
      "依照每組測試值，分別計算必要條件與替代條件的結果。"
    ]
  }
} satisfies Record<import('./warp').WarpTaskId,HintTask>;
export type Handbook=typeof warpHandbook|typeof radarHandbook|typeof crewHandbook|typeof alarmHandbook|typeof generatorHandbook|typeof lifeSupportHandbook|typeof airlockHandbook|typeof coolingHandbook|typeof boosterHandbook|typeof cargoHandbook;
export type HintTask={taskId:string;title:string;hints:readonly [string,string,string]};
const allHintTasks=[...Object.values(warpHintTasks),...Object.values(radarHintTasks),...Object.values(crewHintTasks),...Object.values(alarmHintTasks),...Object.values(generatorHintTasks),...Object.values(lifeSupportHintTasks),...Object.values(airlockHintTasks),...Object.values(coolingHintTasks),...Object.values(boosterHintTasks),...Object.values(cargoHintTasks)];
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
