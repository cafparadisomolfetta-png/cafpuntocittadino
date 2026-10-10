const crypto = require("crypto");

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
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

function serviceCategory(servizio) {
  const s = String(servizio || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    s.includes("invalidita") ||
    s.includes("104") ||
    s.includes("naspi") ||
    s.includes("pension") ||
    s.includes("inps") ||
    s.includes("inclusione")
  ) {
    return "Patronato / Previdenziale";
  }

  if (
    s.includes("isee") ||
    s.includes("730") ||
    s.includes("fiscale")
  ) {
    return "CAF / Fiscale";
  }

  if (s.includes("sindacal")) {
    return "Lavoro / Sindacale";
  }

  if (s.includes("area aziende")) {
    return "Area Aziende";
  }

  if (s.includes("tesseramento")) {
    return "Tesseramento associativo";
  }

  return "Consulenza / Altro";
}

function makeCancelCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);

  let code = "";

  for (const b of bytes) {
    code += alphabet[b % alphabet.length];
  }

  return code;
}

function localTimeHHMM(dateTime) {
  if (!dateTime) return "";

  try {
    return new Intl.DateTimeFormat("it-IT", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(dateTime));
  } catch {
    return "";
  }
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

async function sendEmail(accessToken, { to, cc, subject, html }) {
  const message = [
    `From: CAF Punto Cittadino <${EMAIL_SEDE}>`,
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

  return x;
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

    const servizio = String(
      p.servizio || p.service || ""
    ).trim();

    const categoriaServizio = serviceCategory(servizio);

    const data = String(
      p.data || p.date || ""
    ).trim();

    const ora = String(
      p.ora || p.time || ""
    ).trim().slice(0, 5);

    const nome = String(
      p.nome || p.name || ""
    ).trim();

    const telefono = String(
      p.telefono || p.phone || ""
    ).trim();

    const email = String(
      p.email || ""
    ).trim();

    const modalita = String(
      p.modalita ||
      p.mode ||
      p.appointmentType ||
      "In sede"
    ).trim();

    const missing = [];

    if (!servizio) missing.push("servizio");
    if (!data) missing.push("data");
    if (!ora) missing.push("ora");
    if (!nome) missing.push("nome");
    if (!telefono) missing.push("telefono");
    if (!email) missing.push("email");

    if (missing.length) {
      return json(400, {
        error:
          "Dati mancanti: " +
          missing.join(", ")
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return json(400, {
        error: "Inserisci un indirizzo email valido"
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !/^\d{2}:\d{2}$/.test(ora)
    ) {
      return json(400, {
        error: "Data o orario non validi"
      });
    }

    const accessToken = await getAccessToken();

    const dayStart = `${data}T00:00:00Z`;

    const nextDay = new Date(`${data}T00:00:00Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const listUrl = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`
    );

    listUrl.searchParams.set("timeMin", dayStart);
    listUrl.searchParams.set(
      "timeMax",
      nextDay.toISOString()
    );
    listUrl.searchParams.set("singleEvents", "true");
    listUrl.searchParams.set("showDeleted", "false");
    listUrl.searchParams.set("maxResults", "250");

    const lr = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const lx = await lr.json();

    if (!lr.ok) {
      throw new Error(
        lx.error?.message ||
        "Errore nel controllo disponibilità"
      );
    }

    const occupied = (lx.items || []).some(
      ev =>
        localTimeHHMM(ev.start?.dateTime) === ora
    );

    if (occupied) {
      return json(409, {
        error:
          "Questo orario non è più disponibile. Scegline un altro."
      });
    }

    const codiceDisdetta = makeCancelCode();

    const icon =
      /telefon/i.test(modalita)
        ? "📞"
        : "🏢";

    const description = [
      `Area: ${categoriaServizio}`,
      `Modalità: ${modalita}`,
      `Nome: ${nome}`,
      `Telefono: ${telefono}`,
      `Email: ${email}`,
      `Codice disdetta: ${codiceDisdetta}`
    ].join("\n");

    const [h, m] = ora
      .split(":")
      .map(Number);

    const totalMinutes =
      h * 60 + m + 20;

    const endOra =
      `${String(
        Math.floor(totalMinutes / 60) % 24
      ).padStart(2, "0")}:` +
      `${String(
        totalMinutes % 60
      ).padStart(2, "0")}`;

    const eventBody = {
      summary:
        `${icon} ${categoriaServizio} - ${nome}`,

      description,

      start: {
        dateTime:
          `${data}T${ora}:00`,
        timeZone: TZ
      },

      end: {
        dateTime:
          `${data}T${endOra}:00`,
        timeZone: TZ
      },

      extendedProperties: {
        private: {
          cancelCode: codiceDisdetta,
          appointmentMode: modalita,
          phone: telefono,
          email: email,
          service: categoriaServizio,
          reminder24hSent: "false"
        }
      }
    };

    const ir = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventBody)
      }
    );

    const ix = await ir.json();

    if (!ir.ok) {
      throw new Error(
        ix.error?.message ||
        "Errore nella creazione dell'appuntamento"
      );
    }

    let emailInviata = false;

    try {
      const dataIt =
        data.split("-").reverse().join("/");

      const nomeHtml =
        escapeHtml(nome);

      const servizioHtml =
        escapeHtml(categoriaServizio);

      const modalitaHtml =
        escapeHtml(modalita);

      const indicazione =
        /telefon/i.test(modalita)
          ? `
            <p>
              <strong>Appuntamento telefonico:</strong><br>
              sarà la sede a contattarti al numero
              indicato nella prenotazione.
            </p>
          `
          : `
            <p>
              Ti aspettiamo presso la sede di
              <strong>Via Paradiso 34 – Molfetta</strong>.
            </p>
          `;

      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17233c">
          
          <h2>
            ✅ Appuntamento confermato
          </h2>

          <p>
            Gentile ${nomeHtml},
          </p>

          <p>
            il tuo appuntamento presso
            <strong>CAF Punto Cittadino</strong>
            è stato confermato.
          </p>

          <p>
            <strong>Area:</strong>
            ${servizioHtml}<br>

            <strong>Data:</strong>
            ${dataIt}<br>

            <strong>Ora:</strong>
            ${ora}<br>

            <strong>Modalità:</strong>
            ${modalitaHtml}
          </p>

          ${indicazione}

          <p>
            <strong>Codice di disdetta:</strong>
            ${codiceDisdetta}
          </p>

          <p>
            Conserva il codice di disdetta.
            La disdetta online è consentita
            con almeno
            <strong>2 giorni di anticipo</strong>.
          </p>

          <p>
            Riceverai anche un promemoria
            prima dell'appuntamento.
          </p>

          <hr>

          <p>
            <strong>CAF Punto Cittadino</strong><br>
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
            `Conferma appuntamento CAF Punto Cittadino - ${dataIt} ore ${ora}`,
          html
        }
      );

      emailInviata = true;

    } catch (mailError) {
      console.error(
        "EMAIL_CONFIRMATION_ERROR:",
        mailError?.message ||
        mailError
      );
    }

    return json(200, {
      ok: true,

      eventId: ix.id,

      codiceDisdetta,
      codice_disdetta:
        codiceDisdetta,
      cancelCode:
        codiceDisdetta,

      data,
      ora,

      modalita,
      mode: modalita,

      emailInviata
    });

  } catch (e) {
    console.error(
      "CALENDAR_BOOK_ERROR:",
      e?.message || e
    );

    return json(500, {
      error:
        e?.message ||
        "Errore durante la prenotazione"
    });
  }
};
