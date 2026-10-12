'use strict';
const crypto=require('node:crypto');
const {slots}=require('../netlify/functions/booking-schedule');
const reply=(statusCode,error)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({error})});
// Durable per-slot reservation: ambiguous provider results remain blocked until reconciled.
// This wrapper is used only by the private runtime, not by the existing Netlify deployment.
function bookingHandlers({vault,book,cancel,verifyFree}){
 const active=new Set();
 return {
  reservations:actor=>{if(actor.role!=='admin'||!actor.authenticated)throw Object.assign(Error('ADMIN_REQUIRED'),{status:403,code:'ADMIN_REQUIRED'});return vault.list('booking').filter(x=>['pending','uncertain'].includes(x.state)).map(({id,state,start,createdAt})=>({id,state,start,createdAt}));},
  reconcile:async(actor,id)=>{
   const fail=code=>{throw Object.assign(Error(code),{status:409,code})};
   if(actor.role!=='admin'||!actor.authenticated)throw Object.assign(Error('ADMIN_REQUIRED'),{status:403,code:'ADMIN_REQUIRED'});
   const row=vault.get('booking',id);
   if(!row||!['pending','uncertain'].includes(row.state)||active.has(row.attempt)||Date.now()-Date.parse(row.createdAt)<600000)fail('BOOKING_STILL_IN_PROGRESS');
   if(typeof verifyFree!=='function'||!(await verifyFree(row)))fail('SLOT_NOT_VERIFIED_FREE');
   return vault.transaction(()=>{const current=vault.get('booking',id);if(current?.attempt!==row.attempt||active.has(row.attempt)||!['pending','uncertain'].includes(current.state))fail('BOOKING_CHANGED');vault.put('booking',id,{...row,state:'cancelled',reconciledAt:new Date().toISOString()});vault.audit(actor,'booking.reconcile',id);return {released:true};});
  },
  book:async event=>{
   if(event.httpMethod!=='POST')return book(event);
   let p;try{p=JSON.parse(event.body||'{}')}catch{return reply(400,'Richiesta non valida')}
   const site=p.sede||p.site||'molfetta',date=p.data||p.date,time=p.ora||p.time;
   if(site!=='molfetta'||typeof date!=='string'||typeof time!=='string'||!slots(date).includes(time))return reply(400,'Sede, data o orario non validi');
   const id=site+':'+date+':'+time,attempt=crypto.randomUUID();
   const offset=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Rome',timeZoneName:'shortOffset'}).formatToParts(new Date(date+'T12:00:00Z')).find(x=>x.type==='timeZoneName').value;
   const hours=Number(offset.match(/GMT([+-]\d+)/)?.[1]||1);
   const start=new Date(date+'T'+time+':00'+(hours>=0?'+':'-')+String(Math.abs(hours)).padStart(2,'0')+':00').toISOString();
   const acquired=vault.transaction(()=>{const current=vault.get('booking',id);if(current&&current.state!=='cancelled')return false;vault.put('booking',id,{id,state:'pending',attempt,start,createdAt:new Date().toISOString()});return true});
   if(!acquired)return reply(409,'Orario già prenotato o in verifica. Scegli un altro orario.');
   active.add(attempt);try{
   let response;try{response=await book(event)}catch{return reply(503,'Prenotazione in verifica. Contatta la sede prima di riprovare.')}
   let body;try{body=JSON.parse(response.body)}catch{body={}}
   vault.transaction(()=>{
    const current=vault.get('booking',id);if(current?.attempt!==attempt)throw Error('Booking reservation lost');
    if(response.statusCode===200&&body.ok===true&&body.eventId&&body.codiceDisdetta){
     vault.put('booking',id,{...current,state:'booked',eventId:body.eventId,cancelCode:body.codiceDisdetta});
    }else if([400,405,409].includes(response.statusCode))vault.remove('booking',id);
    else vault.put('booking',id,{...current,state:'uncertain'});
   });
   return response;
   }finally{active.delete(attempt)}
  },
  cancel:async event=>{
   const response=await cancel(event);
   let payload,result;try{payload=JSON.parse(event.body||'{}');result=JSON.parse(response.body)}catch{return response}
   if(response.statusCode===200&&result.ok===true){
    const code=String(payload.codiceDisdetta||payload.codice_disdetta||payload.cancelCode||payload.codice||'').trim().toUpperCase();
    vault.transaction(()=>{for(const row of vault.list('booking').filter(x=>x.cancelCode===code&&x.state==='booked')){vault.put('booking',row.id,{...row,state:'cancelled',cancelledAt:new Date().toISOString()});vault.audit({subject:'public-cancellation',role:'public'},'booking.cancel',row.id)}});
   }
   return response;
  }
 };
}
module.exports={bookingHandlers};
