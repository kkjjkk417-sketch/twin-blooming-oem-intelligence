// Site-scoped persistent snapshots shared across public deployments.
// No server credentials or customer information are exposed through the public site.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
// Local development state is stored under .local-data (ignored by git).
const local=process.env.TWIN_BLOOMING_LOCAL_DEV==='1';
const filename=(storeName,key)=>{const safe=(s)=>String(s).replace(/[^a-zA-Z0-9-]/g,'_').slice(0,90);return join(resolve(process.cwd(),'.local-data'),safe(storeName),safe(key)+'.json')};
let modPromise;
async function blobs(){modPromise ||= import('@netlify/blobs');return modPromise}
export async function readJSON(storeName,key){
  if(local){try{return JSON.parse(await readFile(filename(storeName,key),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
  const {getStore}=await blobs();return await getStore(storeName).get(key,{type:'json',consistency:'strong'});
}
export async function writeJSON(storeName,key,data){
  if(local){const f=filename(storeName,key);await mkdir(resolve(f,'..'),{recursive:true});await writeFile(f,JSON.stringify(data),'utf8');return}
  const {getStore}=await blobs();await getStore(storeName).setJSON(key,data);
}
export function responseJSON(value,status=200){return Response.json(value,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}})}
