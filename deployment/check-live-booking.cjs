'use strict';
// Explicit live-provider check: one disposable booking to the office's own
// mailbox, then cancellation. Uses an isolated local vault, never real files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {Vault}=require('../server/vault.cjs');
const {bookingHandlers}=require('../server/booking.cjs');
const {checkGoogle}=require('./check-google.cjs');
const OFFICE='cafparadiso.molfetta@gmail.com';
async function main(){
 if(process.argv[2]!=='--run'||process.getuid?.()!==0||process.env.GESTIONALE_ADMIN_EMAIL!==OFFICE)throw Error('Explicit office-only check required');
 const readiness=await checkGoogle();assert.ok(Object.values(readiness).every(Boolean));
 const marker='COLLAUDO TECNICO '+crypto.randomBytes(5).toString('hex');
 const recovery='/var/lib/cafpuntocittadino-backup/live-booking-recovery.json';
 if(fs.existsSync(recovery))throw Error('Previous synthetic event requires reconciliation');
 const root=fs.mkdtempSync('/var/lib/cafpuntocittadino/booking-check-');fs.chmodSync(root,0o700);
 const originalFetch=global.fetch,originalError=console.error;let vault,created=null,removed=false;
 const result={availability:false,booking:false,emailAcceptedByGmail:false,cancellationEmailAcceptedByGmail:false,conflictBlocked:false,cancellation:false,slotReleased:false,temporaryEventRemoved:false};
 console.error=()=>{}; // Legacy handlers may log provider diagnostics; never expose them.
 global.fetch=async(url,options={})=>{
  const response=await originalFetch(url,{...options,signal:AbortSignal.timeout(15000)});
  if(options.method==='POST'&&/\/calendar\/v3\/calendars\/[^/]+\/events$/.test(String(url))&&response.ok){
   const data=await response.clone().json();
   if(typeof data.id==='string'&&String(data.summary).includes(marker)){
    created={url:String(url)+'/'+encodeURIComponent(data.id),id:data.id,marker};
    fs.writeFileSync(recovery,JSON.stringify(created)+'\n',{mode:0o600,flag:'wx'});
   }
  }
  return response;
 };
 try{
  const key=crypto.randomBytes(32);try{vault=new Vault({directory:path.join(root,'vault'),key});}finally{key.fill(0);}
  const calendar=require('../server/calendar.cjs').calendars({identity:{},vault,env:process.env,activeSites:['molfetta']});
  const wrapped=bookingHandlers({vault,book:require('../netlify/functions/calendar-book.js').handler,cancel:require('../netlify/functions/calendar-cancel.js').handler,verifyFree:calendar.verifyFree});
  const available=require('../netlify/functions/calendar-availability.js').handler;
  let chosen;
  for(let days=4;days<=17&&!chosen;days++){
   const date=new Date(Date.now()+days*86400000).toISOString().slice(0,10);
   if(!require('../netlify/functions/booking-schedule.js').slots(date).length)continue;
   const response=await available({httpMethod:'GET',queryStringParameters:{date}});
   assert.equal(response.statusCode,200);const slots=JSON.parse(response.body).slots;
   if(slots?.length)chosen={date,time:slots[0]};
  }
  assert.ok(chosen);result.availability=true;
  const request={httpMethod:'POST',body:JSON.stringify({servizio:'ISEE',data:chosen.date,ora:chosen.time,nome:marker,telefono:'0000000000',email:OFFICE,modalita:'Telefonico'})};
  const booked=await wrapped.book(request);assert.equal(booked.statusCode,200);
  const body=JSON.parse(booked.body);assert.equal(body.ok,true);assert.ok(created&&body.eventId===created.id);result.booking=true;result.emailAcceptedByGmail=body.emailInviata===true;
  const event=await calendar.getEvent('molfetta',body.eventId);assert.ok(event.summary.includes(marker));assert.equal(event.extendedProperties.private.email,OFFICE);
  assert.equal((await wrapped.book(request)).statusCode,409);result.conflictBlocked=true;
  const cancelled=await wrapped.cancel({httpMethod:'POST',body:JSON.stringify({codiceDisdetta:body.codiceDisdetta})});
  assert.equal(cancelled.statusCode,200);assert.equal(JSON.parse(cancelled.body).ok,true);result.cancellation=true;result.cancellationEmailAcceptedByGmail=JSON.parse(cancelled.body).emailInviata===true;
  const row=vault.list('booking')[0];assert.equal(row.state,'cancelled');
  result.slotReleased=await calendar.verifyFree(row);assert.equal(result.slotReleased,true);
  removed=true;result.temporaryEventRemoved=true;fs.unlinkSync(recovery);
  assert.equal(result.emailAcceptedByGmail,true);assert.equal(result.cancellationEmailAcceptedByGmail,true);
 }finally{
  // On any failure, remove ONLY the event created by this invocation, after
  // matching its unique marker. Retain private recovery metadata on ambiguity.
  if(created&&!removed){
   try{
    const tokenResponse=await originalFetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:process.env.GOOGLE_REFRESH_TOKEN}),signal:AbortSignal.timeout(10000)});
    const token=await tokenResponse.json();assert.equal(tokenResponse.ok,true);const headers={Authorization:'Bearer '+token.access_token};
    const found=await originalFetch(created.url,{headers,signal:AbortSignal.timeout(10000)});
    if([404,410].includes(found.status))removed=true;
    else{const event=await found.json();assert.equal(found.ok,true);if(event.status==='cancelled')removed=true;else{assert.ok(String(event.summary).includes(marker));const deletion=await originalFetch(created.url,{method:'DELETE',headers:{...headers,'If-Match':event.etag},signal:AbortSignal.timeout(10000)});removed=deletion.ok;}}
    if(removed){result.temporaryEventRemoved=true;fs.unlinkSync(recovery);}
   }catch{}
  }
  global.fetch=originalFetch;console.error=originalError;vault?.close();fs.rmSync(root,{recursive:true,force:true});
  console.log(JSON.stringify({...result,cleanupRequired:!!created&&!removed,inboxDeliveryVerified:false,realGoogleLoginTested:false}));
 }
}
if(require.main===module)main().catch(()=>{console.error('LIVE_BOOKING_CHECK_FAILED: inspect only boolean results and private recovery metadata.');process.exitCode=1;});
