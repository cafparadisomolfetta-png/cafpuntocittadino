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
module.exports={createDatabase,claimSlot};
