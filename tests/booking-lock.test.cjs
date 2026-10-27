'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {withSlotLock}=require('../server/booking-lock.cjs');
test('same slot is serialized and released',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve});
 const first=withSlotLock('2026-11-02|09:00',async()=>{await gate;return 7});
 const second=await withSlotLock('2026-11-02|09:00',async()=>{throw Error('Must not execute')});
 assert.deepEqual(second,{busy:true});
 const other=await withSlotLock('2026-11-02|09:20',async()=>8);
 assert.deepEqual(other,{busy:false,value:8});
 release();
 assert.deepEqual(await first,{busy:false,value:7});
 const again=await withSlotLock('2026-11-02|09:00',async()=>9);
 assert.deepEqual(again,{busy:false,value:9});
});
test('slot releases after an exception',async()=>{
 await assert.rejects(withSlotLock('2026-11-02|10:00',async()=>{throw Error('fail')}));
 assert.equal((await withSlotLock('2026-11-02|10:00',async()=>true)).busy,false);
});
