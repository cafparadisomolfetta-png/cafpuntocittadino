'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {handler}=require('../netlify/functions/pratiche');
test('practices endpoint remains unavailable for reads and writes',async()=>{
 for(const httpMethod of ['GET','POST','PUT','DELETE']){
  const response=await handler({httpMethod,body:JSON.stringify({name:'sensitive'})});
  assert.equal(response.statusCode,503);
  assert.equal(response.headers['Cache-Control'],'no-store');
  assert.equal(JSON.parse(response.body).code,'PRACTICES_NOT_ACTIVE');
  assert.equal(response.body.includes('sensitive'),false);
 }
});
test('preflight requests cannot activate document intake',async()=>{
 const response=await handler({httpMethod:'OPTIONS'});
 assert.equal(response.statusCode,405);
});
