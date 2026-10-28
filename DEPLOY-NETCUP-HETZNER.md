# Netcup + Hetzner — percorso concordato
Questo è il solo percorso infrastrutturale autorizzato per il sito originale Punto Cittadino Italia.
Server Netcup già attivo; backup Hetzner già attivo; dominio/email Aruba già attivi.
Non creare servizi Railway/Render, non cambiare DNS prima dell'approvazione del collaudo.

## Staging Netcup senza alterare la produzione
1. Sul server Netcup verificare accesso SSH, Docker/Compose, spazio disco, firewall, rete e certificati.
2. Effettuare backup e verificare il ripristino prima di migrare dati o DNS.
3. Prelevare il ramo `release/molfetta-only-20261027` dal repository GitHub autorizzato.
4. Eseguire `node deploy-build.cjs` su un runner di build; oppure scaricare l'artifact statico della pipeline GitHub.
5. Avviare esclusivamente la versione staging su porta locale 8080 tramite `Dockerfile.staging`, dietro reverse proxy con TLS e autenticazione per il collaudo.
6. Predisporre PostgreSQL privato su Netcup: backup consistenti cifrati su Hetzner, verifica restore e retention.
7. Inserire credenziali Google OAuth e altre chiavi solo come variabili segrete sul server, mai nel repository.
8. Testare disponibilità, transazioni, prenotazioni/disdette, gestione permessi, privacy, PDF e Cloe prima di abilitare le funzioni.
9. Controllare il collegamento futuro del dominio Aruba solo dopo esito positivo e piano di rollback.

## Stato di sicurezza
Il server standalone risponde con 503 per prenotazioni, disdette e gestionale non migrati.
Non utilizzare staging per appuntamenti/documenti reali. Il funzionamento CI non prova la disponibilità
del server Netcup. Non inventare credenziali, endpoint, IP o backup completati.

## Budget concordato
Server e backup già attivi; non introdurre abbonamenti senza autorizzazione.
