'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('../server/standalone.cjs');
async function call(method,url){
 let status,headers,body='';
 const res={writeHead:(s,h)=>{status=s;headers=h},end:b=>{body=b||''}};
 await app({method,url},res);
 return {status,headers,body};
}
test('standalone refuses all legacy API paths during migration',async()=>{
 for(const url of ['/.netlify/functions/pratiche','/api/gestionale'])
  for(const method of ['GET','POST']){
   const r=await call(method,url);
   assert.equal(r.status,503);
   assert.match(r.body,/MIGRATION_NOT_READY/);
  }
});
test('availability rejects invalid input on standalone route',async()=>{
 const oldFetch=global.fetch;
 try{
  global.fetch=async()=>{throw Error('No Google request expected')};
  for(const url of ['/api/calendar-availability?date=invalid','/.netlify/functions/calendar-availability?date=invalid','/api/calendar-availability?date=2026-10-27&site=bari']){
   const r=await call('GET',url);
   assert.equal(r.status,400);
  }
  assert.equal((await call('POST','/api/calendar-availability?date=invalid')).status,405);
 }finally{global.fetch=oldFetch}
});
test('standalone rejects traversal and mutation',async()=>{
 assert.equal((await call('GET','/%2e%2e/secret')).status,404);
 assert.equal((await call('POST','/index.html')).status,405);
});

test('Cloe staging requires POST and server-side configuration',async()=>{
 const original=process.env.OPENAI_API_KEY;
 delete process.env.OPENAI_API_KEY;
 try{
  const get=await call('GET','/api/segretaria-ai');
  assert.equal(get.status,405);
  const post=await call('POST','/.netlify/functions/segretaria-ai');
  assert.equal(post.status,503);
 }finally{if(original===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=original;}
});

test('booking and cancellation fail closed without touching Calendar',async()=>{
 const old=global.fetch;
 global.fetch=async()=>{throw Error('No external write allowed')};
 try{
  for(const route of ['/api/calendar-book','/api/calendar-cancel','/.netlify/functions/calendar-book','/.netlify/functions/calendar-cancel']){
   const reply=await call('POST',route);
   assert.equal(reply.status,503);
   assert.match(reply.body,/BOOKING_MIGRATION_LOCKED/);
   assert.equal((await call('GET',route)).status,405);
  }
 }finally{global.fetch=old}
});

test('staging health probe discloses disabled sensitive functions',async()=>{
 const response=await call('GET','/healthz');
 assert.equal(response.status,200);
 const data=JSON.parse(response.body);
 assert.equal(data.ok,true);
 assert.equal(data.bookingEnabled,false);
 assert.equal(data.documentsEnabled,false);
 assert.equal((await call('POST','/healthz')).status,405);
});

test('availability rejects missing Google configuration without external call',async()=>{
 const names=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN'];
 const saved=names.map(name=>process.env[name]);
 const previous=global.fetch;
 try{
  for(const name of names)delete process.env[name];
  global.fetch=async()=>{throw Error('Google must not be contacted')};
  const r=await call('GET','/api/calendar-availability?date=2026-11-03');
  assert.equal(r.status,503);
  assert.match(r.body,/non configurato/);
 }finally{
  names.forEach((name,i)=>{if(saved[i]===undefined)delete process.env[name];else process.env[name]=saved[i]});
  global.fetch=previous;
 }
});

test('availability requires an explicit Molfetta calendar mapping',async()=>{
 const keys=['GOOGLE_CALENDAR_ID','GESTIONALE_SITE_CALENDARS_JSON'];
 const saved=keys.map(k=>process.env[k]);
 const oldFetch=global.fetch;
 try{
  for(const k of keys)delete process.env[k];
  global.fetch=async()=>{throw Error('No external request expected')};
  const result=await call('GET','/api/calendar-availability?date=2026-11-03');
  assert.equal(result.status,503);
  assert.match(result.body,/Identificativo calendario Molfetta/);
 }finally{
  keys.forEach((k,i)=>{if(saved[i]===undefined)delete process.env[k];else process.env[k]=saved[i]});
  global.fetch=oldFetch;
 }
});

test('Google Calendar read works through mocked OAuth and events endpoint',async()=>{
 const keys=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','GOOGLE_CALENDAR_ID','GESTIONALE_SITE_CALENDARS_JSON'];
 const saved=keys.map(k=>process.env[k]);const previousFetch=global.fetch;const requests=[];
 try {
  process.env.GOOGLE_CLIENT_ID='example-client';
  process.env.GOOGLE_CLIENT_SECRET='example-secret';
  process.env.GOOGLE_REFRESH_TOKEN='example-refresh';
  process.env.GOOGLE_CALENDAR_ID='cafparadiso.molfetta@gmail.com';
  delete process.env.GESTIONALE_SITE_CALENDARS_JSON;
  global.fetch=async(url,options)=>{
   requests.push({url:String(url),options});
   if(String(url).includes('oauth2.googleapis.com/token'))return {ok:true,json:async()=>({access_token:'example-access'})};
   if(String(url).includes('googleapis.com/calendar/v3/calendars/'))return {ok:true,json:async()=>({items:[]})};
   throw Error('Unexpected external request');
  };
  const result=await call('GET','/api/calendar-availability?date=2026-11-03&site=molfetta');
  assert.equal(result.status,200);
  assert.ok(Array.isArray(JSON.parse(result.body).slots));
  assert.equal(requests.length,2);
  assert.match(requests[1].url,/cafparadiso.molfetta%40gmail.com/);
  assert.equal(requests[1].options.headers.Authorization,'Bearer example-access');
 } finally {
  keys.forEach((k,i)=>{if(saved[i]===undefined)delete process.env[k];else process.env[k]=saved[i]});
  global.fetch=previousFetch;
 }
});

test('calendar rejects impossible calendar dates',async()=>{
 const answer=await call('GET','/api/calendar-availability?date=2026-02-30');
 assert.equal(answer.status,400);
});
