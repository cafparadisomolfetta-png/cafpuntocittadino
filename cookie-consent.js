/* CAF Punto Cittadino: gestione consenso cookie, modulo pronto per integrazione.
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
    style.textContent = '.cafpc-cookie-panel{position:fixed;z-index:2147483645;inset:auto 12px 12px;max-width:520px;margin:auto;background:#fff;color:#14253c;border:1px solid #ccd5e2;border-radius:16px;box-shadow:0 12px 40px #14253c44;padding:22px;font:inherit}.cafpc-cookie-panel[hidden]{display:none}.cafpc-cookie-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.cafpc-cookie-panel button{cursor:pointer;padding:10px 14px;border:1px solid #22466d;border-radius:8px;background:#fff;color:#14253c;font:inherit}.cafpc-cookie-panel button:focus-visible{outline:3px solid #2b75d0;outline-offset:2px}.cafpc-cookie-panel a{color:#164b83}.cafpc-cookie-settings{margin-top:12px}.cafpc-cookie-settings label{display:block;margin:10px 0}.cafpc-cookie-reopen{position:fixed;z-index:2147483644;bottom:12px;left:12px;border:1px solid #ccd5e2;border-radius:999px;padding:8px 12px;background:#fff;color:#14253c;font:inherit;cursor:pointer}';
    document.head.appendChild(style);
    var panel = document.createElement('section');
    panel.id = 'cafpc-cookie-panel';
    panel.className = 'cafpc-cookie-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Preferenze cookie');
    panel.innerHTML = '<strong>La tua privacy è importante</strong><p>Utilizziamo strumenti necessari al funzionamento del sito. Eventuali cookie statistici e di marketing saranno attivati soltanto con il tuo consenso. Puoi scegliere o cambiare idea in qualsiasi momento.</p><p><a href="/privacy.html">Informativa privacy</a> · <a href="/cookie.html">Informativa cookie</a></p><div class="cafpc-cookie-settings" hidden><label><input type="checkbox" checked disabled> Cookie necessari (sempre attivi)</label><label><input id="cafpc-analytics" type="checkbox"> Statistiche facoltative</label><label><input id="cafpc-marketing" type="checkbox"> Marketing facoltativo</label></div><div class="cafpc-cookie-actions"><button type="button" data-action="reject">Rifiuta facoltativi</button><button type="button" data-action="accept">Accetta tutti</button><button type="button" data-action="settings">Personalizza</button><button type="button" data-action="save" hidden>Salva preferenze</button></div>';
    var reopen = document.createElement('button');
    reopen.type = 'button';
    reopen.className = 'cafpc-cookie-reopen';
    reopen.textContent = 'Preferenze cookie';
    reopen.setAttribute('aria-label', 'Modifica preferenze cookie');
    document.body.appendChild(panel);
    document.body.appendChild(reopen);
    var settings = panel.querySelector('.cafpc-cookie-settings');
    var saveButton = panel.querySelector('[data-action="save"]');
    function close() { panel.hidden = true; }
    function open() {
      var existing = read();
      panel.querySelector('#cafpc-analytics').checked = !!(existing && existing.analytics);
      panel.querySelector('#cafpc-marketing').checked = !!(existing && existing.marketing);
      settings.hidden = true; saveButton.hidden = true; panel.hidden = false;
    }
    panel.addEventListener('click', function (event) {
      var action = event.target && event.target.getAttribute('data-action');
      if (action === 'reject') { save(false, false); close(); }
      if (action === 'accept') { save(true, true); close(); }
      if (action === 'settings') { settings.hidden = false; saveButton.hidden = false; }
      if (action === 'save') { save(panel.querySelector('#cafpc-analytics').checked, panel.querySelector('#cafpc-marketing').checked); close(); }
    });
    reopen.addEventListener('click', open);
    if (read()) close(); else open();
  }
  window.CAFPCConsent = { read: read, save: save, open: function () { var button = document.querySelector('.cafpc-cookie-reopen'); if (button) button.click(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}());
