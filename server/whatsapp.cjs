'use strict';
// Optional transport only. No scheduler or public endpoint activates this adapter.
const sid=(value,prefix)=>typeof value==='string'&&new RegExp('^'+prefix+'[0-9a-fA-F]{32}$').test(value);
const phone=value=>typeof value==='string'&&/^\+[1-9][0-9]{7,14}$/.test(value);
function rejected(code,definitive=true){return Object.assign(Error(code),{code,definitive});}
function whatsappReminders({env={},fetcher=fetch,consentFor,clock=()=>Date.now()}={}){
 return async({subject,to,start,site}={})=>{
  if(env.CAF_WHATSAPP_ENABLED!=='true'||env.CAF_WHATSAPP_SPEND_AUTHORIZED!=='true')throw rejected('WHATSAPP_DISABLED');
  if(env.CAF_WHATSAPP_REVIEWED!=='true')throw rejected('WHATSAPP_REVIEW_REQUIRED');
  const account=env.TWILIO_ACCOUNT_SID,token=env.TWILIO_AUTH_TOKEN,service=env.TWILIO_MESSAGING_SERVICE_SID,template=env.CAF_WHATSAPP_REMINDER_CONTENT_SID;
  if(!sid(account,'AC')||typeof token!=='string'||!/^[0-9a-fA-F]{32}$/.test(token)||!sid(service,'MG')||!sid(template,'HX'))throw rejected('WHATSAPP_CONFIGURATION_REQUIRED');
  if(typeof subject!=='string'||!subject||subject.length>255||!phone(to)||site!=='molfetta'||typeof start!=='string'||!Number.isFinite(Date.parse(start))||Date.parse(start)<=clock())throw rejected('INVALID_WHATSAPP_REMINDER');
  // Read the current server-side record immediately before sending. Caller flags
  // never constitute opt-in, and a consent revoked after enqueue blocks delivery.
  if(typeof consentFor!=='function')throw rejected('WHATSAPP_CONSENT_REQUIRED');
  let consent;try{consent=await consentFor(subject)}catch{throw rejected('WHATSAPP_CONSENT_UNAVAILABLE');}
  if(!consent||consent.subject!==subject||consent.phone!==to||consent.purpose!=='appointment-reminders'||consent.granted!==true||consent.revokedAt||!consent.noticeVersion||typeof consent.noticeVersion!=='string'||!Number.isFinite(Date.parse(consent.grantedAt))||Date.parse(consent.grantedAt)>clock()||!Number.isFinite(Date.parse(consent.phoneVerifiedAt))||Date.parse(consent.phoneVerifiedAt)>clock())throw rejected('WHATSAPP_CONSENT_REQUIRED');
  const when=new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',dateStyle:'short',timeStyle:'short'}).format(new Date(start));
  // Approved utility template: only location and time; no practice, documents,
  // taxpayer identifiers, medical information or cancellation bearer code.
  const body=new URLSearchParams({To:'whatsapp:'+to,MessagingServiceSid:service,ContentSid:template,ContentVariables:JSON.stringify({'1':'Molfetta','2':when})});
  let response;
  try{response=await fetcher('https://api.twilio.com/2010-04-01/Accounts/'+account+'/Messages.json',{method:'POST',redirect:'error',headers:{Authorization:'Basic '+Buffer.from(account+':'+token).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(10000)});}catch{throw rejected('WHATSAPP_OUTCOME_UNCERTAIN',false);}
  // Never retry on a transport timeout, server failure or ambiguous response.
  if(!response.ok)throw rejected('WHATSAPP_PROVIDER_REJECTED',[400,401,403,404,422,429].includes(response.status));
  let result;try{result=await response.json()}catch{throw rejected('WHATSAPP_OUTCOME_UNCERTAIN',false);}
  if(!sid(result.sid,'SM')||result.account_sid!==account||result.to!=='whatsapp:'+to||!['accepted','scheduled','queued','sending','sent','delivered','read'].includes(result.status))throw rejected('WHATSAPP_OUTCOME_UNCERTAIN',false);
  // API acceptance is not proof of recipient delivery. No raw provider response
  // is returned because it may contain message text, credentials or phone data.
  return {id:result.sid,state:'accepted',providerStatus:result.status};
 };
}
module.exports={whatsappReminders};
