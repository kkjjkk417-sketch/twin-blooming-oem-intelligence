import {createHash} from 'node:crypto';
// Queries are source-scoped. Google News indexes lag source publication.
export const SOURCES=[
 {name:'Samsung Display Newsroom',category:'competitor',who:'samsung',q:'site:news.samsungdisplay.com (OLED OR automotive OR 차량용) when:30d',verified:['news.samsungdisplay.com']},
 {name:'BOE Corporate',category:'competitor',who:'boe',q:'site:boe.com (automotive OR OLED OR slidable) when:30d',verified:['boe.com']},
 {name:'BOE Technology',category:'competitor',who:'boe',q:'site:blog.boe.com (automotive OR display OR OLED) when:30d',verified:['blog.boe.com']},
 {name:'LG Display',category:'lgd',who:'lgd',q:'site:lgdisplay.com (OLED OR automotive OR 슬라이더블) when:30d',verified:['lgdisplay.com']},
 {name:'Hyundai Motor Group',category:'oem',who:'genesis',q:'site:hyundaimotorgroup.com (autonomous OR cockpit OR 제네시스) when:30d',verified:['hyundaimotorgroup.com']},
 {name:'Mercedes-Benz',category:'oem',who:'mercedes',q:'site:group.mercedes-benz.com (automated OR display OR cockpit) when:30d',verified:['group.mercedes-benz.com']},
 {name:'BMW Group',category:'oem',who:'bmw',q:'site:press.bmwgroup.com (display OR electric OR autonomous) when:30d',verified:['press.bmwgroup.com']},
 {name:'Zeekr',category:'oem',who:'zeekr',q:'site:zeekrlife.com (Zeekr MIX OR autonomous OR cockpit) when:30d',verified:['zeekrlife.com']}
];
export const decode=s=>String(s??'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10))).replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[v]));
export const extract=(raw,tag)=>decode(raw.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'))?.[1]||'').replace(/<[^>]+>/g,'').trim();
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,18);
export async function fetchOneNews(item,fetcher=fetch){
 const rss=new URL('https://news.google.com/rss/search');rss.searchParams.set('q',item.q);rss.searchParams.set('hl','ko');rss.searchParams.set('gl','KR');rss.searchParams.set('ceid','KR:ko');
 const response=await fetcher(rss,{signal:AbortSignal.timeout(9000),headers:{'user-agent':'Mozilla/5.0 (compatible; TwinBloomingMonitor/1.0)'}});
 if(!response.ok)throw Error('RSS HTTP '+response.status+' '+item.name);
 const xml=await response.text();const items=[];
 for(const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const raw=m[1],title=extract(raw,'title'),url=extract(raw,'link'),pub=extract(raw,'pubDate'),sourceName=extract(raw,'source');
  const src=raw.match(/<source\s+url="([^"]*)"[^>]*>/i)?.[1]||'';
  let hostname='';try{hostname=new URL(src).hostname.replace(/^www\./,'')}catch{}
  if(item.verified?.length&&!item.verified.some(v=>hostname===v||hostname.endsWith('.'+v)))continue;
  if(!title||!url.startsWith('https://')||!pub)continue;
  const date=new Date(pub);if(!Number.isFinite(+date))continue;
  items.push({id:'rss-'+hash(title+'|'+url),title,summary:'공개 기사 제목 및 발행 정보입니다. 세부 내용은 원문을 확인하세요.',url,date:date.toISOString().slice(0,10),publishedAt:date.toISOString(),category:item.category,who:item.who,source:sourceName||item.name});
  if(items.length>=14)break;
 }
 return items;
}
export async function fetchNews(fetcher=fetch){
 const settled=await Promise.allSettled(SOURCES.map(s=>fetchOneNews(s,fetcher)));
 let articles=[],sourcesSucceeded=0,errors=[];
 for(let i=0;i<settled.length;i++){const r=settled[i];if(r.status==='fulfilled'){sourcesSucceeded++;articles.push(...r.value)}else errors.push(SOURCES[i].name+': '+String(r.reason?.message||r.reason).slice(0,80))}
 const ids=new Set();articles=articles.filter(a=>{if(ids.has(a.id))return false;ids.add(a.id);return true}).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,75);
 return {articles,sourcesAttempted:SOURCES.length,sourcesSucceeded,partial:sourcesSucceeded!==SOURCES.length,checkedAt:new Date().toISOString(),errors};
}
export function diffNew(current,previous){
 const old=new Set((previous||[]).map(x=>x.id));
 return (current||[]).filter(x=>!old.has(x.id));
}
