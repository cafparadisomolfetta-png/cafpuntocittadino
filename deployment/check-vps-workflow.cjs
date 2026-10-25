'use strict';
// Explicit VPS check with synthetic identities/data, real ClamAV, local HTTP and
// encrypted backup/restore. Never opens the production vault or calls Google.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {Vault}=require('../server/vault.cjs'),{Practices}=require('../server/practices.cjs'),{createApp}=require('../server/app.cjs');
const {clamScanner}=require('../server/scanner.cjs'),{backupVault,restoreVault}=require('../server/backups.cjs');
const {VERSION}=require('../server/privacy.cjs');

async function main(){
 const baseDirectory='/var/lib/cafpuntocittadino';
 const root=fs.mkdtempSync(path.join(baseDirectory,'synthetic-check-'));fs.chmodSync(root,0o700);
 const key=crypto.randomBytes(32),scan=clamScanner('/usr/bin/clamscan');let vault,restored,server;
 const results={syntheticIdentities:true,realScanner:false,httpWorkflow:false,isolation:false,malwareBlocked:false,scannerFailureBlocked:false,backupRestore:false};
 try{
  const clean=Buffer.from('%PDF-1.4\nsynthetic-vps-check-only\n%%EOF');
  const eicar=Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
  assert.equal(await scan(clean),'clean');assert.equal(await scan(eicar),'infected');results.realScanner=true;
  const identities={owner:{authenticated:true,role:'citizen',subject:'synthetic-owner',email:'owner@example.invalid',sites:[]},other:{authenticated:true,role:'citizen',subject:'synthetic-other',email:'other@example.invalid',sites:[]},operator:{authenticated:true,role:'operator',subject:'synthetic-operator',sites:['molfetta']},viewer:{authenticated:true,role:'viewer',subject:'synthetic-viewer',sites:['molfetta']},outsider:{authenticated:true,role:'operator',subject:'synthetic-outsider',sites:['bari']}};
  vault=new Vault({directory:path.join(root,'vault'),key});
  const practices=new Practices({vault,scan,activeSites:['molfetta','bari'],enabledServices:['isee']});
  const identity={clientId:'synthetic-no-google-login',activeSites:['molfetta','bari'],authenticate:async headers=>{const actor=identities[String(headers.authorization||'').replace('Bearer ','')];if(!actor)throw Object.assign(Error('UNAUTHORIZED'),{status:401,code:'UNAUTHORIZED'});return actor;}};
  server=createApp({practices,identity,publicDirectory:path.resolve(__dirname,'../dist'),origin:'https://puntocittadinoitalia.it'});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const request=(route,actor='owner',method='GET',body)=>fetch(base+route,{method,headers:{Authorization:'Bearer '+actor,Origin:'https://puntocittadinoitalia.it','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
  let response=await request('/api/practices','owner','POST',{site:'molfetta',service:'isee',mode:'direct',privacyVersion:VERSION,privacyAcknowledged:true});assert.equal(response.status,201);let row=await response.json();const route='/api/practices/'+row.id;
  assert.equal((await request(route,'other')).status,404);assert.equal((await request(route,'outsider')).status,404);
  const pending=await request('/api/practices','other');assert.deepEqual((await pending.json()).practices,[]);
  const offer={version:row.version,amountCents:0,description:'Solo collaudo tecnico sintetico',privacyBasisReviewed:true};
  assert.equal((await request(route+'/approval','viewer','POST',offer)).status,403);
  assert.equal((await request(route+'/approval','operator','POST',{...offer,privacyBasisReviewed:false})).status,400);
  response=await request(route+'/approval','operator','POST',offer);assert.equal(response.status,200);row=await response.json();
  response=await request(route+'/accept-offer','owner','POST',{version:row.version,accept:true});assert.equal(response.status,200);
  const upload=bytes=>({name:'synthetic.pdf',mime:'application/pdf',bytes:bytes.length,content:bytes.toString('base64')});
  response=await request(route+'/documents','owner','POST',upload(clean));assert.equal(response.status,201);const document=await response.json();
  assert.equal((await request(route+'/documents/'+document.id,'other')).status,404);
  response=await request(route+'/documents/'+document.id,'owner');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(Buffer.from(await response.arrayBuffer()),clean);results.isolation=true;
  const infected=Buffer.concat([Buffer.from('%PDF-1.4\n'),eicar,Buffer.from('\n%%EOF')]);
  response=await request(route+'/documents','owner','POST',upload(infected));assert.equal(response.status,400);assert.equal((await response.json()).error,'UNSAFE_DOCUMENT');assert.equal(vault.list('document').length,1);results.malwareBlocked=true;
  practices.scan=clamScanner('/nonexistent/synthetic-scanner');response=await request(route+'/documents','owner','POST',upload(Buffer.from('%PDF-1.4\nsecond-synthetic-check\n%%EOF')));assert.equal(response.status,503);assert.equal((await response.json()).error,'SCANNER_UNAVAILABLE');assert.equal(vault.list('document').length,1);practices.scan=scan;results.scannerFailureBlocked=true;
  response=await request(route,'operator');row=await response.json();
  assert.equal((await request(route+'/status','viewer','POST',{version:row.version,status:'in_review'})).status,404);
  response=await request(route+'/status','operator','POST',{version:row.version,status:'awaiting_documents',integrationMessage:'Solo prova sintetica'});assert.equal(response.status,200);row=await response.json();
  response=await request(route+'/status','operator','POST',{version:row.version,status:'in_review'});assert.equal(response.status,200);row=await response.json();
  response=await request(route+'/status','operator','POST',{version:row.version,status:'completed'});assert.equal(response.status,200);assert.ok(vault.verifyAudit());results.httpWorkflow=true;
  const backup=path.join(root,'synthetic.cafbackup');backupVault(vault,backup);
  assert.ok(!fs.readFileSync(backup).includes(Buffer.from('SQLite format 3')));
  assert.throws(()=>restoreVault({source:backup,targetDirectory:path.join(root,'wrong-key'),key:crypto.randomBytes(32)}));
  const target=path.join(root,'restored');restoreVault({source:backup,targetDirectory:target,key});restored=new Vault({directory:target,key});
  assert.ok(restored.verifyAudit());assert.equal(restored.get('practice',row.id).status,'completed');assert.deepEqual(Buffer.from(restored.get('content',document.id).content,'base64'),clean);results.backupRestore=true;
  console.log(JSON.stringify({...results,offsiteBackupTested:false,realGoogleLoginTested:false}));
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));if(restored)restored.close();if(vault)vault.close();key.fill(0);
  fs.rmSync(root,{recursive:true,force:true});
 }
}
if(require.main===module)main().catch(error=>{console.error('VPS_SYNTHETIC_CHECK_FAILED',JSON.stringify({name:error.name,code:error.code,line:String(error.stack||'').match(/check-vps-workflow\.cjs:\d+:\d+/)?.[0],actual:typeof error.actual==='number'?error.actual:undefined,expected:typeof error.expected==='number'?error.expected:undefined}));process.exitCode=1;});
