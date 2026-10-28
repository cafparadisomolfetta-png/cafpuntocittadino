'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Pool}=require('pg');
const {claimSlot,confirmSlot,releaseUnconfirmedSlot,recordCancellation}=require('../server/database.cjs');
test('real PostgreSQL serializes concurrent slot claims and audits cancellation',async()=>{
 const pool=new Pool({connectionString:process.env.DATABASE_URL,max:5});
 try{
  const migration=fs.readFileSync(path.resolve(__dirname,'../server/migrations/001_booking_claims.sql'),'utf8').split('-- Integration requirements')[0];
  await pool.query(migration);
  const stamp=new Date(Date.now()+45*86400000);
  stamp.setUTCHours(10,0,0,0);
  const start=stamp.toISOString(),end=new Date(stamp.getTime()+1200000).toISOString();
  const [a,b]=await Promise.all([claimSlot(pool,{start,end}),claimSlot(pool,{start,end})]);
  assert.equal([a,b].filter(x=>x.held).length,1);
  const winning=a.held?a:b;
  assert.equal(await confirmSlot(pool,{id:Number(winning.id),eventId:'ci-check-'+winning.id}),true);
  assert.equal(await releaseUnconfirmedSlot(pool,{id:Number(winning.id)}),false);
  assert.equal(await recordCancellation(pool,{id:Number(winning.id),eventId:'ci-check-'+winning.id}),true);
  const audit=await pool.query('SELECT id FROM booking_cancellation_audit WHERE claim_id=$1',[winning.id]);
  assert.equal(audit.rowCount,1);
  const third=await claimSlot(pool,{start,end});
  assert.equal(third.held,true);
 }finally{await pool.end()}
});
