import {fetchNews} from './_shared/news.mjs';
import {previous,save} from './_shared/monitor.mjs';
import {responseJSON} from './_shared/storage.mjs';
export default async ()=>{
 let snap=await previous('news');
 const age=snap?.checkedAt?Date.now()-Date.parse(snap.checkedAt):Infinity;
 // Avoid requesting Google News for every viewer; refresh cached data at most once per 15 minutes.
 if(age>900000){
  try{const fresh=await fetchNews();if(fresh.sourcesSucceeded>0){await save('news',fresh);snap=fresh}}
  catch(e){if(!snap)return responseJSON({articles:[],connected:false,reason:'뉴스 수집·저장 서버 확인 필요',error:String(e.message).slice(0,100)},503)}
 }
 return responseJSON(snap?{...snap,connected:true,stale:Date.now()-Date.parse(snap.checkedAt)>3600000}:{articles:[],connected:false,reason:'초기 수집 대기',sourcesSucceeded:0},snap?200:503)
};
