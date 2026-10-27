# Punto Cittadino Italia — stato verificato 27 ottobre 2026

## Perimetro
Questo repository riguarda esclusivamente il sito originale Punto Cittadino Italia e il relativo sportello/gestionale. La startup **Punto Cittadino Italia Tech** e il suo SaaS sono progetti separati; non integrare qui la startup.

## Vincoli del progetto approvato
- Mantenere la grafica e le card già approvate, senza reinventare il layout.
- Navigazione per pagine Home, CAF e Fiscale, Patronato/INPS, Lavoro/Sindacato, Area Aziende, News e Bonus, Servizi online, Lavora con noi: niente home a scorrimento interminabile.
- Comunicazione nazionale; evitare dati organizzativi e indirizzo della sede esposti in evidenza.
- Molfetta è la sola sede da mostrare/gestire nel rilascio desiderato; la documentazione e parte del codice preesistente mantengono ancora riferimenti a Bari. Non considerare rimossa Bari finché la migrazione codice/configurazioni/test non è stata eseguita.
- Cookie: pannello centrale con Personalizza, Continua senza accettare, Accetta; link privacy e controlli nel footer.
- Funzionalità previste: prenotazioni/disdette, area assistiti con PDF e stato pratiche, accessi amministratrice/operatori, segretaria AI Cloe in italiano, notizie, candidatura collaboratori, PWA.

## Verificato sul repository
- Branch di riferimento: main.
- Ultimo commit trovato durante la ricognizione: bc1a84042a89bd1f520eaf0530d7ab4c056fd64a del 12 ottobre 2026.
- Workflow preflight relativo all'ultimo commit: success (test automatici, NON collaudo completo).
- Il deploy automatico è disabilitato in netlify.toml tramite `ignore = "exit 0"`; mantenerlo così fino al collaudo.
- Le funzioni server sono attualmente Netlify Functions. **Aruba come hosting scelto non implica che esse possano funzionare su un normale hosting statico:** prima di cambiare hosting va definito e testato un backend compatibile, inclusi OAuth, calendari, email, scheduler e archiviazione.
- La documentazione precedente cita ancora due sedi e Netlify come piattaforma operativa. Queste sono discrepanze da correggere, non decisioni aggiornate.

## Sequenza vincolante prima di qualsiasi rilascio
1. Fotografare la grafica attuale e verificare in browser desktop/mobile le otto pagine, i form e i link.
2. Adeguare **codice server, client, autorizzazioni e test** alla sola sede di Molfetta; rimuovere Bari anche dalle mappature amministrative e dai testi dove non deve figurare, senza ridurre i controlli di sicurezza.
3. Verificare ogni richiesta pubblica e ogni funzione gestionale end-to-end. Le funzioni pratiche/assistiti oggi hanno vincoli di sicurezza e parti volutamente disabilitate: nessuna attivazione con dati reali senza isolamento, autorizzazioni e privacy testati.
4. Definire come ospitare le funzionalità dinamiche su Aruba (oppure esplicitare e autorizzare l'eventuale backend esterno), con backup e ripristino.
5. Testare build, OAuth Google, disponibilità appuntamenti, concorrenza, disdetta 48h, email, PWA, cookie, trattamento documenti e CV.
6. Pubblicare solo dopo verifiche funzionali e di sicurezza riuscite. Nessun deploy automatico soltanto perché un commit è stato eseguito.

## Stato
**Rilascio non autorizzato tecnicamente:** le verifiche automatiche sono positive ma non coprono hosting Aruba, configurazioni private o collaudo reale. Questo file è un riallineamento del progetto; non certifica nuove funzionalità, test in produzione o messa online.
