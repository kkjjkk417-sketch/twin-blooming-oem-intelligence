import {queryPatent} from './_shared/patent-api.mjs';
import {previous,save,alertEmail} from './_shared/monitor.mjs';
// Patent databases have publication delays. Check every six hours, not continuously.
export const config={schedule:'10 */6 * * *'};
const WATCH=[
 {region:'kr',assignee:'삼성디스플레이',keyword:'롤러블 디스플레이'},
 {region:'kr',assignee:'LG디스플레이',keyword:'롤러블 디스플레이'},
 {region:'world',assignee:'BOE',keyword:'rollable display'},
 {region:'world',assignee:'Samsung Display',keyword:'slidable display'}
];
const id=(p,w)=>[w.region,w.assignee,p.number].join('|');
export default async ()=>{
 const results=await Promise.allSettled(WATCH.map(w=>queryPatent(w)));
 const old=await previous('patent-snapshot')||{entries:[],checkedAt:null};
 const known=new Set(old.knownIds||old.entries.map(e=>e.id));let entries=[],ok=0;const successfulFilters=new Set();
 for(let i=0;i<WATCH.length;i++){
  const w=WATCH[i],r=results[i];if(r.status!=='fulfilled'||!r.value.connected)continue;
  ok++;successfulFilters.add(w.region+'|'+w.assignee+'|'+w.keyword);for(const p of r.value.results||[])entries.push({...p,id:id(p,w),assigneeFilter:w.assignee,region:w.region,keyword:w.keyword,url:w.region==='kr'?'https://www.kipris.or.kr/khome/search/searchResult.do?tab=patent':'https://worldwide.espacenet.com/'});
 }
 if(ok===0){console.warn('Patent monitor waiting for approved API credentials');return}
 // Preserve earlier results of sources that failed this round: avoid false delete/re-add notifications.
 entries.push(...old.entries.filter(x=>!successfulFilters.has(x.region+'|'+x.assigneeFilter+'|'+x.keyword)));
 const fresh=old.checkedAt?entries.filter(p=>!known.has(p.id)):[];
 const knownIds=[...new Set([...known,...entries.map(x=>x.id)])].slice(-2500);
 await save('patent-snapshot',{entries,knownIds,checkedAt:new Date().toISOString(),queriesSucceeded:ok,queriesAttempted:WATCH.length});
 if(fresh.length){const past=await previous('patentAlerts')||[];await save('patentAlerts',[...fresh.map(x=>({...x,category:'patent',detectedAt:new Date().toISOString()})),...past].slice(0,100));try{await alertEmail('[TWIN BLOOMING] 신규 공개특허 '+fresh.length+'건',fresh)}catch(e){console.error('Optional patent email failed',String(e.message))}}
 console.log(`Patent monitor: ${ok}/${WATCH.length} sources; new ${fresh.length}`);
};
