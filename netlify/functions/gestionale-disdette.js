'use strict';
const { getStore }=require('@netlify/blobs');
const { authorize }=require('./gestionale-agenda');
const reply=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(body)});
exports.handler=async event=>{
 if(event.httpMethod!=='GET')return reply(405,{error:'METHOD_NOT_ALLOWED'});
 let user;
 try{user=await authorize(event.headers||{})}catch{return reply(503,{error:'AUTH_UNAVAILABLE'})}
 if(!user)return reply(401,{error:'UNAUTHORIZED'});
 const qs=event.queryStringParameters||{};
 const site=qs.site||user.sites[0]||'';
 const date=qs.date||'';
 if(!site||!user.sites.includes(site))return reply(403,{error:'SITE_FORBIDDEN'});
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z')))return reply(400,{error:'INVALID_DATE'});
 let sites;try{sites=JSON.parse(process.env.GESTIONALE_SITE_CALENDARS_JSON||'{}')}catch{return reply(503,{error:'CALENDAR_CONFIGURATION_INVALID'})}
 const ids=Object.values(sites);
 if(ids.some(id=>typeof id!=='string'||!id.trim())||new Set(ids).size!==ids.length)return reply(503,{error:'SITE_CALENDAR_ISOLATION_REQUIRED'});
 const calendar=sites[site];if(!calendar)return reply(503,{error:'SITE_CALENDAR_NOT_CONFIGURED'});
 try{
  const store=getStore('caf-cancellations');
  const history=[];let cursor;
  do{
   const page=await store.list({prefix:'event/',paginate:false,cursor});
   for(const {key} of page.blobs||[]){
    const row=await store.get(key,{type:'json'});
    if(row&&row.calendarId===calendar&&row.date===date)
      history.push({id:row.id,start:row.start,summary:row.summary,category:row.category,cancelledAt:row.cancelledAt,status:'Disdetto'});
   }
   cursor=page.cursor;
  }while(cursor&&history.length<200);
  return reply(200,{site,date,history:history.sort((a,b)=>b.cancelledAt.localeCompare(a.cancelledAt)).slice(0,200)});
 }catch{return reply(503,{error:'HISTORY_UNAVAILABLE'})}
};
