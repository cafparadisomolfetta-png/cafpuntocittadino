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

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Metodo non consentito" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const nome = String(body.nome || "").trim();
    const telefono = String(body.telefono || "").trim();
    const email = String(body.email || "").trim();
    const servizio = String(body.servizio || "").trim();
    const data = String(body.data || "").trim();
    const ora = String(body.ora || "").trim();

    if (!nome || !telefono || !servizio || !data || !ora) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Compila tutti i campi obbligatori"
        })
      };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Data non valida" })
      };
    }

    if (!/^\d{2}:\d{2}$/.test(ora)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Orario non valido" })
      };
    }

    const accessToken = await getAccessToken();

    const start = new Date(`${data}T${ora}:00+02:00`);
    const end = new Date(start.getTime() + 20 * 60 * 1000);

    const checkUrl = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    );

    checkUrl.searchParams.set("timeMin", start.toISOString());
    checkUrl.searchParams.set("timeMax", end.toISOString());
    checkUrl.searchParams.set("singleEvents", "true");

    const checkResponse = await fetch(checkUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const checkData = await checkResponse.json();

    if (!checkResponse.ok) {
      console.error("Errore controllo disponibilità:", checkData);
      throw new Error("Impossibile controllare la disponibilità");
    }

    if ((checkData.items || []).length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: "Questo orario non è più disponibile"
        })
      };
    }

    const calendarEvent = {
      summary: `Appuntamento CAF - ${nome}`,
      description:
        `Servizio: ${servizio}\n` +
        `Nome: ${nome}\n` +
        `Telefono: ${telefono}\n` +
        (email ? `Email: ${email}\n` : "") +
        `Prenotazione effettuata da cafpuntocittadino.it`,
      start: {
        dateTime: start.toISOString(),
        timeZone: "Europe/Rome"
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "Europe/Rome"
      }
    };

    const createResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(calendarEvent)
      }
    );

    const createdEvent = await createResponse.json();

    if (!createResponse.ok) {
      console.error("Errore creazione appuntamento:", createdEvent);
      throw new Error("Impossibile creare l'appuntamento");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Appuntamento prenotato correttamente"
      })
    };
  } catch (error) {
    console.error("Errore prenotazione:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Errore durante la prenotazione"
      })
    };
  }
};
