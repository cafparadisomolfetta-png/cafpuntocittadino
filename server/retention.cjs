'use strict';
const {failure}=require('./practices.cjs');
// Durations have no default: the data controller must approve the actual retention policy.
function retentionPlan(vault,policy,now=Date.now()){
 if(!policy||!['730','isee'].every(service=>Number.isInteger(policy[service])&&policy[service]>0&&policy[service]<=36500))throw Error('Approved retention durations required for 730 and ISEE');
 for(const [service,days] of Object.entries(policy))if(![...require('../netlify/functions/practice-services.js').ids,'richiamata'].includes(service)||!Number.isInteger(days)||days<1||days>36500)throw Error('Invalid retention policy');
 const records=vault.list('practice');if(records.some(p=>!policy[p.service]))throw Error('Retention policy missing for an active service');
 return records.filter(p=>['completed','rejected'].includes(p.status)&&Number.isFinite(Date.parse(p.updatedAt))&&now-Date.parse(p.updatedAt)>=policy[p.service]*86400000).map(p=>({id:p.id,site:p.site,service:p.service,updatedAt:p.updatedAt}));
}
function purgeExpired({vault,practices,actor,policy,now=Date.now()}){
 if(actor.role!=='admin'||!actor.authenticated)failure(403,'ADMIN_REQUIRED');
 const plan=retentionPlan(vault,policy,now);
 vault.transaction(()=>{
  for(const row of plan){
   const p=vault.get('practice',row.id);if(!p||p.updatedAt!==row.updatedAt)failure(409,'RETENTION_CONFLICT');
   for(const d of vault.list('document').filter(x=>x.practiceId===row.id)){vault.remove('document',d.id);vault.remove('content',d.id)}
   vault.remove('practice',row.id);vault.audit(actor,'practice.retention_purge',row.id);
  }
 });return {erased:plan.length};
}
module.exports={retentionPlan,purgeExpired};
