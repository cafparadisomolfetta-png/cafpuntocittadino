'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reserveAppointment}=require('../server/booking-orchestrator.cjs');
test('conflicting claim must never call Google',async()=>{
 let calls=0;
 const pool={query:async()=>({rows:[]})};
 const r=await reserveAppointment({pool,start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T09:20:00+01:00',checkAvailability:async()=>{calls++},createEvent:async()=>{calls++}});
 assert.equal(r.code,'SLOT_CONFLICT');
 assert.equal(calls,0);
});
test('unknown Google outcome retains hold for reconciliation',async()=>{
 const sql=[];
 const pool={query:async(query)=>{sql.push(query);return {rows:[{id:19}]}}};
 const r=await reserveAppointment({pool,start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T09:20:00+01:00',checkAvailability:async()=>true,createEvent:async()=>{throw Error('timeout')}});
 assert.equal(r.code,'RECONCILIATION_REQUIRED');
 assert.equal(sql.some(x=>x.includes("state='expired'")),false);
});
test('calendar unavailable releases unconfirmed hold',async()=>{
 const sql=[];
 const pool={query:async(query)=>{sql.push(query);return {rows:[{id:20}]}}};
 const r=await reserveAppointment({pool,start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T09:20:00+01:00',checkAvailability:async()=>false,createEvent:async()=>{throw Error('must not write')}});
 assert.equal(r.code,'CALENDAR_UNAVAILABLE');
 assert.equal(sql.some(x=>x.includes("state='expired'")),true);
});
