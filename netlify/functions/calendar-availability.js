async function getAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token"
    }).toString()
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Errore token Google:", data);
    throw new Error("Impossibile ottenere il token Google");
  }

  return data.access_token;
}

function minuti(orario) {
  const [h, m] = orario.split(":").map(Number);
  return h * 60 + m;
}

function orarioDaMinuti(totale) {
  const h = Math.floor(totale / 60);
  const m = totale % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  try {
    const date = event.queryStringParameters?.date;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Data mancante o non valida"
        })
      };
    }

    const accessToken = await getAccessToken();

    const timeMin = `${date}T00:00:00+02:00`;
    const timeMax = `${date}T23:59:59+02:00`;

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      timeZone: "Europe/Rome"
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Errore Google Calendar:", data);

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Impossibile leggere Google Calendar"
        })
      };
    }

    const eventi = (data.items || []).map((evento) => ({
      inizio: evento.start?.dateTime || evento.start?.date,
      fine: evento.end?.dateTime || evento.end?.date
    }));

    /*
      Orari di apertura attuali:
      mattina 09:00 - 11:30
      pomeriggio 17:00 - 19:00
      appuntamenti ogni 20 minuti.
    */
    const fasce = [
      ["09:00", "11:30"],
      ["17:00", "19:00"]
    ];

    const durata = 20;
    const slots = [];

    for (const [inizioFascia, fineFascia] of fasce) {
      let corrente = minuti(inizioFascia);
      const fine = minuti(fineFascia);

      while (corrente + durata <= fine) {
        const ora = orarioDaMinuti(corrente);

        const slotStart = new Date(`${date}T${ora}:00+02:00`);
        const slotEnd = new Date(slotStart.getTime() + durata * 60000);

        const occupato = eventi.some((evento) => {
          if (!evento.inizio || !evento.fine) return false;

          const eventoStart = new Date(evento.inizio);
          const eventoEnd = new Date(evento.fine);

          return slotStart < eventoEnd && slotEnd > eventoStart;
        });

        if (!occupato) {
          slots.push(ora);
        }

        corrente += durata;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        date,
        slots,
        events: eventi
      })
    };

  } catch (error) {
    console.error("Errore calendar-availability:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Errore interno"
      })
    };
  }
};
