exports.handler = async function (event) {
  const code = event.queryStringParameters?.code;
  const error = event.queryStringParameters?.error;

  if (error) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: "<h2>Autorizzazione Google Calendar non concessa.</h2>"
    };
  }

  if (!code) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: "<h2>Codice di autorizzazione mancante.</h2>"
    };
  }

  const redirectUri =
    "https://cafpuntocittadino.it/.netlify/functions/google-calendar-callback";

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
    })
  });

  const tokens = await response.json();

  if (!response.ok) {
    console.error("Google OAuth error:", tokens);

    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: "<h2>Errore durante il collegamento a Google Calendar.</h2>"
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Google Calendar collegato</title>
      </head>
      <body style="font-family:Arial;text-align:center;padding:40px">
        <h1>Google Calendar collegato</h1>
        <p>Autorizzazione completata correttamente.</p>
      </body>
      </html>
    `
  };
};
