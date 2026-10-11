const {calendarForSite} = require('./site-calendars');
const {slots: validSlots} = require('./booking-schedule');
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

function romeOffset(date) {
  const anchor = new Date(date + "T12:00:00Z");
  const zone = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome", timeZoneName: "shortOffset"
  }).formatToParts(anchor).find(x => x.type === "timeZoneName")?.value || "GMT+1";
  const hours = Number(zone.match(/GMT([+-]\d+)/)?.[1] || "+1");
  return (hours >= 0 ? "+" : "-") + String(Math.abs(hours)).padStart(2, "0") + ":00";
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

    const resolved=calendarForSite(event.queryStringParameters?.sede||event.queryStringParameters?.site||'molfetta');
    if(resolved.error)return {statusCode:resolved.status,headers,body:JSON.stringify({error:resolved.error})};
    const calendarId=resolved.calendarId;

    const accessToken = await getAccessToken();

    const offset = romeOffset(date);
    const timeMin = `${date}T00:00:00${offset}`;
    const timeMax = `${date}T23:59:59${offset}`;

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      timeZone: "Europe/Rome"
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
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

    const slots = validSlots(date).filter(ora => {
      const slotStart = new Date(`${date}T${ora}:00${offset}`);
      const slotEnd = new Date(slotStart.getTime() + 20 * 60000);
      if(slotStart.getTime() < Date.now()) return false;
      return !eventi.some(evento => {
        if(!evento.inizio || !evento.fine)return false;
        const start = new Date(evento.inizio),end = new Date(evento.fine);
        return slotStart < end && slotEnd > start;
      });
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        date,
        slots
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
