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

    const events = (data.items || []).map((item) => ({
      id: item.id,
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        date,
        events
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
