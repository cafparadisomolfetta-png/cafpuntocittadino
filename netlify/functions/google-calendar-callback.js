const crypto = require("node:crypto");
const {googleRedirectUri} = require("./google-oauth-config");
exports.handler = async function (event) {
  if (event.httpMethod !== "GET") return {statusCode:405,headers:{Allow:"GET","Cache-Control":"no-store"},body:"Metodo non consentito"};
  const code = event.queryStringParameters?.code;
  const error = event.queryStringParameters?.error;

  const htmlHeaders = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Set-Cookie": "oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  };

  const state = event.queryStringParameters?.state;
  const cookies = String(event.headers?.cookie || event.headers?.Cookie || "").split(";").map(v => v.trim());
  const matches = cookies.filter(v => v.startsWith("oauth_state="));
  const expected = matches.length === 1 ? matches[0].slice("oauth_state=".length) : "";
  if (!/^[a-f0-9]{48}$/.test(state || "") || !/^[a-f0-9]{48}$/.test(expected) ||
      !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected))) {
    return {statusCode:400,headers:htmlHeaders,body:"<h2>Sessione di autorizzazione non valida o scaduta.</h2><p>Ripeti il collegamento a Google.</p>"};
  }

  if (error) {
    return {
      statusCode: 400,
      headers: htmlHeaders,
      body: `
        <h2>Autorizzazione Google non concessa.</h2>
        <p>Puoi chiudere questa pagina.</p>
      `
    };
  }

  if (!code) {
    return {
      statusCode: 400,
      headers: htmlHeaders,
      body: `
        <h2>Codice di autorizzazione mancante.</h2>
        <p>Ripeti la procedura di collegamento.</p>
      `
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: htmlHeaders,
      body: `
        <h2>Configurazione Google incompleta.</h2>
        <p>Controlla la configurazione privata del server.</p>
      `
    };
  }

  let redirectUri;
  try { redirectUri = googleRedirectUri(); }
  catch { return {statusCode:500,headers:htmlHeaders,body:"<h2>Origine Google non configurata correttamente.</h2>"}; }

  try {
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      }
    );

    const tokens = await response.json();

    if (!response.ok) {
      console.error(
        "GOOGLE_OAUTH_ERROR:",
        tokens?.error || "oauth_error",
        tokens?.error_description || ""
      );

      return {
        statusCode: 500,
        headers: htmlHeaders,
        body: `
          <h2>Errore durante il collegamento a Google.</h2>
          <p>Riprova l'autorizzazione.</p>
        `
      };
    }

    if (!tokens.refresh_token) {
      console.warn(
        "GOOGLE_OAUTH: autorizzazione completata senza nuovo refresh token."
      );

      return {
        statusCode: 200,
        headers: htmlHeaders,
        body: `
          <h2>Google collegato</h2>
          <p>
            Autorizzazione completata.
          </p>
          <p>
            Non è stato generato un nuovo refresh token.
            Il token già presente nella configurazione privata
            deve essere verificato separatamente.
          </p>
        `
      };
    }

    /*
      IMPORTANTE:
      il refresh token NON viene scritto nei log.
      Quello attualmente configurato su Netlify
      resta invariato.
    */

    console.log(
      "GOOGLE_OAUTH_SUCCESS: autorizzazione completata correttamente."
    );

    return {
      statusCode: 200,
      headers: htmlHeaders,
      body: `
        <!DOCTYPE html>
        <html lang="it">
          <head>
            <meta charset="UTF-8">
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            >
            <title>Google collegato</title>
          </head>

          <body
            style="
              font-family: Arial, sans-serif;
              max-width: 700px;
              margin: 60px auto;
              padding: 20px;
              text-align: center;
            "
          >
            <h1>Autorizzazione Google completata</h1>

            <p>
              Autorizzazione completata correttamente.
            </p>

            <p>
              Questa procedura non salva il nuovo token sul server. Il collegamento deve essere configurato e verificato separatamente per
              Google Calendar e per l'invio delle email.
            </p>

            <p>
              Ora puoi tornare alla configurazione del sito.
            </p>
          </body>
        </html>
      `
    };

  } catch (err) {
    console.error(
      "GOOGLE_CALLBACK_ERROR:",
      err?.message || "Errore sconosciuto"
    );

    return {
      statusCode: 500,
      headers: htmlHeaders,
      body: `
        <h2>Errore durante il collegamento a Google.</h2>
        <p>Riprova più tardi.</p>
      `
    };
  }
};
