'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{createRequire}=require('node:module'),path=require('node:path');
const file=path.resolve('netlify/functions/calendar-book.js'),localRequire=createRequire(file);
function handler(){
 const sent=[];const fakeFetch=async(url,options={})=>{
  const address=String(url);if(address.includes('oauth2'))return {ok:true,json:async()=>({access_token:'synthetic'})};
  if(address.includes('gmail.googleapis.com')){sent.push({mail:Buffer.from(JSON.parse(options.body).raw,'base64url').toString('utf8')});return {ok:true,json:async()=>({id:'synthetic-mail'})};}
  if(options.method==='POST'){sent.push({event:JSON.parse(options.body)});return {ok:true,json:async()=>({id:'synthetic-event'})};}
  return {ok:true,json:async()=>({items:[]})};
 };
 class FixedDate extends Date{static now(){return Date.parse('2026-10-14T12:00:00Z')}}
 const context={exports:{},process:{env:{}},require:name=>name==='./site-calendars'?{calendarForSite:()=>({calendarId:'synthetic-calendar'})}:localRequire(name),fetch:fakeFetch,URL,URLSearchParams,Buffer,Date:FixedDate,Intl,console:{error:()=>{}}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});return {run:context.exports.handler,sent};
}
const input={servizio:'INAIL: malattia professionale',data:'2026-10-20',ora:'09:00',nome:'Assistito sintetico',telefono:'0000000000',email:'test@example.invalid'};
test('All three appointment modes reach the calendar and have matching confirmation instructions',async()=>{
 for(const mode of ['In sede','Telefonico','WhatsApp']){
  const {run,sent}=handler(),response=await run({httpMethod:'POST',body:JSON.stringify({...input,modalita:mode})});assert.equal(response.statusCode,200);assert.equal(JSON.parse(response.body).mode,mode);
  const event=sent.find(x=>x.event).event,mail=sent.find(x=>x.mail).mail;assert.equal(event.extendedProperties.private.appointmentMode,mode);assert.equal(event.extendedProperties.private.service,'Patronato / INAIL');
  if(mode==='In sede')assert.match(mail,/Ti aspettiamo presso/);else assert.ok(!mail.includes('Ti aspettiamo presso'));
  if(mode==='WhatsApp'){assert.match(mail,/Appuntamento tramite WhatsApp/);assert.match(mail,/un operatore/);}if(mode==='Telefonico')assert.match(mail,/Appuntamento telefonico/);
 }
});
test('Unknown appointment modes are rejected before contacting providers',async()=>{
 const {run,sent}=handler();const result=await run({httpMethod:'POST',body:JSON.stringify({...input,modalita:'arbitrary mode'})});assert.equal(result.statusCode,400);assert.equal(sent.length,0);
});
