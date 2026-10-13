'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process');
function testEnvironment(source=process.env){
 const env={};for(const [name,value]of Object.entries(source))if(!/^(?:CAF_|GOOGLE_|GESTIONALE_|OPENAI_|NETLIFY_|NODE_OPTIONS$|NODE_PATH$)/i.test(name))env[name]=value;
 env.CAF_PRIVATE_ENABLED='false';env.CAF_AI_ENABLED='false';env.CAF_AI_SPEND_AUTHORIZED='false';env.CAF_MAIL_ENABLED='false';env.CAF_JOBS_ENABLED='false';
 env.NODE_OPTIONS='--require '+JSON.stringify(path.join(__dirname,'test-network-guard.cjs'));
 return env;
}
function run(){
 const [major,minor]=process.versions.node.split('.').map(Number);
 if(major<22||major===22&&minor<13){console.error('Serve Node.js >=22.13. Installa Node.js LTS dal sito ufficiale https://nodejs.org/en/download');return 1;}
 console.log('Collaudo CAF con dati sintetici. Nessuna pubblicazione o avvio del servizio privato.');
 const result=spawnSync(process.execPath,['deploy-build.cjs'],{cwd:path.resolve(__dirname,'..'),env:testEnvironment(),stdio:'inherit',timeout:120000});
 if(result.error||result.signal||result.status!==0){console.error('COLLAUDO NON SUPERATO. Conserva il messaggio di errore.');return 1;}
 console.log('COLLAUDO LOCALE SUPERATO. Il sito non e online. Login Google, antivirus reale e installazione PWA restano da verificare.');return 0;
}
if(require.main===module)process.exitCode=run();
module.exports={testEnvironment,run};
