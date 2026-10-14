# Servizi delle prenotazioni

Aggiornamento 14 ottobre 2026. Il catalogo condiviso è in `netlify/functions/booking-services.js`. La build applica le voci raggruppate a tutte le pagine con il selettore bkServizio; il provider prenotazioni usa lo stesso catalogo per la categoria dell'evento. Nessuna tariffa, durata, credenziale o prenotazione esistente viene modificata.

Le aree sono CAF e fiscale, Patronato/INPS, Patronato/INAIL, Famiglia e agevolazioni, Lavoro, Orientamento e Associazione. Comprendono IMU/F24, successioni, locazioni, pensioni, contribuzione, disoccupazione, invalidità, congedi, infortuni, malattie professionali, revisione INAIL, bonus, scuola e altri servizi. La voce finale di orientamento è “Altro / Non so quale servizio scegliere / Non trovo il servizio”. Tesseramento conserva la categoria e il comportamento precedenti.

L'elenco è un motivo di appuntamento, non una nuova abilitazione, garanzia di prestazione o workflow PDF. Le pratiche digitali strutturate restano quelle già implementate. Per successioni e consulenze complesse lo slot concordato di 20 minuti va inteso come primo incontro; il seguito si organizza con la sede. Non si pubblica una disponibilità specifica di visita medico-legale, Decreto Flussi o paghe aziendali senza conferma della relativa organizzazione/abilitazione.

Le voci storiche inviate da vecchie pagine mantengono la classificazione precedente. I nuovi valori sono classificati esattamente: per esempio RED resta fiscale pur contenendo INPS, mentre malattia professionale è INAIL.

Fonti consultate per la proposta: [CAAF CGIL Puglia](https://caafcgilpuglia.it/), [CAF ACLI](https://www.cafacli.it/it/), [Patronato ACLI pensioni](https://www.patronato.acli.it/soluzioni-per-te/contributi-e-pensioni/) e [invalidità](https://www.patronato.acli.it/soluzioni-per-te/invalidita/). Le fonti descrivono servizi di settore, non provano la disponibilità o le abilitazioni della nostra sede.

## Appuntamenti in tutta Italia

Tutti i motivi di appuntamento possono essere selezionati nelle tre modalità: In sede (Molfetta), Telefonico e WhatsApp. Il motivo è distinto dalla modalità: non occorre un catalogo separato per utenti fuori Molfetta. L'evento Calendar e l'email di conferma conservano la modalità scelta; per telefono e WhatsApp la sede contatta il numero fornito. Il numero WhatsApp deve essere attivo sul servizio. Si tratta del contatto di un operatore, non del centralino o chatbot AI.

La home presenta assistenza a distanza in tutta Italia. La disponibilità dell'appuntamento remoto non promette che ogni adempimento si possa concludere senza firme, identificazione o presenza: le istruzioni del modulo rendono esplicito che gli eventuali passaggi vengono concordati con la sede. Non si invita a inviare PDF o dati sanitari in WhatsApp. I documenti restano nel canale riservato quando attivo. Nessuna integrazione WhatsApp API, chiamata o email reale è stata attivata con questa modifica.
