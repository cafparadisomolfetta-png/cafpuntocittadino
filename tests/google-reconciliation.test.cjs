'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inspectGoogleEvent}=require('../server/google-reconciliation.cjs');
const {googleEventId}=require('../server/google-event-id.cjs');
const secret='a'.repeat(40),claimId=7,id=googleEventId({claimId,secret});
const common={claimId,secret,calendarId:'calendar@example.com',accessToken:'test'};
test('read-only reconciliation locates stable Google event',async()=>{
 const found=await inspectGoogleEvent({...common,fetchImpl:async(url,options)=>{
  assert.match(url,/googleapis.com\/calendar\/v3\/calendars/);
  assert.equal(options.method,'GET');
  return {status:200,ok:true,json:async()=>({id,status:'confirmed',start:{dateTime:'2026-11-03T09:00:00+01:00'},end:{dateTime:'2026-11-03T09:20:00+01:00'}})};
 }});
 assert.equal(found.state,'found');
 assert.equal(found.eventId,id);
});
test('404 is distinguished from uncertain provider failures',async()=>{
 const missing=await inspectGoogleEvent({...common,fetchImpl:async()=>({status:404,ok:false})});
 assert.equal(missing.state,'not_found');
 const uncertain=await inspectGoogleEvent({...common,fetchImpl:async()=>({status:503,ok:false})});
 assert.equal(uncertain.state,'unknown');
});
