  const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const TZ = 'Europe/Rome';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN || '',
    grant_type: 'refresh_token'
  });

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const x = await r.json();

  if (!r.ok || !x.access_token) {
    throw new Error(
      x.error_description ||
      x.error ||
      'Impossibile collegarsi a Google Calendar'
    );
  }

  return x.access_token;
}

function hoursUntil(dateTime) {
  const target = new Date(dateTime).getTime();
  const now = Date.now();

  return (target - now) / (1000 * 60 * 60);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Metodo non consentito' });
  }

  try {
    const p = JSON.parse(event.body || '{}');

    const codice = String(
      p.codiceDisdetta ||
      p.codice_disdetta ||
      p.cancelCode ||
      p.codice ||
      ''
    )
      .trim()
      .toUpperCase();

    if (!codice) {
      return json(400, {
        error: 'Inserisci il codice di disdetta'
      });
    }

    const accessToken = await getAccessToken();

    const now = new Date();

    const timeMin = now.toISOString();

    const future = new Date();
    future.setMonth(future.getMonth() + 12);

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`
    );

    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', future.toISOString());
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('showDeleted', 'false');
    url.searchParams.set('maxResults', '2500');
    url.searchParams.set(
      'privateExtendedProperty',
      `cancelCode=${codice}`
    );

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const x = await r.json();

    if (!r.ok) {
      throw new Error(
        x.error?.message ||
        'Errore durante la ricerca dell’appuntamento'
      );
    }

    const appuntamento = (x.items || [])[0];

    if (!appuntamento) {
      return json(404, {
        error:
          'Codice di disdetta non valido oppure appuntamento non trovato'
      });
    }

    const start =
      appuntamento.start?.dateTime ||
      appuntamento.start?.date;

    if (!start) {
      return json(400, {
        error:
          'Impossibile determinare la data dell’appuntamento'
      });
    }

    const oreMancanti = hoursUntil(start);

    if (oreMancanti < 48) {
      return json(400, {
        error:
          'La disdetta online è consentita solo con almeno 2 giorni di anticipo. Contatta la sede telefonicamente.'
      });
    }

    const deleteUrl =
      `https://www.googleapis.com/calendar/v3/calendars/` +
      `${encodeURIComponent(CALENDAR_ID)}/events/` +
      `${encodeURIComponent(appuntamento.id)}`;

    const dr = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!dr.ok) {
      let message = 'Errore durante la cancellazione dell’appuntamento';

      try {
        const dx = await dr.json();
        message = dx.error?.message || message;
      } catch {}

      throw new Error(message);
    }

    return json(200, {
      ok: true,
      message: 'Appuntamento disdetto correttamente'
    });

  } catch (e) {
    return json(500, {
      error:
        e?.message ||
        'Errore durante la disdetta'
    });
  }
};   
