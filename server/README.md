# Runtime privato CAF Punto Cittadino

Implementazione verificata localmente con dati sintetici: **109 test superati**. Stato e limiti: [VERIFICA-WORK-2026-10-13.md](../VERIFICA-WORK-2026-10-13.md). Nessuna pubblicazione, spesa, chiamata AI a pagamento o email reale effettuata. I deploy Netlify restano sospesi.

## Ambiente

Node >=22.13 con `node:sqlite`, HTTPS tramite reverse proxy, un singolo nodo scrittore, filesystem privato persistente, ClamAV con firme aggiornate e backup separati. Database e chiave devono stare fuori dal repository e dal bundle pubblico. Non usare disco effimero serverless per i documenti. Il servizio ascolta su loopback; hosting, TLS, accordi con i fornitori e procedure operative richiedono l'ambiente effettivo. Nessun host è stato acquistato/configurato.

Comandi: `npm test` (suite e build), `npm run build` (`dist/`), `npm run start:private` (solo dopo configurazione privata approvata).

Prima di avviare: `npm run check:private`. Restituisce un rapporto JSON con nomi dei controlli ed esito, senza valori delle variabili. Exit 1 indica configurazione incompleta/invalida; exit 0 indica solo il superamento delle verifiche offline. Non apre il vault, non crea directory/file, non avvia scanner, non chiama Google/OpenAI e non invia email. Verifica percorsi, origine, porta, chiave base64, provisioning, calendari distinti, durate e condizioni dei moduli opzionali. Lo stesso controllo blocca l'avvio prima di creare dati. L'origine deve essere canonica, per esempio `https://cafpuntocittadino.it`, senza slash finale, credenziali, path, query o fragment. Non caricare automaticamente `.env` dal repository: la configurazione va fornita privatamente dall'host.

Il controllo verifica solo che l'eseguibile antivirus configurato sia presente ed eseguibile, non che sia davvero ClamAV o che le firme siano aggiornate. HTTPS, provider, scansione reale, ripristino e dispositivi richiedono i collaudi operativi descritti sotto. Il rapporto positivo non autorizza pubblicazione, spesa o uso di dati reali.

## Funzioni e accessi

- `/assistiti/`: account Google personale, richieste 730/ISEE, riferimento appuntamento verificato tramite email account/calendario, pratiche proprie, ricevute/stati, integrazioni e PDF. Upload non equivale a mandato/firma/invio ufficiale.
- Richiamata: intake autenticato con telefono e email verificata, gestione nello stesso workflow; recapiti solo admin/manager/operator della sede, senza allegati. Le pagine pubbliche instradano verso l'area assistiti e non raccolgono questi dati in Netlify Forms.
- `/gestionale/pratiche.html`: admin entrambe le sedi; manager/operator/viewer solo sedi assegnate. Viewer non modifica; admin gestisce collaboratori, revoca, erasure, conservazione, news e job. I dati reali non devono comparire nei test.
- `/gestionale/`: agenda Google, spostamenti/annullamenti per operatori autorizzati della sede, esclusi viewer/citizen ed eventi senza marcatura CAF. ETag/If-Match impedisce sovrascritture di versioni cambiate; il runtime riserva lo slot prima dello spostamento. Esiti incerti/crash mantengono il blocco. Inserimenti diretti su Google o tramite altri sistemi non sono serializzati dal runtime.
- Prenotazioni pubbliche Molfetta: funzioni esistenti con wrapper di prenotazione persistente per slot. Disdetta pubblica con regola 48 ore e storico locale. Il codice Netlify storico non acquisisce questo wrapper: non va attivato come se fosse il nuovo backend.
- Bari: agenda e annullamenti supportati; spostamenti solo con orari privati approvati. Prenotazioni pubbliche disabilitate fino a definizione e collaudo di orari, indirizzo e conferme.
- `/candidature/`: CV solo PDF fino a 5 MiB, scansione e cifratura; candidato vede i propri CV/ricevute, admin la valutazione. Gli operatori ordinari non leggono CV. `?gestione=1` richiede ruolo admin sul server. Versioni/stati, erasure e durata dalla raccolta, senza proroga automatica dovuta a nuovi aggiornamenti. Il bundle sostituisce il precedente upload CV Netlify.
- PWA pubblico/assistiti/gestionale, PNG 192/512, token solo in memoria, logout/pagehide e scarto risposte tardive; nessuna cache di documenti/risposte autenticate. L'installazione iPhone/Android non è stata verificata.

## Dati, PDF e integrità

Record/contenuti AES-256-GCM con AAD legato a tipo/ID, database privato, autorizzazioni server, URL di download autenticato e `no-store`. PDF pratica fino a 10 MiB, massimo 20 per pratica, nomi/MIME/dimensioni/signature/EOF verificati, alcune azioni attive visibili bloccate e ClamAV prima della persistenza. Firma/EOF e filtro testuale non sono un parser PDF completo. Scanner guasto, non configurato o esito diverso da `clean`: niente archiviazione. Duplicati rifiutati, due upload contemporanei al massimo.

Scritture SQLite transazionali, versione pratica e riesame dei permessi/stato dopo scansione; audit cifrato concatenato HMAC, necessario per letture/scritture. Il registro locale non è immutabile contro un host compromesso. Chiave errata o alterazioni impediscono la lettura. Backup AES-GCM e restore su directory nuova verificati in test. Proteggere e conservare separatamente la chiave: la perdita impedisce il recupero.

Retention: pratiche/callback concluse/non accolte oltre il periodo approvato, CV dalla raccolta, notifiche secondo policy, prefisso audit con ancora HMAC cifrata. Durate non vengono inventate. Cancellazione SQLite/secure_delete non garantisce eliminazione fisica su SSD o dai backup: tutte le copie devono essere incluse nelle procedure approvate.

## Segretaria AI

Adattatore Responses controllato e **disattivato per default**. Richiede sia abilitazione sia autorizzazione separata alla spesa, modello scelto in configurazione, chiave privata e cap giornaliero. Con l'attuale vincolo di nessuna spesa non abilitare chiamate reali.

Due richieste concorrenti, messaggio 1200 caratteri, history 8 messaggi, output 500 token, timeout, `store:false`, nessuna chat archiviata localmente. Le chiamate ammesse consumano il cap anche in caso di errore, perché la richiesta potrebbe essere già costata. Il cap conta richieste, non euro. Il filtro dei dati personali è euristico e non riconosce ogni dato sensibile. L'assistente non accede a pratiche/documenti o banche dati personali, non promette esiti e indirizza i casi individuali alla sede. Nessun modello viene scelto automaticamente; nessuna chiave reale creata o riutilizzata nei collaudi.

`store:false` riguarda la memorizzazione delle Response e non certifica assenza di ogni logging/retention del fornitore. Servono verifica qualità, informative, accordi e condizioni del fornitore sull'ambiente reale.

## Scheduler, email e news

Scheduler opt-in: fonti giornaliere, ricerca promemoria oraria nella finestra 23–25 ore prima, invio coda ogni minuto. Il shutdown attende i job avviati. Stato e avvio manuale disponibili all'admin; un job rimasto running dopo crash richiede riconciliazione dopo almeno 30 minuti. Email in stato sending diventano uncertain e non sono reinviate automaticamente.

Notifiche/promemoria deduplicati e cifrati; oggetto/corpo generici senza dettagli sanitari, mittente configurato e destinatari validati, subject/corpo MIME. Coda solo con durata approvata; senza policy non vengono archiviate notifiche con indirizzi. Invio opt-in; esiti incerti non ritentati automaticamente. Nessuna garanzia exactly-once del provider. Le email pubbliche storiche di prenotazione/disdetta restano nel codice originario Google e richiedono il proprio collaudo.

Monitoraggio news senza AI, tramite fonti istituzionali fisse, hashing e segnalazioni da verificare: una variazione del sito non prova una novità normativa. Testo integrale non archiviato. Il catalogo contiene solo testi approvati dall'admin con fonte HTTPS ammessa, massimo 120. Le bozze non sono pubbliche. Le schede storiche del sito richiedono controllo editoriale prima del rilascio.

## Configurazione privata

Mai inserire valori segreti o documenti personali in chat, GitHub o bundle.

| Variabile | Scopo |
| --- | --- |
| `CAF_PRIVATE_ENABLED=true` | Avvio esplicito |
| `CAF_PRIVACY_REVIEWED=true` | Conferma delle informative/fornitori/policy effettivamente revisionati |
| `CAF_PRIVATE_DIRECTORY` | Percorso assoluto persistente fuori dal repository, con parent esistente |
| `CAF_VAULT_KEY` | Chiave privata 32 byte in base64, separata dai backup |
| `CAF_CLAMSCAN_PATH` | Eseguibile antivirus affidabile; default `/usr/bin/clamscan` |
| `CAF_ORIGIN`, `CAF_PORT` | Origine finale HTTPS e porta loopback; HTTP solo localhost/127.0.0.1, porta default 8080 |
| `GESTIONALE_GOOGLE_CLIENT_ID` | Audience Google Identity Services; origine autorizzata in Google Cloud |
| `GESTIONALE_ADMIN_EMAIL` | Unico account admin, Molfetta/Bari |
| `GESTIONALE_OPERATORS_JSON` | Provisioning iniziale; default `[]`; revoche del database prevalgono |
| `GESTIONALE_SITE_CALENDARS_JSON` | Calendari distinti Molfetta/Bari |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | Integrazione storica Calendar/Gmail |
| `CAF_RETENTION_DAYS_JSON` | Giorni approvati per `730`, `isee` e, se abilitata, `richiamata` |
| `CAF_CALLBACK_ENABLED=true` | Richiamate personali; richiede policy `richiamata` |
| `CAF_CV_RETENTION_DAYS` | Durata approvata necessaria per abilitare CV |
| `CAF_BARI_SLOTS_JSON` | Mappa weekday 0–6 a orari privati approvati; nessun default Bari |
| `CAF_JOBS_ENABLED=true` | Avvio scheduler; default spento |
| `CAF_MAIL_ENABLED=true`, `CAF_SENDER_EMAIL` | Invio reale della coda e mittente; default spento |
| `CAF_MAIL_RETENTION_DAYS` | Necessaria per accodare notifiche e per abilitare invio |
| `CAF_AUDIT_RETENTION_DAYS` | Durata approvata per purge audit locale |
| `CAF_AI_ENABLED=true`, `CAF_AI_SPEND_AUTHORIZED=true` | Due controlli separati per chiamate a pagamento; entrambi spenti per default |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `CAF_AI_DAILY_REQUEST_LIMIT` | Configurazione privata AI, modello e cap 1–10000 richieste/giorno UTC |

Queste flag non sostituiscono la revisione o le autorizzazioni effettive. Non avviare il servizio con dati reali prima del collaudo operativo. Le funzioni Netlify `pratiche` restano disabilitate e distinte dal backend Node.

## Manutenzione sul solo host approvato

- `node server/maintenance.cjs verify`: integrità audit.
- `node server/maintenance.cjs backup /percorso/privato/nuovo.cafbackup`: snapshot cifrato, senza sovrascritture.
- `node server/maintenance.cjs restore /percorso/privato/backup.cafbackup /percorso/privato/directory-nuova`: restore; per uso operativo fermare il servizio e verificare prima dello scambio directory.
- `node server/maintenance.cjs retention-preview` / `retention-purge`: pratiche scadute secondo policy, cancellazione solo con revisione confermata. Disponibile anche nell'interfaccia admin.
- `node server/maintenance.cjs audit-purge`: prefisso scaduto, con policy esplicita e ancora verificabile.

Conservazione/cancellazione backup, rotazione chiavi, monitoraggio, MFA, incidenti, controllo firme antivirus, TLS, accessi host e prova di recupero reale restano operazioni dell'ambiente. Nessuna automatizzazione di queste operazioni è stata attivata sull'account dell'utente.

## Collaudo e riferimenti

`npm test` esegue API HTTP locali, provider simulati, cifratura, ruoli/versioni/concorrenza, PDF, CV, richiamate, AI disattivata/cap, scheduler/email/news, rollback/retention/backup, logout tardivo, frontend statico e bundle. Google, Gmail, ClamAV, fonti e AI reali, browser visuale, accessibilità, installazione PWA, carico e test di sicurezza indipendenti restano da eseguire. Il superamento dei test locali non certifica conformità GDPR.

Documentazione usata: [Google Calendar, versioni/If-Match](https://developers.google.com/workspace/calendar/api/guides/version-resources), [Calendar patch](https://developers.google.com/workspace/calendar/api/v3/reference/events/patch), [OpenAI Responses](https://developers.openai.com/api/docs/guides/migrate-to-responses).
