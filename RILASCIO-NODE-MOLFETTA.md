# Checklist rilascio del server indipendente (Molfetta)

## Stato e regole
Il container Docker è per staging. Nessuna prenotazione o disdetta reale è attivata.
Non pubblicare senza completare i controlli sottostanti. Non copiare token nel repository.

## Servizi da predisporre
1. Hosting applicativo con supporto per il container Node.js 22, TLS, HTTPS e backup.
2. Database PostgreSQL 15+ gestito con backup e accesso privato; applicare
   `server/migrations/001_booking_claims.sql` soltanto dopo aver creato il database.
3. OAuth Google Calendar nel progetto Google Cloud corretto, accesso esclusivo al
   calendario di Molfetta e credenziali conservate come secret del provider.

## Variabili server (valori di esempio, non credenziali)
- `HOST=0.0.0.0`, `PORT=8080`
- `GOOGLE_CALENDAR_ID=<id_esatto_del_calendario_molfetta>`
- `GOOGLE_CLIENT_ID=<secret>`
- `GOOGLE_CLIENT_SECRET=<secret>`
- `GOOGLE_REFRESH_TOKEN=<secret>`
- `DATABASE_URL=<postgres_connection_string_secret>`
- `PGSSL=require` solo con certificati verificabili
- `OPENAI_API_KEY=<secret>` e modello esplicitamente verificato per Cloe

## Criteri di rilascio non ancora soddisfatti
- Verificare OAuth direttamente nell'ambiente hosting senza registrare i token nei log.
- Booking: idempotenza, controllo conflict DB e Google, recupero errori parziali,
  conferma email e protezione anti-spam.
- Disdetta: codice, finestra 48 ore, cancellazione Google e audit transazionale
  con riconciliazione in caso di errore parziale.
- Gestionale: identità operatori, autorizzazioni, tracciabilità, dati GDPR, PDF.
- Test end-to-end, backup/restore e rollback, privacy e cookie policy, accessibilità.
- Verificare prima il dominio su staging; solo dopo modificare DNS Aruba.

## Evidenze già disponibili
La pipeline .github/workflows/preflight.yml crea gli artifact statico e Node,
avvia il runtime, esegue i test e verifica il container isolato.
Il test OAuth usa risposte Google simulate. L'accesso Google Calendar tramite
ChatGPT è distinto dalle credenziali OAuth del server.
Il workflow public-smoke verifica un sito pubblico preesistente e può fallire
finché il nuovo sito non viene effettivamente pubblicato.
