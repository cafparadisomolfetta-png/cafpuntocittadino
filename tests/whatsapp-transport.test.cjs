'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {whatsappReminders}=require('../server/whatsapp.cjs');
const now=Date.parse('2026-10-14T12:00:00Z'),account='AC'+'a'.repeat(32),message='SM'+'b'.repeat(32);
const env={CAF_WHATSAPP_ENABLED:'true',CAF_WHATSAPP_SPEND_AUTHORIZED:'true',CAF_WHATSAPP_REVIEWED:'true',TWILIO_ACCOUNT_SID:account,TWILIO_AUTH_TOKEN:'c'.repeat(32),TWILIO_MESSAGING_SERVICE_SID:'MG'+'d'.repeat(32),CAF_WHATSAPP_REMINDER_CONTENT_SID:'HX'+'e'.repeat(32)};
// Synthetic values only. The tests never contact Twilio or a real recipient.
const request={subject:'synthetic-citizen',to:'+390000000000',site:'molfetta',start:'2026-10-20T09:00:00+02:00'};
const consent={subject:request.subject,phone:request.to,purpose:'appointment-reminders',granted:true,noticeVersion:'test-v1',grantedAt:'2026-10-13T10:00:00Z',phoneVerifiedAt:'2026-10-13T09:00:00Z'};
function setup(options={}){let calls=0;const send=whatsappReminders({env,clock:()=>now,consentFor:async()=>consent,fetcher:async()=>{calls++;return {ok:true,json:async()=>({sid:message,account_sid:account,to:'whatsapp:'+request.to,status:'queued'})}},...options});return {send,count:()=>calls};}
test('WhatsApp stays off unless activation, spending and review are explicit',async()=>{
 for(const flag of ['CAF_WHATSAPP_ENABLED','CAF_WHATSAPP_SPEND_AUTHORIZED','CAF_WHATSAPP_REVIEWED']){
  const {send,count}=setup({env:{...env,[flag]:'false'}});await assert.rejects(send(request));assert.equal(count(),0);
 }
 const {send,count}=setup({env:{...env,TWILIO_AUTH_TOKEN:''}});await assert.rejects(send(request),e=>e.code==='WHATSAPP_CONFIGURATION_REQUIRED');assert.equal(count(),0);
});
test('Current opt-in must match verified phone, subject, purpose and notice',async()=>{
 for(const change of [{granted:false},{revokedAt:'2026-10-14T11:00:00Z'},{phone:'+390000000001'},{subject:'other'},{purpose:'marketing'},{noticeVersion:''},{grantedAt:'invalid'},{phoneVerifiedAt:null},{phoneVerifiedAt:'2027-01-01T00:00:00Z'}]){
  const {send,count}=setup({consentFor:async()=>({...consent,...change})});await assert.rejects(send(request),e=>e.code==='WHATSAPP_CONSENT_REQUIRED');assert.equal(count(),0);
 }
 const {send,count}=setup({consentFor:async()=>{throw Error('private record unavailable')}});await assert.rejects(send(request),e=>e.code==='WHATSAPP_CONSENT_UNAVAILABLE');assert.equal(count(),0);
});
test('Malformed destinations, inactive sites and past appointments never reach provider',async()=>{
 for(const change of [{to:'0806455509'},{to:'whatsapp:+390000000000'},{site:'bari'},{start:'2026-10-01T09:00:00Z'},{subject:''}]){const {send,count}=setup();await assert.rejects(send({...request,...change}),e=>e.code==='INVALID_WHATSAPP_REMINDER');assert.equal(count(),0);}
});
test('Transport uses approved template with minimum appointment information and reports acceptance only',async()=>{
 const {send}=setup({fetcher:async(url,options)=>{
  assert.equal(url,'https://api.twilio.com/2010-04-01/Accounts/'+account+'/Messages.json');assert.equal(options.redirect,'error');
  const fields=new URLSearchParams(options.body);assert.deepEqual([...fields.keys()].sort(),['ContentSid','ContentVariables','MessagingServiceSid','To']);
  const vars=JSON.parse(fields.get('ContentVariables'));assert.deepEqual(vars,{'1':'Molfetta','2':'20/10/26, 09:00'});
  assert.ok(!fields.has('Body'));assert.ok(!fields.has('MediaUrl'));assert.ok(!options.body.toString().includes('730'));
  return {ok:true,json:async()=>({sid:message,account_sid:account,to:'whatsapp:'+request.to,status:'queued',body:'do not return',secret:'do not return'})};
 }});assert.deepEqual(await send(request),{id:message,state:'accepted',providerStatus:'queued'});
});
test('Transport failures and invalid success responses are uncertain and never internally retried',async()=>{
 for(const responder of [async()=>{throw Error('timeout')},async()=>({ok:false,status:503}),async()=>({ok:true,json:async()=>{throw Error('bad JSON')}}),async()=>({ok:true,json:async()=>({sid:message,account_sid:'AC'+'f'.repeat(32),to:'whatsapp:'+request.to,status:'queued'})})]){
  let calls=0;const {send}=setup({fetcher:async()=>{calls++;return responder()}});await assert.rejects(send(request),e=>e.definitive===false);assert.equal(calls,1);
 }
});
test('Provider rejections do not expose response bodies or credentials',async()=>{
 const {send}=setup({fetcher:async()=>({ok:false,status:401,json:async()=>{throw Error('must not read sensitive response')}})});
 await assert.rejects(send(request),e=>e.code==='WHATSAPP_PROVIDER_REJECTED'&&e.definitive===true&&!e.message.includes(env.TWILIO_AUTH_TOKEN));
});
