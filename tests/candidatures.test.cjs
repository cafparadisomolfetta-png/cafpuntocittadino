'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {Vault}=require('../server/vault.cjs'),{Candidatures}=require('../server/candidatures.cjs');
const citizen={authenticated:true,role:'citizen',subject:'candidate-one',email:'candidate@example.invalid'},other={...citizen,subject:'candidate-two'},admin={authenticated:true,role:'admin',subject:'admin'},operator={authenticated:true,role:'operator',subject:'operator',sites:['molfetta']};
const pdf=Buffer.from('%PDF-1.4\nsynthetic-cv-only\n%%EOF'),input={site:'molfetta',type:'Collaborazione',name:'Persona',surname:'Test',phone:'0800000000',presentation:'Candidatura sintetica di collaudo',privacyVersion:'2026-10-25',privacyAcknowledged:true,fileName:'cv-test.pdf',mime:'application/pdf',bytes:pdf.length};
function setup(t,scan=async()=> 'clean'){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'caf-cv-')),vault=new Vault({directory,key:crypto.randomBytes(32)}),cvs=new Candidatures({vault,scan,retentionDays:90});t.after(()=>{vault.close();fs.rmSync(directory,{recursive:true,force:true})});return {vault,cvs,directory}}
test('CVs are scanned, encrypted, visible to the applicant and admin only',async t=>{
 const {vault,cvs,directory}=setup(t),row=await cvs.submit(citizen,{...input,email:'untrusted@example.invalid'},pdf);
 assert.equal(cvs.list(citizen).length,1);assert.equal(cvs.list(other).length,0);assert.throws(()=>cvs.list(operator),e=>e.code==='ADMIN_REQUIRED');assert.throws(()=>cvs.download(other,row.id),e=>e.code==='CANDIDATURE_NOT_FOUND');
 assert.equal(cvs.list(admin)[0].email,citizen.email);assert.deepEqual(cvs.download(admin,row.id).bytes,pdf);assert.equal(cvs.list(citizen)[0].email,undefined);
 const bytes=fs.readFileSync(path.join(directory,'vault.sqlite'));for(const s of ['cv-test.pdf','candidate@example.invalid','synthetic-cv-only'])assert.equal(bytes.includes(Buffer.from(s)),false);
 assert.ok(vault.verifyAudit());
});
test('PDF violations, missing acknowledgement and scanner outages do not persist a CV',async t=>{
 const {cvs,vault}=setup(t,async()=>{throw Error('offline')});await assert.rejects(cvs.submit(citizen,input,pdf),e=>e.code==='SCANNER_UNAVAILABLE');assert.equal(vault.list('candidature').length,0);assert.equal(vault.list('cv-content').length,0);
 await assert.rejects(cvs.submit(citizen,{...input,privacyAcknowledged:false},pdf),e=>e.code==='PRIVACY_ACKNOWLEDGEMENT_REQUIRED');await assert.rejects(cvs.submit(citizen,{...input,fileName:'cv.doc'},pdf),e=>e.code==='INVALID_FILE_TYPE');
 const big=Buffer.alloc(6*1024*1024);await assert.rejects(cvs.submit(citizen,{...input,bytes:big.length},big),e=>e.code==='INVALID_FILE_SIZE');
});
test('Applicant cannot change status or access another CV; admin versions prevent lost updates',async t=>{
 const {cvs}=setup(t),row=await cvs.submit(citizen,input,pdf);assert.throws(()=>cvs.status(citizen,row.id,{version:1,status:'in_review'}),e=>e.code==='ADMIN_REQUIRED');
 cvs.status(admin,row.id,{version:1,status:'in_review'});assert.throws(()=>cvs.status(admin,row.id,{version:1,status:'contacted'}),e=>e.code==='VERSION_CONFLICT');
 cvs.status(admin,row.id,{version:2,status:'archived'});assert.throws(()=>cvs.status(admin,row.id,{version:3,status:'received'}),e=>e.code==='INVALID_TRANSITION');
});
test('Duplicate CVs are rejected; erasure and approved expiry remove content',async t=>{
 const {cvs,vault}=setup(t),row=await cvs.submit(citizen,input,pdf);await assert.rejects(cvs.submit(citizen,input,pdf),e=>e.code==='DUPLICATE_CANDIDATURE');
 assert.throws(()=>cvs.erase(citizen,row.id),e=>e.code==='ADMIN_REQUIRED');cvs.erase(admin,row.id);assert.equal(vault.list('cv-content').length,0);
 const old=new Candidatures({vault,scan:async()=> 'clean',retentionDays:1,clock:()=> '2020-01-01T00:00:00Z'});await old.submit(citizen,input,pdf);assert.equal(old.purge(admin).erased,1);assert.equal(vault.list('candidature').length,0);assert.equal(vault.list('cv-content').length,0);assert.ok(vault.verifyAudit());
});
test('CV submission rolls back metadata/content if audit fails',async t=>{
 const {cvs,vault}=setup(t);vault.audit=()=>{throw Error('Audit unavailable')};await assert.rejects(cvs.submit(citizen,input,pdf));assert.equal(vault.list('candidature').length,0);assert.equal(vault.list('cv-content').length,0);
});
