'use strict';
const {googleEventId}=require('./google-event-id.cjs');
// Read-only reconciliation probe. Never marks a booking confirmed without checking
// the event start/end and site. No calendar writes are made by this adapter.
async function inspectGoogleEvent({claimId,calendarId,accessToken,site='molfetta',secret,fetchImpl=fetch}){
 if(typeof calendarId!=='string'||!calendarId.trim()||typeof accessToken!=='string'||!accessToken.trim())throw new TypeError('Missing Google credentials');
 const id=googleEventId({claimId,site,secret});
 const url='https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(calendarId)+'/events/'+encodeURIComponent(id);
 const response=await fetchImpl(url,{method:'GET',headers:{Authorization:'Bearer '+accessToken},signal:AbortSignal.timeout(8000)});
 if(response.status===404)return {state:'not_found',eventId:id};
 if(!response.ok)return {state:'unknown',eventId:id};
 const event=await response.json();
 if(event.id!==id||event.status==='cancelled')return {state:'unknown',eventId:id};
 return {state:'found',eventId:id,start:event.start?.dateTime||null,end:event.end?.dateTime||null};
}
module.exports={inspectGoogleEvent};
