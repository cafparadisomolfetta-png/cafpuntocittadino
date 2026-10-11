# Gestionale CAF Punto Cittadino — progetto di sicurezza

## Stato
Interfaccia responsive e accesso **bloccato per impostazione predefinita**. Non è ancora un gestionale operativo. Nessuna credenziale, password, nome assistito o appuntamento viene incorporato nei file pubblici.

## Ruoli e permessi server-side proposti
- **Amministratrice**: gestisce sedi, inviti, ruoli e consultazione appuntamenti secondo l'ambito autorizzato.
- **Responsabile sede**: vede e gestisce appuntamenti e operatori solo della propria sede.
- **Operatore**: consulta e gestisce esclusivamente gli appuntamenti della/e sede/i assegnata/e, con funzioni più ristrette.
- **Lettura**: solo consultazione della propria sede, ove autorizzata.

La sede e il ruolo non devono mai essere accettati da parametri forniti dal browser: vanno derivati da una sessione verificata sul server. Vietare per default ogni operazione non esplicitamente autorizzata. Audit delle operazioni amministrative e modifiche appuntamenti.

## Passi prima dell'attivazione
1. Scegliere e configurare identity provider con MFA, inviti individuali, disabilitazione utenti, sessioni HttpOnly/Secure/SameSite e anti-CSRF.
2. Persistenza sicura delle assegnazioni operatore-sede con controllo tenant/ruolo per ogni endpoint.
3. Integrare Google Calendar **solo lato server** e con minimi dati necessari, verificando la corretta separazione tra sedi.
4. Gestire annullamenti, errori, rate limiting, log senza dati sensibili, privacy e conservazione.
5. Test automatizzati contro accessi incrociati, escalation di ruolo, sessioni scadute e accessi anonimi.
6. Collaudare sito e funzioni live in un unico rilascio approvato, senza rimuovere la sospensione deploy prima dei test.

La pagina `/gestionale/` non concede accesso: la funzione `gestionale-session` restituisce sempre HTTP 503 fino alla realizzazione del sistema di login sicuro.
