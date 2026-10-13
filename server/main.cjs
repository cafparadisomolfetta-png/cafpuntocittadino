'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Vault}=require('./vault.cjs');
const {Practices}=require('./practices.cjs');
const {Identity}=require('./identity.cjs');
const {clamScanner}=require('./scanner.cjs');
const {createApp}=require('./app.cjs');
function configuredServer(env=process.env){
 require('./environment.cjs').requireEnvironment(env);
 if(env.CAF_PRIVACY_REVIEWED!=='true')throw Error('Private runtime requires reviewed privacy information and retention policy.');
 if(env.CAF_PRIVATE_ENABLED!=='true')throw Error('Private runtime is disabled. Read server/README.md before enabling.');
 const root=path.resolve(__dirname,'..'),publicDirectory=path.join(root,'dist');
 if(!fs.existsSync(publicDirectory))throw Error('Build the public frontend first');
 const directory=env.CAF_PRIVATE_DIRECTORY;
 if(!directory||!path.isAbsolute(directory))throw Error('Configure an absolute private directory');
 const canonical=path.resolve(directory);
 // Keep all production data outside source and public assets, even with a custom path.
 if(canonical===root||canonical.startsWith(root+path.sep))throw Error('Private data must be outside the repository');
 const parent=fs.realpathSync(path.dirname(canonical));
 if(parent===root||parent.startsWith(root+path.sep))throw Error('Private data parent cannot resolve inside the repository');
 const key=Buffer.from(env.CAF_VAULT_KEY||'','base64');
 if(key.length!==32)throw Error('Configure a private 32-byte base64 vault key');
 const scanner=env.CAF_CLAMSCAN_PATH||'/usr/bin/clamscan';
 if(!path.isAbsolute(scanner)||!fs.existsSync(scanner))throw Error('A configured malware scanner is required');
 fs.accessSync(scanner,fs.constants.X_OK);
 const origin=env.CAF_ORIGIN||'http://127.0.0.1:8080';
 const parsed=new URL(origin);
 if(parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&['127.0.0.1','localhost'].includes(parsed.hostname)))throw Error('Non-local origin must use HTTPS');
 let operators;try{operators=JSON.parse(env.GESTIONALE_OPERATORS_JSON||'[]')}catch{throw Error('Invalid operators configuration')}
 if(!env.GESTIONALE_GOOGLE_CLIENT_ID||!env.GESTIONALE_ADMIN_EMAIL)throw Error('Configure Google login and administrator account');
 let retentionPolicy;try{retentionPolicy=JSON.parse(env.CAF_RETENTION_DAYS_JSON||'null');require('./retention.cjs').retentionPlan({list:()=>[]},retentionPolicy)}catch{throw Error('Configure approved retention durations for 730 and ISEE');}
 if(env.CAF_CALLBACK_ENABLED==='true'&&!Number.isInteger(retentionPolicy.richiamata))throw Error('Configure approved callback retention duration');
 const vault=new Vault({directory:canonical,key});key.fill(0);
 try{
  const identity=new Identity({vault,clientId:env.GESTIONALE_GOOGLE_CLIENT_ID,adminEmail:env.GESTIONALE_ADMIN_EMAIL,operators});
  const slotsFor=require('./site-slots.cjs').siteSlots(env);
  const calendar=require('./calendar.cjs').calendars({identity,vault,env});
  const mailEnabled=env.CAF_MAIL_ENABLED==='true',mailRetentionDays=env.CAF_MAIL_RETENTION_DAYS?Number(env.CAF_MAIL_RETENTION_DAYS):null;
  if(mailEnabled&&(!Number.isInteger(mailRetentionDays)||mailRetentionDays<1||mailRetentionDays>36500))throw Error('Configure approved email/outbox retention duration');
  const jobs=new (require('./jobs.cjs').Jobs)({vault,calendar,enabled:env.CAF_JOBS_ENABLED==='true',mailEnabled,retentionDays:mailRetentionDays,sendMail:require('./google-mail.cjs').googleMail({env})});
  const appointments=new (require('./appointments.cjs').Appointments)({vault,calendar,slotsFor,notify:value=>jobs.enqueue(value)});
  const candidatures=env.CAF_CV_RETENTION_DAYS?new (require('./candidatures.cjs').Candidatures)({vault,scan:clamScanner(scanner),retentionDays:Number(env.CAF_CV_RETENTION_DAYS)}):undefined;
  const practices=new Practices({vault,scan:clamScanner(scanner),verifyAppointment:calendar.verifyAppointment,enabledServices:env.CAF_CALLBACK_ENABLED==='true'?['730','isee','richiamata']:['730','isee']});
  // Preserve existing public Google functions without enabling Netlify deployments.
  const providerHandlers={};
  for(const name of ['calendar-availability','calendar-book','calendar-cancel'])providerHandlers[name]=require('../netlify/functions/'+name+'.js').handler;
  const assistant=new (require('./assistant.cjs').Assistant)({vault,env});
  providerHandlers['segretaria-ai']=event=>assistant.handler(event);
  providerHandlers['official-updates']=async()=>({statusCode:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(jobs.publicNews())});
  providerHandlers['gestionale-session']=calendar.session;providerHandlers['gestionale-agenda']=calendar.agenda;providerHandlers['gestionale-disdette']=calendar.cancellations;
  const wrapped=require('./booking.cjs').bookingHandlers({vault,book:providerHandlers['calendar-book'],cancel:providerHandlers['calendar-cancel'],verifyFree:calendar.verifyFree});
  providerHandlers['calendar-book']=wrapped.book;providerHandlers['calendar-cancel']=wrapped.cancel;
  if(!vault.verifyAudit())throw Error('Audit integrity verification failed');
  const server=createApp({practices,identity,publicDirectory,origin,providerHandlers,retentionPolicy,booking:wrapped,candidatures,appointments,jobs,trustProxy:env.CAF_TRUST_PROXY==='true'});
  let timer;server.on('listening',()=>{if(jobs.enabled){timer=setInterval(()=>jobs.tick(),60000);timer.unref();jobs.tick();}});
  server.on('close',()=>{if(timer)clearInterval(timer);jobs.stop().finally(()=>vault.close());});return {server,vault};
 }catch(e){vault.close();throw e}
}
if(require.main===module){
 try{const {server}=configuredServer();const port=Number(process.env.CAF_PORT||8080);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');server.listen(port,'127.0.0.1',()=>console.log('Private runtime listening on loopback port '+port));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close());}
 catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={configuredServer};
