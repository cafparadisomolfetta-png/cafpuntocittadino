'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {handler}=require('../netlify/functions/calendar-cancel.js');
test('cancellation rejects unsupported sites before contacting Google',async()=>{
 const oldFetch=global.fetch;
 const oldMap=process.env.GESTIONALE_SITE_CALENDARS_JSON;
 try{
  process.env.GESTIONALE_SITE_CALENDARS_JSON=JSON.stringify({molfetta:'calendar-molfetta'});
  global.fetch=async()=>{throw Error('Google API must not be contacted for unsupported site')};
  const result=await handler({httpMethod:'POST',body:JSON.stringify({codiceDisdetta:'TESTCODE',site:'bari'})});
  assert.equal(result.statusCode,400);
 }finally{
  global.fetch=oldFetch;
  if(oldMap===undefined)delete process.env.GESTIONALE_SITE_CALENDARS_JSON;
  else process.env.GESTIONALE_SITE_CALENDARS_JSON=oldMap;
 }
});
