# Verifica dei promemoria rispetto al calendario

14 ottobre 2026. Correzione del modulo email `server/jobs.cjs`, verificata soltanto con dati e provider sintetici.

La coda conserva ora anche ID evento e istante dell'appuntamento. Prima di inviare un promemoria o un avviso di spostamento, il worker rilegge l'evento della sede e verifica ID, stato non annullato, data/ora, destinatario e riferimento a una prenotazione gestita. Gli avvisi superati diventano `obsolete`, senza tentativi di invio, con audit cifrato. Appuntamenti già trascorsi e vecchie righe prive dei riferimenti necessari non vengono inviate.

Se il calendario non è disponibile, la riga resta pending: la verifica può essere ripetuta, ma il provider email non viene contattato e il numero di tentativi di consegna non aumenta. Un evento eliminato che produce un errore Calendar resta sospeso fino a eventuale verifica o retention; un evento restituito come cancelled rende la riga obsolete. Non si interpreta una risposta 404 come prova certa di cancellazione, perché può indicare anche un problema di accesso.

Gli avvisi di cancellazione confermata dal gestionale non richiedono un evento ancora leggibile: sono inviati sulla base dell'operazione conclusa e del destinatario salvato. Gli esiti email incerti continuano a non essere reinviati automaticamente.

## Limiti e prove reali

La lettura Calendar e l'invio email appartengono a due servizi diversi: non costituiscono una transazione atomica. Una modifica contemporanea dopo la verifica e prima dell'invio rimane possibile e va considerata nel collaudo. La lettura aggiunge richieste e latenza; carico, quote Google e tempi effettivi devono essere misurati sull'ambiente finale.

I test coprono eventi spostati, annullati, riassegnati, scaduti, righe storiche senza riferimenti, indisponibilità temporanea e avvisi di cancellazione. La consegna reale resta da provare. Il modulo WhatsApp non è ancora collegato a questa coda.

Fonti: [Events.get](https://developers.google.com/workspace/calendar/api/v3/reference/events/get) e [errori Calendar](https://developers.google.com/workspace/calendar/api/guides/errors).
