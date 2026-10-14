'use strict';
const {validDate}=require('../netlify/functions/gestionale-date');
const {failure}=require('./practices.cjs');
const json=(statusCode,value)=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(value)});
function calendars({identity,vault,env,activeSites=['molfetta','bari'],fetcher=fetch}){
 function mapping(site){let map;try{map=JSON.parse(env.GESTIONALE_SITE_CALENDARS_JSON||'{}')}catch{failure(503,'CALENDAR_CONFIGURATION_INVALID')}
  if(!map||Array.isArray(map)||typeof map!=='object'||!activeSites.every(s=>typeof map[s]==='string'&&map[s].trim())||map.molfetta===map.bari)failure(503,'SITE_CALENDAR_ISOLATION_REQUIRED');
  if(!activeSites.includes(site))failure(400,'INVALID_SITE');return map[site];
 }
 async function token(){
  if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.GOOGLE_REFRESH_TOKEN)failure(503,'CALENDAR_NOT_CONFIGURED');
  const r=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:env.GOOGLE_REFRESH_TOKEN,grant_type:'refresh_token'}),signal:AbortSignal.timeout(6500)});
  if(!r.ok)failure(503,'CALENDAR_UNAVAILABLE');const x=await r.json();if(!x.access_token)failure(503,'CALENDAR_UNAVAILABLE');return x.access_token;
 }
 async function request(url,access){const r=await fetcher(url,{headers:{Authorization:'Bearer '+access},signal:AbortSignal.timeout(10000)});if(!r.ok)failure(503,'CALENDAR_UNAVAILABLE');return r.json()}
 const localDate=value=>{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));return ['year','month','day'].map(k=>parts.find(x=>x.type===k)?.value).join('-')};
 async function authorized(event){const actor=await identity.authenticate(event.headers||{},'staff');const site=event.queryStringParameters?.site||actor.sites[0];if(!actor.sites.includes(site))failure(403,'SITE_FORBIDDEN');return {actor,site}}
 async function guard(fn,event){try{return await fn(event)}catch(e){return json(e.status||503,{error:e.code||'CALENDAR_UNAVAILABLE'})}}
 async function mutate(site,id,etag,method,payload){const access=await token(),url='https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(mapping(site))+'/events/'+encodeURIComponent(id);
  const r=await fetcher(url,{method,headers:{Authorization:'Bearer '+access,'If-Match':etag,...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(10000)});
  if(!r.ok){const error=Object.assign(Error('Calendar mutation failed'),{status:r.status===412?409:503,code:r.status===412?'APPOINTMENT_VERSION_CONFLICT':'CALENDAR_UNAVAILABLE',definitive:[400,401,403,404,409,412,429].includes(r.status)});throw error;}return method==='DELETE'?{}:r.json();
 }
 return {
  upcomingReminders:async now=>{const result=[];const access=await token();for(const site of activeSites){const url=new URL('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(mapping(site))+'/events');url.searchParams.set('timeMin',new Date(now+23*3600000).toISOString());url.searchParams.set('timeMax',new Date(now+25*3600000).toISOString());url.searchParams.set('singleEvents','true');url.searchParams.set('showDeleted','false');url.searchParams.set('maxResults','250');const page=await request(url,access);if(page.nextPageToken)failure(503,'CALENDAR_PAGINATION_LIMIT');for(const event of page.items||[]){const p=event.extendedProperties?.private;if(event.status!=='cancelled'&&p?.cancelCode&&p.reminder24hSent!=='true')result.push({site,event});}}return result;},
  getEvent:async(site,id)=>request('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(mapping(site))+'/events/'+encodeURIComponent(id),await token()),
  patchEvent:(site,id,etag,payload)=>mutate(site,id,etag,'PATCH',payload),
  deleteEvent:(site,id,etag)=>mutate(site,id,etag,'DELETE'),
  isFree:async(site,start,end,excludeId)=>{const access=await token(),url=new URL('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(mapping(site))+'/events');url.searchParams.set('timeMin',start);url.searchParams.set('timeMax',end);url.searchParams.set('singleEvents','true');url.searchParams.set('showDeleted','false');url.searchParams.set('maxResults','250');const result=await request(url,access);return Array.isArray(result.items)&&!result.nextPageToken&&result.items.every(x=>x.id===excludeId);},
  session:async()=>json(200,{configured:true,clientId:identity.clientId,authenticated:false}),
  agenda:event=>guard(async()=>{
   if(event.httpMethod!=='GET')failure(405,'METHOD_NOT_ALLOWED');
   const {actor,site}=await authorized(event),day=event.queryStringParameters?.date;
   if(!validDate(day))failure(400,'INVALID_DATE');const calendar=mapping(site),access=await token();const appointments=[];let pageToken='';
   for(let page=0;page<8;page++){
    const url=new URL('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(calendar)+'/events');
    url.searchParams.set('timeMin',new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString());url.searchParams.set('timeMax',new Date(Date.parse(day+'T00:00:00Z')+2*86400000).toISOString());url.searchParams.set('singleEvents','true');url.searchParams.set('showDeleted','false');url.searchParams.set('maxResults','250');if(pageToken)url.searchParams.set('pageToken',pageToken);
    const result=await request(url,access);
    for(const e of result.items||[]){if(!e.start?.dateTime||localDate(e.start.dateTime)!==day)continue;const p=e.extendedProperties?.private||{};appointments.push({id:e.id,start:e.start.dateTime,end:e.end?.dateTime||null,summary:e.summary||'Appuntamento',etag:e.etag||null,moveable:site==='molfetta'||!!env.CAF_BARI_SLOTS_JSON,editable:!!p.cancelCode&&['admin','operator','manager'].includes(actor.role),category:p.service||'',mode:p.appointmentMode||''})}
    pageToken=result.nextPageToken||'';if(!pageToken)break;if(page===7)failure(503,'CALENDAR_PAGINATION_LIMIT');
   }
   return json(200,{authenticated:true,role:actor.role,email:actor.email,sites:actor.sites,site,date:day,appointments});
  },event),
  cancellations:event=>guard(async()=>{
   if(event.httpMethod!=='GET')failure(405,'METHOD_NOT_ALLOWED');
   const {site}=await authorized(event),date=event.queryStringParameters?.date;if(!validDate(date))failure(400,'INVALID_DATE');
   const history=vault.list('booking').filter(x=>x.state==='cancelled'&&x.cancelledAt&&x.id.startsWith(site+':'+date+':')).map(x=>({id:x.eventId,start:x.start,summary:'Appuntamento annullato',category:'',cancelledAt:x.cancelledAt}));
   return json(200,{site,date,history});
  },event),
  verifyFree:async row=>{
   try{const site=row.id.split(':')[0],calendar=mapping(site),access=await token();const start=Date.parse(row.start);if(!Number.isFinite(start))return false;
    const url=new URL('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(calendar)+'/events');url.searchParams.set('timeMin',new Date(start).toISOString());url.searchParams.set('timeMax',new Date(start+20*60000).toISOString());url.searchParams.set('singleEvents','true');url.searchParams.set('showDeleted','false');url.searchParams.set('maxResults','250');
    const result=await request(url,access);return Array.isArray(result.items)&&result.items.length===0&&!result.nextPageToken;
   }catch{return false}
  },
  verifyAppointment:async(actor,input)=>{
   try{const calendar=mapping(input.site),access=await token();const data=await request('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(calendar)+'/events/'+encodeURIComponent(input.appointmentId),access);
    return data.id===input.appointmentId&&data.status!=='cancelled'&&typeof data.extendedProperties?.private?.email==='string'&&data.extendedProperties.private.email.toLowerCase()===actor.email.toLowerCase();
   }catch{return false}
  }
 };
}
module.exports={calendars};
