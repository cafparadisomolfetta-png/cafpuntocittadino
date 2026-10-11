'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {handler}=require('../netlify/functions/gestionale-agenda.js');
const oldFetch=global.fetch;
const old={client:process.env.GESTIONALE_GOOGLE_CLIENT_ID,users:process.env.GESTIONALE_OPERATORS_JSON,sites:process.env.GESTIONALE_SITE_CALENDARS_JSON,admin:process.env.GESTIONALE_ADMIN_EMAIL};
test.after(()=>{global.fetch=oldFetch;for(const [key,val] of Object.entries({GESTIONALE_GOOGLE_CLIENT_ID:old.client,GESTIONALE_OPERATORS_JSON:old.users,GESTIONALE_SITE_CALENDARS_JSON:old.sites,GESTIONALE_ADMIN_EMAIL:old.admin})){if(val===undefined)delete process.env[key];else process.env[key]=val;}});
test('refuse requests without authentication',async()=>{
 process.env.GESTIONALE_GOOGLE_CLIENT_ID='test-client';
 process.env.GESTIONALE_ADMIN_EMAIL='admin@example.org';
 process.env.GESTIONALE_OPERATORS_JSON=JSON.stringify([{email:'operator@example.org',role:'operator',sites:['molfetta'],enabled:true}]);
 const r=await handler({httpMethod:'GET',headers:{},queryStringParameters:{site:'molfetta',date:'2026-10-12'}});
 assert.equal(r.statusCode,401);
});
test('operator cannot access another site even when selecting it manually',async()=>{
 process.env.GESTIONALE_SITE_CALENDARS_JSON=JSON.stringify({molfetta:'calendar-molfetta',bari:'calendar-bari'});
 global.fetch=async url=>{
  assert.match(String(url),/tokeninfo/);
  return {ok:true,json:async()=>({aud:'test-client',iss:'accounts.google.com',email_verified:'true',email:'operator@example.org',sub:'sample-google-sub'})};
 };
 const r=await handler({httpMethod:'GET',headers:{authorization:'Bearer example.jwt.token'},queryStringParameters:{site:'bari',date:'2026-10-12'}});
 assert.equal(r.statusCode,403);
});
test('reject shared calendar between two independent sites',async()=>{
 process.env.GESTIONALE_SITE_CALENDARS_JSON=JSON.stringify({molfetta:'shared',bari:'shared'});
 const r=await handler({httpMethod:'GET',headers:{authorization:'Bearer example.jwt.token'},queryStringParameters:{site:'molfetta',date:'2026-10-12'}});
 assert.equal(r.statusCode,503);
 assert.equal(JSON.parse(r.body).error,'SITE_CALENDAR_ISOLATION_REQUIRED');
});
test('refuse requests when provider token exchange fails',async()=>{
 const r=await handler({httpMethod:'GET',headers:{authorization:'Bearer example.jwt.token'},queryStringParameters:{site:'molfetta',date:'2026-10-12'}});
 assert.equal(r.statusCode,503);
});

test('reject invalid calendar day before requesting calendar data',async()=>{
 process.env.GESTIONALE_SITE_CALENDARS_JSON=JSON.stringify({molfetta:'calendar-molfetta',bari:'calendar-bari'});
 global.fetch=async url=>{
  if(String(url).includes('tokeninfo'))return {ok:true,json:async()=>({aud:'test-client',iss:'accounts.google.com',email_verified:'true',email:'operator@example.org',sub:'sample-google-sub'})};
  throw new Error('No Google Calendar call expected');
 };
 const r=await handler({httpMethod:'GET',headers:{authorization:'Bearer example.jwt.token'},queryStringParameters:{site:'molfetta',date:'2026-02-30'}});
 assert.equal(r.statusCode,400);
});
