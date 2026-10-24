# Preparazione del server Linux

Modelli da applicare esclusivamente al server scelto e collaudato. I modelli non eseguono acquisti, cambi DNS o riattivazioni Netlify. Sul VPS Netcup sono stati installati Node 24, ClamAV e Nginx per il collaudo locale; l’installazione dei modelli non equivale all’attivazione del portale. Il servizio resta disabilitato finché non esiste una configurazione privata valida e revisionata.

## Percorsi e prerequisiti

- Node >=22.13 disponibile a `/usr/bin/node`; verificare `node --version` sul server. Se installato altrove, adattare entrambi i comandi della unit al percorso effettivo e verificato.
- Codice e build in `/opt/cafpuntocittadino`, leggibili ma non scrivibili dall'utente del servizio; `dist/` creato con il collaudo completo prima dell'installazione.
- Utente di sistema dedicato `cafpuntocittadino`, senza login interattivo e senza privilegi amministrativi.
- Archivio in `/var/lib/cafpuntocittadino/vault`, con cartella superiore e archivio di proprietà dell'utente del servizio, permessi 0700, fuori dal codice pubblico.
- Configurazione completa in `/etc/cafpuntocittadino/runtime.env`, directory 0700, file 0600 root. Il file d'esempio non contiene credenziali né durate inventate; non cambiarne le flag per aggirare i controlli.
- ClamAV da fonte ufficiale della distribuzione, database aggiornato leggibile dal servizio e prove reale PDF pulito/infetto/scanner guasto. Aggiornamento firme distinto dal processo applicativo.
- Backup applicativi cifrati fuori dal repository, copia su archivio remoto separato, chiave conservata separatamente. Prima del rilascio: restore verificato e procedura di conservazione/rotazione approvata.

## Collaudo privato prima del rilascio

`cafpuntocittadino.service` usa filesystem in sola lettura salvo la directory dati, utente dedicato, umask 0077, nessuna capability, loopback e configurazione esterna. Installare la unit sul server solo dopo aver verificato percorsi e permessi; `systemd-analyze verify` deve passare lì. Non è stata abilitata o avviata in questa sessione.

`nginx-staging.conf` ascolta esclusivamente su 127.0.0.1:8081. Per il collaudo usare origine `http://127.0.0.1:8081` e accesso tramite tunnel autorizzato. Google richiede origine di test autorizzata e client appropriato. Se occorre HTTPS di staging, predisporre dominio/controllo accessi e certificato verificati senza pubblicare funzionalità non collaudate. L'esempio HTTP locale non sostituisce il collaudo TLS.

`CAF_TRUST_PROXY=true` è appropriato soltanto con questo proxy locale che **sovrascrive** `X-Forwarded-For` con l'indirizzo del client; non conserva header forniti dal visitatore. Il runtime accetta un unico IP valido solo da loopback quando la flag è esplicita. Senza proxy affidabile lasciare false. Non aggiungere CDN/proxy intermedi senza adattare e verificare la catena di fiducia. Le quote per IP non rappresentano un limite di utenti registrati e possono essere condivise da persone dietro lo stesso NAT.

I modelli proxy limitano il body a 14 MiB, disabilitano buffering delle richieste/risposte, cache e replay verso upstream: PDF e risposte riservate non devono essere scritti come file temporanei del proxy. Il limite applicativo resta 10 MiB per il PDF. Verificare realmente i caricamenti al limite e l'assenza di file temporanei con la versione nginx installata, inclusi richieste chunked e protocolli abilitati. Il controllo rate non sostituisce protezione DDoS, limiti host e collaudo sotto carico.

I modelli non registrano access log con URL/codici di disdetta/IP; verificare anche gli error log effettivi e le regole di conservazione. Non aggiungere log del body o degli header Authorization.

## Rilascio

`nginx-production.conf` è un modello HTTPS per il nuovo dominio principale puntocittadinoitalia.it e redirect www. Richiede dominio effettivamente registrato, DNS verificati e certificati già presenti. Impostare `CAF_ORIGIN=https://puntocittadinoitalia.it` soltanto quando il dominio è disponibile e configurato; allineare anche le origini OAuth Google. L’utente ha completato l’ordine Aruba Dominio con Email: la schermata del 25 ottobre mostra ancora la registrazione in corso, con scadenza 25 ottobre 2027. L’email del Registro .it del 25 ottobre 2026 alle 00:55:11 Europe/Rome conferma la registrazione con registrar ARUBA-REG, ma riporta ancora `inactive, dnsHold`: registrazione e operatività DNS sono quindi distinte. Verificare attivazione nel pannello e delega DNS prima del rilascio; allineare anche origini e callback Google. Il modello `nginx-legacy-redirect.conf` prepara il reindirizzamento dal vecchio dominio, da attivare solo dopo verifica dei certificati e della migrazione delle integrazioni. Il modello HTTPS non è ancora stato validato con certificati effettivi. Il proxy di staging sul VPS supera `nginx -t` e ascolta solo su loopback. Sul server, verificare la configurazione completa con `nginx -t`, certificati, rinnovo e test del proxy prima di abilitarla. La unit installata sul VPS usa il percorso verificato `/opt/node-v24.22.1-linux-x64/bin/node` e supera `systemd-analyze verify`; resta disabilitata in attesa della configurazione privata completa.

Seguire tutte le prove in [COLLAUDO-OPERATIVO.md](../COLLAUDO-OPERATIVO.md): Google, utenti/sedi, PDF reali, workflow, agenda/disdette, backup/restore, carico, UI, PWA e privacy. Approvare i moduli opzionali solo dopo il loro collaudo. AI e invio mail restano spenti in questo esempio. Attivazione, contratto, identità di fatturazione, pagamento e autorizzazioni account richiedono l'intervento previsto dal fornitore. Nessuna richiesta di password o token in chat.

Solo dopo l'esito positivo: approvare configurazione finale, certificato e record DNS puntati al server effettivo. Conservare i record precedenti e una procedura di rollback che non riattivi Netlify. Il PC Windows viene usato per l'ultimo collaudo locale, non come server operativo.

Fonti tecniche: [systemd.exec](https://github.com/systemd/systemd/blob/main/man/systemd.exec.xml), [nginx proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).

## Conservazione operativa selezionata il 25 ottobre 2026

Su delega della responsabile del progetto: `retention-policy.json` assegna 365 giorni a ciascuno dei 30 servizi, dall’ultimo aggiornamento di una pratica conclusa o non accolta. Il file riguarda l’archivio operativo del portale e non certifica i termini obbligatori dell’archivio professionale. La cancellazione resta manuale con anteprima e conferma dell’amministratrice: prima occorre verificare gli obblighi applicabili e l’archiviazione dei documenti da mantenere. Nessun nuovo job di cancellazione è attivato. Le pratiche aperte richiedono una verifica periodica della necessità di conservazione.

Il file JSON va copiato nella variabile privata `CAF_RETENTION_DAYS_JSON`; il modello generico resta privo di durate automatiche. La revisione privacy completa resta un requisito separato.

Backup esterno individuato: Hetzner Storage Box BX11, 1 TB, regione UE, listino verificato il 25 ottobre 2026 pari a 3,90 euro/mese IVA italiana 22% inclusa, attivazione 0 euro e nessuna durata minima. Ordine non completato. Piano proposto: copia cifrata giornaliera, finestra di recupero 30 giorni; rotazione e ripristino da configurare e verificare dopo la disponibilità dello storage. Il totale e gli accordi del fornitore vanno verificati prima dell’ordine. La chiave di cifratura non deve accompagnare i backup sullo stesso storage.

Il nome pubblico è Punto Cittadino Italia. Il nuovo dominio `puntocittadinoitalia.it` è stato ordinato dall’utente su Aruba con 5 caselle da 1 GB; il prezzo mostrato nel carrello era 4,87 euro IVA inclusa per il primo anno, rinnovo 20,12 euro IVA inclusa/anno. La registrazione è confermata dall’email del Registro .it; operatività DNS e caselle email restano da verificare. Il dominio posseduto `cafpuntocittadino.it` resta invariato finché non esistono registrazione e configurazione del nuovo dominio.

## Preparazione Google per il nuovo dominio

Origine del login Google Identity Services: `https://puntocittadinoitalia.it` nel client web esistente, da allineare a `GESTIONALE_GOOGLE_CLIENT_ID`. Il client OAuth storico Calendar/Gmail usa `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN`, conservati solo nella configurazione privata. Calendario Molfetta e amministratrice già verificati tramite il connettore: account della sede `cafparadiso.molfetta@gmail.com`; Bari resta separato e disabilitato al lancio.

Le funzioni storiche `google-calendar-auth` e `google-calendar-callback` derivano ora lo stesso redirect dalla `CAF_ORIGIN` HTTPS canonica, senza usare Host o header della richiesta. Con origine finale il redirect è `https://puntocittadinoitalia.it/.netlify/functions/google-calendar-callback`; deve coincidere esattamente con quello autorizzato in Google Cloud. La compatibilità con il vecchio dominio resta solo quando `CAF_ORIGIN` è assente. Un’origine di staging HTTP non deve essere usata per avviare questa procedura storica.

Queste due funzioni storiche non sono esposte dal runtime Node attuale e non salvano il nuovo refresh token. La correzione del redirect non attesta quindi un collegamento operativo e non autorizza a pubblicare un endpoint di configurazione aperto. Occorre recuperare e validare la configurazione privata esistente, oppure predisporre separatamente una procedura amministrativa protetta per l’autorizzazione e il salvataggio del token, prima di abilitarle. Il token non va inserito in pagine, repository, log o messaggi.

La Console Google Cloud non è raggiungibile dal browser di lavoro: restituisce `Site Unavailable`. Nessun progetto o client Google è stato modificato e nessuna nuova autorizzazione Google è stata concessa da questa sessione. Il connettore Calendar permette di verificare i calendari ma non esporta le credenziali OAuth necessarie al VPS. Test reali di login, prenotazione, disdetta e invio email restano obbligatori.
