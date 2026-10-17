import {STUDIO_CONFIG} from './config.js';
const APP_NAME = STUDIO_CONFIG.organizationName || STUDIO_CONFIG.productName;
const UPDATE_TIMEOUT = 15000;
const VERSION_TIMEOUT = 4000;
const RESET_WARNING = `Updating reloads ${APP_NAME}. All session-only drafts, review approvals, added observations, provider selections and disposable API keys will be reset. Nothing is saved. Continue?`;

export function initPwa({isBusy = () => false, updateWarning = RESET_WARNING,
  onState = () => {}, updateLabel = 'Update available', confirmLabel = null} = {}) {
  const buildId = document.body.dataset.buildId;
  const create = (tag, className, text, id) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    if (id) node.id = id;
    return node;
  };
  const button = (text, id, primary = false) => {
    const node = create('button', `btn ${primary ? 'btn-primary' : 'btn-outline'}`, text, id);
    node.type = 'button';
    return node;
  };
  const controls = create('section', 'pwa-controls');
  controls.setAttribute('aria-label', 'App installation and offline status');
  const status = create('p', 'pwa-status', '', 'pwa-status');
  status.setAttribute('role', 'status');
  const actions = create('div', 'pwa-actions');
  const updateButton = button('Update available', 'pwa-update-button');
  const installButton = button('Install app', 'pwa-install-button');
  updateButton.hidden = true;
  installButton.hidden = true;
  actions.append(updateButton, installButton);
  controls.append(status, actions);
  (document.getElementById('pwa-controls-host') || document.body).append(controls);

  const dialog = create('dialog', 'pwa-dialog modal', '', 'pwa-update-dialog');
  const heading = create('h2', '', `Update ${APP_NAME}`, 'pwa-update-heading');
  dialog.setAttribute('aria-labelledby', heading.id);
  const warning = create('p', '', updateWarning, 'pwa-update-warning');
  dialog.setAttribute('aria-describedby', warning.id);
  const message = create('p', 'pwa-notice', '', 'pwa-update-message');
  message.setAttribute('role', 'status');
  const confirm = button('Update and reset session', 'pwa-confirm-update', true);
  const cancel = button('Keep this session', 'pwa-cancel-update');
  const dialogActions = create('div', 'pwa-dialog-actions pwa-actions');
  dialogActions.append(cancel, confirm);
  dialog.append(heading, warning, message, dialogActions);
  const loader = create('dialog', 'pwa-loader modal', '', 'pwa-update-loader');
  loader.setAttribute('aria-labelledby', 'pwa-loader-heading');
  loader.setAttribute('aria-describedby', 'pwa-loader-description');
  loader.append(create('span', 'pwa-loader-mark'), create('h2', '', APP_NAME, 'pwa-loader-heading'), create('p', '', 'Updating the app. Please wait…', 'pwa-loader-description'));
  loader.addEventListener('cancel', event => event.preventDefault());
  document.body.append(dialog, loader);

  let registration;
  let cacheReady = false;
  let detail = 'Setting up offline shell…';
  let waiting = null;
  let refreshRequired = false;
  let optedIn = false;
  let activationTarget = null;
  let reloading = false;
  let timer;
  let versionCheck = 0;
  let previousController = navigator.serviceWorker?.controller || null;
  let installPrompt = null;

  function renderStatus() {
    const connection = navigator.onLine === false ? 'Offline' : 'Online';
    status.textContent = `${connection} · Build ${buildId && buildId !== '__BUILD_ID__' ? buildId : 'source preview'} · ${detail}${navigator.onLine === false ? ' Remote AI is unavailable; Offline Mock remains an explicit choice.' : ''}`;
    updateButton.hidden = !waiting && !refreshRequired;
    updateButton.textContent = refreshRequired ? 'Reload updated app' : updateLabel;
    updateButton.disabled = optedIn;
    onState({ online: navigator.onLine !== false, cacheReady,
      updateAvailable: Boolean(waiting || refreshRequired), detail });
  }
  function closeDialog(node) { if (node.open) node.close(); }
  function showDialog(node) {
    if (!node.open) node.showModal();
  }
  function versionOf(worker) {
    return new Promise((resolve, reject) => {
      if (!worker) return reject(new Error('No active offline worker.'));
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); reject(new Error('Offline worker did not respond.')); }, VERSION_TIMEOUT);
      channel.port1.onmessage = event => {
        clearTimeout(timeout);
        channel.port1.close();
        if (event.data?.type === 'VERSION') resolve(event.data);
        else reject(new Error('Offline worker returned an invalid version.'));
      };
      try { worker.postMessage({type: 'GET_VERSION'}, [channel.port2]); }
      catch (error) { clearTimeout(timeout); channel.port1.close(); reject(error); }
    });
  }
  async function inspectController() {
    const check = ++versionCheck;
    const controller = navigator.serviceWorker.controller;
    try {
      const version = await versionOf(controller);
      if (check !== versionCheck || controller !== navigator.serviceWorker.controller) return;
      cacheReady = version.cacheReady === true;
      detail = cacheReady ? 'Ready · offline shell available.' : 'Cache setup error · offline shell incomplete. Reconnect and reload to repair.';
      if (version.buildId !== buildId) refreshRequired = true;
    } catch {
      if (check !== versionCheck) return;
      cacheReady = false;
      detail = 'Offline availability could not be verified. Reconnect and reload to retry.';
    }
    renderStatus();
  }
  function failUpdate(text) {
    clearTimeout(timer);
    optedIn = false;
    closeDialog(loader);
    waiting = registration?.waiting || null;
    message.textContent = text;
    renderStatus();
    showDialog(dialog);
    confirm.textContent = confirmLabel || 'Retry update and reset';
  }
  function reload() {
    if (!optedIn || reloading) return;
    reloading = true;
    clearTimeout(timer);
    window.location.reload();
  }
  function busyWarning() {
    message.textContent = 'Generation is still running. Wait for it to finish before updating; your session has not been reset.';
  }
  function requestUpdate() {
    if (optedIn) return;
    message.textContent = '';
    confirm.textContent = confirmLabel
      || (refreshRequired ? 'Reload and reset session' : 'Update and reset session');
    showDialog(dialog);
    if (isBusy()) busyWarning();
  }
  async function confirmUpdate() {
    if (optedIn || reloading) return;
    if (isBusy()) { busyWarning(); return; }
    optedIn = true;
    activationTarget = null;
    closeDialog(dialog);
    showDialog(loader);
    renderStatus();
    timer = setTimeout(() => failUpdate('The update did not finish in time. Your session has not been reset. Check your connection and retry.'), UPDATE_TIMEOUT);
    try {
      waiting = registration?.waiting || null;
      if (waiting) {
        // Only this explicit confirmation is permitted to activate a waiting release.
        activationTarget = waiting;
        waiting.postMessage({type: 'SKIP_WAITING'});
      } else if (refreshRequired && navigator.serviceWorker.controller) {
        // Another tab already activated it. Its controllerchange was observed, not an auto-reload.
        const version = await versionOf(navigator.serviceWorker.controller);
        if (!optedIn) return;
        if (version.buildId !== buildId && version.cacheReady) reload();
        else failUpdate('No complete new release is ready yet. Your session is unchanged. Retry after the update finishes.');
      } else {
        failUpdate('No waiting update is available. Your session is unchanged. Reconnect and check again.');
        registration?.update().catch(() => {});
      }
    } catch {
      failUpdate('The update could not be activated. Your session is unchanged. Reconnect and retry.');
    }
  }
  updateButton.addEventListener('click', requestUpdate);
  confirm.addEventListener('click', confirmUpdate);
  cancel.addEventListener('click', () => closeDialog(dialog));
  window.addEventListener('online', renderStatus);
  window.addEventListener('offline', renderStatus);

  function displayInstallGuidance() {
    message.textContent = 'On iPhone or iPad, open this site in Safari, choose Share, then Add to Home Screen if available. Other browsers may offer Install app in their menu. Installation availability depends on your browser and device.';
    const guidance = create('dialog', 'pwa-dialog modal', '', 'pwa-install-dialog');
    guidance.setAttribute('aria-label', `Install ${APP_NAME}`);
    const done = button('Close', 'pwa-install-close');
    done.addEventListener('click', () => { guidance.close(); guidance.remove(); });
    guidance.addEventListener('close', () => guidance.remove());
    guidance.append(create('h2', '', `Add ${APP_NAME} to your device`), create('p', '', message.textContent), done);
    document.body.append(guidance);
    showDialog(guidance);
  }
  installButton.addEventListener('click', async () => {
    if (!installPrompt) { displayInstallGuidance(); return; }
    const prompt = installPrompt;
    installPrompt = null;
    installButton.disabled = true;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      detail = 'Install prompt unavailable. Use your browser menu if installation is supported.';
      renderStatus();
    } finally {
      installButton.disabled = false;
      installButton.hidden = true;
    }
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installButton.hidden = true;
  });
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!standalone && ios) {
    installButton.textContent = 'Add to Home Screen';
    installButton.hidden = false;
  }

  if (!('serviceWorker' in navigator)) {
    detail = 'Offline installation is not supported by this browser. The online demo remains available.';
    renderStatus();
    return;
  }
  if (!buildId || buildId === '__BUILD_ID__') {
    detail = 'Source preview only. Run npm run build and serve dist to enable installation and offline support.';
    renderStatus();
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const controller = navigator.serviceWorker.controller;
    const changedFromExisting = previousController && controller !== previousController;
    previousController = controller;
    waiting = registration?.waiting || null;
    if (changedFromExisting) refreshRequired = true;
    if (optedIn && controller && (controller === activationTarget || (!activationTarget && changedFromExisting))) {
      reload();
      return;
    }
    // First installation claims this page without resetting the memory-only session.
    inspectController();
    renderStatus();
  });
  function watchWorker(worker) {
    if (!worker) return;
    const stateChanged = () => {
      if (worker.state === 'installed') {
        waiting = registration.waiting;
        if (waiting && navigator.serviceWorker.controller) {
          detail = cacheReady ? 'Ready · offline shell available. An update is waiting.' : 'An update is waiting; offline readiness is being checked.';
        }
        renderStatus();
      } else if (worker.state === 'redundant') {
        detail = 'Cache setup error · installation failed. Reconnect and reload to retry; any previous offline release remains available.';
        renderStatus();
        if (optedIn) failUpdate('The new release could not be installed. Your session is unchanged. Reconnect and retry.');
      } else if (worker.state === 'activated' && !navigator.serviceWorker.controller) {
        detail = 'Offline release installed; waiting for control of this page.';
        renderStatus();
      }
    };
    worker.addEventListener('statechange', stateChanged);
    stateChanged();
  }
  renderStatus();
  navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), {updateViaCache: 'none'})
    .then(result => {
      registration = result;
      waiting = registration.waiting;
      watchWorker(registration.installing);
      registration.addEventListener('updatefound', () => watchWorker(registration.installing));
      if (navigator.serviceWorker.controller) inspectController();
      else if (!registration.installing && !registration.active) {
        detail = 'Offline shell unavailable. Connect to the internet and reload to finish installation.';
      }
      renderStatus();
    })
    .catch(() => {
      detail = 'Cache setup error · service worker registration failed. Use HTTPS or localhost, reconnect and reload to retry.';
      renderStatus();
    });
}
