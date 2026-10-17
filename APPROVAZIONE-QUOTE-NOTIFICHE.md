# Approvazione richieste, importi e notifiche

17 ottobre 2026. Implementato nel ramo di sviluppo; non pubblicato. Nessun pagamento, invio email reale o spesa.

## Percorso dell'assistito

1. Accesso Google personale e richiesta del servizio. La nuova richiesta documentale nasce ricevuta e in attesa di approvazione; non accetta PDF.
2. Operatore autorizzato della sede: primo esame, approvazione e comunicazione privata dell'importo complessivo e delle condizioni. L'importo può essere zero; non viene inventato un tariffario comune né reso pubblico.
3. Assistito proprietario: legge e conferma l'offerta esatta tramite versione. Solo allora può inviare i PDF e l'operatore può avviare la lavorazione o richiedere integrazioni.
4. Il pagamento resta un passaggio esterno da concordare: la conferma non esegue un addebito, non prova l'avvenuto versamento e non sostituisce identificazione, deleghe o firme necessarie alla prestazione.

Una proposta aggiornata prima della conferma invalida le vecchie versioni. Dopo la conferma non è modificabile con questo flusso. Una richiesta può essere non accolta dall'operatore anche prima dell'abilitazione. Assistiti diversi, viewer e operatori di altre sedi non possono approvare o accettare al posto dell'interessato. Richiamate senza documenti restano distinte.

## Avvisi

- Nuova richiesta e nuovo PDF: messaggio generico all'email dell'amministratrice configurata con `GESTIONALE_ADMIN_EMAIL`.
- Approvazione/offerta e avanzamento: messaggio generico all'email verificata dell'assistito. Nessun dettaglio della pratica, documento, dato sanitario o importo nel testo email.
- Inserimento pratica/documento e accodamento dell'avviso avvengono nella stessa transazione; errore della coda comporta rollback. Deduplica per pratica/versione/tipo.
- Prima dell'invio sono verificati esistenza della pratica, sede attiva e destinatario ancora corretto. Aggiornamenti superati o pratiche eliminate non producono vecchi avvisi. Esiti di consegna incerti non vengono ritentati automaticamente.
- Nel gestionale aperto l'elenco si aggiorna ogni minuto e mostra richieste da approvare o importi da confermare; non sono notifiche push di sistema.

Invio reale subordinato a scheduler, `CAF_MAIL_ENABLED`, mittente e OAuth Gmail funzionanti, destinatari corretti e conservazione della coda approvata. Senza conservazione mail non vengono accodati recapiti; senza invio/scheduler abilitati le email non partono. Questa sessione non ha attivato tali flag né inviato messaggi.

## Verifiche

**150 test di comportamento + 4 della build = 154 superati.** Nuove prove su filtro pre-scansione, impossibilità di forzare l'approvazione dal client, ruoli/sedi, tutti i 30 servizi, importo zero o a pagamento, versioni e conferme obsolete, blocco della lavorazione, privacy degli avvisi, deduplica, rollback e percorsi HTTP reali su loopback. Dati e provider esclusivamente sintetici.

Le precedenti fixture dei test del workflow storico selezionano esplicitamente la compatibilità senza filtro per continuare a verificare quel comportamento. Il costruttore ordinario abilita il filtro per default e il runtime di produzione lo imposta esplicitamente a true. I record preesistenti senza campi di approvazione conservano la compatibilità storica; nessuna migrazione di dati reali è stata eseguita.

Restano da verificare browser desktop/mobile, OAuth e consegna email sul server finale. Il backend pronto non equivale ad avvisi già operativi. Netlify rimane sospeso.
