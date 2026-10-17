const {calendarForSite} = require('./site-calendars');
const TZ = "Europe/Rome";
const EMAIL_SEDE = "cafparadiso.molfetta@gmail.com";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify(body)
});

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
    grant_type: "refresh_token"
  });

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const x = await r.json();

  if (!r.ok || !x.access_token) {
    throw new Error(
      x.error_description ||
      x.error ||
      "Impossibile collegarsi ai servizi Google"
    );
  }

  return x.access_token;
}

function hoursUntil(dateTime) {
  return (
    new Date(dateTime).getTime() - Date.now()
  ) / (1000 * 60 * 60);
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateTime) {
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(dateTime));
}

function formatTime(dateTime) {
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(dateTime));
}

async function sendEmail(
  accessToken,
  { to, cc, subject, html }
) {
  const message = [
    `From: Punto Cittadino Italia <${EMAIL_SEDE}>`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html
  ]
    .filter(v => v !== null)
    .join("\r\n");

  const r = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        raw: base64UrlEncode(message)
      })
    }
  );

  const x = await r.json().catch(() => ({}));

  if (!r.ok) {
    throw new Error(
      x.error?.message ||
      "Errore durante l'invio dell'email"
    );
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, {
      error: "Metodo non consentito"
    });
  }

  try {
    const p = JSON.parse(event.body || "{}");

    const codice = String(
      p.codiceDisdetta ||
      p.codice_disdetta ||
      p.cancelCode ||
      p.codice ||
      ""
    )
      .trim()
      .toUpperCase();

    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(codice)) {
      return json(400, {
        error: "Inserisci il codice di disdetta"
      });
    }

    const resolved=calendarForSite(p.sede||p.site||'molfetta');
    if(resolved.error)return json(resolved.status,{error:resolved.error});
    const CALENDAR_ID=resolved.calendarId;

    const accessToken = await getAccessToken();

    const now = new Date();

    const future = new Date();
    future.setMonth(future.getMonth() + 12);

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        CALENDAR_ID
      )}/events`
    );

    url.searchParams.set(
      "timeMin",
      now.toISOString()
    );

    url.searchParams.set(
      "timeMax",
      future.toISOString()
    );

    url.searchParams.set(
      "singleEvents",
      "true"
    );

    url.searchParams.set(
      "showDeleted",
      "false"
    );

    url.searchParams.set(
      "maxResults",
      "2500"
    );

    url.searchParams.set(
      "privateExtendedProperty",
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
        "Errore durante la ricerca dell'appuntamento"
      );
    }

    if (x.nextPageToken || !Array.isArray(x.items) || x.items.length > 1) {
      return json(503, {error:"Disdetta non verificabile. Contatta la sede."});
    }
    const appuntamento = (x.items || [])[0];

    if (!appuntamento) {
      return json(404, {
        error:
          "Codice di disdetta non valido oppure appuntamento non trovato"
      });
    }

    const start =
      appuntamento.start?.dateTime ||
      appuntamento.start?.date;

    if (!start) {
      return json(400, {
        error:
          "Impossibile determinare la data dell'appuntamento"
      });
    }

    if (!Number.isFinite(hoursUntil(start)) || hoursUntil(start) < 48) {
      return json(400, {
        error:
          "La disdetta online è consentita solo con almeno 2 giorni di anticipo. Contatta la sede telefonicamente."
      });
    }

    const props =
      appuntamento.extendedProperties?.private || {};

    const email =
      String(props.email || "").trim();

    const servizio =
      String(
        props.service ||
        appuntamento.summary ||
        "Appuntamento"
      ).trim();

    const modalita =
      String(
        props.appointmentMode ||
        "In sede"
      ).trim();

    const dataIt = formatDate(start);
    const ora = formatTime(start);

    const deleteUrl =
      `https://www.googleapis.com/calendar/v3/calendars/` +
      `${encodeURIComponent(CALENDAR_ID)}/events/` +
      `${encodeURIComponent(appuntamento.id)}`;

    const dr = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!dr.ok) {
      let message =
        "Errore durante la cancellazione dell'appuntamento";

      try {
        const dx = await dr.json();

        message =
          dx.error?.message ||
          message;
      } catch {}

      throw new Error(message);
    }

    // Persist a minimal cancellation record after the Calendar event was deleted.
    // Failure to write the audit must not undo the successful cancellation.
    let storicoRegistrato = false;
    try {
      const { getStore } = require("@netlify/blobs");
      const store = getStore("caf-cancellations");
      const dateParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit"
      }).formatToParts(new Date(start));
      const part = kind => dateParts.find(x => x.type === kind)?.value;
      const day = [part("year"), part("month"), part("day")].join("-");
      const record = {
        id: appuntamento.id,
        calendarId: CALENDAR_ID,
        date: day,
        start,
        summary: String(appuntamento.summary || "Appuntamento").slice(0, 180),
        category: String(props.service || "").slice(0, 90),
        cancelledAt: new Date().toISOString()
      };
      await store.setJSON("event/" + encodeURIComponent(appuntamento.id), record);
      storicoRegistrato = true;
    } catch(error) {
      console.error("CANCELLATION_AUDIT_ERROR", error?.message || "store unavailable");
    }

    let emailInviata = false;

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      try {
        const html = `
          <div style="
            font-family:Arial,sans-serif;
            line-height:1.6;
            color:#17233c
          ">

            <h2>
              ✅ Appuntamento disdetto
            </h2>

            <p>
              Ti confermiamo che il tuo appuntamento
              presso <strong>Punto Cittadino Italia</strong>
              è stato annullato correttamente.
            </p>

            <p>
              <strong>Servizio:</strong>
              ${escapeHtml(servizio)}<br>

              <strong>Data:</strong>
              ${dataIt}<br>

              <strong>Ora:</strong>
              ${ora}<br>

              <strong>Modalità:</strong>
              ${escapeHtml(modalita)}
            </p>

            <p>
              Lo spazio è stato nuovamente
              reso disponibile in agenda.
            </p>

            <p>
              Se hai bisogno di un nuovo appuntamento,
              puoi effettuare una nuova prenotazione
              dal nostro sito.
            </p>

            <hr>

            <p>
              <strong>Punto Cittadino Italia</strong><br>
              Via Paradiso 34 – Molfetta<br>
              Tel. 080 6455509
            </p>

          </div>
        `;

        await sendEmail(
          accessToken,
          {
            to: email,
            cc: EMAIL_SEDE,
            subject:
              `Conferma disdetta appuntamento Punto Cittadino Italia - ${dataIt} ore ${ora}`,
            html
          }
        );

        emailInviata = true;

      } catch (mailError) {
        console.error(
          "CANCEL_EMAIL_ERROR:",
          mailError?.message ||
          mailError
        );
      }
    }

    return json(200, {
      ok: true,
      message:
        "Appuntamento disdetto correttamente",
      emailInviata,
      storicoRegistrato
    });

  } catch (e) {
    console.error(
      "CALENDAR_CANCEL_ERROR:",
      e?.message || e
    );

    return json(503, {error:"Disdetta temporaneamente non disponibile. Riprova più tardi."});
  }
};
