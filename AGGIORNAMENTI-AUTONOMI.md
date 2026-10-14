# Aggiornamenti autonomi del sito

14 ottobre 2026. La frequenza concordata è quotidiana; il venerdì sera rimane un'alternativa da valutare se emergono costi aggiuntivi. Nessun servizio a pagamento è stato attivato.

## Implementato

Il job news del server raccoglie ora anche i feed RSS pubblici INPS e INAIL. La pagina News e Bonus contiene una sezione separata “Notizie dalle fonti ufficiali”, con titolo, data, attribuzione e collegamento alla notizia originale. Non vengono generate spiegazioni AI, importi, requisiti, scadenze o diritti a prestazioni. Non viene ripubblicato il corpo degli articoli.

I feed sono quelli indicati dai portali istituzionali: https://www.inps.it/it/it/rss.html e https://www.inail.it/portale/it/rss.html. Il modulo dedicato è server/headlines.cjs; la visualizzazione è official-headlines.js. Feed e link sono vincolati ai domini ufficiali HTTPS, senza credenziali o porte alternative; i redirect sono rifiutati. Dimensione, profondità, numero di nodi e quantità di notizie sono limitati. DTD ed entità esterne sono rifiutati.

Si pubblicano fino a 20 titoli per fonte, riferiti agli ultimi 30 giorni, ordinati per data e deduplicati per URL. Se una fonte fallisce il controllo, i suoi titoli non sono esposti come aggiornati; in pagina viene segnalata l'indisponibilità. Il browser nasconde inoltre raccolte non controllate da almeno 48 ore. L'assenza di notizie non significa assenza di novità normative.

Il precedente monitoraggio di Regione Puglia, ARPAL, Ministero Interno, Entrate e altre fonti resta separato e segnala variazioni da verificare; non estrae automaticamente articoli. Il catalogo delle spiegazioni editoriali resta soggetto all'approvazione amministrativa e non è sostituito dai titoli RSS.

## Costi e attivazione

Questa raccolta non usa chiavi API o chiamate AI a pagamento. Consuma le normali risorse del server e della connessione; non rende gratuito il server. La frequenza resta ogni 24 ore dall'ultimo job, non a un'ora italiana fissa. I promemoria appuntamenti mantengono frequenze indipendenti.

Lo scheduler CAF_JOBS_ENABLED rimane false nell'esempio: manca il server finale configurato e collaudato. Non è stata attivata una pubblicazione sul dominio. Prima del rilascio: provare recupero dopo indisponibilità, correttezza di date/link, resa mobile e cronologia del job nel server effettivo. Una futura pianificazione del venerdì dovrà usare Europe/Rome e gestire ora legale e riavvii; l'ora non è ancora concordata.
