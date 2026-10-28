'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createDatabase,claimSlot}=require('../server/database.cjs');
test('database connection requires server-only configuration',()=>{
 assert.throws(()=>createDatabase(''),/DATABASE_URL/);
});
test('atomic slot claim uses a parameterized query and honors conflicts',async()=>{
 let seen;
 const pool={query:async(sql,args)=>{seen={sql,args};return {rows:[{id:7}]}}};
 assert.deepEqual(await claimSlot(pool,{start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T09:20:00+01:00'}),{held:true,id:7});
 assert.match(seen.sql,/ON CONFLICT DO NOTHING/);
 assert.equal(seen.args[0],'molfetta');
 assert.deepEqual(await claimSlot({query:async()=>({rows:[]})},{start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T09:20:00+01:00'}),{held:false});
 await assert.rejects(claimSlot(pool,{site:'bari',start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T09:20:00+01:00'}),/Invalid slot/);
});

test('pending claims can be confirmed or expired only from held state',async()=>{
 const {confirmSlot,releaseUnconfirmedSlot}=require('../server/database.cjs');
 const calls=[];
 const pool={query:async(sql,args)=>{calls.push({sql,args});return {rows:[{id:12}]}}};
 assert.equal(await confirmSlot(pool,{id:12,eventId:'google-test-event'}),true);
 assert.match(calls[0].sql,/state='held'/);
 assert.deepEqual(calls[0].args,[12,'google-test-event']);
 assert.equal(await releaseUnconfirmedSlot(pool,{id:12}),true);
 assert.match(calls[1].sql,/external_event_id IS NULL/);
 await assert.rejects(confirmSlot(pool,{id:0,eventId:'x'}),/Invalid booking reference/);
 await assert.rejects(releaseUnconfirmedSlot(pool,{id:-1}),/Invalid booking reference/);
});

test('cancellation audit is transactional',async()=>{
 const {recordCancellation}=require('../server/database.cjs');
 const steps=[];
 const client={query:async(sql)=>{steps.push(sql);return sql.startsWith('SELECT')?{rows:[{site:'molfetta',slot_start:'2026-11-03T08:00:00Z',external_event_id:'event-12'}]}:{rows:[]}},release:()=>{steps.push('RELEASE')}};
 assert.equal(await recordCancellation({connect:async()=>client},{id:12,eventId:'event-12'}),true);
 assert.equal(steps[0],'BEGIN');
 assert.equal(steps.at(-2),'COMMIT');
 assert.equal(steps.at(-1),'RELEASE');
});
