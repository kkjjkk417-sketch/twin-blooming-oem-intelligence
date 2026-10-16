import {readJSON,writeJSON} from './storage.mjs';
export const NAMESPACE='twin-blooming-monitor-v6';
export async function previous(key){try{return await readJSON(NAMESPACE,key)}catch{return null}}
export async function save(key,value){return await writeJSON(NAMESPACE,key,value)}
export async function alertEmail(subject,items,env=process.env,fetcher=fetch){
 const {RESEND_API_KEY,ALERT_TO_EMAIL,ALERT_FROM_EMAIL}=env;
 if(!RESEND_API_KEY||!ALERT_TO_EMAIL||!ALERT_FROM_EMAIL||!items.length)return{enabled:false,sent:false};
 const body=items.slice(0,15).map((x,i)=>`${i+1}. ${x.title||x.name||x.number}\n${x.url||''}`).join('\n\n');
 const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+RESEND_API_KEY,'content-type':'application/json'},body:JSON.stringify({from:ALERT_FROM_EMAIL,to:ALERT_TO_EMAIL.split(',').map(x=>x.trim()).filter(Boolean).slice(0,5),subject,text:`TWIN BLOOMING — 신규 공개자료 ${items.length}건\n\n${body}\n\n해당 정보는 공개 검색으로 수신되며 공급계약 또는 특허 권리상태 판단의 근거로 단정할 수 없습니다.`}),signal:AbortSignal.timeout(9000)});
 if(!response.ok)throw Error('메일 제공사 HTTP '+response.status);
 return{enabled:true,sent:true};
}
