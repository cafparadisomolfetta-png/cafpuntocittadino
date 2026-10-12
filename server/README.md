# Runtime privato CAF Punto Cittadino

## Stato e scopo

Implementazione locale verificata con dati sintetici. **Non pubblicata e non collaudata con servizi o documenti reali.** Il sito storico resta nel repository; i deploy Netlify rimangono sospesi. Le funzioni Netlify `pratiche` rimangono intenzionalmente disabilitate. Il nuovo runtime Node è un percorso distinto, predisposto per un ambiente esistente con filesystem privato persistente: non installarlo su funzioni serverless con disco effimero.

Node >=22.13 con `node:sqlite`, HTTPS tramite reverse proxy, un solo nodo scrittore, disco locale persistente cifrato, backup separati e ClamAV con firme aggiornate sono requisiti operativi. Non è stato acquistato né configurato un server. La scelta dell'hosting e gli accordi di trattamento richiedono la responsabile.

## Moduli implementati

- `/assistiti/`: accesso Google personale, richieste dirette 730/ISEE per Molfetta e Bari, riferimento appuntamento facoltativo, elenco/stato/ricevuta di invio, integrazioni, caricamento e download PDF.
- `/gestionale/pratiche.html`: pratiche delle sole sedi assegnate; gestione stati e integrazioni; ruoli admin, manager, operator e viewer. Solo admin può configurare collaboratori e cancellare definitivamente pratiche/documenti.
- `/gestionale/`: agenda Google esistente, con endpoint del runtime che consultano anche la revoca degli operatori salvata nel database. L'agenda rimane in lettura: spostamenti di appuntamenti non sono implementati.
- PDF: estensione/MIME/dimensione massimo 10 MiB, intestazione/EOF, rifiuto di alcune azioni attive visibili e scansione ClamAV prima dell'archiviazione. Firma ed EOF non costituiscono un parser PDF completo. Scanner assente/guasto o risultato diverso da `clean`: nessun documento archiviato. Massimo 20 documenti per pratica, duplicati rifiutati, due upload contemporanei al massimo nel runtime.
- Record e contenuti cifrati AES-256-GCM con AAD legato al tipo e all'ID; database fuori dal repository e fuori da `dist`; modalità private per directory/file. La chiave è esclusivamente in configurazione privata. Una chiave errata o dati alterati impediscono lettura/apertura. Nessuna chiave reale creata.
- Audit cifrato e concatenato con HMAC per letture e scritture; le operazioni falliscono se l'audit necessario non può essere scritto. L'audit locale non è un registro esterno immutabile; un host compromesso richiede ulteriori misure operative.
- Scritture SQLite transazionali; stato pratica con controllo versione per evitare sovrascritture.
- Prenotazioni pubbliche Molfetta: prenotazione persistente per slot prima della chiamata a Google. Le richieste concorrenti attraverso questo runtime non creano due eventi. Esiti incerti e crash conservano il blocco. Solo l'admin può riconciliare richieste vecchie di almeno dieci minuti, non ancora in elaborazione, dopo conferma del calendario che lo slot sia libero. Prenotazioni eseguite direttamente da Google o da altri sistemi non sono serializzate dal runtime.
- Disdetta pubblica tramite funzione esistente e registrazione locale; il codice non riattiva Netlify. Le prenotazioni pubbliche Bari restano disabilitate in attesa dei dati operativi della sede.
- Backup AES-GCM e ripristino verificato su directory nuova; conservazione per 730/ISEE senza durate arbitrarie, cancellazione esclusiva di pratiche concluse/non accolte oltre il periodo approvato.
- PWA separate pubblico, assistiti e gestionale, con PNG 192/512. Nessuna cache di PDF, risposte API o credenziali; token Google solo in memoria, cancellati al logout/pagehide. Installazione reale su iOS/Android ancora da verificare.

## Configurazione privata

Non copiare valori segreti in GitHub o nella chat. Non inserire documenti personali nei test.

| Variabile | Funzione |
| --- | --- |
| `CAF_PRIVATE_ENABLED=true` | Abilitazione esplicita del runtime |
| `CAF_PRIVACY_REVIEWED=true` | Informative/fornitori/policy effettivamente revisionati, non un sostituto della revisione |
| `CAF_PRIVATE_DIRECTORY` | Directory assoluta privata persistente, fuori dal repository; parent già esistente |
| `CAF_VAULT_KEY` | Chiave privata 32 byte in base64, conservata separatamente dai backup; senza chiave non è possibile il recupero |
| `CAF_CLAMSCAN_PATH` | Eseguibile antivirus affidabile; default `/usr/bin/clamscan` |
| `CAF_ORIGIN` | Origine HTTPS finale; HTTP consentito solo per localhost/127.0.0.1 |
| `CAF_PORT` | Porta loopback; default 8080 |
| `GESTIONALE_GOOGLE_CLIENT_ID` | Audience Google Identity Services; autorizzare origine finale in Google Cloud |
| `GESTIONALE_ADMIN_EMAIL` | Unico account amministratrice, entrambe le sedi |
| `GESTIONALE_OPERATORS_JSON` | Provisioning iniziale operatori; default `[]`; le revoche del database prevalgono sul provisioning |
| `GESTIONALE_SITE_CALENDARS_JSON` | Mappa con calendari distinti Molfetta e Bari |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | Funzioni Google esistenti; Calendar e Gmail da collaudare |
| `CAF_RETENTION_DAYS_JSON` | Oggetto con giorni approvati per `730` e `isee`; nessun valore automatico |

Avvio solo dopo configurazione: `npm run build`, poi `npm run start:private`. Il servizio ascolta esclusivamente su loopback; TLS e accesso esterno restano compiti del reverse proxy dell'ambiente scelto. Non impostare segreti su host non approvati. Non avviare con documenti reali prima del collaudo operativo.

L'identità Google viene verificata sul server per issuer, audience, email verificata e scadenza. Il ruolo deriva dall'account amministratrice o dal registro operatori, non dal client. Richieste citizen restano sempre legate al `sub` Google. Il riferimento appuntamento non autorizza da solo l'accesso: il server confronta email account/prenotazione e calendario della sede.

## Manutenzione

Sul solo host privato, con le variabili di ambiente approvate:

- `node server/maintenance.cjs verify`: verifica audit.
- `node server/maintenance.cjs backup /percorso/privato/backup-nuovo.cafbackup`: snapshot cifrato; non sovrascrive backup esistenti.
- `node server/maintenance.cjs restore /percorso/privato/backup.cafbackup /percorso/privato/directory-nuova`: ripristino in directory nuova; per uso operativo fermare il servizio e verificare audit e dati prima dello scambio directory.
- `node server/maintenance.cjs retention-preview`: elenco pratiche scadute secondo la policy configurata.
- `node server/maintenance.cjs retention-purge`: cancellazione effettiva secondo policy approvata; disponibile anche nell'interfaccia admin con conferma.

La pianificazione su un host reale, la conservazione/cancellazione dei backup e dell'audit, la rotazione delle chiavi, monitoraggio, MFA Google, gestione incidenti e prova di recupero con l'infrastruttura scelta restano da completare. `secure_delete` SQLite non garantisce cancellazione fisica su SSD o copie di backup; la policy deve coprire queste copie.

## Limiti del collaudo

`npm test` esegue suite originali, motore privato, API HTTP locale, provider simulati, cifratura, backup/ripristino, permessi, transazioni, frontend statico e bundle. Nessun test usa Google, Gmail, OpenAI o antivirus reali. Non sono stati eseguiti test visuali/browser né verifiche di sicurezza indipendenti.

La segretaria AI e i monitoraggi/scheduler storici Netlify non sono stati migrati o attivati in questo runtime. Nessuna chiamata OpenAI o spesa effettuata; serve una decisione sulla chiave e un ambiente autorizzato. Il modulo CV storico richiede ancora un percorso di raccolta privato collaudato; il filtro PDF nel frontend non rende sicuro Netlify Forms. Il runtime rifiuta i POST ai moduli statici senza un endpoint previsto.

La versione predisposta richiede collaudo dei servizi esterni, revisione privacy e verifiche su dispositivi prima di qualunque rilascio. Non rimuovere il blocco deploy Netlify.
