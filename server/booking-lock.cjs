'use strict';
// Process-local reservation serialization for staging only.
// Production requires a shared transactional lock across all instances.
const active=new Set();
async function withSlotLock(slot,work){
 if(typeof slot!=='string'||!/^\d{4}-\d{2}-\d{2}\|\d{2}:\d{2}$/.test(slot))throw new TypeError('Invalid slot key');
 if(active.has(slot))return {busy:true};
 active.add(slot);
 try{return {busy:false,value:await work()}}
 finally{active.delete(slot)}
}
module.exports={withSlotLock};
