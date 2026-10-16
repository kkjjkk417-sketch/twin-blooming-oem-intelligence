import {fetchNews,diffNew} from './_shared/news.mjs';
import {previous,save,alertEmail} from './_shared/monitor.mjs';
// Server-side collection runs regardless of whether a user is visiting the website.
export const config={schedule:'0 * * * *'};
export default async ()=>{
 const result=await fetchNews();
 if(result.sourcesSucceeded===0){console.error('All sources unavailable',result.errors);return}
 const old=await previous('news-monitor-last-seen');const newItems=old?.checkedAt?diffNew(result.articles,old.articles||[]):[];
 await save('news',result);
 await save('news-monitor-last-seen',{articles:result.articles,checkedAt:result.checkedAt});
 if(newItems.length){
  const oldAlerts=await previous('newsAlerts')||[];
  await save('newsAlerts',[...newItems.map(x=>({...x,category:'news',detectedAt:new Date().toISOString()})),...oldAlerts].slice(0,100));
  try{await alertEmail('[TWIN BLOOMING] 신규 OEM·경쟁사 뉴스 '+newItems.length+'건',newItems)}catch(e){console.error('Optional email failed',String(e.message))}
 }
 console.log(`News checked: ${result.articles.length}; new: ${newItems.length}; sources: ${result.sourcesSucceeded}/${result.sourcesAttempted}`);
};
