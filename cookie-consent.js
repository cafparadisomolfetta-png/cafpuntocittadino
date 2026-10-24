/* Punto Cittadino Italia: gestione consenso cookie, modulo pronto per integrazione.
 * Non carica traccianti: ogni script facoltativo dovra' rispettare la scelta.
 */
(function () {
  'use strict';
  var KEY = 'cafpc_cookie_preferences_v1';
  var VERSION = 1;
  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || 'null');
      return data && data.version === VERSION && typeof data.analytics === 'boolean' && typeof data.marketing === 'boolean' ? data : null;
    } catch (_) { return null; }
  }
  function save(analytics, marketing) {
    var value = { version: VERSION, necessary: true, analytics: !!analytics, marketing: !!marketing, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (_) {}
    document.dispatchEvent(new CustomEvent('cafpc:consent', { detail: value }));
    return value;
  }
  function start() {
    if (!document.body || document.getElementById('cafpc-cookie-panel')) return;
    var style = document.createElement('style');
    style.textContent = '.cafpc-cookie-panel{position:fixed;z-index:2147483645;inset:0;width:calc(100% - 32px);max-width:550px;max-height:calc(100% - 32px);box-sizing:border-box;overflow:auto;margin:auto;background:#fff;color:#14253c;border:1px solid #ccd5e2;border-radius:16px;box-shadow:0 12px 40px #14253c44;padding:25px;font:14px/1.6 Arial,sans-serif}.cafpc-cookie-panel::backdrop{background:#071e3f99;backdrop-filter:blur(3px)}.cafpc-cookie-panel[hidden]{display:none}.cafpc-cookie-panel h2{font-size:23px;line-height:1.3;margin:8px 0 12px}.cafpc-cookie-symbol{font-size:28px}.cafpc-cookie-actions{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 12px}.cafpc-cookie-panel button{cursor:pointer;padding:11px 12px;border:1px solid #ccd5e2;border-radius:8px;background:#fff;color:#14253c;font:inherit;min-height:44px}.cafpc-cookie-actions button{flex:1;min-width:125px;font-size:13px}.cafpc-cookie-panel [data-action="accept"],.cafpc-cookie-panel [data-action="save"]{background:#075bc7;color:#fff}.cafpc-cookie-panel button:focus-visible,.cafpc-cookie-panel a:focus-visible{outline:3px solid #2b75d0;outline-offset:2px}.cafpc-cookie-panel a{color:#164b83}.cafpc-cookie-policy-links{font-size:12px}.cafpc-cookie-settings{margin-top:12px}.cafpc-cookie-settings label{display:block;margin:10px 0}.cafpc-cookie-reopen{position:fixed;z-index:2147483644;bottom:12px;left:12px;border:1px solid #ccd5e2;border-radius:999px;padding:8px 12px;background:#fff;color:#14253c;font:inherit;cursor:pointer}@media(max-width:400px){.cafpc-cookie-panel{padding:19px}.cafpc-cookie-actions{flex-direction:column}.cafpc-cookie-actions button{width:100%;flex:auto;min-width:0}}';
    document.head.appendChild(style);
    var panel = document.createElement('dialog');
    panel.id = 'cafpc-cookie-panel';
    panel.className = 'cafpc-cookie-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Preferenze cookie');
    panel.setAttribute('aria-labelledby', 'cafpc-cookie-title');
    panel.setAttribute('aria-describedby', 'cafpc-cookie-description');
    panel.innerHTML = '<div class="cafpc-cookie-symbol" aria-hidden="true">🍪</div><h2 id="cafpc-cookie-title">La tua privacy, al centro.</h2><p id="cafpc-cookie-description">Utilizziamo strumenti necessari al funzionamento del sito. Eventuali cookie statistici e di marketing saranno attivati soltanto con il tuo consenso. Puoi scegliere o cambiare idea in qualsiasi momento.</p><div class="cafpc-cookie-settings" hidden><label><input type="checkbox" checked disabled> Cookie necessari (sempre attivi)</label><label><input id="cafpc-analytics" type="checkbox"> Statistiche facoltative</label><label><input id="cafpc-marketing" type="checkbox"> Marketing facoltativo</label></div><div class="cafpc-cookie-actions"><button type="button" data-action="settings">Personalizza</button><button type="button" data-action="reject">Continua senza accettare</button><button type="button" data-action="accept">Accetta</button><button type="button" data-action="save" hidden>Salva preferenze</button></div><p class="cafpc-cookie-policy-links"><a href="/privacy.html">Leggi la privacy</a> · <a href="/cookie-policy.html">Cookie Policy</a></p>';
    var reopen = document.createElement('button');
    reopen.type = 'button';
    reopen.className = 'cafpc-cookie-reopen';
    reopen.textContent = 'Preferenze cookie';
    reopen.setAttribute('aria-label', 'Modifica preferenze cookie');
    document.body.appendChild(panel);
    document.body.appendChild(reopen);
    var settings = panel.querySelector('.cafpc-cookie-settings');
    var saveButton = panel.querySelector('[data-action="save"]');
    var returnFocus = null;
    function close() {
      if (panel.open && typeof panel.close === 'function') panel.close();
      else panel.removeAttribute('open');
      panel.hidden = true;
      if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') returnFocus.focus();
    }
    function open() {
      var existing = read();
      panel.querySelector('#cafpc-analytics').checked = !!(existing && existing.analytics);
      panel.querySelector('#cafpc-marketing').checked = !!(existing && existing.marketing);
      settings.hidden = true; saveButton.hidden = true;
      if (panel.open) return;
      returnFocus = document.activeElement;
      panel.hidden = false;
      if (typeof panel.showModal === 'function') panel.showModal();
      else panel.setAttribute('open', '');
      panel.querySelector('[data-action="settings"]').focus();
    }
    panel.addEventListener('click', function (event) {
      var action = event.target && event.target.getAttribute('data-action');
      if (action === 'reject') { save(false, false); close(); }
      if (action === 'accept') { save(true, true); close(); }
      if (action === 'settings') { settings.hidden = false; saveButton.hidden = false; }
      if (action === 'save') { save(panel.querySelector('#cafpc-analytics').checked, panel.querySelector('#cafpc-marketing').checked); close(); }
    });
    // Escape dismisses the notice without granting optional consent.
    panel.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
    reopen.addEventListener('click', open);
    if (read()) close(); else open();
  }
  window.CAFPCConsent = { read: read, save: save, open: function () { var button = document.querySelector('.cafpc-cookie-reopen'); if (button) button.click(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}());
