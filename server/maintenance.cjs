'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Vault}=require('./vault.cjs'),{backupVault,restoreVault}=require('./backups.cjs'),{retentionPlan,purgeExpired}=require('./retention.cjs');
function outsideSource(value){
 if(!value||!path.isAbsolute(value))throw Error('An absolute private path is required');
 const root=fs.realpathSync(path.resolve(__dirname,'..')),p=path.resolve(value),inside=x=>x===root||x.startsWith(root+path.sep);
 if(inside(p))throw Error('Private files cannot be stored in the repository');
 let parent;try{parent=fs.realpathSync(path.dirname(p))}catch{throw Error('Existing private parent required')}
 if(inside(parent)||fs.existsSync(p)&&(fs.lstatSync(p).isSymbolicLink()||inside(fs.realpathSync(p))))throw Error('Private path cannot resolve through a link into source');
 return p;
}
function run(argv,env){
 const [command,arg,target]=argv;
 const counts={verify:1,backup:2,restore:3,'retention-preview':1,'retention-purge':1,'audit-purge':1};
 if(!Object.hasOwn(counts,command)||argv.length!==counts[command])throw Error('Supported commands: verify, backup, restore, retention-preview, retention-purge, audit-purge; supply exact arguments');
 const key=Buffer.from(env.CAF_VAULT_KEY||'','base64');if(key.length!==32)throw Error('A private vault key is required');let vault;
 try{
  if(command==='restore'){restoreVault({source:outsideSource(arg),targetDirectory:outsideSource(target),key});return {restored:true};}
  const backupTarget=command==='backup'?outsideSource(arg):null;
  vault=new Vault({directory:outsideSource(env.CAF_PRIVATE_DIRECTORY),key,requireExisting:true,readOnly:['verify','retention-preview'].includes(command)});
  if(command==='backup'){backupVault(vault,backupTarget);return {backupCreated:true};}
  if(command==='audit-purge'){const days=Number(env.CAF_AUDIT_RETENTION_DAYS);if(env.CAF_PRIVACY_REVIEWED!=='true'||!Number.isInteger(days)||days<1||days>36500)throw Error('Approved audit retention required');return vault.purgeAuditBefore(new Date(Date.now()-days*86400000).toISOString());}
  if(command==='verify'){if(!vault.verifyAudit())throw Error('Audit integrity verification failed');return {auditIntegrity:true};}
  const policy=JSON.parse(env.CAF_RETENTION_DAYS_JSON||'null');
  if(command==='retention-preview')return {expired:retentionPlan(vault,policy)};
  if(command==='retention-purge'){
   if(env.CAF_PRIVACY_REVIEWED!=='true')throw Error('Reviewed privacy and retention policy required');
   return purgeExpired({vault,policy,actor:{authenticated:true,role:'admin',subject:'local-maintenance'}});
  }
  throw Error('Supported commands: verify, backup, restore, retention-preview, retention-purge');
 }finally{key.fill(0);if(vault)vault.close()}
}
if(require.main===module){try{console.log(JSON.stringify(run(process.argv.slice(2),process.env)))}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={run};
