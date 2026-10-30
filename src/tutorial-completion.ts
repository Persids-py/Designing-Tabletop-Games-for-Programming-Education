export const tutorialCompletionKey='space-debugger.tutorialCompleted.v1';
export const tutorialCompletionLines=[
  '「很好！你已經成功掌握基本操作。」',
  '「接下來，真正的維修任務即將開始。」',
  '「記住，每修復一項系統，探索者號就離安全返航更近一步。」',
  '「整艘太空船的命運，就交給你了，維修工程師！」'
] as const;
type TutorialStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
// 瀏覽器停用儲存或容量不足時，仍可正常完成本局教學與遊戲。
export function readTutorialCompletion(storage:()=>TutorialStorage=()=>localStorage){
  try{return storage().getItem(tutorialCompletionKey)==='true';}catch{return false;}
}
export function saveTutorialCompletion(storage:()=>TutorialStorage=()=>localStorage){
  try{storage().setItem(tutorialCompletionKey,'true');return true;}catch{return false;}
}
export function clearTutorialCompletion(storage:()=>TutorialStorage=()=>localStorage){
  try{storage().removeItem(tutorialCompletionKey);}catch{/* 本局仍重置，儲存可用時才清除紀錄。 */}
}
