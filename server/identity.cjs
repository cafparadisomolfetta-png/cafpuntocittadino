'use strict';
const crypto=require('node:crypto');
const {failure}=require('./practices.cjs');
const SITES=['molfetta','bari'],ROLES=['operator','manager','viewer'];
class Identity {
 constructor({vault,clientId,adminEmail,operators=[],activeSites=SITES,fetcher=fetch,clock=()=>Date.now()}){
  if(!clientId||!adminEmail||!Array.isArray(operators))throw Error('Identity configuration incomplete');
  this.activeSites=[...activeSites];this.vault=vault;this.clientId=clientId;this.adminEmail=adminEmail.toLowerCase().trim();this.defaults=operators;this.fetcher=fetcher;this.clock=clock;
 }
 operators(){return this.vault.list('operator');}
 list(actor){if(actor.role!=='admin'||!actor.authenticated)failure(403,'ADMIN_REQUIRED');return this.operators().map(({email,role,sites,enabled,id})=>({email,role,sites,enabled,id}));}
 set(actor,input){
  if(actor.role!=='admin'||!actor.authenticated)failure(403,'ADMIN_REQUIRED');
  if(!input||typeof input.email!=='string'||input.email.length>254||!/^\S+@\S+\.\S+$/.test(input.email)||/[\r\n\x00]/.test(input.email)||!ROLES.includes(input.role)||typeof input.enabled!=='boolean'||!Array.isArray(input.sites)||!input.sites.length||input.sites.some(s=>!this.activeSites.includes(s)))failure(400,'INVALID_OPERATOR');
  const email=input.email.trim().toLowerCase();if(email===this.adminEmail)failure(400,'ADMIN_CANNOT_BE_CHANGED');
  const existing=this.operators().find(x=>x.email===email);const id=existing?.id||crypto.randomUUID();
  const record={id,email,role:input.role,sites:[...new Set(input.sites)],enabled:input.enabled};
  this.vault.transaction(()=>{this.vault.put('operator',id,record);this.vault.audit(actor,input.enabled?'operator.enable':'operator.disable',id)});return record;
 }
 async authenticate(headers,area){
  const match=/^Bearer ([A-Za-z0-9_.-]{10,8192})$/.exec(headers.authorization||'');if(!match)failure(401,'UNAUTHORIZED');
  let token;try{const r=await this.fetcher('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(match[1]),{signal:AbortSignal.timeout(6500)});if(!r.ok)failure(401,'INVALID_IDENTITY');token=await r.json()}catch(e){if(e.status)throw e;failure(503,'IDENTITY_UNAVAILABLE')}
  if(token.aud!==this.clientId||!['accounts.google.com','https://accounts.google.com'].includes(token.iss)||![true,'true'].includes(token.email_verified)||typeof token.email!=='string'||typeof token.sub!=='string'||!token.sub||!Number.isFinite(Number(token.exp))||Number(token.exp)*1000<=this.clock())failure(401,'INVALID_IDENTITY');
  const base={authenticated:true,subject:token.sub,email:token.email};
  if(area==='citizen')return {...base,role:'citizen',sites:[]};
  if(area!=='staff')failure(400,'INVALID_AREA');
  const email=token.email.toLowerCase();
  if(email===this.adminEmail)return {...base,role:'admin',sites:[...this.activeSites]};
  const operator=this.operators().find(x=>x.email===email)||this.defaults.find(x=>typeof x.email==='string'&&x.email.toLowerCase()===email);
  if(!operator?.enabled||!ROLES.includes(operator.role)||!Array.isArray(operator.sites)||!operator.sites.length||operator.sites.some(s=>!SITES.includes(s)))failure(403,'STAFF_FORBIDDEN');
  const sites=[...new Set(operator.sites)].filter(site=>this.activeSites.includes(site));if(!sites.length)failure(403,'STAFF_FORBIDDEN');
  return {...base,role:operator.role,sites};
 }
}
module.exports={Identity};
