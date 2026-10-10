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

function makeCancelCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);

  crypto.getRandomValues(bytes);

  let out = '';

  for (const b of bytes) {
    out += alphabet[b % alphabet.length];
  }

  return out;
}

function localTimeHHMM(dateTime) {
  if (!dateTime) return '';

  try {
    return new Intl.DateTimeFormat('it-IT', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(dateTime));
  } catch {
    return '';
  }
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

    const servizio = String(
      p.servizio || p.service || ''
    ).trim();

    const data = String(
      p.data || p.date || ''
    ).trim();

    const ora = String(
      p.ora || p.time || ''
    ).trim().slice(0, 5);

    const nome = String(
      p.nome || p.name || ''
    ).trim();

    const telefono = String(
      p.telefono || p.phone || ''
    ).trim();

    const email = String(
      p.email || ''
    ).trim();

    const modalita = String(
      p.modalita ||
      p.mode ||
      p.appointmentType ||
      'In sede'
    ).trim();

    const missing = [];

    if (!servizio) missing.push('servizio');
    if (!data) missing.push('data');
    if (!ora) missing.push('ora');
    if (!nome) missing.push('nome');
    if (!telefono) missing.push('telefono');

    if (missing.length) {
      return json(400, {
        error: 'Dati mancanti: ' + missing.join(', ')
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !/^\d{2}:\d{2}$/.test(ora)
    ) {
      return json(400, {
        error: 'Data o orario non validi'
      });
    }

    const accessToken = await getAccessToken();

    const dayStart = `${data}T00:00:00Z`;

    const next = new Date(`${data}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);

    const dayEnd = next.toISOString();

    const listUrl = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`
    );

    listUrl.searchParams.set('timeMin', dayStart);
    listUrl.searchParams.set('timeMax', dayEnd);
    listUrl.searchParams.set('singleEvents', 'true');
    listUrl.searchParams.set('showDeleted', 'false');
    listUrl.searchParams.set('maxResults', '250');

    const lr = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const lx = await lr.json();

    if (!lr.ok) {
      throw new Error(
        lx.error?.message ||
        'Errore nel controllo disponibilità'
      );
    }

    const occupied = (lx.items || []).some(
      ev => localTimeHHMM(ev.start?.dateTime) === ora
    );

    if (occupied) {
      return json(409, {
        error:
          'Questo orario non è più disponibile. Scegline un altro.'
      });
    }

    const codiceDisdetta = makeCancelCode();

    const icon = /telefon/i.test(modalita)
      ? '📞'
      : '🏢';

    const description = [
      `Servizio: ${servizio}`,
      `Modalità: ${modalita}`,
      `Nome: ${nome}`,
      `Telefono: ${telefono}`,
      email ? `Email: ${email}` : null,
      `Codice disdetta: ${codiceDisdetta}`
    ]
      .filter(Boolean)
      .join('\n');

    const [h, m] = ora.split(':').map(Number);

    const mins = h * 60 + m + 20;

    const endOra =
      `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:` +
      `${String(mins % 60).padStart(2, '0')}`;

    const eventBody = {
      summary: `${icon} ${servizio} - ${nome}`,

      description,

      start: {
        dateTime: `${data}T${ora}:00`,
        timeZone: TZ
      },

      end: {
        dateTime: `${data}T${endOra}:00`,
        timeZone: TZ
      },

      extendedProperties: {
        private: {
          cancelCode: codiceDisdetta,
          appointmentMode: modalita,
          phone: telefono
        }
      }
    };

    const ir = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      }
    );

    const ix = await ir.json();

    if (!ir.ok) {
      throw new Error(
        ix.error?.message ||
        'Errore nella creazione dell’appuntamento'
      );
    }

    return json(200, {
      ok: true,
      eventId: ix.id,

      codiceDisdetta,
      codice_disdetta: codiceDisdetta,
      cancelCode: codiceDisdetta,

      data,
      ora,

      modalita,
      mode: modalita
    });

  } catch (e) {
    return json(500, {
      error:
        e?.message ||
        'Errore durante la prenotazione'
    });
  }
};
