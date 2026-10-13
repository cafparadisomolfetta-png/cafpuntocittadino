# Preparazione del server Linux

Modelli da applicare esclusivamente al server scelto e collaudato. Nessun server acquistato, nessuna installazione remota, nessun cambio DNS o Netlify. Il servizio resta disabilitato finché non esiste una configurazione privata valida e revisionata.

## Percorsi e prerequisiti

- Node >=22.13 disponibile a `/usr/bin/node`; verificare `node --version` sul server. Se installato altrove, adattare entrambi i comandi della unit al percorso effettivo e verificato.
- Codice e build in `/opt/cafpuntocittadino`, leggibili ma non scrivibili dall'utente del servizio; `dist/` creato con il collaudo completo prima dell'installazione.
- Utente di sistema dedicato `cafpuntocittadino`, senza login interattivo e senza privilegi amministrativi.
- Archivio in `/var/lib/cafpuntocittadino`, proprietario dell'utente del servizio, permessi 0700, fuori dal codice pubblico.
- Configurazione completa in `/etc/cafpuntocittadino/runtime.env`, directory 0700, file 0600 root. Il file d'esempio non contiene credenziali né durate inventate; non cambiarne le flag per aggirare i controlli.
- ClamAV da fonte ufficiale della distribuzione, database aggiornato leggibile dal servizio e prove reale PDF pulito/infetto/scanner guasto. Aggiornamento firme distinto dal processo applicativo.
- Backup applicativi cifrati fuori dal repository, copia su archivio remoto separato, chiave conservata separatamente. Prima del rilascio: restore verificato e procedura di conservazione/rotazione approvata.

## Collaudo privato prima del rilascio

`cafpuntocittadino.service` usa filesystem in sola lettura salvo la directory dati, utente dedicato, umask 0077, nessuna capability, loopback e configurazione esterna. Installare la unit sul server solo dopo aver verificato percorsi e permessi; `systemd-analyze verify` deve passare lì. Non è stata abilitata o avviata in questa sessione.

`nginx-staging.conf` ascolta esclusivamente su 127.0.0.1:8081. Per il collaudo usare origine `http://127.0.0.1:8081` e accesso tramite tunnel autorizzato. Google richiede origine di test autorizzata e client appropriato. Se occorre HTTPS di staging, predisporre dominio/controllo accessi e certificato verificati senza pubblicare funzionalità non collaudate. L'esempio HTTP locale non sostituisce il collaudo TLS.

`CAF_TRUST_PROXY=true` è appropriato soltanto con questo proxy locale che **sovrascrive** `X-Forwarded-For` con l'indirizzo del client; non conserva header forniti dal visitatore. Il runtime accetta un unico IP valido solo da loopback quando la flag è esplicita. Senza proxy affidabile lasciare false. Non aggiungere CDN/proxy intermedi senza adattare e verificare la catena di fiducia. Le quote per IP non rappresentano un limite di utenti registrati e possono essere condivise da persone dietro lo stesso NAT.

Entrambi i modelli proxy limitano il body a 14 MiB, disabilitano buffering delle richieste/risposte, cache e replay verso upstream: PDF e risposte riservate non devono essere scritti come file temporanei del proxy. Il limite applicativo resta 10 MiB per il PDF. Verificare realmente i caricamenti al limite e l'assenza di file temporanei con la versione nginx installata, inclusi richieste chunked e protocolli abilitati. Il controllo rate non sostituisce protezione DDoS, limiti host e collaudo sotto carico.

I modelli non registrano access log con URL/codici di disdetta/IP; verificare anche gli error log effettivi e le regole di conservazione. Non aggiungere log del body o degli header Authorization.

## Rilascio

`nginx-production.conf` è un modello HTTPS per cafpuntocittadino.it e redirect www. Richiede certificati già presenti. Non è stato validato con `nginx -t` perché nginx e certificati non sono installati nell'ambiente locale. Sul server, verificare la configurazione completa con `nginx -t`, certificati, rinnovo e test del proxy prima di abilitarla. La unit è stata controllata con systemd-analyze in una copia temporanea adattando il percorso Node al runtime locale; il file finale resta da verificare sul server.

Seguire tutte le prove in [COLLAUDO-OPERATIVO.md](../COLLAUDO-OPERATIVO.md): Google, utenti/sedi, PDF reali, workflow, agenda/disdette, backup/restore, carico, UI, PWA e privacy. Approvare i moduli opzionali solo dopo il loro collaudo. AI e invio mail restano spenti in questo esempio. Attivazione, contratto, identità di fatturazione, pagamento e autorizzazioni account richiedono l'intervento previsto dal fornitore. Nessuna richiesta di password o token in chat.

Solo dopo l'esito positivo: approvare configurazione finale, certificato e record DNS puntati al server effettivo. Conservare i record precedenti e una procedura di rollback che non riattivi Netlify. Il PC Windows viene usato per l'ultimo collaudo locale, non come server operativo.

Fonti tecniche: [systemd.exec](https://github.com/systemd/systemd/blob/main/man/systemd.exec.xml), [nginx proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).
