# Aggiornamenti del sito — frequenza e stato

Decisione del 14 ottobre 2026: l'obiettivo resta un aggiornamento autonomo quotidiano. In alternativa, se emerge un costo aggiuntivo rilevante, valutare una cadenza settimanale il venerdì sera, fuso Europe/Rome. Non è un'autorizzazione ad acquistare servizi o consumare API a pagamento.

## Già implementato

Il runtime include il job news: quando lo scheduler è esplicitamente abilitato e il server è in funzione, controlla fonti istituzionali ogni 24 ore, conserva hash/esito/ora del controllo e rende disponibile lo stato delle fonti. Il monitoraggio non usa OpenAI o altri servizi AI a pagamento. Le richieste e il processo utilizzano comunque le risorse del server; non costituiscono una garanzia che l'intero progetto sia gratuito. La frequenza attuale è relativa all'ultimo controllo, non a un'ora fissa italiana.

Nella configurazione attuale lo scheduler è disattivato e non c'è un server finale in funzione: nessun aggiornamento quotidiano reale è stato attivato da questa sessione.

## Da completare prima di dichiarare pubblicazione autonoma

Il catalogo pubblica ancora soltanto testi approvati dall'amministratrice. Un hash diverso della pagina istituzionale non prova l'esistenza di un nuovo bonus o di una nuova norma. Prima della pubblicazione automatica occorre collaudare notizie, date e collegamenti alle fonti.

Occorre realizzare e provare l'acquisizione delle singole notizie ufficiali, la deduplica, i collegamenti alle fonti, le date e i casi di fonte indisponibile. Un primo formato automatico può essere un elenco di titoli/link ufficiali con data e provenienza; spiegazioni fiscali o previdenziali generate richiedono controlli distinti e l'eventuale budget AI. Non è ancora implementato.

La variante venerdì sera deve usare una pianificazione di calendario Europe/Rome, comprese ora legale e riavvii; non basta impostare un intervallo di sette giorni. L'ora precisa non è stata concordata. I promemoria appuntamenti devono mantenere la propria frequenza indipendente dal monitoraggio news.

L'attivazione finale richiede prove delle fonti reali, del server e della resa pubblica. Nessuna modifica Netlify, DNS, abbonamento o pubblicazione eseguita.
