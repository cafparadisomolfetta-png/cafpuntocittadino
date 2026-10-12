# CAF Punto Cittadino — ripristino Netlify controllato
Aggiornato: 12 ottobre 2026

## Non ripristinare subito il live
Il ramo `main` contiene correzioni e controlli, ma i test reali con Google non sono stati completati. Gli accessi e i calendari devono essere configurati in modo sicuro. Il progetto Netlify può essere riabilitato solo quando questo documento è stato verificato.

## 1 — Controlli GitHub, prima del deploy
Accedere a GitHub > Actions > "Verifica pre-rilascio (senza pubblicazione)". Verificare che l'ultima esecuzione su main sia verde. La compilazione usa `node deploy-build.cjs`; se fallisce, non procedere. Questo workflow non pubblica il sito.

## 2 — Configurazione privata
In Netlify > Environment variables controllare i valori senza copiarli nel repository o in chat:
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_CALENDAR_ID.
- GESTIONALE_GOOGLE_CLIENT_ID, GESTIONALE_ADMIN_EMAIL, GESTIONALE_OPERATORS_JSON, GESTIONALE_SITE_CALENDARS_JSON.
- Molfetta e Bari devono avere ID calendario distinti. Per Molfetta, il calendario nel mapping deve coincidere con quello delle prenotazioni.
- Bari: prenotazioni online non abilitate; il gestionale richiede un calendario Bari separato.
- Verificare i permessi Google OAuth di Calendar e Gmail.

## 3 — Test ambiente staging
Verificare responsive e aspetto delle pagine rispetto ai mockup approvati, collegamenti e formulari, cookie e consensi, CV e privacy. Provare con appuntamenti fittizi e account di prova: disponibilità, conflitti, prenotazione, email, disdetta, storico Netlify Blobs, agenda, autorizzazione per sede e fusi orari. Confermare politiche di retention e gestione richieste privacy.

ATTENZIONE: la verifica sovrapposizioni con Google Calendar non è una transazione atomica e due richieste contemporanee possono ancora creare appuntamenti sovrapposti. Validare la strategia di concorrenza prima di aprire le prenotazioni ad assistiti reali.

## 4 — Solo a controlli verdi, messa online
Prima assicurarsi che il progetto Netlify abbia crediti e permessi adeguati. Il file netlify.toml mantiene ancora `ignore = "exit 0"`. La compilazione NON richiede più questo blocco: sarà possibile rimuovere soltanto la riga ignore al momento autorizzato della pubblicazione. Quindi avviare il deploy, aprire il sito reale e ripetere test di fumo; in caso di errore ripristinare il blocco o fare rollback.

## Stato al 12 ottobre 2026
- Corretto un falso blocco del preflight: ora la build può funzionare sia prima sia dopo la riattivazione.
- Aggiunti controlli fall-closed per calendari non completi e messaggi d'errore generici lato pubblico.
- La sintassi JavaScript delle parti modificate è stata verificata; non è stato possibile eseguire il workflow integrale o collaudare Netlify/Google.
- Non dichiarare pronto al live finché i test GitHub, la corrispondenza grafica e i test funzionali non risultano superati.
