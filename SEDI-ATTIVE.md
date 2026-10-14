# Avvio con la sola sede di Molfetta

Scelta della direzione del 14 ottobre 2026: il progetto parte con Molfetta. Bari non è una condizione da risolvere per il lancio e non è proposta nei form di richiesta o candidatura.

`CAF_ENABLED_SITES_JSON` ha default `["molfetta"]`. Il runtime comunica soltanto le sedi attive al frontend; assegna all'amministratrice soltanto queste sedi; interseca i permessi preesistenti dei collaboratori e respinge gli accessi senza sedi attive. Le API respingono nuove pratiche e candidature per le sedi inattive, e non espongono le loro pratiche o i relativi documenti. Il polling dei promemoria legge esclusivamente i calendari delle sedi attive.

La configurazione Google richiede ora soltanto il calendario Molfetta. I dati e i permessi eventualmente già memorizzati per Bari non vengono cancellati da questa modifica. Il codice di supporto a più sedi rimane disponibile.

Per aggiungere Bari in seguito: configurare `["molfetta","bari"]`, calendario distinto, dati della sede, operatori e orari approvati; poi verificare separazione degli accessi, documenti, agenda e promemoria prima di attivare. Questa impostazione non abilita automaticamente le prenotazioni pubbliche Bari, che restano bloccate finché non sono implementate e collaudate. Una sede diversa da quelle già supportate richiede l'estensione del registro e delle validazioni, quindi il relativo collaudo.

La scelta non attiva server, AI, Netlify o servizi a pagamento. Restano i collaudi operativi di Molfetta e l'attivazione dell'ambiente concordato.

Collaudo locale della modifica: `node tools/collaudo-locale.cjs`, 119 test di comportamento e 3 test della build, tutti superati. Incluse prove dedicate a calendario unico, permessi, pratiche di sedi inattive conservate ma non esposte, candidature respinte e polling dei promemoria della sola Molfetta. Il collaudo con i provider reali resta da effettuare.
