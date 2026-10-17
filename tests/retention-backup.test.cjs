'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {Vault}=require('../server/vault.cjs'),{Practices}=require('../server/practices.cjs'),{retentionPlan,purgeExpired}=require('../server/retention.cjs'),{backupVault,restoreVault}=require('../server/backups.cjs');
const citizen={role:'citizen',subject:'test-citizen',authenticated:true},admin={role:'admin',subject:'test-admin',authenticated:true};
function setup(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'caf-backup-test-')),key=crypto.randomBytes(32),vault=new Vault({directory:path.join(root,'live'),key}),practices=new Practices({requireApproval:false,vault,scan:async()=> 'clean',clock:()=> '2025-01-01T12:00:00Z'});t.after(()=>{vault.close();fs.rmSync(root,{recursive:true,force:true})});return {root,key,vault,practices}}
test('Retention requires an explicit policy and deletes only expired terminal cases',async t=>{
 const {vault,practices}=setup(t),input={site:'molfetta',service:'isee',mode:'direct',privacyAcknowledged:true,privacyVersion:'2026-10-12'};
 const old=await practices.create(citizen,input),open=await practices.create(citizen,input);
 practices.changeStatus(admin,old.id,{version:1,status:'in_review'});practices.changeStatus(admin,old.id,{version:2,status:'completed'});
 assert.throws(()=>retentionPlan(vault,{}));const policy={'730':365,isee:365};assert.deepEqual(retentionPlan(vault,policy,Date.parse('2025-02-01')),[]);
 assert.equal(purgeExpired({vault,practices,actor:admin,policy,now:Date.parse('2026-10-12')}).erased,1);assert.ok(vault.get('practice',open.id));assert.equal(vault.get('practice',old.id),null);assert.ok(vault.verifyAudit());
});
test('Encrypted backups restore state with the right key and refuse tampering or overwrite',async t=>{
 const {root,key,vault,practices}=setup(t);const row=await practices.create(citizen,{site:'molfetta',service:'730',mode:'direct',privacyAcknowledged:true,privacyVersion:'2026-10-12'});
 const source=path.join(root,'test.cafbackup');backupVault(vault,source);assert.throws(()=>backupVault(vault,source));assert.equal(fs.readFileSync(source).includes(Buffer.from('SQLite format 3')),false);
 assert.throws(()=>restoreVault({source,targetDirectory:path.join(root,'bad'),key:crypto.randomBytes(32)}));assert.equal(fs.existsSync(path.join(root,'bad')),false);
 const targetDirectory=path.join(root,'restored');restoreVault({source,targetDirectory,key});const restored=new Vault({directory:targetDirectory,key});assert.equal(restored.get('practice',row.id).service,'730');assert.ok(restored.verifyAudit());restored.close();
 assert.throws(()=>restoreVault({source,targetDirectory,key}));
 const data=fs.readFileSync(source);data[30]^=1;fs.writeFileSync(source,data);assert.throws(()=>restoreVault({source,targetDirectory:path.join(root,'tampered'),key}));
});
test('Approved audit prefix expiry retains a verifiable chain for remaining and future entries',t=>{
 const {vault}=setup(t);vault.clock=()=> '2020-01-01T00:00:00Z';vault.audit(admin,'old.action','synthetic-old');vault.clock=()=> '2026-10-13T00:00:00Z';vault.audit(admin,'new.action','synthetic-new');assert.equal(vault.purgeAuditBefore('2025-01-01T00:00:00Z').erased,1);assert.ok(vault.verifyAudit());vault.audit(admin,'next.action','synthetic-next');assert.ok(vault.verifyAudit());assert.equal(vault.db.prepare('SELECT COUNT(*) AS count FROM audit').get().count,2);
});
