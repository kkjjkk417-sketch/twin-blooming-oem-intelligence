import {queryPatent,safe} from './_shared/patent-api.mjs';
import {responseJSON} from './_shared/storage.mjs';
import {previous,save} from './_shared/monitor.mjs';
import {createHash} from 'node:crypto';
export default async (request)=>{
 const u=new URL(request.url);const region=u.searchParams.get('region')==='world'?'world':'kr',keyword=safe(u.searchParams.get('keyword'),75),assignee=safe(u.searchParams.get('assignee'),60);
 if(!keyword)return responseJSON({connected:false,reason:'특허 검색 키워드가 필요합니다',results:[]},400);
 const k='patent-query-'+createHash('sha256').update([region,keyword,assignee].join('|')).digest('hex').slice(0,16);
 const cached=await previous(k);if(cached?.checkedAt&&Date.now()-Date.parse(cached.checkedAt)<21600000)return responseJSON({...cached,cached:true});
 try{const result=await queryPatent({region,keyword,assignee});
  if(result.connected)try{await save(k,result)}catch(e){/* API result still available */}
  return responseJSON(result);
 }catch(e){return responseJSON({connected:false,provider:region==='kr'?'KIPRISPlus':'EPO OPS',reason:String(e.message).slice(0,120),results:[]},502)}
};
