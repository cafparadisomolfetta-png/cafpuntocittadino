'use strict';
// Restic transport: no password, agent forwarding or automatic host-key acceptance.
const fs=require('node:fs'),{spawn}=require('node:child_process');
const base='/etc/cafpuntocittadino/backup',file=base+'/connection.json';
try{
 const stat=fs.lstatSync(file);if(!stat.isFile()||stat.uid!==0||(stat.mode&0o077))throw Error('Private configuration required');
 const config=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!/^u[0-9]+$/.test(config.user)||config.host!==config.user+'.your-storagebox.de')throw Error('Invalid destination');
 const child=spawn('/usr/bin/ssh',['-F','/dev/null','-p','22','-i',base+'/id_ed25519','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','PasswordAuthentication=no','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+base+'/known_hosts','-o','HostKeyAlgorithms=ssh-ed25519,ecdsa-sha2-nistp256,rsa-sha2-512,rsa-sha2-256','-o','UpdateHostKeys=no','-o','ConnectTimeout=15','-o','ServerAliveInterval=30','-o','ServerAliveCountMax=4','-s',config.user+'@'+config.host,'sftp'],{stdio:'inherit',shell:false});
 child.on('error',()=>process.exit(1));child.on('exit',code=>process.exit(code??1));
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
}catch{console.error('PUNTO_BACKUP_TRANSPORT_NOT_CONFIGURED');process.exitCode=1;}
