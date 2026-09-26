exports.handler = async function (event) {
  const code = event.queryStringParameters?.code;
  const error = event.queryStringParameters?.error;

  if (error) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: "<h2>Autorizzazione Google Calendar non concessa.</h2>"
    };
  }

  if (!code) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: "<h2>Codice di autorizzazione mancante.</h2>"
    };
  }

  const redirectUri =
    "https://cafpuntocittadino.it/.netlify/functions/google-calendar-callback";

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      }).toString()
    });

    const tokens = await response.json();

    if (!response.ok) {
      console.error("Google OAuth error:", tokens);

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        },
        body: "<h2>Errore durante il collegamento a Google Calendar.</h2>"
      };
    }

    if (!tokens.refresh_token) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        },
        body:
          "<h2>Refresh token non ricevuto.</h2>" +
          "<p>Ripeti l'autorizzazione Google.</p>"
      };
    }

    console.log("REFRESH_TOKEN_GENERATED:", tokens.refresh_token);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: `
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Google Calendar collegato</title>
        </head>
        <body style="font-family:Arial;text-align:center;padding:40px">
          <h1>Google Calendar collegato</h1>
          <p>Autorizzazione completata correttamente.</p>
          <p>Ora puoi tornare alla configurazione del sito.</p>
        </body>
        </html>
      `
    };
  } catch (err) {
    console.error("Errore callback Google:", err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: "<h2>Errore interno durante il collegamento a Google Calendar.</h2>"
    };
  }
};
