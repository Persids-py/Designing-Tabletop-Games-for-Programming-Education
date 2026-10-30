import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readTutorialCompletion,saveTutorialCompletion,clearTutorialCompletion,tutorialCompletionKey} from '../src/tutorial-completion';

test('教學完成紀錄可讀寫及重玩清除，其他值不當作完成',()=>{
  const data=new Map<string,string>();const storage=()=>({getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);},removeItem:(key:string)=>{data.delete(key);}});
  assert.equal(readTutorialCompletion(storage),false);data.set(tutorialCompletionKey,'false');assert.equal(readTutorialCompletion(storage),false);
  assert.equal(saveTutorialCompletion(storage),true);assert.equal(readTutorialCompletion(storage),true);
  clearTutorialCompletion(storage);assert.equal(readTutorialCompletion(storage),false);
});
test('儲存拒絕或取得儲存介面失敗時，不讓教學流程崩潰',()=>{
  const denied=()=>{throw new Error('denied');};
  assert.equal(readTutorialCompletion(denied),false);assert.equal(saveTutorialCompletion(denied),false);assert.doesNotThrow(()=>clearTutorialCompletion(denied));
});
