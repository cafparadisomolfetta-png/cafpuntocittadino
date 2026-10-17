'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {enabledSites}=require('../server/sites.cjs'),{Vault}=require('../server/vault.cjs'),{Identity}=require('../server/identity.cjs'),{Practices}=require('../server/practices.cjs'),{Candidatures}=require('../server/candidatures.cjs'),{calendars}=require('../server/calendar.cjs'),{inspectEnvironment}=require('../server/environment.cjs');
function setup(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'caf-sites-')),vault=new Vault({directory,key:crypto.randomBytes(32)});t.after(()=>{vault.close();fs.rmSync(directory,{recursive:true,force:true})});return vault;}
const citizen={authenticated:true,role:'citizen',subject:'test-owner',email:'owner@example.test'},admin={authenticated:true,role:'admin',subject:'test-admin',sites:['molfetta']};
test('Launch defaults to Molfetta and additional sites require explicit valid configuration',()=>{
 assert.deepEqual(enabledSites({}),['molfetta']);assert.deepEqual(enabledSites({CAF_ENABLED_SITES_JSON:'["molfetta","bari"]'}),['molfetta','bari']);
 for(const value of ['[]','["bari"]','["molfetta","unknown"]','["molfetta","molfetta"]','null','{broken'])assert.throws(()=>enabledSites({CAF_ENABLED_SITES_JSON:value}));
 const map={GESTIONALE_SITE_CALENDARS_JSON:'{"molfetta":"calendar-molfetta"}'};
 assert.equal(inspectEnvironment(map).checks.find(x=>x.id==='calendars').ok,true);
 assert.equal(inspectEnvironment({...map,CAF_ENABLED_SITES_JSON:'["molfetta","bari"]'}).checks.find(x=>x.id==='calendars').ok,false);
});
test('Inactive-site practice data remains stored and inaccessible until reactivation',async t=>{
 const vault=setup(t),both=new Practices({requireApproval:false,vault,scan:async()=> 'clean'}),input={site:'bari',service:'isee',mode:'direct',privacyVersion:'2026-10-12',privacyAcknowledged:true};
 const row=await both.create(citizen,input),single=new Practices({requireApproval:false,vault,scan:async()=> 'clean',activeSites:['molfetta']});
 await assert.rejects(single.create(citizen,input),e=>e.code==='SITE_NOT_ACTIVE');assert.deepEqual(single.list(citizen),[]);
 assert.throws(()=>single.detail(citizen,row.id),e=>e.code==='PRACTICE_NOT_FOUND');assert.throws(()=>single.list(admin,'bari'),e=>e.code==='SITE_FORBIDDEN');
 assert.equal(vault.get('practice',row.id).site,'bari');assert.equal(both.detail(citizen,row.id).id,row.id);
 const cv=new Candidatures({vault,scan:async()=>{throw Error('Must not scan inactive-site upload')},retentionDays:30,activeSites:['molfetta']});
 await assert.rejects(cv.submit(citizen,{site:'bari',type:'Collaborazione'},Buffer.alloc(0)),e=>e.code==='INVALID_CANDIDATURE');
});
test('Single-site staff permissions exclude Bari for administrator and existing operators',async t=>{
 const vault=setup(t);let email='admin@example.test';
 const identity=new Identity({vault,clientId:'test-client',adminEmail:email,activeSites:['molfetta'],operators:[{email:'bari@example.test',role:'operator',sites:['bari'],enabled:true},{email:'both@example.test',role:'operator',sites:['molfetta','bari'],enabled:true}],fetcher:async()=>({ok:true,json:async()=>({aud:'test-client',iss:'accounts.google.com',email_verified:true,email,sub:'test-subject',exp:Math.floor(Date.now()/1000)+3600})})});
 const headers={authorization:'Bearer synthetic-token-12345'};
 assert.deepEqual((await identity.authenticate(headers,'staff')).sites,['molfetta']);email='bari@example.test';await assert.rejects(identity.authenticate(headers,'staff'),e=>e.code==='STAFF_FORBIDDEN');email='both@example.test';assert.deepEqual((await identity.authenticate(headers,'staff')).sites,['molfetta']);
 assert.throws(()=>identity.set(admin,{email:'new@example.test',role:'operator',sites:['bari'],enabled:true}),e=>e.code==='INVALID_OPERATOR');
});
test('Reminder polling requires and reads only the active Molfetta calendar',async()=>{
 const calls=[],api=calendars({identity:{},vault:{},activeSites:['molfetta'],env:{GESTIONALE_SITE_CALENDARS_JSON:'{"molfetta":"calendar-molfetta"}',GOOGLE_CLIENT_ID:'test',GOOGLE_CLIENT_SECRET:'test',GOOGLE_REFRESH_TOKEN:'test'},fetcher:async url=>{calls.push(String(url));return {ok:true,json:async()=>String(url).includes('oauth2.googleapis')?{access_token:'test'}:{items:[]}}}});
 assert.deepEqual(await api.upcomingReminders(Date.now()),[]);assert.equal(calls.length,2);assert.ok(calls[1].includes('/calendar-molfetta/events'));
 await assert.rejects(api.getEvent('bari','synthetic-event'),e=>e.code==='INVALID_SITE');assert.equal(calls.length,2);
});
