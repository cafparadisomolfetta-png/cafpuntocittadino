'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {calendars}=require('../server/calendar.cjs');
const actor={authenticated:true,subject:'op-one',email:'test@example.invalid',role:'operator',sites:['molfetta']};
const env={GESTIONALE_SITE_CALENDARS_JSON:'{"molfetta":"calendar-one","bari":"calendar-two"}',GOOGLE_CLIENT_ID:'test',GOOGLE_CLIENT_SECRET:'test',GOOGLE_REFRESH_TOKEN:'test'};
const event={httpMethod:'GET',headers:{authorization:'test'},queryStringParameters:{site:'molfetta',date:'2027-01-11'}};
test('Private agenda uses live operator permissions and never returns cancellation codes',async()=>{
 let enabled=true,calls=0;
 const identity={clientId:'test',authenticate:async()=>{if(!enabled){const e=Error();e.code='STAFF_FORBIDDEN';e.status=403;throw e}return actor}};
 const api=calendars({identity,env,vault:{list:()=>[]},fetcher:async url=>{calls++;return {ok:true,json:async()=>String(url).includes('oauth2.googleapis')?{access_token:'test'}:{items:[{id:'event',summary:'Appuntamento',start:{dateTime:'2027-01-11T09:00:00+01:00'},end:{dateTime:'2027-01-11T09:20:00+01:00'},description:'private description',extendedProperties:{private:{cancelCode:'secret-cancel'}}}]}}}});
 const result=await api.agenda(event);assert.equal(result.statusCode,200);assert.equal(JSON.parse(result.body).appointments.length,1);assert.ok(!result.body.includes('secret-cancel'));assert.ok(!result.body.includes('private description'));enabled=false;
 assert.equal((await api.agenda(event)).statusCode,403);assert.equal(calls,2);
});
test('Appointment linkage matches both site calendar and verified account email',async()=>{
 let email=actor.email,requested=[];
 const api=calendars({identity:{},env,vault:{},fetcher:async url=>{requested.push(String(url));return {ok:true,json:async()=>String(url).includes('oauth2.googleapis')?{access_token:'test'}:{id:'0123456789abcdef',extendedProperties:{private:{email}}}}}});
 assert.equal(await api.verifyAppointment(actor,{site:'molfetta',appointmentId:'0123456789abcdef'}),true);
 assert.ok(requested.some(url=>url.includes('/calendar-one/events/')));email='different@example.invalid';assert.equal(await api.verifyAppointment(actor,{site:'molfetta',appointmentId:'0123456789abcdef'}),false);
});
test('Shared calendars, unknown sites and paginated overflow fail closed',async()=>{
 const identity={authenticate:async()=>actor};
 const shared=calendars({identity,env:{...env,GESTIONALE_SITE_CALENDARS_JSON:'{"molfetta":"same","bari":"same"}'},vault:{}});assert.equal((await shared.agenda(event)).statusCode,503);
 const api=calendars({identity,env,vault:{},fetcher:async url=>({ok:true,json:async()=>String(url).includes('oauth2.googleapis')?{access_token:'test'}:{items:[],nextPageToken:'always'}})});
 assert.equal((await api.agenda({...event,queryStringParameters:{site:'bari',date:'2027-01-11'}})).statusCode,403);
 const result=await api.agenda(event);assert.equal(result.statusCode,503);assert.equal(JSON.parse(result.body).error,'CALENDAR_PAGINATION_LIMIT');
});
