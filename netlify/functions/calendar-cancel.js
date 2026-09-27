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


// Data corrente italiana YYYY-MM-DD.
function getRomeToday() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(new Date());
  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}


// Giorni di calendario mancanti all'appuntamento.
function daysUntilAppointment(appointmentDate) {
  const today = getRomeToday();

  const [todayYear, todayMonth, todayDay] =
    today.split("-").map(Number);

  const [year, month, day] =
    appointmentDate.split("-").map(Number);

  const todayUTC = Date.UTC(
    todayYear,
    todayMonth - 1,
    todayDay
  );

  const appointmentUTC = Date.UTC(
    year,
    month - 1,
    day
  );

  return Math.round(
    (appointmentUTC - todayUTC) / 86400000
  );
}


// Cerca l'appuntamento usando il codice personale.
async function trovaEventoDaCodice(
  accessToken,
  codiceDisdetta
) {
  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );

  // Cerca solamente appuntamenti non già cancellati.
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("showDeleted", "false");
  url.searchParams.set("maxResults", "10");

  // Google Calendar permette di cercare
  // nelle extendedProperties private.
  url.searchParams.append(
    "privateExtendedProperty",
    `cancellationCode=${codiceDisdetta}`
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Errore ricerca appuntamento:",
      data
    );

    throw new Error(
      "Impossibile cercare l'appuntamento"
    );
  }

  const eventi = data.items || [];

  if (!eventi.length) {
    return null;
  }

  return eventi[0];
}


exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Metodo non consentito"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    let eventId = String(
      body.eventId || ""
    ).trim();

    const dataRicevuta = String(
      body.data || ""
    ).trim();

    const codiceDisdetta = String(
      body.codiceDisdetta || ""
    )
      .trim()
      .toUpperCase();


    // Serve almeno il codice personale.
    if (!codiceDisdetta) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "Inserisci il codice di disdetta"
        })
      };
    }


    const accessToken =
      await getAccessToken();

    let calendarEvent = null;


    // SE ABBIAMO EVENT ID
    // Caso: disdetta immediatamente dopo
    // la prenotazione.
    if (eventId) {

      const eventUrl =
        "https://www.googleapis.com/calendar/v3/calendars/primary/events/" +
        encodeURIComponent(eventId);

      const eventResponse = await fetch(
        eventUrl,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`
          }
        }
      );

      if (!eventResponse.ok) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error:
              "Appuntamento non trovato"
          })
        };
      }

      calendarEvent =
        await eventResponse.json();

    } else {

      // SENZA EVENT ID
      // Caso: cliente che torna sul sito
      // successivamente con il proprio codice.
      calendarEvent =
        await trovaEventoDaCodice(
          accessToken,
          codiceDisdetta
        );

      if (!calendarEvent) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error:
              "Codice di disdetta non valido o appuntamento non trovato"
          })
        };
      }

      eventId = calendarEvent.id;
    }


    // VERIFICA CODICE
    const codiceSalvato =
      calendarEvent.extendedProperties &&
      calendarEvent.extendedProperties.private
        ? String(
            calendarEvent.extendedProperties
              .private.cancellationCode || ""
          )
            .trim()
            .toUpperCase()
        : "";


    if (
      !codiceSalvato ||
      codiceSalvato !== codiceDisdetta
    ) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error:
            "Codice di disdetta non valido"
        })
      };
    }


    // DATA REALE DELL'APPUNTAMENTO
    let dataAppuntamento = "";

    if (
      calendarEvent.extendedProperties &&
      calendarEvent.extendedProperties.private &&
      calendarEvent.extendedProperties.private
        .bookingDate
    ) {
      dataAppuntamento =
        calendarEvent.extendedProperties.private
          .bookingDate;

    } else if (
      calendarEvent.start &&
      calendarEvent.start.dateTime
    ) {
      dataAppuntamento =
        calendarEvent.start.dateTime.substring(
          0,
          10
        );

    } else {
      dataAppuntamento = dataRicevuta;
    }


    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dataAppuntamento
      )
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "Data dell'appuntamento non valida"
        })
      };
    }


    // REGOLA DEI 2 GIORNI
    const giorniMancanti =
      daysUntilAppointment(
        dataAppuntamento
      );


    if (giorniMancanti < 2) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error:
            "La disdetta online è consentita solo almeno 2 giorni prima dell'appuntamento. Contatta direttamente la sede."
        })
      };
    }


    // CANCELLAZIONE GOOGLE CALENDAR
    const deleteUrl =
      "https://www.googleapis.com/calendar/v3/calendars/primary/events/" +
      encodeURIComponent(eventId);


    const deleteResponse = await fetch(
      deleteUrl,
      {
        method: "DELETE",
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );


    if (
      !deleteResponse.ok &&
      deleteResponse.status !== 204
    ) {
      let errorData = {};

      try {
        errorData =
          await deleteResponse.json();
      } catch (_) {}

      console.error(
        "Errore cancellazione Google Calendar:",
        errorData
      );

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error:
            "Non è stato possibile annullare l'appuntamento"
        })
      };
    }


    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message:
          "Appuntamento annullato correttamente"
      })
    };

  } catch (error) {

    console.error(
      "Errore disdetta appuntamento:",
      error
    );

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "Errore durante la disdetta dell'appuntamento"
      })
    };
  }
};
