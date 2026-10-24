"use strict";

// Shared by both halves of the historical OAuth flow. Never derive this from
// request headers: only the operator's private, canonical HTTPS origin is trusted.
function googleRedirectUri(env = process.env) {
  const origin = env.CAF_ORIGIN === undefined
    ? "https://cafpuntocittadino.it"
    : env.CAF_ORIGIN;
  const url = new URL(origin);
  if (url.protocol !== "https:" || origin !== url.origin ||
      url.username || url.password || /[\x00-\x20\x7f]/.test(origin)) {
    throw Error("A canonical HTTPS origin is required for Google OAuth");
  }
  return origin + "/.netlify/functions/google-calendar-callback";
}

module.exports = {googleRedirectUri};
