'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Vault}=require('./vault.cjs'),{backupVault,restoreVault}=require('./backups.cjs'),{retentionPlan,purgeExpired}=require('./retention.cjs');
function outsideSource(value){if(!value||!path.isAbsolute(value))throw Error('An absolute private path is required');const root=path.resolve(__dirname,'..'),p=path.resolve(value);if(p===root||p.startsWith(root+path.sep))throw Error('Private files cannot be stored in the repository');return p;}
function run(argv,env){
 const key=Buffer.from(env.CAF_VAULT_KEY||'','base64');if(key.length!==32)throw Error('A private vault key is required');
 const [command,arg,target]=argv;
 if(command==='restore'){restoreVault({source:outsideSource(arg),targetDirectory:outsideSource(target),key});key.fill(0);return {restored:true};}
 const vault=new Vault({directory:outsideSource(env.CAF_PRIVATE_DIRECTORY),key});key.fill(0);
 try{
  if(command==='backup'){backupVault(vault,outsideSource(arg));return {backupCreated:true};}
  if(command==='audit-purge'){const days=Number(env.CAF_AUDIT_RETENTION_DAYS);if(env.CAF_PRIVACY_REVIEWED!=='true'||!Number.isInteger(days)||days<1||days>36500)throw Error('Approved audit retention required');return vault.purgeAuditBefore(new Date(Date.now()-days*86400000).toISOString());}
  if(command==='verify')return {auditIntegrity:vault.verifyAudit()};
  const policy=JSON.parse(env.CAF_RETENTION_DAYS_JSON||'null');
  if(command==='retention-preview')return {expired:retentionPlan(vault,policy)};
  if(command==='retention-purge'){
   if(env.CAF_PRIVACY_REVIEWED!=='true')throw Error('Reviewed privacy and retention policy required');
   return purgeExpired({vault,policy,actor:{authenticated:true,role:'admin',subject:'local-maintenance'}});
  }
  throw Error('Supported commands: verify, backup, restore, retention-preview, retention-purge');
 }finally{vault.close()}
}
if(require.main===module){try{console.log(JSON.stringify(run(process.argv.slice(2),process.env)))}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={run};
