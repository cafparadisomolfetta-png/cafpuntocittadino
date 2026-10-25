# Rilascio — Punto Cittadino Italia

Aggiornamento: 25 ottobre 2026. **Sito pubblico online su Netcup; funzioni riservate ancora chiuse.**

## Stato effettivo

- Sito: https://puntocittadinoitalia.it/ . HTTP e HTTPS www reindirizzano al dominio HTTPS principale.
- Server Netcup, Node 24.22.1, repository `/opt/cafpuntocittadino`. Dominio/DNS e posta presso Aruba; il VPS non è Aruba.
- Nome e grafica approvati conservati. Pagine, servizi e collegamenti email/WhatsApp disponibili.
- L'utente ha chiesto di pubblicare oggi e completare il backup domani, quando avrà il documento per la verifica del fornitore.
- Lancio con `deployment/build-public-launch.cjs` e `deployment/nginx-public-launch.conf`: Nginx serve solo `dist/`, senza avviare il backend privato.
- Agenda automatica, area assistiti/gestionale, PDF, candidature e AI non sono operativi. Avvisi e pagine di attesa indirizzano al contatto con un operatore.
- `/api/` e `/.netlify/functions/`: 503. Richieste diverse da GET/HEAD bloccate. Questa pubblicazione non accetta caricamenti o prenotazioni.
- Runtime privato disabilitato; nessuna attestazione di revisione privacy definitiva inserita per aggirare il preflight.
- Nessun nuovo acquisto, riattivazione Netlify o chiamata AI a pagamento.

## Controlli eseguiti

- [x] VPS: 167 test di comportamento e 4 della build superati, nessun errore o test saltato.
- [x] Build pubblica riuscita; `nginx -t` superato prima del reload.
- [x] HTTPS root: 200, verifica TLS riuscita. HTTP e HTTPS www: 308 al dominio principale.
- [x] Home verificata nel browser esterno; banner cookie e scelta senza cookie facoltativi verificati.
- [x] Servizi online, privacy, cookie policy, pagine di attesa assistiti/candidature e logo: 200.
- [x] Endpoint privati/provider: 503. POST home: 405. Sorgenti server e `.git/config`: 404.
- [x] Certificato Let's Encrypt root + www; rinnovo webroot e deploy hook già collaudati con staging/dry-run prima del lancio. Eccezione ACME conservata su HTTP.
- [x] Google: client dedicato importato privatamente, consenso Calendar/Gmail completato; refresh, scope e account del calendario verificati con richieste reali. Non equivale a collaudo di prenotazioni/consegna email.
- [ ] Il nuovo collaudo HTTP sintetico con antivirus reale ha restituito `VPS_SYNTHETIC_CHECK_FAILED`. Diagnosi/correzione da completare; percorso privato non dichiarato collaudato.

## Prima di aprire le funzioni riservate

- [ ] Completare verifica account e attivazione del backup autorizzato Hetzner BX11 entro €3,90/mese, controllando prezzo e contratto effettivi. Backup esterno non attivo.
- [ ] Backup cifrato fuori dal VPS, chiave custodita separatamente e ripristino isolato con verifica di dati/documenti sintetici e audit.
- [ ] Correggere e superare `deployment/check-vps-workflow.cjs`: antivirus reale, scanner guasto, isolamento e restore locale.
- [ ] Concludere revisione informative, presupposti/mandati, accordi dei fornitori e conservazione. Testi aggiornati non attestano da soli la conformità dell'organizzazione.
- [ ] Accesso Google reale, due account assistiti, ruoli e revoca. Le identità simulate non sostituiscono questa prova.
- [ ] Verificare audience/pubblicazione OAuth e durata delle autorizzazioni prima dell'uso stabile.
- [ ] Prenotazione/disdetta reali di prova, conflitti, fuso italiano e consegna email, senza coinvolgere assistiti reali.
- [ ] Percorso pratiche sul dominio finale: verifica operatore, accettazione quota, incasso se dovuto, PDF, integrazione e chiusura.
- [ ] Abilitare separatamente le funzioni opzionali collaudate con conservazione configurata: CV, notifiche, news automatiche e richiamate.
- [ ] PWA su dispositivi reali e controlli mobile/tastiera.

Seguire `deployment/README.md`. Prima del passaggio al backend occorre rigenerare la build completa normale e sostituire la configurazione pubblica con quella di produzione dopo i collaudi; non basta impostare i flag.

## Attività separate

- Vecchio dominio `cafpuntocittadino.it`: trasferimento/redirect Register.it–Aruba non completati; preservare posta e PEC.
- Caselle nuovo dominio Aruba: attivazione/consegna non verificate. Il sito usa il contatto Gmail dell'ufficio confermato.
- Nessuna automazione futura di acquisto o attivazione creata.
