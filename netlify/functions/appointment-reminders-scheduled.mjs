const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const TZ = "Europe/Rome";
const EMAIL_SEDE = "cafparadiso.molfetta@gmail.com";

/*
  Controllo ogni ora.
  Cerca gli appuntamenti compresi tra 23 e 25 ore da adesso:
  in questo modo il promemoria viene inviato circa 24 ore prima.
*/
export const config = {
  schedule: "5 * * * *"
};

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

async function sendEmail(accessToken, {
  to,
  subject,
  html
}) {
  const message = [
    `From: CAF Punto Cittadino Italia <${EMAIL_SEDE}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html
  ].join("\r\n");

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
      "Errore durante l'invio del promemoria"
    );
  }
}

async function markReminderSent(
  accessToken,
  event
) {
  const privateProps = {
    ...(event.extendedProperties?.private || {}),
    reminder24hSent: "true",
    reminder24hSentAt: new Date().toISOString()
  };

  const r = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      CALENDAR_ID
    )}/events/${encodeURIComponent(event.id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        extendedProperties: {
          private: privateProps
        }
      })
    }
  );

  if (!r.ok) {
    const x = await r.json().catch(() => ({}));

    throw new Error(
      x.error?.message ||
      "Impossibile registrare l'invio del promemoria"
    );
  }
}

export default async () => {
  try {
    const accessToken = await getAccessToken();

    const now = Date.now();

    const timeMin =
      new Date(now + 23 * 60 * 60 * 1000).toISOString();

    const timeMax =
      new Date(now + 25 * 60 * 60 * 1000).toISOString();

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        CALENDAR_ID
      )}/events`
    );

    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("showDeleted", "false");
    url.searchParams.set("maxResults", "2500");

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const x = await r.json();

    if (!r.ok) {
      throw new Error(
        x.error?.message ||
        "Errore durante la lettura del calendario"
      );
    }

    let inviati = 0;

    for (const event of x.items || []) {
      const props =
        event.extendedProperties?.private || {};

      const email =
        String(props.email || "").trim();

      if (!email) {
        continue;
      }

      if (props.reminder24hSent === "true") {
        continue;
      }

      const start = event.start?.dateTime;

      if (!start) {
        continue;
      }

      const servizio =
        props.service ||
        event.summary ||
        "Appuntamento";

      const modalita =
        props.appointmentMode ||
        "In sede";

      const dataIt =
        formatDate(start);

      const ora =
        formatTime(start);

      const telefonico =
        /telefon/i.test(modalita);

      const indicazioni = telefonico
        ? `
          <p>
            <strong>Appuntamento telefonico</strong><br>
            Domani sarà la sede a contattarti
            al numero indicato nella prenotazione.
          </p>
        `
        : `
          <p>
            Ti aspettiamo presso
            <strong>Via Paradiso 34 – Molfetta</strong>.
          </p>
        `;

      const html = `
        <div style="
          font-family:Arial,sans-serif;
          line-height:1.6;
          color:#17233c
        ">

          <h2>
            🔔 Promemoria appuntamento
          </h2>

          <p>
            Ti ricordiamo che domani hai
            un appuntamento presso
            <strong>CAF Punto Cittadino Italia</strong>.
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

          ${indicazioni}

          <p>
            Se non puoi presentarti,
            ricorda che la disdetta online
            è consentita con almeno
            <strong>2 giorni di anticipo</strong>.
          </p>

          <hr>

          <p>
            <strong>CAF Punto Cittadino Italia</strong><br>
            Via Paradiso 34 – Molfetta<br>
            Tel. 080 6455509
          </p>

        </div>
      `;

      try {
        await sendEmail(accessToken, {
          to: email,
          subject:
            `Promemoria appuntamento CAF Punto Cittadino Italia - ${dataIt} ore ${ora}`,
          html
        });

        await markReminderSent(
          accessToken,
          event
        );

        inviati++;

      } catch (e) {
        console.error(
          "REMINDER_EVENT_ERROR:",
          event.id,
          e?.message || e
        );
      }
    }

    console.log(
      "REMINDER_COMPLETED:",
      inviati
    );

    return new Response(
      `Promemoria inviati: ${inviati}`
    );

  } catch (e) {
    console.error(
      "REMINDER_FATAL_ERROR:",
      e?.message || e
    );

    return new Response(
      "Errore promemoria",
      { status: 500 }
    );
  }
};
