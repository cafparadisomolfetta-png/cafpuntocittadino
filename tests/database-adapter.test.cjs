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
