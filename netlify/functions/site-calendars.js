'use strict';
// Public booking remains Molfetta-only until a site selector and Bari's calendar are configured.
function calendarForSite(site){
 const requested=String(site||'molfetta').trim().toLowerCase();
 if(!['molfetta','bari'].includes(requested))return {error:'Sede non valida',status:400};
 let mapping={};
 if(process.env.GESTIONALE_SITE_CALENDARS_JSON){
  try{mapping=JSON.parse(process.env.GESTIONALE_SITE_CALENDARS_JSON)}
  catch{return {error:'Configurazione calendari non valida',status:503}}
 }
 const legacy=process.env.GOOGLE_CALENDAR_ID||'primary';
 if(requested==='molfetta'){
  const id=mapping.molfetta||legacy;
  if(mapping.bari&&mapping.bari===id)return {error:'Calendari sedi non separati',status:503};
  return {site:requested,calendarId:id};
 }
 if(!mapping.bari||!mapping.molfetta||mapping.bari===mapping.molfetta)
  return {error:'Prenotazioni Bari non ancora abilitate',status:503};
 return {site:requested,calendarId:mapping.bari};
}
module.exports={calendarForSite};
