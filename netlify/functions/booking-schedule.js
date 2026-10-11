'use strict';
// Sede Molfetta: slot di 20 minuti, orario locale Europe/Rome.
// Modificare in coordinamento con gli orari pubblicati e le regole di disponibilità.
const DURATION=20;
function ranges(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return [];
 const d=new Date(date+'T12:00:00Z');
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)return [];
 const day=d.getUTCDay();
 if(day===0||day===4||day===6)return [];
 return day===5?[['09:00','11:00'],['17:15','19:00']]:[['09:00','11:20'],['17:15','19:00']];
}
function toMinutes(v){const [h,m]=v.split(':').map(Number);return h*60+m;}
function toHHMM(v){return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');}
function slots(date){
 const result=[];
 for(const [start,end] of ranges(date)){for(let m=toMinutes(start);m+DURATION<=toMinutes(end);m+=DURATION)result.push(toHHMM(m));}
 return result;
}
module.exports={DURATION,slots,ranges};
