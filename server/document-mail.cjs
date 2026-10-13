'use strict';
// Only configured destinations; never accept a recipient from a citizen request.
function mailboxes(env={}){
 const map=JSON.parse(env.CAF_DOCUMENT_EMAILS_JSON||'{}');
 if(!map||Array.isArray(map)||typeof map!=='object')throw Error('Invalid document email configuration');
 for(const [site,services]of Object.entries(map)){
  if(!['molfetta','bari'].includes(site)||!services||Array.isArray(services)||typeof services!=='object')throw Error('Invalid document email configuration');
  for(const [service,email]of Object.entries(services))if(!['730','isee'].includes(service)||typeof email!=='string'||email.length>254||! /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email))throw Error('Invalid document email configuration');
 }
 return map;
}
function delivery(record,map){
 const email=map[record.site]?.[record.service];if(!email)return null;
 const subject='CAF '+record.service.toUpperCase()+' - riferimento '+record.id;
 const body='Riferimento pratica: '+record.id+'\r\nSede: '+record.site+'\r\n\r\nAllego esclusivamente i PDF richiesti dalla sede.\r\n';
 return {email,mailto:'mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)};
}
module.exports={mailboxes,delivery};
