'use strict';
// Database access for the independent server. No live write routes are enabled.
let Pool;
function createDatabase(connectionString=process.env.DATABASE_URL){
 if(typeof connectionString!=='string'||!connectionString.trim())throw new Error('DATABASE_URL not configured');
 Pool ||= require('pg').Pool;
 return new Pool({connectionString,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:10000,ssl:process.env.PGSSL==='require'?{rejectUnauthorized:true}:undefined});
}
async function claimSlot(pool,{site='molfetta',start,end}){
 if(site!=='molfetta'||!/^\d{4}-\d{2}-\d{2}T/.test(start||'')||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end)))throw new TypeError('Invalid slot');
 const minutes=(Date.parse(end)-Date.parse(start))/60000;
 if(minutes!==20)throw new TypeError('Invalid slot duration');
 const sql="INSERT INTO booking_slot_claims (site,slot_start,slot_end,state) VALUES ($1,$2,$3,'held') ON CONFLICT DO NOTHING RETURNING id";
 const result=await pool.query(sql,[site,start,end]);
 return result.rows.length?{held:true,id:result.rows[0].id}:{held:false};
}
async function confirmSlot(pool,{id,eventId}){
 if(!Number.isSafeInteger(id)||id<1||typeof eventId!=='string'||!eventId.trim())throw new TypeError('Invalid booking reference');
 const result=await pool.query("UPDATE booking_slot_claims SET state='confirmed',external_event_id=$2,modified_at=now() WHERE id=$1 AND state='held' RETURNING id",[id,eventId]);
 return result.rows.length===1;
}
async function releaseUnconfirmedSlot(pool,{id}){
 if(!Number.isSafeInteger(id)||id<1)throw new TypeError('Invalid booking reference');
 const result=await pool.query("UPDATE booking_slot_claims SET state='expired',modified_at=now() WHERE id=$1 AND state='held' AND external_event_id IS NULL RETURNING id",[id]);
 return result.rows.length===1;
}
async function recordCancellation(pool,{id,eventId}){
 if(!Number.isSafeInteger(id)||id<1||typeof eventId!=='string'||!eventId.trim())throw new TypeError('Invalid cancellation reference');
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const claim=await client.query("SELECT id,site,slot_start,external_event_id FROM booking_slot_claims WHERE id=$1 AND state='confirmed' FOR UPDATE",[id]);
  if(claim.rows.length!==1 || claim.rows[0].external_event_id!==eventId){
   await client.query('ROLLBACK');
   return false;
  }
  const row=claim.rows[0];
  await client.query("INSERT INTO booking_cancellation_audit (claim_id,external_event_id,site,slot_start) VALUES ($1,$2,$3,$4)",[id,eventId,row.site,row.slot_start]);
  await client.query("UPDATE booking_slot_claims SET state='cancelled',modified_at=now() WHERE id=$1 AND state='confirmed'",[id]);
  await client.query('COMMIT');
  return true;
 }catch(error){
  await client.query('ROLLBACK');
  throw error;
 }finally{client.release()}
}
module.exports={createDatabase,claimSlot,confirmSlot,releaseUnconfirmedSlot,recordCancellation};
