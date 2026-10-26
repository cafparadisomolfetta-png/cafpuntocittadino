# Backup esterno cifrato

Il servizio usa Restic via SFTP sulla Storage Box acquistata dal titolare. I dati
sono cifrati prima del trasferimento; la password della Storage Box serve una sola
volta a installare una chiave dedicata del VPS. Non viene salvata. La chiave privata
e la passphrase Restic restano in `/etc/cafpuntocittadino/backup`, accessibile solo
a root, e non vengono incluse negli snapshot.

La passphrase Restic deve essere conservata dal titolare nel proprio gestore
password: senza di essa, perdere il VPS significa non poter decifrare il backup.
Lo script chiede al titolare di confermare di averla salvata. Il recupero da un
altro computer richiede anche l'accesso alla Storage Box, tramite la password del
fornitore o una nuova chiave autorizzata dal titolare.

## Attivazione

Installare `restic`, `sshpass`, OpenSSH client dai repository Debian. Come root:

```sh
python3 deployment/prepare-backup.py --prepare NOME_UTENTE_STORAGE_BOX
python3 deployment/prepare-backup.py --connect NOME_UTENTE_STORAGE_BOX
```

Il secondo comando va eseguito nella console interattiva del VPS. Il titolare
inserisce personalmente, senza eco, la password Storage Box e una nuova passphrase
Restic ripetuta due volte. Nessun segreto deve transitare in chat o nel repository.
Il passaggio installa sul servizio la chiave pubblica dedicata in formato RFC4716,
preservando e salvando una copia delle eventuali chiavi preesistenti. L'impronta
ED25519 viene confrontata con quella pubblicata dalla documentazione Hetzner;
una mancata corrispondenza blocca la preparazione, senza accettare nuove chiavi.
SFTP sulla porta 22 ed External Reachability sono sufficienti; non servono SMB,
WebDAV o la shell estesa sulla porta 23.

Dopo l'accesso, prima di abilitare il timer, eseguire con Node 24 del VPS:

```sh
node deployment/backup.cjs init
node deployment/backup.cjs self-test
node deployment/backup.cjs backup
node deployment/backup.cjs verify
```

`self-test` trasferisce un fascicolo e un PDF esclusivamente sintetici e li
ripristina in una directory isolata. `verify` recupera lo snapshot di produzione,
verifica gli hash di tutti i file, l'integrità del vault e dell'audit, e i documenti.
Il vault non viene mai ripristinato sopra i dati attivi. Il runtime non inizializzato
è registrato come tale, senza inventare un archivio dati esistente.

Gli snapshot comprendono sorgenti Git tracciati, build pubblica `dist/`, configurazione
runtime, configurazioni Nginx/systemd selezionate e snapshot SQLite consistente,
ulteriormente cifrato con la chiave del vault. Non sono immagini dell'intero VPS.
I certificati TLS possono essere riemessi; lo snapshot include la configurazione
del rinnovo, non le chiavi TLS private. Le configurazioni ripristinate contengono
segreti: vanno aperte soltanto in una directory privata root.

Preparare `/var/lib/cafpuntocittadino-backup` root:root 0700, installare le unit
`punto-backup.service` e `punto-backup.timer`, validarle con systemd e abilitare il
timer soltanto dopo il ripristino riuscito. Pianificazione: ogni giorno tra le
03:15 e le 03:30, fuso Europe/Rome; un'esecuzione persa viene recuperata al riavvio.
Verificare anche un'esecuzione della unit con le protezioni systemd attive.

Lo stato è in `/var/lib/cafpuntocittadino-backup/status.json`; gli errori dettagliati
Restic sono in `last-restic.log`, entrambi root-only. Il timer non invia email.
Consultare `systemctl status punto-backup.service`, `journalctl -u punto-backup.service`
e la data dell'ultimo backup. Il fallimento deve essere corretto prima di dichiarare
il servizio protetto. La mutua esclusione usa `flock` nella directory `/run/punto-backup`.

Non è prevista eliminazione automatica degli snapshot in questa prima attivazione.
La politica di conservazione e cancellazione deve essere definita e approvata prima
dell'apertura dell'area con dati reali. I test sintetici restano identificati dal tag
`punto-self-test`. Nessuna funzione riservata del sito viene attivata da questi script.

Riferimenti: documentazione ufficiale Hetzner, Storage Box Overview e SFTP/SCP;
documentazione ufficiale Restic, Preparing a new repository e SFTP.
