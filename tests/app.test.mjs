import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SOURCES,extract,fetchOneNews,diffNew} from '../netlify/functions/_shared/news.mjs';
import {queryPatent,parseKipris,parseEpo} from '../netlify/functions/_shared/patent-api.mjs';

test('production publishes only /public, never server API keys',()=>{
 const cfg=readFileSync(new URL('../netlify.toml',import.meta.url),'utf8');
 assert.match(cfg,/publish\s*=\s*"public"/);
 assert.doesNotMatch(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),/KIPRIS_PLUS_API_KEY|EPO_OPS_SECRET|RESEND_API_KEY/);
});
test('RSS parses real item only from allowlisted official domain',async()=>{
 const xml=`<rss><channel><item><title><![CDATA[OLED 차량용 발표]]></title><link>https://news.google.com/articles/123</link><pubDate>Thu, 15 Oct 2026 02:00:00 GMT</pubDate><source url="https://news.samsungdisplay.com">Samsung Display</source></item><item><title>Unverified</title><link>https://news.google.com/articles/456</link><pubDate>Thu, 15 Oct 2026 02:00:00 GMT</pubDate><source url="https://unknown.test">Unknown</source></item></channel></rss>`;
 const item=await fetchOneNews(SOURCES[0],async()=>({ok:true,text:async()=>xml}));
 assert.equal(item.length,1);assert.equal(item[0].title,'OLED 차량용 발표');assert.ok(item[0].id.startsWith('rss-'));
});
test('new item detection excludes previous IDs',()=>{
 const result=diffNew([{id:'a'},{id:'b'}],[{id:'a'}]);assert.deepEqual(result,[{id:'b'}]);
});
test('KIPRIS parsed identifiers are grounded, not fabricated',()=>{
 const xml='<items><item><inventionTitle>롤러블 디스플레이 장치</inventionTitle><applicationNumber>10-2026-1234567</applicationNumber><applicationDate>20261015</applicationDate><applicantName>삼성디스플레이</applicantName></item></items>';
 assert.equal(parseKipris(xml)[0].number,'10-2026-1234567');
});
test('KIPRIS key absent returns disabled, not invented patent results',async()=>{
 const out=await queryPatent({region:'kr',keyword:'롤러블',assignee:'삼성디스플레이'},undefined,{});
 assert.equal(out.connected,false);assert.deepEqual(out.results,[]);
});
test('EPO key absent returns disabled',async()=>{
 const out=await queryPatent({region:'world',keyword:'rollable display',assignee:'BOE'},undefined,{});
 assert.equal(out.connected,false);assert.deepEqual(out.results,[]);
});
test('EPO namespaced XML is parsed without fabricated details',()=>{
 const s='<exchange-document><bibliographic-data><invention-title lang="en">Flexible Display</invention-title><doc-number>1234567</doc-number><applicant-name>BOE</applicant-name><date>20261014</date></bibliographic-data></exchange-document>';
 assert.equal(parseEpo(s)[0].title,'Flexible Display');
});
