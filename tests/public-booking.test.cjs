'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {slots}=require('../netlify/functions/booking-schedule');
const {calendarForSite}=require('../netlify/functions/site-calendars');

test('Molfetta: regular weekdays use 20-minute booking slots',()=>{
 const s=slots('2026-10-12');
 assert.equal(s[0],'09:00');assert.equal(s.at(-1),'18:35');
 assert.equal(s.length,12);
 assert.ok(!s.includes('17:00'));
});
test('Molfetta: Thursday and weekends closed',()=>{
 for(const date of ['2026-10-15','2026-10-17','2026-10-18'])assert.deepEqual(slots(date),[]);
});
test('Molfetta: Friday shorter morning',()=>{
 const s=slots('2026-10-16');assert.equal(s.length,11);
 assert.ok(!s.includes('11:00'));assert.ok(s.includes('10:40'));
});
test('Invalid calendar dates produce no slots',()=>{
 assert.deepEqual(slots('2026-02-30'),[]);assert.deepEqual(slots('garbage'),[]);
});
test('Calendar routing remains fail-closed for Bari',()=>{
 const oldId=process.env.GOOGLE_CALENDAR_ID;
 const oldMap=process.env.GESTIONALE_SITE_CALENDARS_JSON;
 try{
  process.env.GOOGLE_CALENDAR_ID='calendar-molfetta';
  delete process.env.GESTIONALE_SITE_CALENDARS_JSON;
  assert.equal(calendarForSite('molfetta').calendarId,'calendar-molfetta');
  assert.equal(calendarForSite('bari').status,503);
  assert.equal(calendarForSite('other').status,400);
  process.env.GESTIONALE_SITE_CALENDARS_JSON=JSON.stringify({molfetta:'same',bari:'same'});
  assert.equal(calendarForSite('molfetta').status,503);
 }finally{
  if(oldId===undefined)delete process.env.GOOGLE_CALENDAR_ID;else process.env.GOOGLE_CALENDAR_ID=oldId;
  if(oldMap===undefined)delete process.env.GESTIONALE_SITE_CALENDARS_JSON;else process.env.GESTIONALE_SITE_CALENDARS_JSON=oldMap;
 }
});

test('Malformed mapped calendars do not fall back to the primary calendar',()=>{
 const old=process.env.GESTIONALE_SITE_CALENDARS_JSON;
 try{
  for(const invalid of ['[]','null','{}','{"bari":"calendar-bari"}']){
   process.env.GESTIONALE_SITE_CALENDARS_JSON=invalid;
   assert.equal(calendarForSite('molfetta').status,503);
  }
 }finally{
  if(old===undefined)delete process.env.GESTIONALE_SITE_CALENDARS_JSON;
  else process.env.GESTIONALE_SITE_CALENDARS_JSON=old;
 }
});
