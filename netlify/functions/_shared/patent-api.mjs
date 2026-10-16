import {decode,extract} from './news.mjs';
export const safe=(value,max=90)=>String(value||'').replace(/[<>]/g,'').trim().slice(0,max);
const text=(xml,tag)=>extract(xml,tag);
export function parseKipris(xml){return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m=>({title:text(m[1],'inventionTitle'),number:text(m[1],'applicationNumber')||text(m[1],'openNumber')||text(m[1],'registerNumber'),date:text(m[1],'openDate')||text(m[1],'applicationDate'),applicant:text(m[1],'applicantName'),status:text(m[1],'registerStatus'),source:'KIPRISPlus'})).filter(x=>x.title&&x.number).slice(0,20)}
export function parseEpo(xml){const results=[];for(const match of xml.matchAll(/<(?:\w+:)?exchange-document\b[^>]*>[\s\S]*?<\/(?:\w+:)?exchange-document>/gi)){
 const s=match[0];const find=t=>decode(s.match(new RegExp(`<(?:\\w+:)?${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${t}>`,'i'))?.[1]||'').replace(/<[^>]+>/g,'').trim();
 const title=find('invention-title'),number=find('doc-number'),applicant=find('applicant-name'),date=find('date');if(title&&number)results.push({title,number,applicant,date,status:'공개문헌',source:'EPO OPS'});
 }return results.slice(0,20)}
const ASSIGNEES={'삼성디스플레이':['삼성디스플레이','SAMSUNG DISPLAY'],'LG디스플레이':['엘지디스플레이','LG DISPLAY'],'BOE':['BOE','BEIJING BOE']};
export async function queryPatent({region='kr',keyword='',assignee=''},fetcher=fetch,env=process.env){
 keyword=safe(keyword,75);assignee=safe(assignee,60);if(!keyword)throw Error('검색어를 입력하세요');
 if(region==='kr'){
  if(!env.KIPRIS_PLUS_API_KEY)return {connected:false,provider:'KIPRISPlus',reason:'KIPRISPlus 서비스 키 미설정',results:[]};
  // A broad title search avoids returning zero merely because the assignee is spelled differently in the patent gazette.
  const url=new URL('https://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getWordSearch');
  url.searchParams.set('word',keyword);url.searchParams.set('ServiceKey',env.KIPRIS_PLUS_API_KEY);url.searchParams.set('year','0');url.searchParams.set('pageNo','1');url.searchParams.set('numOfRows','60');
  const r=await fetcher(url,{signal:AbortSignal.timeout(11500)});if(!r.ok)throw Error('KIPRISPlus 응답 HTTP '+r.status);const xml=await r.text();
  const reason=text(xml,'resultCode')||text(xml,'returnReasonCode');if(reason&&!['0','00','SUCCESS','NORMAL_SERVICE'].includes(reason.toUpperCase()))throw Error('KIPRISPlus 오류 '+reason);
  const all=parseKipris(xml);const match=ASSIGNEES[assignee]||[assignee.toUpperCase()];
  const filtered=assignee?all.filter(x=>match.some(v=>x.applicant.toUpperCase().includes(v.toUpperCase()))):all;
  return {connected:true,provider:'KIPRISPlus 국내 특허 공개자료',results:filtered,queryScope:'첫 60건 출원인 명칭 일치 결과 (전체 특허망라 아님)',checkedAt:new Date().toISOString()};
 }
 if(!env.EPO_OPS_KEY||!env.EPO_OPS_SECRET)return {connected:false,provider:'EPO OPS',reason:'EPO OPS OAuth 자격증명 미설정',results:[]};
 const basic=Buffer.from(env.EPO_OPS_KEY+':'+env.EPO_OPS_SECRET).toString('base64');const auth=await fetcher('https://ops.epo.org/3.2/auth/accesstoken',{method:'POST',headers:{authorization:'Basic '+basic,'content-type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(9000)});
 if(!auth.ok)throw Error('EPO OAuth HTTP '+auth.status);const token=(await auth.json()).access_token;if(!token)throw Error('EPO 인증 토큰 없음');
 const a=assignee==='삼성디스플레이'?'Samsung Display':assignee==='LG디스플레이'?'LG Display':assignee;
 const k=/[가-힣]/.test(keyword)?'rollable display':keyword;
 const clean=s=>s.replace(/["\\;:()]/g,' ').slice(0,75).trim();const q=a?`pa="${clean(a)}" and ti="${clean(k)}"`:`ti="${clean(k)}"`;
 const url='https://ops.epo.org/3.2/rest-services/published-data/search/biblio?q='+encodeURIComponent(q);
 const r=await fetcher(url,{headers:{authorization:'Bearer '+token,accept:'application/xml','x-ops-range':'1-20'},signal:AbortSignal.timeout(12500)});
 if(!r.ok)throw Error('EPO OPS 검색 HTTP '+r.status);
 return {connected:true,provider:'EPO OPS 해외 공개특허',queryScope:q,results:parseEpo(await r.text()),checkedAt:new Date().toISOString()};
}
