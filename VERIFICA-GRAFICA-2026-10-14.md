# Grafica concordata CAF Punto Cittadino

La versione del ramo di verifica applica al codice la grafica approvata nella chat: blu e turchese, fotografie originali, schede colorate e arrotondate, pulsanti arrotondati e identità coordinata per sito, area assistiti, candidature e gestionale. Non modifica i moduli di autenticazione o le API.

## Modifiche

- Introduzioni fotografiche statiche per le otto pagine pubbliche, disponibili già nell'HTML prodotto dalla build. I pannelli introduttivi della precedente impaginazione sono sostituiti visivamente; i moduli e i contenuti esistenti restano collegati.
- Logo e fotografie derivati dai due riferimenti grafici originali recuperati dalla chat. Gli SVG contengono immagini incorporate e non richiedono chiamate esterne per questi elementi.
- Tema comune per intestazioni, schede, form, bottoni e navigazione, con impaginazione mobile.
- Navigazione laterale nelle aree assistiti, agenda collaboratori, pratiche e candidature. Le voci relative a sezioni riservate seguono gli attributi `hidden` impostati dall'applicazione esistente, incluse autenticazione, permessi e logout. L'autorizzazione effettiva rimane controllata dalle API.
- Correzione dei cataloghi grafici: ora vengono collegati anche alle pagine storiche che non avevano un elemento `main`.
- Nessuna aggiunta di dati fittizi nelle pagine reali. Le 31 schermate mostrate in chat erano una dimostrazione: le funzioni disponibili nelle pagine reali restano quelle implementate e autorizzate dal backend.
- La denominazione visibile è CAF Punto Cittadino. Il titolare e i recapiti nell'informativa privacy richiedono verifica, senza inventare una diversa identità legale.

## Controlli

`node tools/collaudo-locale.cjs`: 115 test di comportamento e 3 test dell'artefatto pubblico, tutti superati. Il controllo aggiunto sulla navigazione verifica autenticazione, ruolo amministratrice e logout. La build verifica introduzioni, logo, fotografie, tema e navigazione su tutte le pagine previste.

Controllati inoltre sintassi JavaScript, validità XML degli SVG e assenza di errori di whitespace nelle modifiche. La build copia esclusivamente i file frontend previsti, senza includere questo documento, moduli server o credenziali.

## Limiti prima della pubblicazione

Non è stata eseguita una verifica visiva completa delle pagine reali in browser. Restano da eseguire su un ambiente di collaudo: accesso Google, flussi Calendar/email, antivirus reale, installazione PWA su dispositivi, HTTPS, carico, backup e ripristino. Nessuna pubblicazione e nessuna spesa sono state effettuate. Il blocco Netlify rimane attivo.
