import {previous} from './_shared/monitor.mjs';
import {responseJSON} from './_shared/storage.mjs';
export default async ()=>{
 const [news,patents,feed,patentSnapshot]=await Promise.all([previous('newsAlerts'),previous('patentAlerts'),previous('news'),previous('patent-snapshot')]);
 const events=[...(news||[]),...(patents||[])].sort((a,b)=>String(b.detectedAt||'').localeCompare(String(a.detectedAt||''))).slice(0,60);
 return responseJSON({events,newsCheckedAt:feed?.checkedAt||null,patentsCheckedAt:patentSnapshot?.checkedAt||null,patentMonitorActive:!!patentSnapshot?.checkedAt,generatedAt:new Date().toISOString()});
};
