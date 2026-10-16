import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Local developer server. Never expose this server publicly: it binds to loopback only.
process.env.TWIN_BLOOMING_LOCAL_DEV='1';
const BASE=resolve(fileURLToPath(new URL('./public/',import.meta.url)));
const FUNCTIONS=resolve(fileURLToPath(new URL('./netlify/functions/',import.meta.url)));
const PORT=Number(process.env.PORT)||4173;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.csv':'text/csv; charset=utf-8','.png':'image/png','.ico':'image/x-icon'};
function fail(res,status,message){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify({error:message}))}
const allowed=['feed','patents','alerts','status'];
const server=createServer(async (req,res)=>{
 try{
  const route=new URL(req.url,'http://127.0.0.1:'+PORT);
  if(!['GET','HEAD'].includes(req.method))return fail(res,405,'허용되지 않은 요청입니다');
  if(route.pathname.startsWith('/.netlify/functions/')){
   const name=route.pathname.slice('/.netlify/functions/'.length);
   if(!allowed.includes(name))return fail(res,404,'확인할 수 없는 API');
   const handler=(await import(pathToFileURL(resolve(FUNCTIONS,name+'.mjs')).href)).default;
   const response=await handler(new Request(route.toString(),{method:req.method}));
   res.writeHead(response.status, Object.fromEntries(response.headers));
   return res.end(req.method==='HEAD'?'':Buffer.from(await response.arrayBuffer()));
  }
  const decoded=decodeURIComponent(route.pathname);
  if(decoded.includes('\\')||decoded.includes('\0'))return fail(res,400,'잘못된 경로');
  const relative=decoded==='/'?'index.html':decoded.slice(1);
  const f=resolve(BASE,relative);
  if(f!==BASE&&!f.startsWith(BASE+sep))return fail(res,403,'권한이 없습니다');
  const detail=await stat(f).catch(()=>null);
  if(!detail?.isFile())return fail(res,404,'파일을 찾을 수 없습니다');
  const content=await readFile(f);
  res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff'});
  return res.end(req.method==='HEAD'?'':content);
 }catch(e){console.error('Local server:',e);return fail(res,500,'로컬 실행 오류')}
});
server.listen(PORT,'127.0.0.1',()=>console.log(`TWIN BLOOMING local: http://127.0.0.1:${PORT}`));
