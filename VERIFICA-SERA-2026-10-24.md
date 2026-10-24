# Preparazione al rilascio del 24 ottobre 2026

Il progetto resta non pubblicato. L'utente ha confermato in questa sessione che il server non è ancora acquistato. Nessun acquisto, contratto, modifica DNS, riattivazione Netlify o chiamata AI a pagamento eseguiti.

## Lavoro verificato

- Popup centrale approvato, tre pulsanti, preferenze persistenti e accessibilità: commit remoto `9fda827986ca62fe9aa7cecd914de17f0d8d7ab7`.
- Trasferite nel prodotto reale le 30 schede fotografiche e i dettagli a fascicolo della simulazione approvata. Le 13 immagini e i colori provengono dall'HTML originale fornito dall'utente e dalla simulazione del 24 ottobre; nessuna nuova fotografia o nuova identità grafica.
- Il modulo `service-visuals.js` contiene fotografie incorporate: nessuna richiesta a fornitori di immagini terzi. `service-explorer.js` mantiene questionari, contenuti, prenotazione con servizio preselezionato e aggiunge il ritorno al catalogo. Se il modulo visivo non è disponibile rimane la scheda testuale.
- Corretto lo sforamento mobile delle etichette storiche `dossier__stamp`, senza rimuovere schede o servizi.
- Suite `node tools/collaudo-locale.cjs`: 157 test di comportamento e 4 di build, tutti superati con provider sintetici e blocco delle richieste reali. Il test dell'esploratore esercita tutte le 30 schede fotografiche, i dettagli e i questionari. Verificati anche firma JPEG e colori di tutte le immagini del catalogo.
- Browser locale: 30 pulsanti servizio, foto ISEE caricata, dettaglio a fascicolo, prenotazione con servizio preselezionato, ritorno al catalogo. Verifica a larghezza iframe 320 px: area utile 305 px e documento largo 305 px sia nel catalogo sia nel dettaglio, nessuno sforamento. Non è un test su dispositivo fisico.

## Condizioni bloccanti ancora presenti

Il controllo offline `node server/environment.cjs` restituisce `configured:false`. Mancano in questo ambiente revisione privacy/conservazione, abilitazione privata, directory archivio, chiave vault, scanner reale, login/amministratrice Google, calendari e OAuth. Non vengono inventati valori per far passare il controllo. Gli account precedentemente creati possono esistere altrove: vanno recuperati e riconvalidati.

Server e backup remoto non sono ancora operativi. Restano prove reali di Google Calendar/Gmail, promemoria, isolamento utenti, incasso, PDF/scanner, backup/restore, HTTPS, carico e PWA su dispositivi. Alcune sezioni storiche conservano testi provvisori e promesse da revisionare; blog/Messenger/video e viste aggiuntive della simulazione non risultano ancora integralmente trasferiti. Non dichiarare il progetto completo o pronto per dati reali sulla sola base della suite locale.

Il piano Netcup già raccomandato rimane VPS Lite 2 G12.5s iv 3M: 4 vCore, 8 GB, 160 GB SSD, IPv4/IPv6 e regione europea automatica. Pagina ufficiale riaperta: 9,50 euro/mese IVA tedesca 19%, equivalente circa 9,74 con ipotesi IVA italiana 22%; minimo e fatturazione tre mesi, circa 29,22 euro da confermare nel carrello. Il backup separato è una voce aggiuntiva e va configurato. Nessun ordine eseguito. Per il confronto completo usare VERIFICA-COSTI-RILASCIO-2026-10-24.md, successivo alle decisioni Aruba contenute nei documenti del 17 ottobre.

## CLOE e AI

La segretaria testuale esistente è preservata. Il ritratto approvato di CLOE è stato recuperato e visionato dalla risorsa già creata dall'utente: nessun volto nuovo generato, nessun invio del ritratto a fornitori avatar. Non è ancora integrato nel sito. Voce, ascolto e avatar conversazionale non sono attivi; non presentare la sola immagine come avatar parlante. Le opzioni a pagamento richiedono confronto di API, gestione dati, italiano, limiti e consumo prima dell'attivazione. Netlify resta non riattivato e il blocco alla consultazione della configurazione AI già segnalato non è stato aggirato.

La pubblicazione completa richiede prima il server disponibile, configurazione effettiva e collaudo operativo positivo. Il desiderio di pubblicare stasera non sostituisce queste condizioni.
