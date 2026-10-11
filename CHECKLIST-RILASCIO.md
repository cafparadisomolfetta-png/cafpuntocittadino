# Rilascio controllato — CAF Punto Cittadino
Stato: NON PRONTO AL LIVE. Non riattivare deploy Netlify senza superare i test.

## Organizzazione confermata
- Sedi iniziali: Molfetta e Bari.
- Un unico account amministratrice/responsabile per entrambe, ruolo `admin` con `sites: ["molfetta", "bari"]`.
- Altri operatori limitati alle sedi espressamente assegnate.
- Email dell'amministratrice da configurare in Netlify, mai nel repository.

## Prima del rilascio
- [ ] Configurare in Netlify GESTIONALE_GOOGLE_CLIENT_ID, GESTIONALE_OPERATORS_JSON e GESTIONALE_SITE_CALENDARS_JSON senza inserire segreti in GitHub.
- [ ] Verificare che ogni sede disponga di calendario separato: per il momento il modulo pubblico prenota sul calendario GOOGLE_CALENDAR_ID. Se esiste più di una sede pubblica, servirà associare esplicitamente sede e calendario anche a prenotazione, disponibilità e disdetta.
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

## Limitazioni conosciute
- L'agenda gestionale è in lettura; la modifica diretta di appuntamenti e l'amministrazione operatori da interfaccia non sono attive.
- Non è garantita prevenzione atomica di due prenotazioni contemporanee: la verifica disponibilità e la creazione dell'evento Google sono due operazioni distinte.
- Storico disdette da collaudare su Netlify Blobs; se la scrittura fallisce, l'appuntamento viene comunque cancellato e lo storico può risultare incompleto.
- Non esistono notifiche push istantanee; l'agenda aggiorna circa ogni minuto mentre è aperta.
- Non è stato eseguito il collaudo di produzione né una verifica di conformità privacy professionale.
