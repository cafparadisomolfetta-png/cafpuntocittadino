#!/usr/bin/python3
"""Prepare pinned SFTP access; secrets are entered by the owner in the VPS console.
Storage password is used once through an inherited pipe, never stored or logged.
"""
import base64, datetime, getpass, hashlib, json, os, pathlib, re, subprocess, sys, tempfile

BASE=pathlib.Path('/etc/cafpuntocittadino/backup')
FINGERPRINTS={'ssh-ed25519':'XqONwb1S0zuj5A1CDxpOSuD2hnAArV1A3wKY7Z3sdgM','ssh-rsa':'EMlfI8GsRIfpVkoW1H2u0zYVpFGKkIMKHFZIRkf2ioI','ecdsa-sha2-nistp256':'oDHZqKXnoMtgvPBjjC57pcuFez28roaEuFcfwyg8O5c'}
ALGORITHMS='ssh-ed25519,ecdsa-sha2-nistp256,rsa-sha2-512,rsa-sha2-256'

def run(args, **kwargs):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=90, **kwargs)

def private_write(path, value):
    fd=os.open(path, os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd,'w') as stream: stream.write(value)

def prepare(user):
    if not re.fullmatch(r'u[0-9]+',user): raise ValueError('Invalid user')
    os.umask(0o077)
    BASE.mkdir(mode=0o700,exist_ok=True)
    if BASE.is_symlink() or BASE.stat().st_uid!=0 or BASE.stat().st_mode&0o077: raise ValueError('Private directory required')
    host=user+'.your-storagebox.de';config={'user':user,'host':host,'port':22}
    destination=BASE/'connection.json'
    if destination.exists():
        if json.loads(destination.read_text())!=config: raise ValueError('Existing destination differs')
    else: private_write(destination,json.dumps(config)+'\n')
    key=BASE/'id_ed25519'
    if not key.exists(): run(['/usr/bin/ssh-keygen','-q','-t','ed25519','-N','','-f',str(key),'-C','punto-cittadino-backup'])
    if key.is_symlink() or key.stat().st_uid!=0 or key.stat().st_mode&0o077: raise ValueError('Private key required')
    result=run(['/usr/bin/ssh-keyscan','-T','15','-t','ed25519,ecdsa,rsa',host])
    keys=[]
    for line in result.stdout.splitlines():
        parts=line.split()
        if len(parts)!=3 or parts[1] not in FINGERPRINTS: continue
        fingerprint=base64.b64encode(hashlib.sha256(base64.b64decode(parts[2],validate=True)).digest()).decode().rstrip('=')
        if fingerprint!=FINGERPRINTS[parts[1]]: raise ValueError('Unexpected host fingerprint')
        keys.append(parts[1]+' '+parts[2])
    if not keys: raise ValueError('No verified host key')
    known=''.join(host+' '+key+'\n' for key in sorted(set(keys)))
    target=BASE/'known_hosts'
    if target.exists():
        if target.read_text()!=known: raise ValueError('Host key changed')
    else: private_write(target,known)
    print('BACKUP_PREPARED: destinazione e impronta SSH ufficiale verificate; nessuna password utilizzata.')
    return config

def connect(config):
    if not sys.stdin.isatty(): raise ValueError('Use the interactive VPS console')
    print('Questo passaggio autorizza SOLO questo VPS a usare la Storage Box per i backup.')
    print('Destinazione:',config['user']+'@'+config['host'])
    print('La password Hetzner viene usata una volta e non viene salvata. Non incollarla in chat.')
    secret=getpass.getpass('Password della Storage Box (invisibile): ')
    if not secret or len(secret)>1024 or '\n' in secret or '\r' in secret: raise ValueError('Invalid password')
    common=['-F','/dev/null','-P','22','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(BASE/'known_hosts'),'-o','HostKeyAlgorithms='+ALGORITHMS,'-o','UpdateHostKeys=no','-o','ConnectTimeout=15']
    destination=config['user']+'@'+config['host']
    def authenticated(batch):
        read_fd,write_fd=os.pipe()
        try:
            os.write(write_fd,(secret+'\n').encode());os.close(write_fd);write_fd=-1
            return subprocess.run(['/usr/bin/sshpass','-d',str(read_fd),'/usr/bin/sftp',*common,'-o','BatchMode=no','-o','PubkeyAuthentication=no','-o','PreferredAuthentications=password','-b','-',destination],input=batch,text=True,capture_output=True,pass_fds=(read_fd,),timeout=90,env={**os.environ,'LC_ALL':'C'})
        finally:
            os.close(read_fd)
            if write_fd!=-1: os.close(write_fd)
    with tempfile.TemporaryDirectory(prefix='key-install-',dir=BASE) as temp:
        folder=pathlib.Path(temp);old=folder/'old';combined=folder/'combined'
        result=authenticated('get .ssh/authorized_keys '+str(old)+'\n')
        if result.returncode==0:
            if not old.exists() or old.stat().st_size>1048576: raise ValueError('Unexpected key file')
            previous=old.read_text()
        elif 'no such file' in result.stderr.lower(): previous=''
        else: raise ValueError('SFTP authentication or key read failed')
        public=run(['/usr/bin/ssh-keygen','-e','-m','RFC4716','-f',str(BASE/'id_ed25519.pub')]).stdout
        combined.write_text(previous.rstrip()+'\n'+public.rstrip()+'\n');combined.chmod(0o600)
        stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d%H%M%S')
        batch='-mkdir .ssh\nchmod 700 .ssh\n'
        if previous: batch+='put '+str(old)+' .ssh/authorized_keys.before-punto-'+stamp+'\n'
        temporary='.ssh/punto-key-'+stamp+'.tmp'
        batch+='put '+str(combined)+' '+temporary+'\nchmod 600 '+temporary+'\nrename '+temporary+' .ssh/authorized_keys\n'
        if authenticated(batch).returncode!=0: raise ValueError('SSH key installation failed')
    secret=None
    result=subprocess.run(['/usr/bin/sftp',*common,'-i',str(BASE/'id_ed25519'),'-o','IdentitiesOnly=yes','-o','BatchMode=yes','-b','-',destination],input='pwd\n',text=True,capture_output=True,timeout=45)
    if result.returncode!=0: raise ValueError('Dedicated SSH key verification failed')
    password_file=BASE/'restic-password'
    if not password_file.exists():
        print('Scegli una NUOVA passphrase del backup, almeno 20 caratteri. Conservala prima nel tuo gestore password: serve per recuperare i dati se perdi il VPS.')
        password=getpass.getpass('Nuova passphrase backup (invisibile): ')
        repeated=getpass.getpass('Ripeti passphrase backup (invisibile): ')
        if password!=repeated or len(password)<20 or '\n' in password or '\r' in password: raise ValueError('Passphrases differ or too short')
        if input('Conferma che la passphrase e salvata nel tuo gestore: scrivi SALVATA: ').strip()!='SALVATA': raise ValueError('Recovery copy not confirmed')
        private_write(password_file,password+'\n');password=None;repeated=None
        private_write(BASE/'recovery-confirmed.json',json.dumps({'confirmedByOwner':True,'at':datetime.datetime.now(datetime.timezone.utc).isoformat()})+'\n')
    if not (BASE/'recovery-confirmed.json').exists(): raise ValueError('Recovery copy not confirmed')
    marker=BASE/'access-ready.json'
    if not marker.exists(): private_write(marker,json.dumps({'keyAccessVerified':True,'at':datetime.datetime.now(datetime.timezone.utc).isoformat()})+'\n')
    print('BACKUP_ACCESS_READY: chiave dedicata verificata; passphrase protetta e copia di recupero confermata. Il timer resta disattivato fino al collaudo.')

if __name__=='__main__':
    try:
        if os.geteuid()!=0: raise ValueError('Root required')
        if len(sys.argv)!=3 or sys.argv[1] not in ('--prepare','--connect'): raise ValueError('Use --prepare or --connect and the Storage Box username')
        settings=prepare(sys.argv[2])
        if sys.argv[1]=='--connect': connect(settings)
    except Exception as error:
        print('BACKUP_SETUP_NOT_COMPLETED:',str(error) if isinstance(error,ValueError) else type(error).__name__,file=sys.stderr)
        sys.exit(1)
