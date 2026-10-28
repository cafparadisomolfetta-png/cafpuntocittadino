'use strict';
// Public booking supports Molfetta only; unsupported sites fail closed.
function calendarForSite(site){
 const requested=String(site||'molfetta').trim().toLowerCase();
 if(requested!=='molfetta')return {error:'Sede non disponibile',status:400};
 let mapping={};
 if(process.env.GESTIONALE_SITE_CALENDARS_JSON){
  try{mapping=JSON.parse(process.env.GESTIONALE_SITE_CALENDARS_JSON)}catch{return {error:'Configurazione calendari non valida',status:503}}
  if(!mapping||typeof mapping!=='object'||Array.isArray(mapping)||Object.keys(mapping).some(x=>x!=='molfetta')||typeof mapping.molfetta!=='string'||!mapping.molfetta.trim())return {error:'Configurazione calendario Molfetta non valida',status:503};
 }
 return {site:'molfetta',calendarId:mapping.molfetta||process.env.GOOGLE_CALENDAR_ID||'primary'};
}
module.exports={calendarForSite};
