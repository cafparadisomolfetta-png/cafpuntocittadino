'use strict';
const fs=require('node:fs');const vm=require('node:vm');
const required=['index.html','caf.html','patronato.html','lavoro-sindacato.html','area-aziende.html','news-bonus.html','servizi-online.html','lavora-con-noi.html','privacy.html','cookie-policy.html'];
const errors=[];
for(const file of required){
 if(!fs.existsSync(file)){errors.push('Missing page: '+file);continue;}
 const html=fs.readFileSync(file,'utf8');
 if(!/<html\b/i.test(html)||!/<\/html>/i.test(html))errors.push('Invalid HTML document: '+file);
}
for(const file of ['site-enhancements.js','cookie-consent.js','deploy-build.cjs']){
 if(!fs.existsSync(file))errors.push('Missing script: '+file);
 else try{new vm.Script(fs.readFileSync(file,'utf8'),{filename:file})}catch(e){errors.push('Syntax error: '+file+' '+e.message)}
}
const career=fs.existsSync('lavora-con-noi.html')?fs.readFileSync('lavora-con-noi.html','utf8'):'';
for(const token of ['id="form-candidatura"','name="candidatura-cv"','name="email"','name="tipo_candidatura"','name="curriculum"','name="privacy_cv"']){
 if(!career.includes(token))errors.push('Career form missing: '+token);
}
for(const file of ['calendar-availability.js','calendar-book.js','calendar-cancel.js','segretaria-ai.mjs','official-updates-scheduled.mjs']){
 if(!fs.existsSync('netlify/functions/'+file))errors.push('Critical Netlify function missing: '+file);
}
// Keep the release safe if a server endpoint or PWA asset has a parse error.
for(const file of ['gestionale/index.html','gestionale/app.css','gestionale/app.js','gestionale/manifest.webmanifest','gestionale/icon.svg','gestionale/service-worker.js','site-enhancements.css','manifest.webmanifest','app-icon.svg','public-sw.js']){
 if(!fs.existsSync(file))errors.push('Missing PWA or shared asset: '+file);
}
for(const file of ['gestionale/app.js','gestionale/service-worker.js','public-sw.js','netlify/functions/calendar-availability.js','netlify/functions/calendar-book.js','netlify/functions/calendar-cancel.js','netlify/functions/gestionale-agenda.js','netlify/functions/gestionale-disdette.js','netlify/functions/site-calendars.js','netlify/functions/booking-schedule.js','netlify/functions/gestionale-date.js','netlify/functions/pratiche-validation.js','netlify/functions/pratiche-workflow.js','netlify/functions/pratiche-permissions.js','netlify/functions/pratiche-projection.js','netlify/functions/pratiche.js','netlify/functions/pratiche-query.js']){
 if(!fs.existsSync(file)){errors.push('Missing JavaScript: '+file);continue;}
 try{new vm.Script(fs.readFileSync(file,'utf8'),{filename:file})}catch(e){errors.push('JavaScript parse error: '+file+' '+e.message)}
}
const enh=fs.existsSync('site-enhancements.js')?fs.readFileSync('site-enhancements.js','utf8'):'';
for(const target of ['/caf.html','/patronato.html','/lavoro-sindacato.html','/area-aziende.html','/news-bonus.html','/servizi-online.html','/lavora-con-noi.html','/privacy.html','/cookie-policy.html']){
 if(!enh.includes(target))errors.push('Shared nav/privacy missing: '+target);
}

// Check that the public design layer still exposes every intended page, and remains deploy-disabled.
for(const marker of ['designPages()','serviceCards()','featureNavigation()','repairPageLinks()','safeCrossPageBookingLinks()']){
 if(!enh.includes(marker))errors.push('Public design/navigation routine missing: '+marker);
}
// These guards must remain in place to avoid misleading users when Google pages its data.
const bookingCode=fs.existsSync('netlify/functions/calendar-book.js')?fs.readFileSync('netlify/functions/calendar-book.js','utf8'):'';
const agendaCode=fs.existsSync('netlify/functions/gestionale-agenda.js')?fs.readFileSync('netlify/functions/gestionale-agenda.js','utf8'):'';
if(!bookingCode.includes('lx.nextPageToken'))errors.push('Booking must reject an incomplete busy-event page');
if(!agendaCode.includes('CALENDAR_PAGINATION_LIMIT'))errors.push('Management agenda must reject incomplete pagination');
const releaseConfig=fs.existsSync('netlify.toml')?fs.readFileSync('netlify.toml','utf8'):'';
// The deployment lock is a Netlify release decision, not a build requirement.
// In staging/production the same tests must pass after the lock is removed.
if(!releaseConfig.includes('command = "node deploy-build.cjs"'))errors.push('Expected build command missing');
if(!releaseConfig.includes('publish = "dist"'))errors.push('Expected publish directory missing');
if(!fs.existsSync('tests/gestionale-access.test.cjs')) errors.push('Missing RBAC tests');
if(!fs.existsSync('tests/public-booking.test.cjs')) errors.push('Missing booking regression tests');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
require('node:child_process').execFileSync(process.execPath,['--test','tests/gestionale-access.test.cjs','tests/gestionale-client-session.test.cjs','tests/cancellation-site.test.cjs','tests/calendar-availability-safety.test.cjs','tests/cloe-conversation.test.cjs','tests/public-booking.test.cjs','tests/cookie-consent.test.cjs','tests/pratiche-validation.test.cjs','tests/pratiche-workflow.test.cjs','tests/pratiche-permissions.test.cjs','tests/pratiche-projection.test.cjs','tests/pratiche-disabled.test.cjs','tests/pratiche-query.test.cjs'],{stdio:'inherit',timeout:15000});
console.log('Preflight OK: '+required.length+' pages, career form, shared JS and critical functions.');

// Shared cookie consent must be copied and inserted by the production builder.
if(!fs.readFileSync('deploy-build.cjs','utf8').includes('cookie-consent.js')) throw Error('Consent script missing from build');
