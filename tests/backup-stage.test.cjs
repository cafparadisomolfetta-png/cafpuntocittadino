'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {createStage,verifyStage}=require('../deployment/backup.cjs'),{Vault}=require('../server/vault.cjs');
function fixture(t,{initialized=true}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'punto-backup-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const key=crypto.randomBytes(32),source=path.join(root,'source');fs.mkdirSync(source);fs.writeFileSync(path.join(source,'site.txt'),'synthetic-site');const directory=path.join(root,'vault');let vault;
 if(initialized){vault=new Vault({directory,key});const bytes=Buffer.from('%PDF-1.4\nsynthetic-backup-test\n%%EOF');vault.transaction(()=>{vault.put('practice','test-practice',{id:'test-practice',status:'completed'});vault.put('document','test-document',{id:'test-document',sha256:crypto.createHash('sha256').update(bytes).digest('hex')});vault.put('content','test-document',{content:bytes.toString('base64')});vault.audit({subject:'synthetic'},'test.backup','test-practice');});vault.close();}
 const runtimeFile=path.join(root,'runtime.env');fs.writeFileSync(runtimeFile,'CAF_PRIVATE_DIRECTORY='+directory+'\nCAF_VAULT_KEY='+key.toString('base64')+'\n');key.fill(0);
 return {root,directory,source,runtimeFile,stage:path.join(root,'stage'),create(extra={}){return createStage({directory:this.stage,runtimeFile,sourceDirectory:source,sourceFiles:['site.txt'],...extra});}};
}
test('Backup stage restores data using ONLY recovered configuration, with authenticated audit and document hashes',t=>{
 const f=fixture(t),manifest=f.create();assert.equal(manifest.vaultInitialized,true);fs.rmSync(f.directory,{recursive:true});fs.rmSync(f.runtimeFile);const result=verifyStage(f.stage,path.join(f.root,'restored'));assert.equal(result.documentsVerified,1);assert.equal(result.vaultInitialized,true);assert.equal(result.filesVerified,3);
});
test('Changed recovered configuration or source is rejected before accepting a restore',t=>{
 const f=fixture(t);f.create();fs.appendFileSync(path.join(f.stage,'config/runtime.env'),'\nCHANGED=yes\n');assert.throws(()=>verifyStage(f.stage,path.join(f.root,'restored')));
});
test('Corrupt encrypted vault is rejected even when its outer manifest digest is rewritten',t=>{
 const f=fixture(t);f.create();const file=path.join(f.stage,'vault.cafbackup'),bytes=fs.readFileSync(file);bytes[32]^=1;fs.writeFileSync(file,bytes);const manifest=JSON.parse(fs.readFileSync(path.join(f.stage,'manifest.json')));manifest.files.find(row=>row.path==='vault.cafbackup').sha256=crypto.createHash('sha256').update(bytes).digest('hex');fs.writeFileSync(path.join(f.stage,'manifest.json'),JSON.stringify(manifest));assert.throws(()=>verifyStage(f.stage,path.join(f.root,'restored')));
});
test('Uninitialized private runtime is represented truthfully without creating a production vault',t=>{
 const f=fixture(t,{initialized:false});const manifest=f.create();assert.equal(manifest.vaultInitialized,false);assert.equal(fs.existsSync(f.directory),false);assert.equal(verifyStage(f.stage,path.join(f.root,'restored')).vaultInitialized,false);
});
test('Parent traversal and symbolic source files cannot enter the backup stage',t=>{
 const a=fixture(t);assert.throws(()=>a.create({sourceFiles:['../runtime.env']}),/Unsafe/);const b=fixture(t);fs.symlinkSync(b.runtimeFile,path.join(b.source,'linked'));assert.throws(()=>b.create({sourceFiles:['linked']}),/Regular/);
});
