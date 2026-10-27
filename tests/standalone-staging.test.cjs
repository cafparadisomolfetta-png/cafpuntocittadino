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
 for(const url of ['/.netlify/functions/calendar-book','/.netlify/functions/pratiche','/api/gestionale'])
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
