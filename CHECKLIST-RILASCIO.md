> Aggiornamento sviluppo Work: esiste ora un runtime privato separato da Netlify, con area assistiti e gestione pratiche collaudate localmente. Nessun servizio è stato pubblicato. Stato corrente e limitazioni: [VERIFICA-WORK-2026-10-12.md](VERIFICA-WORK-2026-10-12.md). La checklist storica sottostante non equivale a collaudo reale.

# Rilascio controllato — CAF Punto Cittadino
Stato: NON PRONTO AL LIVE. Non riattivare deploy Netlify senza superare i test.

## Organizzazione confermata
- Sedi iniziali: Molfetta e Bari.
- Un unico account amministratrice/responsabile per entrambe, ruolo `admin` con `sites: ["molfetta", "bari"]`.
- Altri operatori limitati alle sedi espressamente assegnate.
- Email dell'amministratrice da configurare in Netlify, mai nel repository.

## Prima del rilascio
- [ ] Configurare in Netlify GESTIONALE_GOOGLE_CLIENT_ID, GESTIONALE_OPERATORS_JSON e GESTIONALE_SITE_CALENDARS_JSON senza inserire segreti in GitHub.
- [ ] Verificare che ogni sede disponga di calendario separato. Il codice instrada esplicitamente la prenotazione pubblica di Molfetta; Bari resta non prenotabile online fino a configurazione e collaudo. Controllare coerenza fra GOOGLE_CALENDAR_ID e GESTIONALE_SITE_CALENDARS_JSON.
- [ ] Testare accesso admin e operatore, utenti revocati, token non valido, sede non assegnata, fuso orario italiano.
- [ ] Testare prenotazione, doppia prenotazione concorrente, eventi sovrapposti, disdetta 48 ore prima e conferma email.
- [ ] Testare Netlify Blobs (storico disdette): completamento scrittura, lettura per sede, persistenza, limite di conservazione e cancellazione GDPR.
- [ ] Testare che la chiusura dell'app e il ritorno in primo piano aggiornino l'agenda.
- [ ] Rivedere informativa privacy, cookie, trattamento CV, responsabilità delle sedi, informative agli assistiti e protezione dati.
- [ ] Verificare tutte le schede pubbliche e i moduli con browser mobile e desktop.
- [ ] Eseguire npm install e node deploy-build.cjs in un ambiente di test ed esaminare dist/.
- [ ] Verificare con prova reale servizio Google OAuth, Google Calendar, Gmail e funzioni schedulate.
- [ ] Definire gestione dei calendari e autorizzazioni di eventuali nuove sedi prima di aggiungere operatori.
- [ ] Solo dopo esito positivo riattivare Netlify rimuovendo la regola ignore e pubblicare.


## Verifiche della revisione grafica e dei collegamenti
- [x] Layout condiviso delle sezioni CAF, Patronato, Lavoro, Aziende, News, Servizi online, Lavora con noi predisposto nel codice.
- [x] Cataloghi dei servizi e schede responsive aggiunti alle pagine pertinenti.
- [x] Collegamenti delle nuove schede verso Servizi online senza rinviare a un'ancora non verificata.
- [x] Link interni ai moduli: se il modulo non viene individuato, il relativo pulsante viene disabilitato anziché simulare una funzione operativa.
- [x] Controllo statico aggiunto al preflight per accertare la presenza dei moduli di navigazione e del blocco deploy.
- [ ] Eseguire il preflight completo con Node in ambiente di build; il controllo sintattico eseguito tramite connettore GitHub NON lo sostituisce.
- [ ] Aprire ogni pagina reale in browser per verificare che le nuove schede siano effettivamente renderizzate e che il markup storico non interferisca.
- [ ] Verificare destinazioni e presenza reali del modulo di prenotazione, del modulo disdetta e del modulo CV.
- [ ] Sostituire i segni grafici provvisori con risorse coerenti con i mockup e autorizzate per il sito.
- [ ] Completare e collaudare tutti i ruoli e gli accessi del gestionale; la demo grafica non equivale a funzionalità attiva.

## Test aggiunti il 12 ottobre 2026
- [x] Test automatici per durata slot, chiusura giovedì/fine settimana e venerdì ridotto, date invalide e instradamento calendari.
- [x] Esecuzione di tali test inclusa nel preflight del build.
- [ ] Esecuzione effettiva della suite completa in ambiente Node/Netlify (non disponibile attraverso il solo collegamento GitHub).
- [ ] Inserire in Netlify le variabili di ambiente necessarie e verificare gli accessi con account reali.
- [ ] Calendario e orari Bari: sede deliberatamente non prenotabile online finché non configurata e collaudata.
- [ ] Test sul servizio Google: invio email, doppie richieste concorrenti, disdette, sincronizzazione calendario e storici.

## Correzioni di sicurezza pre-rilascio del 12 ottobre 2026
- [x] La prenotazione pubblica rifiuta la richiesta se la lettura Google Calendar è paginata e non interamente ispezionata: nessuna falsa disponibilità.
- [x] L'agenda gestionale segnala il limite di paginazione invece di presentare un elenco potenzialmente incompleto.
- [ ] Eseguire i test automatizzati di questi controlli in Node e simulare risposte paginante di Google.
- [ ] Verificare l'effettiva fedeltà grafica rispetto ai mockup approvati, non soltanto la presenza degli stili.

## Limitazioni conosciute
- L'agenda gestionale è in lettura; la modifica diretta di appuntamenti e l'amministrazione operatori da interfaccia non sono attive.
- Non è garantita prevenzione atomica di due prenotazioni contemporanee: la verifica disponibilità e la creazione dell'evento Google sono due operazioni distinte.
- Storico disdette da collaudare su Netlify Blobs; se la scrittura fallisce, l'appuntamento viene comunque cancellato e lo storico può risultare incompleto.
- Non esistono notifiche push istantanee; l'agenda aggiorna circa ogni minuto mentre è aperta.
- Non è stato eseguito il collaudo di produzione né una verifica di conformità privacy professionale.
