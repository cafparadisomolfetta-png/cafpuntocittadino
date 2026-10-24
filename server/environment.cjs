'use strict';
const fs=require('node:fs'),path=require('node:path');
const {retentionPlan}=require('./retention.cjs');
const {siteSlots}=require('./site-slots.cjs');
const root=path.resolve(__dirname,'..');
const inside=(value,base)=>value===base||value.startsWith(base+path.sep);
const email=value=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&!/[\x00-\x1f\x7f]/.test(value);
const duration=value=>/^\d+$/.test(value||'')&&Number(value)>=1&&Number(value)<=36500;
const present=value=>typeof value==='string'&&!!value.trim()&&!/[\x00-\x1f\x7f]/.test(value);
// Offline inspection only: no database access, writes, subprocesses, provider requests or secret values in results.
function inspectEnvironment(env=process.env,{publicDirectory=path.join(root,'dist')}={}){
 const checks=[];
 function check(id,message,fn){let ok=false;try{ok=fn()===true}catch{}checks.push({id,ok,message});}
 check('privacy','Private runtime requires reviewed privacy information and retention policy.',()=>env.CAF_PRIVACY_REVIEWED==='true');
 check('enabled','Private runtime is disabled; configure it before enabling.',()=>env.CAF_PRIVATE_ENABLED==='true');
 check('node','Node >=22.13 with built-in SQLite is required.',()=>{const [major,minor]=process.versions.node.split('.').map(Number);return major>22||major===22&&minor>=13;});
 check('build','Build the public frontend first.',()=>fs.statSync(path.join(publicDirectory,'index.html')).isFile());
 check('private_directory','Configure a private directory outside the repository with an existing writable parent and no symlinks into source.',()=>{
  const value=env.CAF_PRIVATE_DIRECTORY;if(!value||!path.isAbsolute(value))return false;
  const canonical=path.resolve(value),realRoot=fs.realpathSync(root),parent=fs.realpathSync(path.dirname(canonical));
  if(inside(canonical,root)||inside(parent,realRoot))return false;
  // An existing archive needs write access to itself, not to /var/lib.
  // The parent needs write access only when the archive must be created.
  fs.accessSync(parent,fs.constants.X_OK);
  if(fs.existsSync(canonical)){if(fs.lstatSync(canonical).isSymbolicLink()||!fs.statSync(canonical).isDirectory()||inside(fs.realpathSync(canonical),realRoot))return false;fs.accessSync(canonical,fs.constants.W_OK|fs.constants.X_OK);}
  else fs.accessSync(parent,fs.constants.W_OK|fs.constants.X_OK);
  return true;
 });
 check('vault_key','Configure a canonical 32-byte base64 vault key privately.',()=>{
  const value=env.CAF_VAULT_KEY;if(typeof value!=='string'||!/^[A-Za-z0-9+/]{43}=$/.test(value))return false;
  const bytes=Buffer.from(value,'base64');try{return bytes.length===32&&bytes.toString('base64')===value}finally{bytes.fill(0)}
 });
 check('scanner','A trusted executable malware scanner is required; real scanning and fresh signatures must still be tested.',()=>{
  const scanner=env.CAF_CLAMSCAN_PATH||'/usr/bin/clamscan';if(!path.isAbsolute(scanner)||!fs.statSync(scanner).isFile())return false;fs.accessSync(scanner,fs.constants.X_OK);return true;
 });
 check('origin','Configure a canonical HTTPS origin (HTTP only for localhost/127.0.0.1), without credentials, path, query or fragment.',()=>{
  const value=env.CAF_ORIGIN||'http://127.0.0.1:8080',url=new URL(value);
  return value===url.origin&&!url.username&&!url.password&&(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname));
 });
 check('proxy','Configure proxy trust as true or false; only a local proxy overwriting client IP headers is trusted.',()=>!env.CAF_TRUST_PROXY||['true','false'].includes(env.CAF_TRUST_PROXY));
 check('port','Configure a port from 1024 to 65535.',()=>/^\d+$/.test(env.CAF_PORT||'8080')&&Number(env.CAF_PORT||8080)>=1024&&Number(env.CAF_PORT||8080)<=65535);
 check('login','Configure the Google login client privately.',()=>present(env.GESTIONALE_GOOGLE_CLIENT_ID));
 check('administrator','Configure a valid administrator email privately.',()=>email(env.GESTIONALE_ADMIN_EMAIL));
 check('operators','Configure valid operators, enabled flags, roles and unique site permissions.',()=>{
  const rows=JSON.parse(env.GESTIONALE_OPERATORS_JSON||'[]');if(!Array.isArray(rows))return false;const seen=new Set();
  return rows.every(row=>{if(!row||!email(row.email)||!['manager','operator','viewer'].includes(row.role)||typeof row.enabled!=='boolean'||!Array.isArray(row.sites)||!row.sites.length||row.sites.some(site=>!['molfetta','bari'].includes(site))||new Set(row.sites).size!==row.sites.length)return false;
   const normalized=row.email.toLowerCase();if(normalized!==row.email.trim().toLowerCase()||seen.has(normalized)||normalized===env.GESTIONALE_ADMIN_EMAIL?.trim().toLowerCase())return false;seen.add(normalized);return true;});
 });
 check('enabled_sites','Configure valid enabled sites; default is Molfetta only.',()=>{require('./sites.cjs').enabledSites(env);return true;});
 check('calendars','Configure a calendar for each enabled site; different sites require distinct calendars.',()=>{
  const map=JSON.parse(env.GESTIONALE_SITE_CALENDARS_JSON||'null');return !!map&&!Array.isArray(map)&&typeof map==='object'&&require('./sites.cjs').enabledSites(env).every(site=>present(map[site])&&map[site]===map[site].trim())&&map.molfetta!==map.bari;
 });
 check('google_credentials','Configure Google OAuth client, secret and refresh token privately; validity and scopes require real testing.',()=>['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN'].every(name=>present(env[name])));
 check('retention','Configure approved retention durations for 730 and ISEE.',()=>{retentionPlan({list:()=>[]},JSON.parse(env.CAF_RETENTION_DAYS_JSON||'null'));return true;});
 check('services','Every enabled document service requires an approved retention duration.',()=>{const selected=require('../netlify/functions/practice-services.js').enabledServices(env),policy=JSON.parse(env.CAF_RETENTION_DAYS_JSON||'null');return selected.every(id=>Number.isInteger(policy?.[id])&&policy[id]>0&&policy[id]<=36500);});
 check('callback','Enabled callbacks require an approved retention duration.',()=>env.CAF_CALLBACK_ENABLED!=='true'||duration(String(JSON.parse(env.CAF_RETENTION_DAYS_JSON||'null')?.richiamata||'')));
 check('cv','If enabled, configure an approved CV retention duration.',()=>!env.CAF_CV_RETENTION_DAYS||duration(env.CAF_CV_RETENTION_DAYS));
 check('bari_schedule','If configured, use valid approved Bari slots.',()=>{siteSlots(env);return true;});
 check('mail_retention','If configured or sending enabled, configure an approved email/outbox retention duration.',()=>env.CAF_MAIL_RETENTION_DAYS?duration(env.CAF_MAIL_RETENTION_DAYS):env.CAF_MAIL_ENABLED!=='true');
 check('sender','Enabled email sending requires a valid private sender address.',()=>env.CAF_MAIL_ENABLED!=='true'||email(env.CAF_SENDER_EMAIL));
 check('audit_retention','If configured, use an approved audit retention duration.',()=>!env.CAF_AUDIT_RETENTION_DAYS||duration(env.CAF_AUDIT_RETENTION_DAYS));
 check('ai','Enabled AI requires separate spend authorization, key, model and a valid daily request cap.',()=>{
  if(env.CAF_AI_ENABLED!=='true')return true;
  return env.CAF_AI_SPEND_AUTHORIZED==='true'&&present(env.OPENAI_API_KEY)&&present(env.OPENAI_MODEL)&&env.OPENAI_MODEL.length<=100&&/^\d+$/.test(env.CAF_AI_DAILY_REQUEST_LIMIT||'')&&Number(env.CAF_AI_DAILY_REQUEST_LIMIT)>=1&&Number(env.CAF_AI_DAILY_REQUEST_LIMIT)<=10000;
 });
 return {configured:checks.every(row=>row.ok),checks,notice:'Offline configuration check only. No provider, antivirus, TLS, backup recovery, privacy compliance or device validation is certified.'};
}
function requireEnvironment(env){const result=inspectEnvironment(env);if(!result.configured)throw Error(result.checks.filter(row=>!row.ok).map(row=>row.message).join('\n'));return result;}
if(require.main===module){const result=inspectEnvironment();console.log(JSON.stringify(result,null,2));process.exitCode=result.configured?0:1;}
module.exports={inspectEnvironment,requireEnvironment};
