'use strict';
const {DatabaseSync}=require('node:sqlite');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
class Vault {
 constructor({directory,key,clock=()=>new Date().toISOString(),readOnly=false,requireExisting=false}){
  if(!Buffer.isBuffer(key)||key.length!==32)throw Error('A 32-byte encryption key is required');
  if(!path.isAbsolute(directory))throw Error('Private directory must be absolute');
  if(fs.existsSync(directory)&&fs.lstatSync(directory).isSymbolicLink())throw Error('Private directory cannot be a symlink');
  if((readOnly||requireExisting)&&(!fs.existsSync(directory)||!fs.statSync(directory).isDirectory()))throw Error('Existing private vault required');
  if(!readOnly){fs.mkdirSync(directory,{recursive:true,mode:0o700});fs.chmodSync(directory,0o700);}
  const file=path.join(directory,'vault.sqlite');
  if(fs.existsSync(file)&&fs.lstatSync(file).isSymbolicLink())throw Error('Database cannot be a symlink');
  if((readOnly||requireExisting)&&(!fs.existsSync(file)||!fs.statSync(file).isFile()))throw Error('Existing private vault required');
  this.key=Buffer.from(key);this.clock=clock;this.db=new DatabaseSync(file,{readOnly});
  try {
   if(readOnly||requireExisting){const check=this.get('metadata','key-check');if(check?.valid!==true)throw Error('Existing initialized vault required');}
   if(!readOnly){fs.chmodSync(file,0o600);this.db.exec('PRAGMA journal_mode=DELETE; PRAGMA secure_delete=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,value BLOB NOT NULL,PRIMARY KEY(kind,id)); CREATE TABLE IF NOT EXISTS audit(seq INTEGER PRIMARY KEY AUTOINCREMENT,value BLOB NOT NULL,signature TEXT NOT NULL);');}
   const check=this.get('metadata','key-check'); if(check&&check.valid!==true||!check&&(readOnly||requireExisting))throw Error('Invalid vault key'); if(!check)this.put('metadata','key-check',{valid:true});
  } catch(e) { this.db.close(); this.key.fill(0); throw Error('Vault key or database integrity invalid'); }
 }
 seal(bytes,aad){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(Buffer.from(aad));return Buffer.concat([iv,cipher.update(bytes),cipher.final(),cipher.getAuthTag()]);}
 open(value,aad){const bytes=Buffer.from(value),decipher=crypto.createDecipheriv('aes-256-gcm',this.key,bytes.subarray(0,12));decipher.setAAD(Buffer.from(aad));decipher.setAuthTag(bytes.subarray(-16));return Buffer.concat([decipher.update(bytes.subarray(12,-16)),decipher.final()]);}
 get(kind,id){const row=this.db.prepare('SELECT value FROM records WHERE kind=? AND id=?').get(kind,id);return row?JSON.parse(this.open(row.value,kind+':'+id).toString('utf8')):null;}
 list(kind){const rows=this.db.prepare('SELECT id,value FROM records WHERE kind=? ORDER BY id LIMIT 10001').all(kind);if(rows.length>10000)throw Error('Query capacity exceeded');return rows.map(row=>JSON.parse(this.open(row.value,kind+':'+row.id).toString('utf8')));}
 put(kind,id,value){this.db.prepare('INSERT INTO records(kind,id,value) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET value=excluded.value').run(kind,id,this.seal(Buffer.from(JSON.stringify(value)),kind+':'+id));}
 remove(kind,id){this.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind,id);}
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const value=fn();if(value&&typeof value.then==='function')throw Error('Transactions must be synchronous');this.db.exec('COMMIT');return value}catch(e){this.db.exec('ROLLBACK');throw e}}
 audit(actor,action,recordId){
  const prev=this.db.prepare('SELECT signature FROM audit ORDER BY seq DESC LIMIT 1').get()?.signature||this.get('metadata','audit-anchor')?.signature||'';
  const data={at:this.clock(),actor:actor.subject,role:actor.role,action,recordId,prev};
  const plain=JSON.stringify(data),signature=crypto.createHmac('sha256',this.key).update(plain).digest('hex');
  this.db.prepare('INSERT INTO audit(value,signature) VALUES(?,?)').run(this.seal(Buffer.from(plain),'audit:'+signature),signature);
 }
 verifyAudit(){let previous=this.get('metadata','audit-anchor')?.signature||'';for(const row of this.db.prepare('SELECT value,signature FROM audit ORDER BY seq').all()){
  const plain=this.open(row.value,'audit:'+row.signature).toString('utf8');
  const signature=crypto.createHmac('sha256',this.key).update(plain).digest('hex');
  if(signature!==row.signature||JSON.parse(plain).prev!==previous)return false;previous=row.signature;
 }return true;}
 purgeAuditBefore(cutoff){if(typeof cutoff!=='string'||!Number.isFinite(Date.parse(cutoff)))throw Error('Valid audit cutoff required');return this.transaction(()=>{if(!this.verifyAudit())throw Error('Audit integrity invalid');let erased=0;for(const row of this.db.prepare('SELECT seq,value,signature FROM audit ORDER BY seq').all()){const entry=JSON.parse(this.open(row.value,'audit:'+row.signature).toString('utf8'));if(!Number.isFinite(Date.parse(entry.at))||Date.parse(entry.at)>=Date.parse(cutoff))break;this.put('metadata','audit-anchor',{signature:row.signature});this.db.prepare('DELETE FROM audit WHERE seq=?').run(row.seq);erased++;}return {erased};});}
 close(){this.db.close();this.key.fill(0);}
}
module.exports={Vault};
