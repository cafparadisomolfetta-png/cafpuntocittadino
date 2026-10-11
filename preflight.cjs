'use strict';
const fs=require('node:fs');const vm=require('node:vm');
const required=['index.html','caf.html','patronato.html','lavoro-sindacato.html','area-aziende.html','news-bonus.html','servizi-online.html','lavora-con-noi.html','privacy.html','cookie-policy.html'];
const errors=[];
for(const file of required){
 if(!fs.existsSync(file)){errors.push('Missing page: '+file);continue;}
 const html=fs.readFileSync(file,'utf8');
 if(!/<html\b/i.test(html)||!/<\/html>/i.test(html))errors.push('Invalid HTML document: '+file);
}
for(const file of ['site-enhancements.js','deploy-build.cjs']){
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
const enh=fs.existsSync('site-enhancements.js')?fs.readFileSync('site-enhancements.js','utf8'):'';
for(const target of ['/caf.html','/patronato.html','/lavoro-sindacato.html','/area-aziende.html','/news-bonus.html','/servizi-online.html','/lavora-con-noi.html','/privacy.html','/cookie-policy.html']){
 if(!enh.includes(target))errors.push('Shared nav/privacy missing: '+target);
}
if(!fs.existsSync('tests/gestionale-access.test.cjs')) errors.push('Missing RBAC tests');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
require('node:child_process').execFileSync(process.execPath,['--test','tests/gestionale-access.test.cjs'],{stdio:'inherit',timeout:15000});
console.log('Preflight OK: '+required.length+' pages, career form, shared JS and critical functions.');
