const crypto = require("crypto");
const {googleRedirectUri} = require("./google-oauth-config");

exports.handler = async function () {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return {
      statusCode: 500,
      body: "Configurazione Google incompleta sul server."
    };
  }

  let redirectUri;
  try { redirectUri = googleRedirectUri(); }
  catch { return {statusCode:500,headers:{"Cache-Control":"no-store"},body:"Origine Google non configurata correttamente."}; }

  const state = crypto.randomBytes(24).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send",
    access_type: "offline",
    prompt: "consent",
    state: state
  });

  return {
    statusCode: 302,
    headers: {
      Location:
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        params.toString(),

      "Set-Cookie":
        `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,

      "Cache-Control": "no-store"
    },
    body: ""
  };
};
