'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {catalog,ids,enabledServices,serviceCatalog}=require('../netlify/functions/practice-services.js');
const {groups}=require('../netlify/functions/booking-services.js');
const {Vault}=require('../server/vault.cjs'),{Practices}=require('../server/practices.cjs'),{retentionPlan}=require('../server/retention.cjs'),{inspectEnvironment}=require('../server/environment.cjs'),{createApp}=require('../server/app.cjs');
function fixture(t,services=ids){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'caf-intake-')),vault=new Vault({directory,key:crypto.randomBytes(32)});t.after(()=>{vault.close();fs.rmSync(directory,{recursive:true,force:true})});return {vault,practices:new Practices({requireApproval:false,vault,scan:async()=> 'clean',activeSites:['molfetta'],enabledServices:services})};}
const citizen={authenticated:true,role:'citizen',subject:'synthetic-owner'},other={...citizen,subject:'synthetic-other'},operator={authenticated:true,role:'operator',subject:'synthetic-staff',sites:['molfetta']};
test('Private catalog covers exactly the 30 public booking services with stable unique identifiers',()=>{
 assert.equal(catalog.length,30);assert.equal(new Set(ids).size,30);assert.deepEqual(catalog.map(x=>x.label).sort(),groups.flatMap(x=>x.services).sort());
 for(const row of catalog){assert.match(row.id,/^[a-z0-9_]{2,40}$/);assert.equal(groups.find(x=>x.services.includes(row.label)).category,row.category);}
 assert.equal(serviceCatalog(['730'])[0].label,'Dichiarazione dei redditi (730 o Unico PF)');assert.equal(serviceCatalog(['inail_malattia_professionale'])[0].label,'INAIL: malattia professionale');
});
test('Each enabled intake supports scanned PDFs, private visibility and the operator status workflow',async t=>{
 const {vault,practices}=fixture(t),pdf=Buffer.from('%PDF-1.4\nsynthetic-catalog-intake\n%%EOF');
 for(const id of ids){
  const row=await practices.create(citizen,{site:'molfetta',service:id,mode:'direct',privacyVersion:'2026-10-25',privacyAcknowledged:true});
  const doc=await practices.upload(citizen,row.id,{name:'synthetic.pdf',mime:'application/pdf',bytes:pdf.length},pdf);
  assert.deepEqual(practices.download(operator,row.id,doc.id).bytes,pdf,id);assert.throws(()=>practices.detail(other,row.id),e=>e.code==='PRACTICE_NOT_FOUND');
  practices.changeStatus(operator,row.id,{version:2,status:'in_review'});practices.changeStatus(operator,row.id,{version:3,status:'completed'});
  assert.equal(practices.detail(citizen,row.id).status,'completed',id);assert.equal(practices.detail(citizen,row.id).service,id);
 }
 assert.equal(practices.list(citizen).length,30);assert.equal(vault.verifyAudit(),true);
 const policy=Object.fromEntries(ids.map(id=>[id,1]));assert.equal(retentionPlan(vault,policy,Date.now()+2*86400000).length,30);
 delete policy.inail_infortunio;assert.throws(()=>retentionPlan(vault,policy),/missing for an active service/);
});
test('Service activation is explicit and fails closed without an approved duration for every enabled intake',async t=>{
 assert.deepEqual(enabledServices({}),['730','isee']);assert.deepEqual(enabledServices({CAF_CALLBACK_ENABLED:'true'}),['730','isee','richiamata']);
 for(const value of ['[]','null','{}','["unknown"]','["isee","isee"]','["richiamata"]','{broken'])assert.throws(()=>enabledServices({CAF_ENABLED_SERVICES_JSON:value}));
 const patch={CAF_ENABLED_SERVICES_JSON:JSON.stringify(ids),CAF_RETENTION_DAYS_JSON:JSON.stringify({'730':30,isee:30})};
 assert.equal(inspectEnvironment(patch).checks.find(x=>x.id==='services').ok,false);
 patch.CAF_RETENTION_DAYS_JSON=JSON.stringify(Object.fromEntries(ids.map(id=>[id,30])));assert.equal(inspectEnvironment(patch).checks.find(x=>x.id==='services').ok,true);
 assert.throws(()=>retentionPlan({list:()=>[]},{'730':1,isee:1,unknown:1}),/Invalid retention policy/);
 const {vault,practices}=fixture(t,['730','isee']);await assert.rejects(practices.create(citizen,{site:'molfetta',service:'inail_infortunio',mode:'direct',privacyVersion:'2026-10-25',privacyAcknowledged:true}),e=>e.code==='SERVICE_NOT_ACTIVE');assert.equal(vault.list('practice').length,0);
});
test('Public configuration supplies only enabled service labels without exposing retention or secrets',async t=>{
 const {practices}=fixture(t,['imu','inail_infortunio','altro']);const server=createApp({practices,identity:{clientId:'synthetic-client',activeSites:['molfetta']},origin:'http://127.0.0.1',publicDirectory:path.resolve('dist')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/config'),data=await response.json();assert.equal(response.status,200);assert.deepEqual(data.serviceCatalog.map(x=>x.id),['imu','inail_infortunio','altro']);assert.deepEqual(data.services,['imu','inail_infortunio','altro']);assert.ok(!Object.hasOwn(data,'retentionPolicy'));assert.equal(data.serviceCatalog[0].label,'IMU e modello F24');
});
