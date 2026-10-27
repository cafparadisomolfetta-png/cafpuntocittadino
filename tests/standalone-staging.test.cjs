'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('../server/standalone.cjs');
async function call(method,url){
 let status,headers,body='';
 const res={writeHead:(s,h)=>{status=s;headers=h},end:b=>{body=b||''}};
 app({method,url},res);
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
test('standalone rejects traversal and mutation',async()=>{
 assert.equal((await call('GET','/%2e%2e/secret')).status,404);
 assert.equal((await call('POST','/index.html')).status,405);
});
