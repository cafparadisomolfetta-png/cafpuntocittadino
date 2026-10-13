> Aggiornamento sviluppo Work: esiste ora un runtime privato separato da Netlify, con area assistiti e gestione pratiche collaudate localmente. Nessun servizio è stato pubblicato. Stato corrente e limitazioni: [VERIFICA-WORK-2026-10-13.md](VERIFICA-WORK-2026-10-13.md). La checklist storica sottostante non equivale a collaudo reale.

# CAF Punto Cittadino — consegna per collaudo, NON per la messa live
Data preparazione: 12 ottobre 2026

## Stato
Il sito e la PWA gestionale sono salvati in GitHub, branch main. La grafica di riferimento è approvata, ma la realizzazione non è ancora perfettamente identica ai mockup. Il deploy automatico è bloccato in netlify.toml con `ignore = "exit 0"`. Non rimuoverlo prima del via libera al rilascio.

## Controllo tecnico senza pubblicazione
Il workflow GitHub Actions `.github/workflows/preflight.yml` è configurato per eseguire `npm install` e `node deploy-build.cjs` a ogni push e su avvio manuale. Controllare che il workflow termini in verde. Il workflow non distribuisce né pubblica il sito.

## Configurazione privata da eseguire su Netlify (mai inserire password o segreti in GitHub)
- OAuth Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, verificando i permessi Calendar e Gmail.
- Calendari: `GOOGLE_CALENDAR_ID` per la compatibilità Molfetta e `GESTIONALE_SITE_CALENDARS_JSON` con due calendari distinti `molfetta` e `bari`; assicurarsi che quello di Molfetta sia coerente col calendario della prenotazione pubblica.
- Login gestionale: `GESTIONALE_GOOGLE_CLIENT_ID`, `GESTIONALE_ADMIN_EMAIL`, `GESTIONALE_OPERATORS_JSON`. L'amministratrice deve avere accesso a entrambe le sedi, ciascun operatore solo alle sedi autorizzate.
- Non impostare nella documentazione email personali, password, token, refresh token o dati di appuntamenti reali.

## Bloccanti che richiedono collaudo
1. Verificare build completa e integrità di tutte le pagine sul sito di test, compresa l'esatta resa della grafica.
2. Provare il login con admin e operatore; confermare divieto di lettura di Bari per operatore assegnato solo a Molfetta.
3. Provare orari, date, sovrapposizioni, prenotazioni contemporanee e disdette almeno 48 ore prima.
4. Provare consegna email di conferma e cancellazione, funzionamento Google Calendar, Gmail e aggiornamento dell'agenda.
5. Provare storico disdette e politiche di conservazione/cancellazione Netlify Blobs.
6. Verificare modulo CV, gestione dei consensi cookie, privacy GDPR e responsabili del trattamento.
7. Verificare accesso e installazione delle PWA su smartphone e computer con HTTPS.
8. Le prenotazioni online per Bari rimangono intenzionalmente disabilitate fino alla definizione di orari, indirizzo e contenuti di conferma distinti.
9. La gestione modifiche degli appuntamenti e degli operatori in interfaccia non è ancora implementata; l'agenda resta prevalentemente in lettura.

## Rilascio
Solo dopo esito positivo dei controlli, autorizzazione dell'amministratrice e disponibilità dei crediti Netlify: riattivare il deploy togliendo l'ignore, pubblicare e ripetere i test di fumo in produzione. Se un punto fallisce, mantenere il sito sospeso.
