'use strict';
const {slots}=require('../netlify/functions/booking-schedule'),{validDate}=require('../netlify/functions/gestionale-date');
function siteSlots(env){let bari=null;if(env.CAF_BARI_SLOTS_JSON){try{bari=JSON.parse(env.CAF_BARI_SLOTS_JSON);if(!bari||typeof bari!=='object'||Array.isArray(bari)||Object.keys(bari).some(day=>! /^[0-6]$/.test(day)||!Array.isArray(bari[day])||bari[day].length>72||new Set(bari[day]).size!==bari[day].length||bari[day].some(time=>! /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)||Number(time.slice(0,2))*60+Number(time.slice(3))+20>1440)))throw Error()}catch{throw Error('Invalid approved Bari schedule')}}
 return (site,date)=>{if(!validDate(date))return [];if(site==='molfetta')return slots(date);if(site==='bari'&&bari)return bari[new Date(date+'T12:00:00Z').getUTCDay()]||[];return [];};
}
module.exports={siteSlots};
