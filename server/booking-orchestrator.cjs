'use strict';
// Staging orchestration only: external calendar writes remain disconnected from public routes.
// Callers must supply an idempotent Google event creator and a verified availability checker.
const {claimSlot,confirmSlot,releaseUnconfirmedSlot}=require('./database.cjs');
async function reserveAppointment({pool,site='molfetta',start,end,checkAvailability,createEvent}){
 if(typeof checkAvailability!=='function'||typeof createEvent!=='function')throw new TypeError('Calendar adapters required');
 const claim=await claimSlot(pool,{site,start,end});
 if(!claim.held)return {ok:false,code:'SLOT_CONFLICT'};
 let eventId;
 try{
  if(await checkAvailability({site,start,end})!==true){
   await releaseUnconfirmedSlot(pool,{id:Number(claim.id)});
   return {ok:false,code:'CALENDAR_UNAVAILABLE'};
  }
  // Production must use a deterministic external Google event id and recovery worker.
  eventId=await createEvent({site,start,end,claimId:claim.id});
  if(typeof eventId!=='string'||!eventId)throw Error('Missing Google event id');
  if(!await confirmSlot(pool,{id:Number(claim.id),eventId}))throw Error('Confirmation failed');
  return {ok:true,id:claim.id,eventId};
 }catch(error){
  // After a calendar create attempt, its result may be unknown. Never release the
  // database hold automatically: doing so could enable a duplicate real booking.
  if(!eventId) return {ok:false,code:'RECONCILIATION_REQUIRED',id:claim.id};
  return {ok:false,code:'RECONCILIATION_REQUIRED',id:claim.id};
 }
}
module.exports={reserveAppointment};
