'use strict';
const crypto=require('node:crypto');
const {failure}=require('./practices.cjs'),{slots}=require('../netlify/functions/booking-schedule');
function romeInstant(date,time){const part=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Rome',timeZoneName:'shortOffset'}).formatToParts(new Date(date+'T12:00:00Z')).find(x=>x.type==='timeZoneName').value;const h=Number(part.match(/GMT([+-]\d+)/)?.[1]||1);return new Date(date+'T'+time+':00'+(h>=0?'+':'-')+String(Math.abs(h)).padStart(2,'0')+':00').toISOString()}
class Appointments{
 constructor({vault,calendar,slotsFor=(site,date)=>site==='molfetta'?slots(date):[],notify=()=>{},clock=()=>Date.now()}){this.vault=vault;this.calendar=calendar;this.slotsFor=slotsFor;this.notify=notify;this.clock=clock;this.active=new Set();}
 authorize(actor,input,id){
  if(!actor?.authenticated||!['admin','operator','manager'].includes(actor.role))failure(403,'STAFF_WRITE_REQUIRED');
  if(!input||!['molfetta','bari'].includes(input.site)||!actor.sites?.includes(input.site))failure(403,'SITE_FORBIDDEN');
  if(!/^[a-zA-Z0-9_-]{5,160}$/.test(id)||typeof input.etag!=='string'||input.etag.length>256||!/^"[^"\r\n]+"$/.test(input.etag))failure(400,'INVALID_EVENT_REFERENCE');
 }
 async current(actor,input,id){this.authorize(actor,input,id);const row=await this.calendar.getEvent(input.site,id);if(row.id!==id||row.status==='cancelled'||!row.start?.dateTime||!row.end?.dateTime||!row.extendedProperties?.private?.cancelCode)failure(404,'MANAGED_EVENT_NOT_FOUND');if(row.etag!==input.etag)failure(409,'APPOINTMENT_VERSION_CONFLICT');return row;}
 releasePrevious(id,except,now){for(const row of this.vault.list('booking').filter(x=>x.eventId===id&&x.id!==except&&['booked','pending','uncertain'].includes(x.state)))this.vault.put('booking',row.id,{...row,state:'cancelled',releasedAt:now});}
 async move(actor,id,input){
  this.authorize(actor,input,id);const lock=input.site+':'+id;if(this.active.has(lock))failure(409,'APPOINTMENT_BUSY');this.active.add(lock);let reservation,sent=false;
  try{
   const current=await this.current(actor,input,id);
   if(typeof input.date!=='string'||typeof input.time!=='string'||!this.slotsFor(input.site,input.date).includes(input.time))failure(400,'INVALID_APPOINTMENT_SLOT');
   const start=romeInstant(input.date,input.time),end=new Date(Date.parse(start)+20*60000).toISOString();if(Date.parse(start)<=this.clock())failure(400,'PAST_APPOINTMENT');
   if(Date.parse(current.start.dateTime)===Date.parse(start))return {moved:false,start,etag:current.etag};
   const key=input.site+':'+input.date+':'+input.time,attempt=crypto.randomUUID(),now=new Date(this.clock()).toISOString();
   reservation={id:key,state:'pending',attempt,eventId:id,start,operation:'appointment-move',createdAt:now,cancelCode:current.extendedProperties.private.cancelCode};
   this.vault.transaction(()=>{const old=this.vault.get('booking',key);if(old&&old.state!=='cancelled')failure(409,'SLOT_RESERVED');this.vault.put('booking',key,reservation);this.vault.audit(actor,'appointment.move_request',id)});
   if(!(await this.calendar.isFree(input.site,start,end,id)))failure(409,'SLOT_OCCUPIED');
   sent=true;const updated=await this.calendar.patchEvent(input.site,id,input.etag,{start:{dateTime:start,timeZone:'Europe/Rome'},end:{dateTime:end,timeZone:'Europe/Rome'}});
   if(updated.id!==id||Date.parse(updated.start?.dateTime)!==Date.parse(start))failure(503,'APPOINTMENT_OUTCOME_UNCERTAIN');
   let queued=false;this.vault.transaction(()=>{this.releasePrevious(id,key,now);this.vault.put('booking',key,{...reservation,state:'booked'});this.vault.audit(actor,'appointment.moved',id);queued=!!this.notify({kind:'appointment-moved',event:updated,site:input.site})});
   return {moved:true,start,etag:updated.etag,notificationQueued:queued};
  }catch(error){
   if(reservation)this.vault.transaction(()=>{const row=this.vault.get('booking',reservation.id);if(row?.attempt===reservation.attempt){if(!sent||error.definitive)this.vault.remove('booking',reservation.id);else this.vault.put('booking',reservation.id,{...reservation,state:'uncertain'})}});
   throw error;
  }finally{this.active.delete(lock)}
 }
 async cancel(actor,id,input){
  this.authorize(actor,input,id);const lock=input.site+':'+id;if(this.active.has(lock))failure(409,'APPOINTMENT_BUSY');this.active.add(lock);
  try{
   const current=await this.current(actor,input,id),auditId=crypto.randomUUID(),now=new Date(this.clock()).toISOString();
   this.vault.transaction(()=>{this.vault.put('event-operation',auditId,{id:auditId,eventId:id,site:input.site,operation:'cancel',state:'pending',createdAt:now});this.vault.audit(actor,'appointment.cancel_request',id)});
   try{await this.calendar.deleteEvent(input.site,id,input.etag)}catch(error){this.vault.transaction(()=>this.vault.put('event-operation',auditId,{id:auditId,eventId:id,site:input.site,state:error.definitive?'failed':'uncertain',createdAt:now}));throw error;}
   let queued=false;this.vault.transaction(()=>{for(const row of this.vault.list('booking').filter(x=>x.eventId===id&&['booked','pending','uncertain'].includes(x.state)))this.vault.put('booking',row.id,{...row,state:'cancelled',cancelledAt:now});this.vault.put('event-operation',auditId,{id:auditId,eventId:id,site:input.site,state:'completed',createdAt:now});this.vault.audit(actor,'appointment.cancelled',id);queued=!!this.notify({kind:'appointment-cancelled',event:current,site:input.site})});
   return {cancelled:true,notificationQueued:queued};
  }finally{this.active.delete(lock)}
 }
}
module.exports={Appointments,romeInstant};
