import {previous} from './_shared/monitor.mjs';
import {responseJSON} from './_shared/storage.mjs';
export default async ()=>{
 const [news,patents]=await Promise.all([previous('news'),previous('patent-snapshot')]);
 return responseJSON({site:'TWIN BLOOMING',news:{checkedAt:news?.checkedAt||null,sourcesSucceeded:news?.sourcesSucceeded||0,items:news?.articles?.length||0},patents:{checkedAt:patents?.checkedAt||null,items:patents?.entries?.length||0},configured:{kipris:!!process.env.KIPRIS_PLUS_API_KEY,epo:!!(process.env.EPO_OPS_KEY&&process.env.EPO_OPS_SECRET),email:!!(process.env.RESEND_API_KEY&&process.env.ALERT_TO_EMAIL&&process.env.ALERT_FROM_EMAIL)},serverTime:new Date().toISOString()});
};
