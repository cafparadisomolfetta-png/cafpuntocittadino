'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {Vault}=require('../server/vault.cjs'),{Appointments}=require('../server/appointments.cjs');
const operator={authenticated:true,subject:'op',role:'operator',sites:['molfetta']},viewer={...operator,role:'viewer'};
const current={id:'event123456',etag:'"original"',start:{dateTime:'2027-01-11T09:00:00+01:00'},end:{dateTime:'2027-01-11T09:20:00+01:00'},extendedProperties:{private:{cancelCode:'AAAAAAAA',email:'test@example.invalid'}}};
const input={site:'molfetta',etag:'"original"',date:'2027-01-11',time:'09:20'};
function setup(t,overrides={}){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'caf-appointments-')),vault=new Vault({directory,key:crypto.randomBytes(32)});t.after(()=>{vault.close();fs.rmSync(directory,{recursive:true,force:true})});let calls=[];const calendar={getEvent:async()=>structuredClone(current),isFree:async()=>true,patchEvent:async(site,id,etag,fields)=>{calls.push({site,id,etag,fields});return {...current,...fields,etag:'"updated"'}},deleteEvent:async()=>{calls.push({deleted:true})},...overrides};const service=new Appointments({vault,calendar,clock:()=>Date.parse('2026-10-13T00:00:00Z')});return {vault,service,calls};}
test('Authorized move reserves destination, conditionally updates event and releases old slot',async t=>{
 const {vault,service,calls}=setup(t);vault.put('booking','molfetta:2027-01-11:09:00',{id:'molfetta:2027-01-11:09:00',eventId:current.id,state:'booked'});
 const response=await service.move(operator,current.id,input);assert.equal(response.moved,true);assert.equal(calls[0].etag,'"original"');assert.equal(calls[0].fields.start.dateTime,'2027-01-11T08:20:00.000Z');assert.equal(vault.get('booking','molfetta:2027-01-11:09:20').state,'booked');assert.equal(vault.get('booking','molfetta:2027-01-11:09:00').state,'cancelled');assert.ok(vault.verifyAudit());
});
test('Viewer, citizen and other-site actors cannot alter appointments',async t=>{const {service,calls}=setup(t);for(const actor of [viewer,{...operator,role:'citizen'},{...operator,sites:['bari']}])await assert.rejects(service.move(actor,current.id,input));assert.equal(calls.length,0)});
test('Outdated versions, non-CAF events and closed slots are rejected before write',async t=>{
 const {service,calls}=setup(t);await assert.rejects(service.move(operator,current.id,{...input,etag:'"old"'}),e=>e.code==='APPOINTMENT_VERSION_CONFLICT');await assert.rejects(service.move(operator,current.id,{...input,date:'2027-01-14'}),e=>e.code==='INVALID_APPOINTMENT_SLOT');assert.equal(calls.length,0);
 const foreign=setup(t,{getEvent:async()=>({...current,extendedProperties:{}})});await assert.rejects(foreign.service.cancel(operator,current.id,input),e=>e.code==='MANAGED_EVENT_NOT_FOUND');assert.equal(foreign.calls.length,0);
});
test('Busy slots and definite precondition failures release only the attempt reservation',async t=>{
 const busy=setup(t,{isFree:async()=>false});await assert.rejects(busy.service.move(operator,current.id,input),e=>e.code==='SLOT_OCCUPIED');assert.equal(busy.vault.get('booking','molfetta:2027-01-11:09:20'),null);
 const conflict=setup(t,{patchEvent:async()=>{throw Object.assign(Error(),{code:'APPOINTMENT_VERSION_CONFLICT',status:409,definitive:true})}});await assert.rejects(conflict.service.move(operator,current.id,input));assert.equal(conflict.vault.get('booking','molfetta:2027-01-11:09:20'),null);
});
test('Unknown provider outcomes hold destination and simultaneous changes cannot proceed',async t=>{
 let release;const wait=new Promise(resolve=>release=resolve);const {service,vault}=setup(t,{patchEvent:async()=>{await wait;throw Error('network failure')}});const first=service.move(operator,current.id,input);await new Promise(resolve=>setImmediate(resolve));await assert.rejects(service.move(operator,current.id,{...input,time:'09:40'}),e=>e.code==='APPOINTMENT_BUSY');release();await assert.rejects(first);assert.equal(vault.get('booking','molfetta:2027-01-11:09:20').state,'uncertain');
});
test('Authorized cancellation updates reservation history and records minimal operation audit',async t=>{
 const {service,vault,calls}=setup(t);vault.put('booking','molfetta:2027-01-11:09:00',{id:'molfetta:2027-01-11:09:00',eventId:current.id,state:'booked'});const response=await service.cancel(operator,current.id,input);assert.equal(response.cancelled,true);assert.equal(calls[0].deleted,true);assert.equal(vault.get('booking','molfetta:2027-01-11:09:00').state,'cancelled');assert.equal(vault.list('event-operation')[0].state,'completed');assert.ok(vault.verifyAudit());
});
test('Bari rescheduling uses only explicitly approved opening slots',()=>{
 const {siteSlots}=require('../server/site-slots.cjs');assert.deepEqual(siteSlots({})('bari','2027-01-11'),[]);assert.deepEqual(siteSlots({CAF_BARI_SLOTS_JSON:'{"1":["09:00","09:20"]}'})('bari','2027-01-11'),['09:00','09:20']);assert.throws(()=>siteSlots({CAF_BARI_SLOTS_JSON:'{"1":["25:00"]}'}));
});
