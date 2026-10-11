'use strict';
const CALENDAR_ID=process.env.GOOGLE_CALENDAR_ID||'primary';
const reply=(status,obj)=>({statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:JSON.stringify(obj)});
function settings(){
 const client=process.env.GESTIONALE_GOOGLE_CLIENT_ID;
 const raw=process.env.GESTIONALE_OPERATORS_JSON;
 if(!client||!raw)return null;
 const users=JSON.parse(raw);
 if(!Array.isArray(users)||!users.length)throw new Error('Invalid role mapping');
 return {client,users};
}
async function userFromToken(headers,config){
 const auth=headers.authorization||headers.Authorization||'';
 const match=/^Bearer ([a-zA-Z0-9_.-]+)$/.exec(auth);
 if(!match)return null;
 const res=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(match[1]),{signal:AbortSignal.timeout(6500)});
 if(!res.ok)return null;
 const token=await res.json();
 if(token.aud!==config.client||!['accounts.google.com','https://accounts.google.com'].includes(token.iss)||token.email_verified!== 'true'||!token.email||!token.sub)return null;
 const found=config.users.find(x=>typeof x.email==='string'&&x.email.toLowerCase()===token.email.toLowerCase()&&x.enabled===true);
 if(!found||!['admin','manager','operator','viewer'].includes(found.role)||!Array.isArray(found.sites))return null;
 return {email:token.email,role:found.role,sites:found.sites.filter(x=>typeof x==='string')};
}
async function accessToken(){
 const params=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||'',client_secret:process.env.GOOGLE_CLIENT_SECRET||'',refresh_token:process.env.GOOGLE_REFRESH_TOKEN||'',grant_type:'refresh_token'});
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params,signal:AbortSignal.timeout(6500)});
 if(!r.ok)throw Error('Calendar token unavailable');
 const x=await r.json();if(!x.access_token)throw Error('Calendar token missing');return x.access_token;
}
function dateLocal(x){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(x));
 const val=type=>parts.find(p=>p.type===type)?.value;
 return [val('year'),val('month'),val('day')].join('-');
}
exports.authorize=async(headers)=>{const config=settings();if(!config)return null;return await userFromToken(headers||{},config)};
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return reply(405,{error:'METHOD_NOT_ALLOWED'});
 let config;
 try{config=settings()}catch{return reply(503,{error:'CONFIG_INVALID'})}
 if(!config)return reply(503,{error:'AUTH_NOT_CONFIGURED'});
 let user;try{user=await userFromToken(event.headers||{},config)}catch{return reply(503,{error:'IDENTITY_UNAVAILABLE'})}
 if(!user)return reply(401,{error:'UNAUTHORIZED'});
 const requestedSite=(event.queryStringParameters||{}).site||'';
 const site=requestedSite||user.sites[0]||'';
 const day=(event.queryStringParameters||{}).date||'';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T00:00:00Z')))return reply(400,{error:'INVALID_DATE'});
 if(!site||!user.sites.includes(site))return reply(403,{error:'SITE_FORBIDDEN'});
 // Only known configured site/calendar mappings are accessible.
 let calendarMap;try{calendarMap=JSON.parse(process.env.GESTIONALE_SITE_CALENDARS_JSON||'{}')}catch{return reply(503,{error:'CALENDAR_CONFIGURATION_INVALID'})}
 const ids=Object.values(calendarMap);
 if(ids.some(id=>typeof id!=='string'||!id.trim())||new Set(ids).size!==ids.length)return reply(503,{error:'SITE_CALENDAR_ISOLATION_REQUIRED'});
 const calendarId=calendarMap[site];
 if(typeof calendarId!=='string'||!calendarId)return reply(503,{error:'SITE_CALENDAR_NOT_CONFIGURED'});
 try{
  const access=await accessToken();
  const min=new Date(Date.parse(day+'T00:00:00Z')-24*3600000);
  const max=new Date(Date.parse(day+'T00:00:00Z')+48*3600000);
  const appointments=[];let pageToken='';
  for(let page=0;page<8;page++){
   const url=new URL('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(calendarId)+'/events');
   url.searchParams.set('timeMin',min.toISOString());url.searchParams.set('timeMax',max.toISOString());
   url.searchParams.set('singleEvents','true');url.searchParams.set('showDeleted','false');url.searchParams.set('maxResults','250');
   if(pageToken)url.searchParams.set('pageToken',pageToken);
   const result=await fetch(url,{headers:{Authorization:'Bearer '+access},signal:AbortSignal.timeout(10000)});
   if(!result.ok)throw Error('Google Calendar unavailable');
   const body=await result.json();
   for(const e of (body.items||[])){
    if(!e.start?.dateTime||dateLocal(e.start.dateTime)!==day)continue;
    const props=e.extendedProperties?.private||{};
    // Never return internal cancel codes, calendar provider tokens, or full free-text description.
    appointments.push({id:e.id,start:e.start.dateTime,end:e.end?.dateTime||null,summary:e.summary||'Appuntamento',category:props.service||'',mode:props.appointmentMode||''});
   }
   pageToken=body.nextPageToken||'';if(!pageToken)break;
  }
  return reply(200,{authenticated:true,role:user.role,email:user.email,sites:user.sites,site,date:day,appointments});
 }catch{return reply(503,{error:'CALENDAR_UNAVAILABLE'})}
};
