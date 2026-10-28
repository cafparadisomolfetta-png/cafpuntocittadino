# Gestionale Punto Cittadino Italia — configurazione sede Molfetta

## Stato verificato
Il gestionale è una PWA responsive con autenticazione Google Identity Services e consultazione agenda in sola lettura. Il progetto sito originale **non** coincide con la startup Punto Cittadino Italia Tech.

La sola sede autorizzata in questa versione è **Molfetta**. Il backend rifiuta configurazioni che includono altre sedi. Ogni operatore autenticato consulta gli appuntamenti della sede Molfetta secondo i propri permessi; l'amministratrice usa un solo account admin. Le funzionalità di gestione completa fascicoli, documenti e operatori non risultano ancora attive.

## Variabili riservate richieste
Non inserire credenziali, email personali, token o dati di assistiti in GitHub.
- `GESTIONALE_ADMIN_EMAIL`: indirizzo privato dell'amministratrice, che riceve ruolo `admin` con `sites: ["molfetta"]`.
- `GESTIONALE_GOOGLE_CLIENT_ID`: Google OAuth client ID con origine JavaScript autorizzata sul dominio effettivo.
- `GESTIONALE_OPERATORS_JSON`: array di operatori consentiti; inizialmente `[]`. Esempio illustrativo: `[{"email":"operatore@example.org","role":"operator","sites":["molfetta"],"enabled":true}]`.
- `GESTIONALE_SITE_CALENDARS_JSON`: esclusivamente `{"molfetta":"ID_CALENDARIO_PRIVATO"}`, senza altre chiavi.
- `GOOGLE_CALENDAR_ID`: deve indicare lo **stesso** calendario di Molfetta.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`: credenziali Google tenute nel secret manager dell'ambiente di esecuzione.

## Controlli obbligatori
1. Autenticazione valida, email verificata, audience e issuer Google corretti; utenti sospesi o non presenti devono essere rifiutati.
2. Accesso Molfetta solo per utenti abilitati; rifiutare altri valori `site` e mappe calendario legacy.
3. Test reali su Google Calendar: prenotazione, conflitti, disdetta entro regole consentite, paginazione, scadenze token e fuso orario Europe/Rome.
4. Test delle email, dello storico delle disdette e della conservazione dei dati.
5. Privacy GDPR, controllo degli accessi, backup, ripristino e test desktop/mobile.
6. Area fascicoli e caricamento documenti: **attualmente disabilitati** finché non sono disponibili storage privato, scansione file, audit e policy di conservazione.

## Hosting
Il codice server esistente usa **Netlify Functions** e Netlify Blobs; Aruba è la destinazione di hosting indicata per il sito, ma un piano Aruba statico/PHP non esegue automaticamente queste funzioni. Prima della migrazione occorre individuare il piano Aruba realmente attivo, configurare un runtime backend compatibile oppure predisporre un backend esterno esplicitamente autorizzato e collaudato. Non esporre dati reali in ambiente di test.

## Regola di pubblicazione
Il ramo principale mantiene il blocco di deploy `ignore = "exit 0"`. Il superamento della CI GitHub è necessario ma **non sufficiente**: le prove end-to-end e la verifica dell'hosting sono ancora indispensabili. Non eliminare il blocco prima del collaudo operativo.
