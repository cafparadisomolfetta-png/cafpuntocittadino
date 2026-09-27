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


// Restituisce la data corrente in Italia nel formato YYYY-MM-DD.
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


// Calcola quanti giorni di calendario mancano
// tra oggi e la data dell'appuntamento.
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

    const eventId = String(
      body.eventId || ""
    ).trim();

    const data = String(
      body.data || ""
    ).trim();


    if (!eventId || !data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "Dati dell'appuntamento mancanti"
        })
      };
    }


    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Data non valida"
        })
      };
    }


    // REGOLA DISDETTA
    //
    // Deve mancare almeno 2 giorni.
    //
    // Esempio:
    // appuntamento venerdì
    // cancellabile fino a mercoledì.
    const giorniMancanti =
      daysUntilAppointment(data);


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


    const accessToken =
      await getAccessToken();


    // CANCELLAZIONE DA GOOGLE CALENDAR
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


    // Google restituisce 204 quando
    // la cancellazione è riuscita.
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
