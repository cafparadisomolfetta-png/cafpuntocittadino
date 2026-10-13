'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function backupVault(vault,target){
 if(!path.isAbsolute(target)||fs.existsSync(target))throw Error('Backup target must be a new absolute path');
 const temp=path.join(path.dirname(target),'.caf-backup-'+crypto.randomUUID()+'.sqlite');
 const previousMask=process.umask(0o077);
 try{
  vault.db.prepare('VACUUM INTO ?').run(temp);fs.chmodSync(temp,0o600);
  const encrypted=vault.seal(fs.readFileSync(temp),'caf-backup-v1');
  fs.writeFileSync(target,Buffer.concat([Buffer.from('CAFVAULT1'),encrypted]),{mode:0o600,flag:'wx'});
 }finally{try{fs.rmSync(temp,{force:true})}finally{process.umask(previousMask)}}
}
function restoreVault({source,targetDirectory,key}){
 if(!path.isAbsolute(targetDirectory)||fs.existsSync(targetDirectory))throw Error('Restore requires a new absolute directory');
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error('Invalid vault key');
 const encrypted=fs.readFileSync(source);if(encrypted.subarray(0,9).toString()!=='CAFVAULT1')throw Error('Invalid backup format');
 const cipher=encrypted.subarray(9),decipher=crypto.createDecipheriv('aes-256-gcm',key,cipher.subarray(0,12));decipher.setAAD(Buffer.from('caf-backup-v1'));decipher.setAuthTag(cipher.subarray(-16));
 const plain=Buffer.concat([decipher.update(cipher.subarray(12,-16)),decipher.final()]);
 if(plain.subarray(0,16).toString()!=='SQLite format 3\0')throw Error('Invalid database snapshot');
 fs.mkdirSync(targetDirectory,{mode:0o700});fs.writeFileSync(path.join(targetDirectory,'vault.sqlite'),plain,{flag:'wx',mode:0o600});
}
module.exports={backupVault,restoreVault};
