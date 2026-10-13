'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {mailboxes,delivery}=require('../server/document-mail.cjs');
const {Practices}=require('../server/practices.cjs');
test('Document mail routes by site and service, encodes subject and never invents a destination',()=>{
 const map=mailboxes({CAF_DOCUMENT_EMAILS_JSON:JSON.stringify({molfetta:{'730':'tax@example.test',isee:'isee@example.test'},bari:{isee:'bari@example.test'}})});
 assert.equal(delivery({site:'molfetta',service:'730',id:'synthetic-id'},map).email,'tax@example.test');
 assert.equal(delivery({site:'bari',service:'isee',id:'synthetic-id'},map).email,'bari@example.test');
 assert.equal(delivery({site:'bari',service:'730',id:'synthetic-id'},map),null);
 const link=delivery({site:'molfetta',service:'isee',id:'synthetic-id'},map).mailto;assert.match(link,/subject=CAF%20ISEE/);assert.match(link,/riferimento%20synthetic-id/);assert.ok(!link.includes('attachment='));
 for(const value of [[],null,{molfetta:{isee:'test@example.test\r\nBcc:other@example.test'}},{molfetta:{isee:'a@example.test?bcc=b@example.test'}},{unknown:{}},{bari:{unknown:'a@example.test'}}])assert.throws(()=>mailboxes({CAF_DOCUMENT_EMAILS_JSON:JSON.stringify(value)}));
});
test('Email-only practices reject upload and download without scanner or vault access',async()=>{
 const practices=new Practices({vault:{get(){assert.fail('Vault must not be accessed')}},documentsEnabled:false});
 await assert.rejects(practices.upload({},'id',{},Buffer.from('document')),{code:'DOCUMENT_STORAGE_DISABLED'});
 assert.throws(()=>practices.download({},'id','doc'),{code:'DOCUMENT_STORAGE_DISABLED'});
});
test('Email-only HTTP endpoints block old upload and download while allowing case tracking',async t=>{
 const {createApp}=require('../server/app.cjs');let reads=0;
 const practices={documentsEnabled:false,detail:()=>{reads++;return {status:'in_review',documentDelivery:null,documents:[]}}};
 const server=createApp({practices,identity:{authenticate:async()=>({authenticated:true,subject:'synthetic'})},publicDirectory:'.',origin:'http://127.0.0.1'});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port,id='00000000-0000-0000-0000-000000000000';
 for(const [suffix,method]of [['/documents','POST'],['/documents/'+id,'GET']]){const r=await fetch(base+'/api/practices/'+id+suffix,{method,...(method==='POST'?{body:'not even JSON'}:{})});assert.equal(r.status,410);assert.equal((await r.json()).error,'DOCUMENT_STORAGE_DISABLED');}
 const r=await fetch(base+'/api/practices/'+id);assert.equal(r.status,200);assert.equal((await r.json()).status,'in_review');assert.equal(reads,1);
 assert.equal((await (await fetch(base+'/api/config')).json()).maxFileBytes,0);
});
