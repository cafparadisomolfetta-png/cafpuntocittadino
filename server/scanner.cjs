'use strict';
const {spawn}=require('node:child_process');
// Only a trusted executable configured by the server operator is used, never a request parameter.
function clamScanner(executable='/usr/bin/clamscan'){
 return bytes=>new Promise((resolve,reject)=>{
  const child=spawn(executable,['--no-summary','-'],{stdio:['pipe','ignore','ignore'],shell:false});
  const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Scanner timeout'))},30000);
  child.on('error',e=>{clearTimeout(timer);reject(e)});
  child.stdin.on('error',()=>{});
  child.on('close',code=>{clearTimeout(timer);if(code===0)resolve('clean');else if(code===1)resolve('infected');else reject(Error('Scanner unavailable'))});
  child.stdin.end(bytes);
 });
}
module.exports={clamScanner};
