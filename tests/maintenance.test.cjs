'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {Vault}=require('../server/vault.cjs'),{run}=require('../server/maintenance.cjs'),{backupVault}=require('../server/backups.cjs');
function setup(t){const parent=fs.mkdtempSync(path.join(os.tmpdir(),'caf-maintenance-')),key=crypto.randomBytes(32),directory=path.join(parent,'live');t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));return {parent,key,directory,env:{CAF_PRIVATE_DIRECTORY:directory,CAF_VAULT_KEY:key.toString('base64')}};}
test('Maintenance refuses missing archives and invalid commands without bootstrapping a vault',t=>{
 const {parent,directory,env}=setup(t);for(const args of [['verify'],['backup',path.join(parent,'new.cafbackup')],['retention-preview'],['unexpected'],['verify','extra']])assert.throws(()=>run(args,env));assert.equal(fs.existsSync(directory),false);assert.deepEqual(fs.readdirSync(parent),[]);
 fs.mkdirSync(directory);const file=path.join(directory,'vault.sqlite');fs.writeFileSync(file,Buffer.alloc(0));
 for(const args of [['verify'],['backup',path.join(parent,'new.cafbackup')]])assert.throws(()=>run(args,env));assert.equal(fs.statSync(file).size,0);assert.equal(fs.existsSync(path.join(parent,'new.cafbackup')),false);
});
test('Verification and retention preview read an existing archive without changing bytes',t=>{
 const {directory,key,env}=setup(t),vault=new Vault({directory,key});vault.audit({subject:'synthetic',role:'admin'},'test','sample');vault.close();
 const file=path.join(directory,'vault.sqlite'),before=fs.readFileSync(file);assert.deepEqual(run(['verify'],env),{auditIntegrity:true});assert.deepEqual(run(['retention-preview'],{...env,CAF_RETENTION_DAYS_JSON:JSON.stringify({'730':30,isee:30})}),{expired:[]});assert.deepEqual(fs.readFileSync(file),before);
 const readonly=new Vault({directory,key,readOnly:true,requireExisting:true});try{assert.throws(()=>readonly.put('test','sample',{private:'synthetic'}));}finally{readonly.close()}
});
test('Maintenance rejects backup and restore paths redirected into source',t=>{
 const {parent,key,directory,env}=setup(t),link=path.join(parent,'source'),root=path.resolve(__dirname,'..');fs.symlinkSync(root,link,process.platform==='win32'?'junction':'dir');
 assert.throws(()=>run(['backup',path.join(link,'forbidden.cafbackup')],env),/link into source/);assert.throws(()=>run(['restore',path.join(parent,'input.cafbackup'),path.join(link,'forbidden-directory')],env),/link into source/);assert.equal(fs.existsSync(directory),false);
 const vault=new Vault({directory,key});try{const target=path.join(parent,'valid.cafbackup'),mask=process.umask();backupVault(vault,target);assert.equal(process.umask(),mask);assert.deepEqual(fs.readdirSync(parent).filter(x=>x.startsWith('.caf-backup-')),[]);if(process.platform!=='win32')assert.equal(fs.statSync(target).mode&0o777,0o600);}finally{vault.close()}
});
