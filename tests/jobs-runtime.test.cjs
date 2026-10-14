'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {Vault}=require('../server/vault.cjs'),{Jobs,SOURCES}=require('../server/jobs.cjs'),{googleMail}=require('../server/google-mail.cjs');
const admin={authenticated:true,role:'admin',subject:'admin'},operator={authenticated:true,role:'operator',subject:'op'};
const event={id:'event123456',etag:'"1"',start:{dateTime:'2027-01-11T09:00:00+01:00'},extendedProperties:{private:{email:'test@example.invalid',cancelCode:'AAAAAAAA'}}};
function setup(t,options={}){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'caf-jobs-')),vault=new Vault({directory,key:crypto.randomBytes(32)});t.after(()=>{vault.close();fs.rmSync(directory,{recursive:true,force:true})});const jobs=new Jobs({vault,calendar:{upcomingReminders:async()=>[{site:'molfetta',event}],getEvent:async()=>event},sendMail:async()=>({id:'test-message'}),retentionDays:90,...options});return {vault,jobs};}
test('Scheduler and delivery stay disabled unless explicitly enabled',async t=>{const {jobs,vault}=setup(t);await assert.rejects(jobs.run('news',admin),e=>e.code==='JOBS_DISABLED');jobs.enqueue({kind:'reminder',event,site:'molfetta'});assert.equal((await jobs.deliver()).disabled,true);assert.equal(vault.list('outbox')[0].state,'pending')});
test('Reminder retries create one outbox entry and do not persist service or medical summary',async t=>{const {jobs,vault}=setup(t,{enabled:true,mailEnabled:true});await jobs.run('reminders',admin);await jobs.run('reminders',admin);assert.equal(vault.list('outbox').length,1);assert.equal(vault.list('outbox')[0].text.includes('AAAAAAAA'),false);assert.equal((await jobs.run('deliver',admin)).sent,1);assert.equal((await jobs.run('deliver',admin)).sent,0);assert.ok(vault.verifyAudit())});
test('Unknown delivery outcomes are not retried automatically',async t=>{let calls=0;const {jobs,vault}=setup(t,{enabled:true,mailEnabled:true,sendMail:async()=>{calls++;throw Error('Unknown response')}});jobs.enqueue({kind:'reminder',event,site:'molfetta'});await jobs.deliver();await jobs.deliver();assert.equal(calls,1);assert.equal(vault.list('outbox')[0].state,'uncertain')});
test('News monitoring publishes only explicitly approved editorial entries from official HTTPS sources',async t=>{let body='First version';const {jobs}=setup(t,{enabled:true,fetcher:async url=>({ok:true,url,text:async()=>body})});await jobs.run('news',admin);assert.equal(jobs.publicNews().catalog.length,0);assert.equal(jobs.publicNews().sources.length,SOURCES.length);body='Updated content';await jobs.run('news',admin);assert.ok(jobs.publicNews().sources.every(x=>x.changed));assert.throws(()=>jobs.approveNews(operator,{key:'news'}),e=>e.code==='ADMIN_REQUIRED');assert.throws(()=>jobs.approveNews(admin,{key:'news',title:'Title',summary:'Text',source_url:'javascript:alert(1)',approved:true}),e=>e.code==='INVALID_NEWS_SOURCE');jobs.approveNews(admin,{key:'news',title:'Aggiornamento da verificare',summary:'Informazione inserita dall’amministratrice',source_url:'https://www.inps.it/test',approved:false});assert.equal(jobs.publicNews().catalog.length,0);jobs.approveNews(admin,{key:'news',title:'Informazione approvata',summary:'Test sintetico',source_url:'https://www.inps.it/test',approved:true});assert.equal(jobs.publicNews().catalog.length,1)});
test('Crashed jobs require admin reconciliation, with unknown mail outcomes preserved',async t=>{const {jobs,vault}=setup(t,{enabled:true});vault.put('job','deliver',{id:'deliver',state:'running',startedAt:'2020-01-01T00:00:00Z'});vault.put('outbox','test',{id:'test',state:'sending'});await assert.rejects(jobs.run('deliver',admin),e=>e.code==='JOB_REQUIRES_RECONCILIATION');assert.throws(()=>jobs.reset(operator,'deliver'),e=>e.code==='ADMIN_REQUIRED');jobs.reset(admin,'deliver');assert.equal(vault.get('outbox','test').state,'uncertain')});
test('Google mail rejects injection, encodes subject and never sends while disabled',async()=>{let calls=0;const disabled=googleMail({env:{},fetcher:async()=>{calls++;throw Error()}});await assert.rejects(disabled({to:'test@example.invalid',subject:'Test',text:'Test'}));assert.equal(calls,0);const enabled=googleMail({env:{CAF_MAIL_ENABLED:'true',CAF_SENDER_EMAIL:'sender@example.invalid'},fetcher:async(url,options)=>{calls++;if(url.includes('oauth2'))return {ok:true,json:async()=>({access_token:'synthetic-token'})};const raw=Buffer.from(JSON.parse(options.body).raw,'base64url').toString();assert.ok(raw.includes('Subject: =?UTF-8?B?'));assert.ok(!raw.includes('Bcc:'));return {ok:true,json:async()=>({id:'synthetic-id'})}}});await assert.rejects(enabled({to:'test@example.invalid\r\nBcc:fake@example.invalid',subject:'Test',text:'Test'}));assert.equal(calls,0);assert.equal((await enabled({to:'test@example.invalid',subject:'Promemoria',text:'Test sintetico'})).id,'synthetic-id');assert.equal(calls,2)});

test('Queued reminders and move notices suppress outdated, cancelled and reassigned events',async t=>{
 const now=Date.parse('2026-10-14T12:00:00Z');
 for(const kind of ['reminder','appointment-moved'])for(const current of [
  {...event,start:{dateTime:'2027-01-12T09:00:00+01:00'}},
  {...event,status:'cancelled'},
  {...event,extendedProperties:{private:{email:'other@example.invalid',cancelCode:'BBBBBBBB'}}},
  {...event,id:'other-event'},
  {...event,extendedProperties:{private:{email:event.extendedProperties.private.email}}}
 ]){
  let calls=0;const {jobs,vault}=setup(t,{mailEnabled:true,clock:()=>now,calendar:{getEvent:async()=>current},sendMail:async()=>{calls++;return {id:'never'}}});
  jobs.enqueue({kind,event,site:'molfetta'});const result=await jobs.deliver();assert.equal(result.obsolete,1);assert.equal(calls,0);assert.equal(vault.list('outbox')[0].state,'obsolete');assert.equal(vault.list('outbox')[0].attempts,0);assert.ok(vault.verifyAudit());
 }
});
test('Calendar outages defer notification without attempts and allow a later verified delivery',async t=>{
 let unavailable=true,calls=0;const {jobs,vault}=setup(t,{mailEnabled:true,calendar:{getEvent:async()=>{if(unavailable)throw Error('unavailable');return event}},sendMail:async()=>{calls++;return {id:'synthetic-mail'}}});
 jobs.enqueue({kind:'reminder',event,site:'molfetta'});assert.equal((await jobs.deliver()).deferred,1);assert.equal(vault.list('outbox')[0].attempts,0);assert.equal(vault.list('outbox')[0].state,'pending');assert.equal(calls,0);
 unavailable=false;assert.equal((await jobs.deliver()).sent,1);assert.equal(calls,1);
});
test('A confirmed cancellation notice remains sendable after the calendar event is deleted',async t=>{
 let calendarCalls=0;const {jobs}=setup(t,{mailEnabled:true,calendar:{getEvent:async()=>{calendarCalls++;throw Error('deleted')}}});
 jobs.enqueue({kind:'appointment-cancelled',event,site:'molfetta'});assert.equal((await jobs.deliver()).sent,1);assert.equal(calendarCalls,0);
});
test('An expired reminder or legacy unverifiable entry never sends',async t=>{
 let calls=0;const {jobs,vault}=setup(t,{mailEnabled:true,clock:()=>Date.parse('2027-01-11T10:00:00Z'),sendMail:async()=>{calls++;return {id:'never'}}});
 jobs.enqueue({kind:'reminder',event,site:'molfetta'});vault.put('outbox','legacy',{id:'legacy',state:'pending',kind:'reminder',site:'molfetta',to:'test@example.invalid',attempts:0,createdAt:'2026-10-14T12:00:00Z'});
 assert.equal((await jobs.deliver()).obsolete,2);assert.equal(calls,0);
});
