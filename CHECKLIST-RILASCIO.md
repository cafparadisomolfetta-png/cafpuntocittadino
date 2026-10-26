# Rilascio — Punto Cittadino Italia

Aggiornamento: 26 ottobre 2026. **Sito pubblico online su Netcup; funzioni riservate ancora chiuse.**

## Stato effettivo

- Sito: https://puntocittadinoitalia.it/ . HTTP e HTTPS www reindirizzano al dominio HTTPS principale.
- Server Netcup, Node 24.22.1, repository `/opt/cafpuntocittadino`. Dominio/DNS e posta presso Aruba; il VPS non è Aruba.
- Nome e grafica approvati conservati. Pagine, servizi e collegamenti email/WhatsApp disponibili.
- Il sito pubblico è stato pubblicato il 25 ottobre. Il 26 ottobre l'utente ha riferito la verifica account e ha acquistato la Storage Box Hetzner BX11 da 1 TB a €3,90/mese IVA inclusa; creazione confermata dalla schermata del fornitore.
- Lancio con `deployment/build-public-launch.cjs` e `deployment/nginx-public-launch.conf`: Nginx serve solo `dist/`, senza avviare il backend privato.
- Agenda automatica, area assistiti/gestionale, PDF, candidature e AI non sono operativi. Avvisi e pagine di attesa indirizzano al contatto con un operatore.
- `/api/` e `/.netlify/functions/`: 503. Richieste diverse da GET/HEAD bloccate. Questa pubblicazione non accetta caricamenti o prenotazioni.
- Runtime privato disabilitato; nessuna attestazione di revisione privacy definitiva inserita per aggirare il preflight.
- Nessun nuovo acquisto, riattivazione Netlify o chiamata AI a pagamento.

## Controlli eseguiti

- [x] VPS: 167 test di comportamento e 4 della build superati, nessun errore o test saltato.
- [x] Altri 5 test di preparazione/ripristino backup superati anche sul VPS; suite locale aggiornata senza errori (un test POSIX saltato nell'ambiente locale).
- [x] Nginx abilitato all'avvio del VPS, oltre che attivo.
- [x] Build pubblica riuscita; `nginx -t` superato prima del reload.
- [x] HTTPS root: 200, verifica TLS riuscita. HTTP e HTTPS www: 308 al dominio principale.
- [x] Home verificata nel browser esterno; banner cookie e scelta senza cookie facoltativi verificati.
- [x] Servizi online, privacy, cookie policy, pagine di attesa assistiti/candidature e logo: 200.
- [x] Endpoint privati/provider: 503. POST home: 405. Sorgenti server e `.git/config`: 404.
- [x] Certificato Let's Encrypt root + www; rinnovo webroot e deploy hook già collaudati con staging/dry-run prima del lancio. Eccezione ACME conservata su HTTP.
- [x] Google: client dedicato importato privatamente, consenso Calendar/Gmail completato; refresh, scope e account del calendario verificati con richieste reali. Non equivale a collaudo di prenotazioni/consegna email.
- [x] Collaudo HTTP con identità e dati sintetici completato sul VPS: isolamento, approvazione/accettazione, PDF, antivirus reale, scanner guasto, integrazione, chiusura, audit e ripristino locale cifrato. Il campione PDF usa una firma sintetica temporanea aggiunta esclusivamente allo scanner di prova; EICAR grezzo verificato separatamente. Database e scanner di produzione non modificati. Questo non verifica accessi Google reali o backup esterni.

## Prima di aprire le funzioni riservate

- [x] Storage Box BX11 acquistata dal titolare entro €3,90/mese; External Reachability attivo. Destinazione SFTP risolta dal VPS e impronte moderne confrontate con la documentazione ufficiale del fornitore.
- [x] Accesso SFTP tramite chiave dedicata verificato; passphrase Restic inserita personalmente e copia di recupero confermata dal titolare. Repository esterno cifrato inizializzato.
- [x] Ripristino esterno isolato di un fascicolo e PDF sintetici: 3 file verificati, archivio decifrato, documento e audit integri; controllo completo dei dati Restic riuscito.
- [x] Backup effettivo di codice, build pubblica e configurazioni: 239 file trasferiti e ripristinati in isolamento con hash verificati. Vault di produzione non inizializzato, nessun documento reale da dichiarare recuperato.
- [x] Esecuzione reale di `punto-backup.service` con protezioni systemd riuscita (`Result=success`, `ExecMainStatus=0`); timer giornaliero abilitato e attivo. Prima esecuzione pianificata osservata: 27 ottobre 2026 alle 03:27 CET, entro la finestra 03:15–03:30 Europe/Rome.
- [ ] Definire conservazione/eliminazione degli snapshot prima di accettare documenti reali; nessuna cancellazione automatica attiva.
- [x] Superato `deployment/check-vps-workflow.cjs` con antivirus reale, scanner guasto, isolamento e restore locale; vedere limiti sopra.
- [ ] Concludere revisione informative, presupposti/mandati, accordi dei fornitori e conservazione. Testi aggiornati non attestano da soli la conformità dell'organizzazione.
- [ ] Accesso Google reale, due account assistiti, ruoli e revoca. Le identità simulate non sostituiscono questa prova.
- [ ] Verificare audience/pubblicazione OAuth e durata delle autorizzazioni prima dell'uso stabile.
- [ ] Prenotazione/disdetta reali di prova, conflitti, fuso italiano e consegna email, senza coinvolgere assistiti reali.
- [ ] Percorso pratiche sul dominio finale: verifica operatore, accettazione quota, incasso se dovuto, PDF, integrazione e chiusura.
- [ ] Abilitare separatamente le funzioni opzionali collaudate con conservazione configurata: CV, notifiche, news automatiche e richiamate.
- [ ] PWA su dispositivi reali e controlli mobile/tastiera.

Seguire `deployment/README.md`. Prima del passaggio al backend occorre rigenerare la build completa normale e sostituire la configurazione pubblica con quella di produzione dopo i collaudi; non basta impostare i flag.

Per il backup seguire `deployment/BACKUP.md`: `init`, `self-test`, `backup`, `verify`, poi verificare un'esecuzione della unit systemd e abilitare il timer giornaliero solo dopo esito positivo. Definire la conservazione degli snapshot prima di accettare documenti reali. Gli script non attivano l'area riservata.

## Attività separate

- Vecchio dominio `cafpuntocittadino.it`: trasferimento/redirect Register.it–Aruba non completati; preservare posta e PEC.
- Caselle nuovo dominio Aruba: attivazione/consegna non verificate. Il sito usa il contatto Gmail dell'ufficio confermato.
- Nessuna automazione futura di acquisto o attivazione creata.
