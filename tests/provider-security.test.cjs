'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const callback=require('../netlify/functions/google-calendar-callback').handler;
const book=require('../netlify/functions/calendar-book').handler;
const cancel=require('../netlify/functions/calendar-cancel').handler;
const state='a'.repeat(48);
async function mocked(run){
 const old=global.fetch; const id=process.env.GOOGLE_CALENDAR_ID;
 let calls=[];process.env.GOOGLE_CALENDAR_ID='test-calendar';
 global.fetch=async(url,options)=>{calls.push({url:String(url),options});return run.respond(String(url),options)};
 try{await run.check(calls)}finally{global.fetch=old;if(id===undefined)delete process.env.GOOGLE_CALENDAR_ID;else process.env.GOOGLE_CALENDAR_ID=id}
}
test('OAuth rejects missing, mismatched and duplicate state cookies before contacting Google',async()=>{
 await mocked({respond:()=>{throw Error('Unexpected provider call')},check:async calls=>{
 for(const headers of [{},{cookie:'oauth_state='+ 'b'.repeat(48)},{cookie:`oauth_state=${state}; oauth_state=${state}`}]){
 const r=await callback({httpMethod:'GET',headers,queryStringParameters:{code:'example',state}});
 assert.equal(r.statusCode,400);assert.match(r.headers['Set-Cookie'],/Max-Age=0/);
 }
 assert.equal(calls.length,0);
 }});
});
test('OAuth callback rejects unsupported method',async()=>{assert.equal((await callback({httpMethod:'POST'})).statusCode,405)});
test('Booking rejects mail header injection without contacting a provider',async()=>{
 await mocked({respond:()=>{throw Error('Unexpected provider call')},check:async calls=>{
 const r=await book({httpMethod:'POST',body:JSON.stringify({servizio:'ISEE',data:'2027-01-11',ora:'09:00',nome:'Test',telefono:'123',email:'test@example.org\r\nBcc:other@example.org'})});
 assert.equal(r.statusCode,400);assert.equal(calls.length,0);
 }});
});
test('Cancellation rejects malformed codes before contacting Google',async()=>{
 await mocked({respond:()=>{throw Error('Unexpected provider call')},check:async calls=>{
 for(const code of ['short','A'.repeat(200),'AAAA\r\nAAAA']){
 assert.equal((await cancel({httpMethod:'POST',body:JSON.stringify({codice:code})})).statusCode,400);
 }
 assert.equal(calls.length,0);
 }});
});
for(const result of [{items:[{id:'one'},{id:'two'}]},{items:[],nextPageToken:'next'},{items:[{id:'one',start:{dateTime:'invalid'}}]}]){
 test('Cancellation does not delete ambiguous, paginated or invalid-date results '+JSON.stringify(result),async()=>{
 await mocked({respond:async url=>({ok:true,json:async()=>url.includes('oauth2.googleapis.com')?{access_token:'test'}:result}),check:async calls=>{
 const r=await cancel({httpMethod:'POST',body:JSON.stringify({codice:'AAAAAAAA'})});
 assert.ok([400,503].includes(r.statusCode));assert.equal(calls.some(x=>x.options?.method==='DELETE'),false);
 }});
 });
}
