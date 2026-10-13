'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {Vault}=require('../server/vault.cjs'),{Practices}=require('../server/practices.cjs'),{Identity}=require('../server/identity.cjs');
const {createApp}=require('../server/app.cjs'),{bookingHandlers}=require('../server/booking.cjs');
const citizen={authenticated:true,subject:'citizen-one',role:'citizen'};
const other={authenticated:true,subject:'citizen-two',role:'citizen'};
const operator={authenticated:true,subject:'op-molfetta',role:'operator',sites:['molfetta']};
const viewer={authenticated:true,subject:'reader',role:'viewer',sites:['molfetta']};
const admin={authenticated:true,subject:'admin-one',role:'admin',sites:['molfetta','bari']};
const input={site:'molfetta',service:'isee',mode:'direct',privacyVersion:'2026-10-12',privacyAcknowledged:true};
const pdf=Buffer.from('%PDF-1.4\nsynthetic-test-only\n%%EOF');
const metadata={name:'documento-riservato-test.pdf',mime:'application/pdf',bytes:pdf.length};
function setup(t,scan=async()=> 'clean'){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'caf-test-')),key=crypto.randomBytes(32);
 const vault=new Vault({directory,key}),practices=new Practices({vault,scan});
 t.after(()=>{vault.close();fs.rmSync(directory,{recursive:true,force:true})});return {vault,practices,directory,key};
}
async function rejectsCode(promise,code){await assert.rejects(promise,e=>e.code===code)}
test('Create, upload, download, integrate and complete a private practice',async t=>{
 const {practices,vault}=setup(t);const record=await practices.create(citizen,input);
 assert.equal(record.status,'received');const uploaded=await practices.upload(citizen,record.id,metadata,pdf);
 assert.equal(uploaded.downloadable,true);assert.deepEqual(practices.download(operator,record.id,uploaded.id).bytes,pdf);
 let detail=practices.detail(operator,record.id);assert.equal(detail.version,2);
 practices.changeStatus(operator,record.id,{version:2,status:'awaiting_documents',integrationMessage:'Carica la dichiarazione richiesta.'});
 assert.equal(practices.detail(citizen,record.id).integrationMessage,'Carica la dichiarazione richiesta.');
 practices.changeStatus(operator,record.id,{version:3,status:'in_review'});practices.changeStatus(operator,record.id,{version:4,status:'completed'});
 await rejectsCode(practices.upload(citizen,record.id,metadata,pdf),'PRACTICE_NOT_FOUND');
 assert.equal(vault.verifyAudit(),true);assert.equal(practices.detail(citizen,record.id).status,'completed');
});
test('Other citizens, other sites and viewer writes are denied',async t=>{
 const {practices}=setup(t);const row=await practices.create(citizen,input);const doc=await practices.upload(citizen,row.id,metadata,pdf);
 assert.deepEqual(practices.list(other),[]);
 for(const actor of [other,{...operator,sites:['bari']}]){
 assert.throws(()=>practices.detail(actor,row.id),e=>e.code==='PRACTICE_NOT_FOUND');
 assert.throws(()=>practices.download(actor,row.id,doc.id),e=>e.code==='PRACTICE_NOT_FOUND');
 }
 assert.throws(()=>practices.list(operator,'bari'),e=>e.code==='SITE_FORBIDDEN');
 assert.equal(practices.detail(viewer,row.id).id,row.id);
 assert.throws(()=>practices.changeStatus(viewer,row.id,{version:2,status:'in_review'}),e=>e.code==='PRACTICE_NOT_FOUND');
});
test('Metadata cannot bind an uploaded document to another owner or practice',async t=>{
 const {practices}=setup(t);const a=await practices.create(citizen,input),b=await practices.create(other,input);
 const doc=await practices.upload(citizen,a.id,{...metadata,practiceId:b.id,ownerSubject:other.subject},pdf);
 assert.throws(()=>practices.download(other,b.id,doc.id),e=>e.code==='DOCUMENT_NOT_FOUND');
 assert.equal(practices.detail(other,b.id).documents.length,0);
 assert.equal(practices.detail(citizen,a.id).documents.length,1);
});
test('Scan failures and infected files leave no documents or bytes',async t=>{
 for(const scan of [async()=> 'infected',async()=>{throw Error('scanner offline')},async()=> 'unknown']){
 const {practices,vault}=setup(t,scan),row=await practices.create(citizen,input);
 await assert.rejects(practices.upload(citizen,row.id,metadata,pdf));assert.equal(vault.list('document').length,0);assert.equal(vault.list('content').length,0);assert.equal(practices.detail(citizen,row.id).documents.length,0);
 }
});
test('Only bounded PDF content is accepted, not extensions, executable PDFs or missing EOF',async t=>{
 const {practices}=setup(t);const row=await practices.create(citizen,input);
 for(const bytes of [Buffer.from('fake'),Buffer.from('%PDF-1.4\n/JavaScript\n%%EOF'),Buffer.from('%PDF-1.4\ntruncated')])await assert.rejects(practices.upload(citizen,row.id,{...metadata,bytes:bytes.length},bytes));
 await rejectsCode(practices.upload(citizen,row.id,{...metadata,name:'../../test.pdf'},pdf),'INVALID_FILE_NAME');
 await rejectsCode(practices.upload(citizen,row.id,{...metadata,bytes:11*1024*1024},pdf),'INVALID_FILE_SIZE');
});
test('State changes use optimistic concurrency and terminal practices cannot reopen',async t=>{
 const {practices}=setup(t);const row=await practices.create(citizen,input);
 practices.changeStatus(operator,row.id,{version:1,status:'in_review'});
 assert.throws(()=>practices.changeStatus(operator,row.id,{version:1,status:'completed'}),e=>e.code==='VERSION_CONFLICT');
 assert.throws(()=>practices.changeStatus(operator,row.id,{version:2,status:'awaiting_documents'}),e=>e.code==='INTEGRATION_MESSAGE_REQUIRED');
 practices.changeStatus(operator,row.id,{version:2,status:'completed'});
 assert.throws(()=>practices.changeStatus(admin,row.id,{version:3,status:'received'}));
});
test('Duplicate upload is rejected and scan-time state changes are rechecked',async t=>{
 let scanHook;const {practices}=setup(t,async()=>{if(scanHook)scanHook();return 'clean'});const row=await practices.create(citizen,input);
 await practices.upload(citizen,row.id,metadata,pdf);await rejectsCode(practices.upload(citizen,row.id,metadata,pdf),'DUPLICATE_DOCUMENT');
 scanHook=()=>practices.changeStatus(operator,row.id,{version:2,status:'in_review'});
 await rejectsCode(practices.upload(citizen,row.id,metadata,pdf),'PRACTICE_NOT_FOUND');assert.equal(practices.detail(citizen,row.id).documents.length,1);
});
test('Cascading erasure removes encrypted documents and retains a minimal audit',async t=>{
 const {practices,vault}=setup(t);const row=await practices.create(citizen,input);await practices.upload(citizen,row.id,metadata,pdf);
 assert.throws(()=>practices.erase(citizen,row.id),e=>e.code==='ADMIN_REQUIRED');
 practices.erase(admin,row.id);assert.equal(vault.list('content').length,0);assert.equal(vault.list('document').length,0);assert.equal(vault.list('practice').length,0);assert.equal(vault.verifyAudit(),true);
});
test('PDF contents and names are encrypted at rest and survive database restart',async t=>{
 const {practices,vault,directory,key}=setup(t);const row=await practices.create(citizen,input);await practices.upload(citizen,row.id,metadata,pdf);
 const disk=fs.readFileSync(path.join(directory,'vault.sqlite'));for(const marker of ['synthetic-test-only','documento-riservato-test.pdf','citizen-one'])assert.equal(disk.includes(Buffer.from(marker)),false);
 const second=new Vault({directory,key});assert.equal(second.get('practice',row.id).ownerSubject,citizen.subject);second.close();
 assert.throws(()=>new Vault({directory,key:crypto.randomBytes(32)}),/Vault key/);
 const encrypted=vault.db.prepare("SELECT value FROM records WHERE kind='practice'").get().value;encrypted[15]^=1;
 vault.db.prepare("UPDATE records SET value=? WHERE kind='practice'").run(encrypted);assert.throws(()=>vault.get('practice',row.id));
});
test('Atomic rollback undoes document and metadata writes when audit persistence fails',async t=>{
 const {practices,vault}=setup(t);const row=await practices.create(citizen,input);vault.audit=()=>{throw Error('Audit unavailable')};
 await assert.rejects(practices.upload(citizen,row.id,metadata,pdf));assert.equal(vault.list('document').length,0);assert.equal(vault.list('content').length,0);assert.equal(vault.get('practice',row.id).version,1);assert.throws(()=>practices.detail(citizen,row.id),/Audit unavailable/);
});
test('Appointment association is rejected without a trusted server-side verifier',async t=>{
 const {practices}=setup(t);await rejectsCode(practices.create(citizen,{...input,mode:'appointment',appointmentId:'0123456789abcdef'}),'APPOINTMENT_NOT_VERIFIED');
 await rejectsCode(practices.create(citizen,{...input,privacyAcknowledged:false}),'PRIVACY_ACKNOWLEDGEMENT_REQUIRED');
});
test('Staff identity expires, respects audience and applies immediate operator revocation',async t=>{
 const {vault}=setup(t);let token={aud:'test-client',iss:'https://accounts.google.com',sub:'staff-sub',email:'operator@example.invalid',email_verified:'true',exp:Math.floor(Date.now()/1000)+3600};
 const identity=new Identity({vault,clientId:'test-client',adminEmail:'admin@example.invalid',operators:[{email:token.email,role:'operator',sites:['molfetta'],enabled:true}],fetcher:async()=>({ok:true,json:async()=>token})});
 const headers={authorization:'Bearer test-token-12345'};assert.equal((await identity.authenticate(headers,'staff')).role,'operator');
 identity.set(admin,{email:token.email,role:'operator',sites:['molfetta'],enabled:false});await rejectsCode(identity.authenticate(headers,'staff'),'STAFF_FORBIDDEN');
 token={...token,exp:1};await rejectsCode(identity.authenticate(headers,'citizen'),'INVALID_IDENTITY');token={...token,exp:Math.floor(Date.now()/1000)+3600,aud:'other'};await rejectsCode(identity.authenticate(headers,'citizen'),'INVALID_IDENTITY');
 assert.throws(()=>identity.set(operator,{email:'new@example.invalid',role:'admin',sites:['molfetta'],enabled:true}),e=>e.code==='ADMIN_REQUIRED');
});
test('Concurrent booking attempts call the provider once and uncertain outcomes remain blocked',async t=>{
 const {vault}=setup(t);let release,calls=0;const waiting=new Promise(resolve=>release=resolve);
 const handlers=bookingHandlers({vault,book:async()=>{calls++;await waiting;return {statusCode:200,body:JSON.stringify({ok:true,eventId:'event-one',codiceDisdetta:'AAAAAAAA'})}},cancel:async()=>({statusCode:200,body:'{"ok":true}'})});
 const event={httpMethod:'POST',body:JSON.stringify({data:'2027-01-11',ora:'09:00'})};const first=handlers.book(event);const second=await handlers.book(event);assert.equal(second.statusCode,409);release();assert.equal((await first).statusCode,200);assert.equal(calls,1);
 await handlers.cancel({httpMethod:'POST',body:'{"codice":"AAAAAAAA"}'});assert.equal((await handlers.book(event)).statusCode,200);
 const failed=bookingHandlers({vault,book:async()=>({statusCode:503,body:'{}'}),cancel:handlers.cancel});const event2={...event,body:JSON.stringify({data:'2027-01-11',ora:'09:20'})};assert.equal((await failed.book(event2)).statusCode,503);assert.equal((await failed.book(event2)).statusCode,409);
});
test('HTTP API enforces authentication, origin, ID isolation and private download headers',async t=>{
 const {practices}=setup(t);const publicDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'caf-public-'));fs.writeFileSync(path.join(publicDirectory,'index.html'),'test frontend');
 t.after(()=>fs.rmSync(publicDirectory,{recursive:true,force:true}));
 const identity={clientId:'test',authenticate:async(headers)=>{if(headers.authorization==='Bearer citizen')return citizen;if(headers.authorization==='Bearer other')return other;const e=Error('UNAUTHORIZED');e.status=401;e.code='UNAUTHORIZED';throw e}};
 const server=createApp({practices,identity,publicDirectory,origin:'http://127.0.0.1'});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base='http://127.0.0.1:'+server.address().port;
 const request=(url,options={})=>fetch(base+url,{...options,headers:{Authorization:'Bearer citizen',...(options.headers||{})}});
 assert.equal((await fetch(base+'/api/practices')).status,401);
 assert.equal((await request('/api/practices',{headers:{Origin:'https://untrusted.invalid'}})).status,403);
 const created=await request('/api/practices',{method:'POST',body:JSON.stringify(input)});assert.equal(created.status,201);const row=await created.json();
 assert.equal((await request('/api/practices/'+row.id,{headers:{Authorization:'Bearer other'}})).status,404);
 const upload=await request('/api/practices/'+row.id+'/documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...metadata,content:pdf.toString('base64')})});assert.equal(upload.status,201);const doc=await upload.json();
 const download=await request('/api/practices/'+row.id+'/documents/'+doc.id);assert.equal(download.status,200);assert.equal(download.headers.get('cache-control'),'no-store');assert.equal(download.headers.get('content-type'),'application/pdf');assert.match(download.headers.get('content-disposition'),/^attachment;/);assert.deepEqual(Buffer.from(await download.arrayBuffer()),pdf);
 assert.equal((await request('/server/vault.cjs')).status,404);assert.equal((await request('/.env')).status,404);
});
test('Only admins can reconcile old uncertain reservations after provider-confirmed availability',async t=>{
 const {vault}=setup(t);let free=false;
 const handlers=bookingHandlers({vault,book:async()=>{},cancel:async()=>{},verifyFree:async()=>free});
 const id='molfetta:2027-01-11:09:00';vault.put('booking',id,{id,state:'uncertain',attempt:'test',start:'2027-01-11T08:00:00Z',createdAt:'2020-01-01T00:00:00Z'});
 assert.throws(()=>handlers.reservations(operator),e=>e.code==='ADMIN_REQUIRED');
 await rejectsCode(handlers.reconcile(admin,id),'SLOT_NOT_VERIFIED_FREE');free=true;assert.equal((await handlers.reconcile(admin,id)).released,true);assert.equal(vault.get('booking',id).state,'cancelled');
});
test('Authenticated callback requests keep phone/email private to operational staff and accept no documents',async t=>{
 const {practices,vault}=setup(t);const callback=await practices.create({...citizen,email:'caller@example.invalid'},{...input,service:'richiamata',contactPhone:'0800000000'});assert.equal(callback.service,'richiamata');assert.equal(practices.detail(operator,callback.id).contactPhone,'0800000000');assert.equal(practices.detail(operator,callback.id).contactEmail,'caller@example.invalid');assert.equal(practices.detail(viewer,callback.id).contactPhone,undefined);assert.equal(practices.detail(citizen,callback.id).contactEmail,undefined);await assert.rejects(practices.upload(citizen,callback.id,metadata,pdf));assert.equal(vault.list('document').length,0);
});
test('Disabled callback intake and unapproved callback retention are refused',async t=>{
 const {vault}=setup(t);const practices=new Practices({vault,scan:async()=> 'clean',enabledServices:['730','isee']});await assert.rejects(practices.create(citizen,{...input,service:'richiamata',contactPhone:'0800000000'}),e=>e.code==='SERVICE_NOT_ACTIVE');const enabled=new Practices({vault,scan:async()=> 'clean'});await enabled.create({...citizen,email:'synthetic@example.invalid'},{...input,service:'richiamata',contactPhone:'0800000000'});assert.throws(()=>require('../server/retention.cjs').retentionPlan(vault,{'730':365,isee:365}),/missing/);
});
