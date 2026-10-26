'use strict';
// Encrypted off-site snapshots. This command never starts the private app.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{parseEnv}=require('node:util'),{spawnSync}=require('node:child_process');
const {Vault}=require('../server/vault.cjs'),{backupVault,restoreVault}=require('../server/backups.cjs');
const CONFIG='/etc/cafpuntocittadino/backup',STATE='/var/lib/cafpuntocittadino-backup',SOURCE=path.resolve(__dirname,'..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function writePrivate(file,value){fs.writeFileSync(file,value,{mode:0o600,flag:'wx'});}
function regular(file){const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Regular file required');return stat;}
function counts(vault){return vault.db.prepare('SELECT kind,COUNT(*) AS count FROM records GROUP BY kind ORDER BY kind').all().map(row=>({kind:row.kind,count:Number(row.count)}));}
function createStage({directory,runtimeFile,sourceDirectory,sourceFiles,hostFiles=[],commit='synthetic'}){
 if(!path.isAbsolute(directory)||fs.existsSync(directory))throw Error('New absolute stage required');
 const runtimeBytes=fs.readFileSync(runtimeFile),env=parseEnv(runtimeBytes.toString('utf8')),files=[];fs.mkdirSync(directory,{mode:0o700});
 function copy(from,to,snapshot){regular(from);const destination=path.join(directory,to);fs.mkdirSync(path.dirname(destination),{recursive:true,mode:0o700});const bytes=snapshot||fs.readFileSync(from);writePrivate(destination,bytes);files.push({path:to,sha256:hash(bytes)});}
 copy(runtimeFile,'config/runtime.env',runtimeBytes);
 for(const name of sourceFiles){if(!name||path.isAbsolute(name)||name.split('/').some(part=>part==='..'||part===''))throw Error('Unsafe source path');copy(path.join(sourceDirectory,name),'code/'+name);}
 for(const name of hostFiles){if(!path.isAbsolute(name))throw Error('Absolute host path required');copy(name,'config/host/'+name.slice(1));}
 const manifest={schema:1,createdAt:new Date().toISOString(),commit,files,vaultInitialized:false};
 const vaultDirectory=env.CAF_PRIVATE_DIRECTORY;
 if(!vaultDirectory||!path.isAbsolute(vaultDirectory))throw Error('Private vault path required');
 if(fs.existsSync(path.join(vaultDirectory,'vault.sqlite'))){
  const key=Buffer.from(env.CAF_VAULT_KEY||'','base64');if(key.length!==32)throw Error('Vault key required');let vault;
  try{vault=new Vault({directory:vaultDirectory,key,readOnly:true,requireExisting:true});assert.equal(vault.verifyAudit(),true);manifest.recordCounts=counts(vault);manifest.auditRows=Number(vault.db.prepare('SELECT COUNT(*) AS count FROM audit').get().count);backupVault(vault,path.join(directory,'vault.cafbackup'));manifest.vaultInitialized=true;files.push({path:'vault.cafbackup',sha256:hash(fs.readFileSync(path.join(directory,'vault.cafbackup')))});}
  finally{vault?.close();key.fill(0);}
 }
 writePrivate(path.join(directory,'manifest.json'),JSON.stringify(manifest)+'\n');return manifest;
}
function verifyStage(directory,restoreDirectory){
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));if(manifest.schema!==1||!Array.isArray(manifest.files))throw Error('Invalid manifest');
 for(const row of manifest.files){if(typeof row.path!=='string'||path.isAbsolute(row.path)||row.path.split('/').some(part=>part==='..'||part===''))throw Error('Unsafe manifest path');regular(path.join(directory,row.path));assert.equal(hash(fs.readFileSync(path.join(directory,row.path))),row.sha256);}
 let documents=0;
 if(manifest.vaultInitialized){
  const env=parseEnv(fs.readFileSync(path.join(directory,'config/runtime.env'),'utf8')),key=Buffer.from(env.CAF_VAULT_KEY||'','base64');let vault;
  try{
   restoreVault({source:path.join(directory,'vault.cafbackup'),targetDirectory:restoreDirectory,key});vault=new Vault({directory:restoreDirectory,key,readOnly:true,requireExisting:true});assert.equal(vault.verifyAudit(),true);assert.deepEqual(counts(vault),manifest.recordCounts);assert.equal(Number(vault.db.prepare('SELECT COUNT(*) AS count FROM audit').get().count),manifest.auditRows);
   // Decrypt every record, including categories not known to the current UI.
   for(const row of vault.db.prepare('SELECT kind,id FROM records').all())vault.get(row.kind,row.id);
   for(const document of vault.list('document')){const bytes=Buffer.from(vault.get('content',document.id)?.content||'','base64');assert.equal(hash(bytes),document.sha256);documents++;}
  }finally{vault?.close();key.fill(0);}
 }
 return {filesVerified:manifest.files.length,vaultInitialized:manifest.vaultInitialized,documentsVerified:documents};
}
function privateConfig(){
 for(const name of ['connection.json','id_ed25519','known_hosts','restic-password','recovery-confirmed.json','access-ready.json']){const stat=regular(path.join(CONFIG,name));if(stat.uid!==0||(stat.mode&0o077))throw Error('Root-only configuration required');}
 const config=JSON.parse(fs.readFileSync(CONFIG+'/connection.json','utf8'));if(!/^u[0-9]+$/.test(config.user)||config.host!==config.user+'.your-storagebox.de')throw Error('Invalid destination');
 if(JSON.parse(fs.readFileSync(CONFIG+'/recovery-confirmed.json','utf8')).confirmedByOwner!==true)throw Error('Recovery copy required');return config;
}
function restic(config,args){
 const result=spawnSync('/usr/bin/restic',['--repo','sftp:'+config.user+'@'+config.host+':punto-cittadino-restic','--password-file',CONFIG+'/restic-password','--cache-dir',STATE+'/cache','-o','sftp.command='+process.execPath+' '+path.join(__dirname,'backup-sftp.cjs'),...args],{encoding:'utf8',maxBuffer:32*1024*1024,timeout:90*60000,env:{...process.env,LC_ALL:'C'},shell:false});
 const log=path.join(STATE,'last-restic.log');fs.writeFileSync(log,String(result.stdout||'')+'\n'+String(result.stderr||''),{mode:0o600});fs.chmodSync(log,0o600);
 if(result.status!==0)throw Error('RESTIC_'+String(result.status??'UNAVAILABLE'));return result.stdout;
}
function stateUpdate(value){const file=STATE+'/status.json',before=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};const temporary=STATE+'/status-'+crypto.randomUUID()+'.json';writePrivate(temporary,JSON.stringify({...before,...value})+'\n');fs.renameSync(temporary,file);}
function backupStage(config,stage,tag){const lines=restic(config,['backup','--json','--tag',tag,stage]).trim().split('\n').map(line=>JSON.parse(line));const snapshot=lines.findLast(row=>row.message_type==='summary')?.snapshot_id;if(!/^[a-f0-9]{8,64}$/.test(snapshot||''))throw Error('Snapshot ID required');return snapshot;}
function restoreAndVerify(config,snapshot,stage){
 const root=fs.mkdtempSync(STATE+'/restore-check-');fs.chmodSync(root,0o700);
 try{restic(config,['restore',snapshot,'--target',root]);return verifyStage(path.join(root,stage.slice(1)),path.join(root,'validated-vault'));}
 finally{fs.rmSync(root,{recursive:true,force:true});}
}
function main(mode){
 if(process.getuid?.()!==0)throw Error('Root required');process.umask(0o077);fs.mkdirSync(STATE,{recursive:true,mode:0o700});const stateStat=fs.lstatSync(STATE);if(!stateStat.isDirectory()||stateStat.isSymbolicLink()||stateStat.uid!==0||(stateStat.mode&0o077))throw Error('Private state required');const config=privateConfig();
 if(mode==='init'){
  try{restic(config,['snapshots','--json']);}catch{restic(config,['init']);}
  stateUpdate({repositoryInitializedAt:new Date().toISOString()});console.log('BACKUP_REPOSITORY_READY');return;
 }
 if(mode==='check'){restic(config,['check','--read-data']);stateUpdate({repositoryCheckedAt:new Date().toISOString()});console.log('BACKUP_REPOSITORY_CHECK_OK');return;}
 if(mode==='verify'){
  const status=JSON.parse(fs.readFileSync(STATE+'/status.json','utf8'));if(!/^[a-f0-9]{8,64}$/.test(status.snapshot||'')||!status.stage?.startsWith(STATE+'/production-'))throw Error('Production snapshot required');
  const result=restoreAndVerify(config,status.snapshot,status.stage);stateUpdate({productionRestoreVerifiedAt:new Date().toISOString(),productionRestore:result});console.log(JSON.stringify({offsiteProductionRestore:true,...result}));return;
 }
 const temporary=fs.mkdtempSync(STATE+'/'+(mode==='self-test'?'self-test-':'production-'));fs.chmodSync(temporary,0o700);const stage=path.join(temporary,'stage');
 try{
  if(mode==='self-test'){
   const fixture=path.join(temporary,'fixture');fs.mkdirSync(fixture,{mode:0o700});const key=crypto.randomBytes(32);let vault;
   try{vault=new Vault({directory:path.join(fixture,'vault'),key});vault.transaction(()=>{const bytes=Buffer.from('%PDF-1.4\nsynthetic-offsite-restore-check\n%%EOF');vault.put('practice','synthetic-practice',{id:'synthetic-practice',status:'completed'});vault.put('document','synthetic-document',{id:'synthetic-document',sha256:hash(bytes)});vault.put('content','synthetic-document',{content:bytes.toString('base64')});vault.audit({subject:'synthetic-owner'},'synthetic.backup','synthetic-practice');});writePrivate(path.join(fixture,'runtime.env'),'CAF_PRIVATE_DIRECTORY='+path.join(fixture,'vault')+'\nCAF_VAULT_KEY='+key.toString('base64')+'\n');writePrivate(path.join(fixture,'synthetic.txt'),'SYNTHETIC_ONLY_NO_CUSTOMER_DATA\n');}
   finally{vault?.close();key.fill(0);}
   createStage({directory:stage,runtimeFile:path.join(fixture,'runtime.env'),sourceDirectory:fixture,sourceFiles:['synthetic.txt']});const snapshot=backupStage(config,stage,'punto-self-test');const result=restoreAndVerify(config,snapshot,stage);assert.equal(result.documentsVerified,1);restic(config,['check','--read-data']);stateUpdate({offsiteSelfTestAt:new Date().toISOString(),selfTestSnapshot:snapshot});console.log(JSON.stringify({offsiteSyntheticRestore:true,...result}));
  }else if(mode==='backup'){
   const gitOptions={cwd:SOURCE,encoding:'utf8',env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}},sourceFiles=spawnSync('/usr/bin/git',['ls-files','-z'],gitOptions);if(sourceFiles.status!==0)throw Error('Source list required');const commit=spawnSync('/usr/bin/git',['rev-parse','HEAD'],gitOptions);if(commit.status!==0)throw Error('Commit required');
   const published=[];function walk(relative){for(const row of fs.readdirSync(path.join(SOURCE,relative),{withFileTypes:true})){const name=relative+'/'+row.name;if(row.isDirectory())walk(name);else if(row.isFile())published.push(name);else throw Error('Regular published files required');}}walk('dist');
   const hostFiles=['/etc/systemd/system/cafpuntocittadino.service','/etc/nginx/sites-available/punto','/etc/nginx/sites-available/punto-public','/etc/nginx/sites-available/punto-https.pending','/etc/nginx/sites-available/punto-legacy.pending','/etc/letsencrypt/renewal/puntocittadinoitalia.it.conf','/etc/letsencrypt/renewal-hooks/deploy/punto-nginx'].filter(file=>fs.existsSync(file));
   const manifest=createStage({directory:stage,runtimeFile:'/etc/cafpuntocittadino/runtime.env',sourceDirectory:SOURCE,sourceFiles:[...new Set([...sourceFiles.stdout.split('\0').filter(Boolean),...published])],hostFiles,commit:commit.stdout.trim()});const snapshot=backupStage(config,stage,'punto-production');restic(config,['check']);stateUpdate({lastBackupAt:new Date().toISOString(),snapshot,stage,files:manifest.files.length,vaultInitialized:manifest.vaultInitialized});console.log(JSON.stringify({offsiteBackup:true,files:manifest.files.length,vaultInitialized:manifest.vaultInitialized}));
  }else throw Error('Unknown mode');
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}
if(require.main===module){
 const mode=process.argv[2];if(!['init','self-test','backup','check','verify'].includes(mode)){console.error('Use init, self-test, backup, check or verify');process.exitCode=1;}
 else if(process.argv[3]!=='--locked'){
  if(process.getuid?.()!==0){console.error('Root required');process.exitCode=1;}else{fs.mkdirSync('/run/punto-backup',{recursive:true,mode:0o700});const result=spawnSync('/usr/bin/flock',['-n','/run/punto-backup/run.lock',process.execPath,__filename,mode,'--locked'],{stdio:'inherit',shell:false});process.exitCode=result.status??1;}
 }else try{main(mode);}catch(error){console.error('PUNTO_BACKUP_FAILED:',/^(RESTIC_|Root |Private |Recovery |Production |Snapshot |Source |Commit |Invalid |Regular |New |Unsafe |Vault |Unexpected |Unknown )/.test(error.message)?error.message:'verification not completed');process.exitCode=1;}
}
module.exports={createStage,verifyStage};
