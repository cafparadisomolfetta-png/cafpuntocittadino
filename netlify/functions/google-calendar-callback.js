exports.handler = async function (event) {
  const code = event.queryStringParameters?.code;
  const error = event.queryStringParameters?.error;

  const htmlHeaders = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  };

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
        <p>Controlla le variabili ambiente su Netlify.</p>
      `
    };
  }

  const redirectUri =
    "https://cafpuntocittadino.it/.netlify/functions/google-calendar-callback";

  try {
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
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
            Se il token è già configurato su Netlify,
            non devi fare altro.
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
            <h1>Google collegato</h1>

            <p>
              Autorizzazione completata correttamente.
            </p>

            <p>
              Il collegamento è attivo per
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
