'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {inspectEnvironment}=require('../server/environment.cjs');
const {configuredServer}=require('../server/main.cjs');
function setup(t){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'caf-environment-'));t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));
 return {parent,env:{CAF_PRIVATE_ENABLED:'true',CAF_PRIVACY_REVIEWED:'true',CAF_PRIVATE_DIRECTORY:path.join(parent,'not-created'),CAF_VAULT_KEY:crypto.randomBytes(32).toString('base64'),CAF_CLAMSCAN_PATH:process.execPath,CAF_ORIGIN:'https://caf.example.test',GESTIONALE_GOOGLE_CLIENT_ID:'synthetic-login',GESTIONALE_ADMIN_EMAIL:'admin@example.test',GESTIONALE_SITE_CALENDARS_JSON:JSON.stringify({molfetta:'synthetic-molfetta',bari:'synthetic-bari'}),GOOGLE_CLIENT_ID:'synthetic-oauth',GOOGLE_CLIENT_SECRET:'synthetic-secret',GOOGLE_REFRESH_TOKEN:'synthetic-refresh',CAF_RETENTION_DAYS_JSON:JSON.stringify({'730':30,isee:30})}};
}
const failure=(env,id)=>inspectEnvironment(env).checks.find(row=>row.id===id)?.ok===false;
test('Offline inspection reports every missing prerequisite without writes or provider calls',t=>{
 const {parent,env}=setup(t),before=fs.readdirSync(parent),oldFetch=global.fetch;
 global.fetch=()=>{throw Error('Provider call forbidden')};t.after(()=>{global.fetch=oldFetch});
 const result=inspectEnvironment(env);assert.equal(result.configured,true);assert.deepEqual(fs.readdirSync(parent),before);
 assert.match(result.notice,/No provider/);assert.equal(inspectEnvironment({}).configured,false);
 const report=JSON.stringify(result);for(const secret of [env.CAF_VAULT_KEY,env.GOOGLE_CLIENT_SECRET,env.GOOGLE_REFRESH_TOKEN,env.GESTIONALE_ADMIN_EMAIL,env.CAF_PRIVATE_DIRECTORY])assert.equal(report.includes(secret),false);
});
test('Invalid calendar and optional settings block startup before creating a vault',t=>{
 const {env}=setup(t);env.GESTIONALE_SITE_CALENDARS_JSON=JSON.stringify({molfetta:'same',bari:'same'});
 assert.throws(()=>configuredServer(env),/distinct Molfetta and Bari/);assert.equal(fs.existsSync(env.CAF_PRIVATE_DIRECTORY),false);
 env.GESTIONALE_SITE_CALENDARS_JSON=JSON.stringify({molfetta:'m',bari:'b'});env.CAF_MAIL_RETENTION_DAYS='-1';
 assert.throws(()=>configuredServer(env),/email\/outbox/);assert.equal(fs.existsSync(env.CAF_PRIVATE_DIRECTORY),false);
});
test('Origins, ports and vault keys reject ambiguous or credential-bearing configuration',t=>{
 const {env}=setup(t);
 for(const origin of ['http://caf.example.test','https://user:secret@caf.example.test','https://caf.example.test/path','https://caf.example.test?key=secret','https://caf.example.test/#secret','https://caf.example.test/',' https://caf.example.test'])assert.equal(failure({...env,CAF_ORIGIN:origin},'origin'),true);
 for(const origin of ['https://caf.example.test','http://localhost:8080','http://127.0.0.1:8080'])assert.equal(failure({...env,CAF_ORIGIN:origin},'origin'),false);
 for(const port of ['80','65536','8080.5','8e3'])assert.equal(failure({...env,CAF_PORT:port},'port'),true);
 for(const key of [env.CAF_VAULT_KEY+'ignored',' '+env.CAF_VAULT_KEY,Buffer.alloc(31).toString('base64')])assert.equal(failure({...env,CAF_VAULT_KEY:key},'vault_key'),true);
});
test('Private directory and scanner checks reject unsafe filesystem locations',t=>{
 const {parent,env}=setup(t),root=path.resolve(__dirname,'..'),link=path.join(parent,'source-link');fs.symlinkSync(root,link);
 for(const directory of [path.join(root,'dist','private'),path.join(link,'private'),'relative'])assert.equal(failure({...env,CAF_PRIVATE_DIRECTORY:directory},'private_directory'),true);
 fs.symlinkSync(parent,env.CAF_PRIVATE_DIRECTORY);assert.equal(failure(env,'private_directory'),true);
 assert.equal(failure({...env,CAF_CLAMSCAN_PATH:parent},'scanner'),true);
});
test('Operator provisioning and enabled features require explicit valid configuration',t=>{
 const {env}=setup(t),operator={email:'staff@example.test',enabled:true,role:'operator',sites:['molfetta']};
 assert.equal(failure({...env,GESTIONALE_OPERATORS_JSON:JSON.stringify([operator])},'operators'),false);
 for(const rows of [[operator,{...operator,email:'STAFF@example.test'}],[{...operator,email:env.GESTIONALE_ADMIN_EMAIL}],[{...operator,role:'admin'}],[{...operator,sites:['molfetta','molfetta']}],[{...operator,enabled:'true'}]])assert.equal(failure({...env,GESTIONALE_OPERATORS_JSON:JSON.stringify(rows)},'operators'),true);
 for(const [patch,id] of [[{CAF_CALLBACK_ENABLED:'true'},'callback'],[{CAF_CV_RETENTION_DAYS:'0'},'cv'],[{CAF_MAIL_ENABLED:'true'},'mail_retention'],[{CAF_MAIL_ENABLED:'true',CAF_MAIL_RETENTION_DAYS:'30',CAF_SENDER_EMAIL:'bad\r\naddress'},'sender'],[{CAF_AUDIT_RETENTION_DAYS:'Infinity'},'audit_retention'],[{CAF_AI_ENABLED:'true'},'ai'],[{CAF_BARI_SLOTS_JSON:'{broken'},'bari_schedule']])assert.equal(failure({...env,...patch},id),true);
 assert.equal(failure({...env,CAF_AI_ENABLED:'true',CAF_AI_SPEND_AUTHORIZED:'true',OPENAI_API_KEY:'synthetic-key',OPENAI_MODEL:'synthetic-model',CAF_AI_DAILY_REQUEST_LIMIT:'10'},'ai'),false);
});
test('CLI errors never echo secret values or create private data',t=>{
 const {env}=setup(t);env.CAF_ORIGIN='https://user:DO-NOT-PRINT@caf.example.test';env.GOOGLE_CLIENT_SECRET='DO-NOT-PRINT\ninvalid';
 let output;try{execFileSync(process.execPath,[path.resolve(__dirname,'../server/environment.cjs')],{env:{...process.env,...env},encoding:'utf8',stdio:['ignore','pipe','pipe']});assert.fail('Must reject invalid configuration')}catch(error){assert.equal(error.status,1);output=error.stdout;}
 assert.equal(output.includes('DO-NOT-PRINT'),false);assert.equal(JSON.parse(output).configured,false);assert.equal(fs.existsSync(env.CAF_PRIVATE_DIRECTORY),false);
});
