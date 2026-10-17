'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {Vault}=require('../server/vault.cjs'),{Practices}=require('../server/practices.cjs'),{Jobs}=require('../server/jobs.cjs'),{createApp}=require('../server/app.cjs');
const citizen={authenticated:true,role:'citizen',subject:'synthetic-owner',email:'owner@example.test'},other={...citizen,subject:'other-owner',email:'other@example.test'},operator={authenticated:true,role:'operator',subject:'synthetic-staff',sites:['molfetta']},viewer={...operator,role:'viewer'},outsider={...operator,sites:['bari']};
const input={site:'molfetta',service:'isee',mode:'direct',privacyVersion:'2026-10-12',privacyAcknowledged:true};
const pdf=Buffer.from('%PDF-1.4\nsynthetic-approval-test\n%%EOF'),meta={name:'synthetic.pdf',mime:'application/pdf',bytes:pdf.length};
function fixture(t,{retentionDays=7}={}){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'caf-approval-')),vault=new Vault({directory:dir,key:crypto.randomBytes(32)}),sent=[];t.after(()=>{vault.close();fs.rmSync(dir,{recursive:true,force:true})});const jobs=new Jobs({vault,retentionDays,adminEmail:'admin@example.test',activeSites:['molfetta'],mailEnabled:true,sendMail:async row=>{sent.push(row);return {id:'synthetic-provider-id'}}});let scans=0;const practices=new Practices({vault,activeSites:['molfetta'],scan:async()=>{scans++;return 'clean'},notify:value=>jobs.enqueuePractice(value)});return {vault,jobs,practices,sent,scans:()=>scans};}
function offer(practices,row,amountCents=1800){return practices.approve(operator,row.id,{version:row.version,amountCents,paymentInstructions:'COORDINATE SINTETICHE NON UTILIZZABILI PER BONIFICI',description:'Importo complessivo per il servizio indicato; condizioni di prova.'});}
test('New requests default to pending approval; forged fields cannot enable documents or start work',async t=>{
 const {practices,vault,scans}=fixture(t),row=await practices.create(citizen,{...input,approvalRequired:false,approvalStatus:'approved',feeOffer:{acceptedAt:'forged'}});
 assert.equal(row.approvalRequired,true);assert.equal(row.approvalStatus,'pending');assert.equal(row.canUpload,false);assert.equal(row.feeOffer,null);
 await assert.rejects(practices.upload(citizen,row.id,meta,pdf),e=>e.code==='PRACTICE_NOT_FOUND');assert.equal(scans(),0);assert.equal(vault.list('document').length,0);
 assert.throws(()=>practices.changeStatus(operator,row.id,{version:1,status:'in_review'}),e=>e.code==='APPROVAL_REQUIRED');
 assert.throws(()=>practices.changeStatus(operator,row.id,{version:1,status:'awaiting_documents',integrationMessage:'Required document'}),e=>e.code==='APPROVAL_REQUIRED');
 for(const actor of [citizen,viewer])assert.throws(()=>offerFor(actor),e=>e.code==='STAFF_REQUIRED');
 function offerFor(actor){return practices.approve(actor,row.id,{version:1,amountCents:0,description:'Nessuna quota richiesta.'});}
 assert.throws(()=>offerFor(outsider),e=>e.code==='PRACTICE_NOT_FOUND');
});
test('Approval and version-bound fee acceptance unlock PDFs for all 30 services, including free requests',async t=>{
 const {practices,vault}=fixture(t),ids=require('../netlify/functions/practice-services.js').ids;
 for(const [index,service] of ids.entries()){
  let row=await practices.create(citizen,{...input,service});row=offer(practices,row,index===0?0:1800);assert.equal(row.canUpload,false);assert.equal(row.feeOffer.acceptedAt,null);
  await assert.rejects(practices.upload(citizen,row.id,meta,pdf),e=>e.code==='PRACTICE_NOT_FOUND');
  assert.throws(()=>practices.acceptOffer(other,row.id,{version:row.version,accept:true}),e=>e.code==='PRACTICE_NOT_FOUND');
  assert.throws(()=>practices.acceptOffer(operator,row.id,{version:row.version,accept:true}),e=>e.code==='CITIZEN_REQUIRED');
  row=practices.acceptOffer(citizen,row.id,{version:row.version,accept:true});assert.equal(row.canUpload,true);assert.ok(row.feeOffer.acceptedAt);
  const uploaded=await practices.upload(citizen,row.id,meta,pdf);assert.deepEqual(practices.download(operator,row.id,uploaded.id).bytes,pdf);
  row=practices.detail(citizen,row.id);if(row.feeOffer.amountCents>0)row=practices.confirmPayment({authenticated:true,role:'admin',subject:'synthetic-admin'},row.id,{version:row.version,receivedCents:row.feeOffer.amountCents,confirmReceived:true});
  practices.changeStatus(operator,row.id,{version:row.version,status:'in_review'});
 }
 assert.equal(vault.list('document').length,30);assert.equal(vault.verifyAudit(),true);
});
test('Changed offers invalidate old confirmations; accepted or closed offers cannot be replaced',async t=>{
 const {practices}=fixture(t);let row=await practices.create(citizen,input);row=offer(practices,row);const stale=row.version;row=offer(practices,row,2000);
 assert.throws(()=>practices.acceptOffer(citizen,row.id,{version:stale,accept:true}),e=>e.code==='VERSION_CONFLICT');
 assert.throws(()=>practices.acceptOffer(citizen,row.id,{version:row.version,accept:false}),e=>e.code==='FEE_ACCEPTANCE_REQUIRED');
 for(const amountCents of [-1,1.1,'1800',100000001])assert.throws(()=>practices.approve(operator,row.id,{version:row.version,amountCents,description:'Test'}),e=>e.code==='INVALID_FEE_OFFER');
 row=practices.acceptOffer(citizen,row.id,{version:row.version,accept:true});assert.throws(()=>offer(practices,row,2200),e=>e.code==='APPROVAL_NOT_AVAILABLE');
 let rejected=await practices.create(citizen,input);rejected=offer(practices,rejected);practices.changeStatus(operator,rejected.id,{version:rejected.version,status:'rejected'});
 assert.throws(()=>practices.acceptOffer(citizen,rejected.id,{version:rejected.version+1,accept:true}),e=>e.code==='FEE_OFFER_NOT_AVAILABLE');
});
test('Transactional generic notifications target admin for submissions/PDFs and owner for current updates',async t=>{
 const {practices,vault,jobs,sent}=fixture(t);let row=await practices.create(citizen,input);assert.equal(vault.list('outbox').length,1);
 const stored=vault.get('practice',row.id);jobs.enqueuePractice({kind:'practice-received',record:stored});assert.equal(vault.list('outbox').length,1);
 row=offer(practices,row);row=practices.acceptOffer(citizen,row.id,{version:row.version,accept:true});await practices.upload(citizen,row.id,meta,pdf);
 const outbox=vault.list('outbox');for(const message of outbox){assert.ok(!message.text.includes('isee'));assert.ok(!message.text.includes(row.id));assert.ok(!message.text.includes('1800'));assert.ok(!message.text.includes('synthetic.pdf'));}
 assert.equal(outbox.find(x=>x.kind==='practice-document').to,'admin@example.test');
 const result=await jobs.deliver();assert.equal(result.sent,2);assert.equal(sent.length,2);assert.ok(sent.every(x=>x.to==='admin@example.test'));assert.equal(result.obsolete,2);
 const second=await practices.create(citizen,input);practices.erase({authenticated:true,role:'admin',subject:'admin'},second.id);const next=await jobs.deliver();assert.equal(next.sent,0);assert.equal(next.obsolete,1);
});
test('Outbox failure rolls back creation; missing retention never queues recipient addresses',async t=>{
 const {practices,vault}=fixture(t);const put=vault.put.bind(vault);vault.put=(kind,...args)=>{if(kind==='outbox')throw Error('Outbox unavailable');return put(kind,...args)};
 await assert.rejects(practices.create(citizen,input),/Outbox unavailable/);assert.equal(vault.list('practice').length,0);assert.equal(vault.list('outbox').length,0);
 const other=fixture(t,{retentionDays:null});await other.practices.create(citizen,input);assert.equal(other.vault.list('outbox').length,0);assert.equal((await other.jobs.deliver()).sent,0);
});
test('HTTP routes enforce staff approval and owner acceptance before upload',async t=>{
 const {practices}=fixture(t),identity={authenticate:async headers=>headers.authorization==='Bearer staff'?operator:headers.authorization==='Bearer other'?other:citizen};
 const server=createApp({practices,identity,origin:'http://127.0.0.1',publicDirectory:path.resolve('dist')});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;const request=(route,body,token='owner')=>fetch(base+route,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 let response=await request('/api/practices',input),row=await response.json();assert.equal(response.status,201);const route='/api/practices/'+row.id;
 assert.equal((await request(route+'/approval',{version:1,amountCents:0,description:'Nessuna quota.'})).status,403);
 response=await request(route+'/approval',{version:1,amountCents:0,description:'Nessuna quota.'},'staff');row=await response.json();assert.equal(response.status,200);
 assert.equal((await request(route+'/accept-offer',{version:row.version,accept:true},'other')).status,404);
 response=await request(route+'/accept-offer',{version:row.version,accept:true});row=await response.json();assert.equal(response.status,200);assert.equal(row.canUpload,true);
 response=await request(route+'/documents',{...meta,content:pdf.toString('base64')});assert.equal(response.status,201);
});

test('Fee acceptance and uploaded receipts do not unlock work before verified receipt of funds',async t=>{
 const {practices}=fixture(t);let row=await practices.create(citizen,{...input,paymentConfirmedAt:'forged'});assert.equal(row.paymentStatus,'pending');row=offer(practices,row);row=practices.acceptOffer(citizen,row.id,{version:row.version,accept:true});
 await practices.upload(citizen,row.id,{...meta,name:'ricevuta-bonifico.pdf'},pdf);row=practices.detail(citizen,row.id);assert.equal(row.paymentStatus,'pending');
 assert.throws(()=>practices.changeStatus(operator,row.id,{version:row.version,status:'in_review'}),e=>e.code==='PAYMENT_REQUIRED');
 assert.throws(()=>practices.changeStatus(operator,row.id,{version:row.version,status:'awaiting_documents',integrationMessage:'Test'}),e=>e.code==='PAYMENT_REQUIRED');
 for(const actor of [citizen,other,operator,viewer])assert.throws(()=>practices.confirmPayment(actor,row.id,{version:row.version,receivedCents:1800,confirmReceived:true}),e=>e.code==='PAYMENT_STAFF_REQUIRED');
 assert.throws(()=>practices.confirmPayment({...outsider,role:'manager'},row.id,{version:row.version,receivedCents:1800,confirmReceived:true}),e=>e.code==='PRACTICE_NOT_FOUND');
 const admin={authenticated:true,role:'admin',subject:'synthetic-admin'};
 assert.throws(()=>practices.confirmPayment(admin,row.id,{version:row.version,receivedCents:1700,confirmReceived:true}),e=>e.code==='PAYMENT_AMOUNT_MISMATCH');
 assert.throws(()=>practices.confirmPayment(admin,row.id,{version:row.version,receivedCents:1800,confirmReceived:false}),e=>e.code==='PAYMENT_CONFIRMATION_REQUIRED');
 assert.throws(()=>practices.confirmPayment(admin,row.id,{version:1,receivedCents:1800,confirmReceived:true}),e=>e.code==='VERSION_CONFLICT');
 row=practices.confirmPayment(admin,row.id,{version:row.version,receivedCents:1800,confirmReceived:true});assert.equal(row.paymentStatus,'confirmed');assert.ok(row.paymentConfirmedAt);
 assert.throws(()=>practices.confirmPayment(admin,row.id,{version:row.version,receivedCents:1800,confirmReceived:true}),e=>e.code==='PAYMENT_NOT_CONFIRMABLE');
 row=practices.changeStatus(operator,row.id,{version:row.version,status:'in_review'});assert.equal(row.status,'in_review');
});
test('Paid offers require private bank instructions; confirmation cannot precede acceptance and free requests need no transfer',async t=>{
 const {practices,vault}=fixture(t);let row=await practices.create(citizen,input);
 assert.throws(()=>practices.approve(operator,row.id,{version:1,amountCents:1800,description:'Test'}),e=>e.code==='PAYMENT_INSTRUCTIONS_REQUIRED');
 row=offer(practices,row);assert.match(row.feeOffer.paymentInstructions,/SINTETICHE/);
 const admin={authenticated:true,role:'admin',subject:'synthetic-admin'};assert.throws(()=>practices.confirmPayment(admin,row.id,{version:row.version,receivedCents:1800,confirmReceived:true}),e=>e.code==='PAYMENT_NOT_CONFIRMABLE');
 const rejected=practices.changeStatus(operator,row.id,{version:row.version,status:'rejected'});assert.equal(rejected.status,'rejected');
 let free=await practices.create(citizen,input);free=offer(practices,free,0);free=practices.acceptOffer(citizen,free.id,{version:free.version,accept:true});assert.equal(free.paymentStatus,'not_required');
 assert.equal(practices.changeStatus(operator,free.id,{version:free.version,status:'in_review'}).status,'in_review');
 for(const mail of vault.list('outbox'))assert.ok(!mail.text.includes('COORDINATE'));
});
test('Payment HTTP endpoint permits only an authorized finance role and applies the work gate server-side',async t=>{
 const {practices}=fixture(t),admin={authenticated:true,role:'admin',subject:'synthetic-admin'},identity={authenticate:async headers=>headers.authorization==='Bearer admin'?admin:headers.authorization==='Bearer staff'?operator:citizen};
 const server=createApp({practices,identity,origin:'http://127.0.0.1',publicDirectory:path.resolve('dist')});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;const request=(route,body,token='owner')=>fetch(base+route,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 let row=await practices.create(citizen,input);row=offer(practices,row);row=practices.acceptOffer(citizen,row.id,{version:row.version,accept:true});const route='/api/practices/'+row.id;
 assert.equal((await request(route+'/status',{version:row.version,status:'in_review'},'staff')).status,409);
 assert.equal((await request(route+'/confirm-payment',{version:row.version,receivedCents:1800,confirmReceived:true})).status,403);
 const response=await request(route+'/confirm-payment',{version:row.version,receivedCents:1800,confirmReceived:true},'admin');assert.equal(response.status,200);row=await response.json();assert.equal(row.paymentStatus,'confirmed');
 assert.equal((await request(route+'/status',{version:row.version,status:'in_review'},'staff')).status,200);
});
