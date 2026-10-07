(() => {
  const key = 'arPrivacyChoice';
  const maxAge = 183 * 24 * 60 * 60 * 1000;
  const script = document.currentScript;
  const policyUrl = new URL('../cookie-policy.html', script.src).href;
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved?.version === 1 && typeof saved.maps === 'boolean' && Number.isFinite(saved.at) && Date.now() - saved.at < maxAge && saved.at <= Date.now()) choice = saved;
  } catch {}
  const maps = [...document.querySelectorAll('iframe[data-consent-src]')];
  maps.forEach(frame => {
    const placeholder = document.createElement('div');
    placeholder.className = 'map-consent-placeholder';
    placeholder.innerHTML = '<p>Per visualizzare la mappa è necessario consentire Google Maps.</p><button type="button" data-cookie-settings>Impostazioni privacy</button>';
    frame.before(placeholder);
    frame.hidden = true;
    frame._privacyPlaceholder = placeholder;
  });
  const apply = () => maps.forEach(frame => {
    const allowed = choice?.maps === true;
    if (allowed) frame.setAttribute('src', frame.dataset.consentSrc);
    else frame.removeAttribute('src');
    frame.hidden = !allowed;
    frame._privacyPlaceholder.hidden = allowed;
  });
  const panel = document.createElement('section');
  panel.className = 'privacy-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'privacy-panel-title');
  panel.innerHTML = `<h2 id="privacy-panel-title">La tua privacy</h2><p>Usiamo memoria tecnica per ricordare la tua scelta. Le mappe Google sono facoltative e restano disattivate senza consenso. <a href="${policyUrl}">Cookie Policy</a></p><div data-privacy-custom hidden><label><input type="checkbox" data-privacy-maps> Consenti Google Maps</label><p>Memoria tecnica: sempre attiva per ricordare la scelta.</p></div><div class="privacy-actions"><button type="button" data-privacy-accept>Accetta</button><button type="button" data-privacy-reject>Rifiuta</button><button type="button" data-privacy-personalize>Personalizza</button><button type="button" data-privacy-save hidden>Salva preferenze</button><button type="button" data-privacy-close hidden>Chiudi</button></div>`;
  document.body.append(panel);
  const custom = panel.querySelector('[data-privacy-custom]');
  const checkbox = panel.querySelector('[data-privacy-maps]');
  const save = panel.querySelector('[data-privacy-save]');
  const close = panel.querySelector('[data-privacy-close]');
  let opener = null;
  const open = (personalize = false, trigger = null) => {
    opener = trigger;
    panel.hidden = false;
    custom.hidden = !personalize;
    save.hidden = !personalize;
    checkbox.checked = choice?.maps === true;
    close.hidden = !choice;
    panel.querySelector('[data-privacy-accept]').focus({preventScroll:true});
  };
  const dismiss = () => { panel.hidden = true; opener?.focus({preventScroll:true}); };
  const persist = mapsAllowed => {
    choice = {version:1,at:Date.now(),maps:mapsAllowed};
    try { localStorage.setItem(key,JSON.stringify(choice)); } catch {}
    apply();
    dismiss();
  };
  panel.querySelector('[data-privacy-accept]').onclick = () => persist(true);
  panel.querySelector('[data-privacy-reject]').onclick = () => persist(false);
  panel.querySelector('[data-privacy-personalize]').onclick = () => {custom.hidden=false;save.hidden=false;checkbox.focus();};
  save.onclick = () => persist(checkbox.checked);
  close.onclick = dismiss;
  panel.addEventListener('keydown', event => {if(event.key==='Escape' && choice) dismiss();});
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-cookie-settings]');
    if(trigger) open(true,trigger);
  });
  apply();
  if (!choice) open();
})();
