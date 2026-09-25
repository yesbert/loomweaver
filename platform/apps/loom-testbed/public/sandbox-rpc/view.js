(function () {
  const SUB_TABS = ['overview', 'architecture'];
  const STRINGS = globalThis.sandboxViewStrings;

  const page = {
    locale: 'en',
    tab: 'overview',
    preview: false,
    shown: true,
    session: { authenticated: false, roles: [] },
    vetoArmed: false,
    onScreenSeconds: 0,
    ticker: null,
  };

  const shared = globalThis.LwFrame.state.watch('scratch');

  globalThis.LwFrame.setIcon(
    'testbed-sparkle',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/></svg>',
  );

  function strings() {
    return STRINGS[page.locale] || STRINGS.en;
  }

  function text(path) {
    return path.split('.').reduce(function (entry, key) {
      return entry[key];
    }, strings());
  }

  function element(testid) {
    return document.querySelector('[data-testid="' + testid + '"]');
  }

  function activeTab() {
    return SUB_TABS.includes(page.tab) ? page.tab : SUB_TABS[0];
  }

  function sharedNote() {
    return shared.loaded() ? (shared.value()?.note ?? '') : '';
  }

  function showTexts() {
    for (const node of document.querySelectorAll('[data-text]')) {
      node.textContent = text(node.dataset.text);
    }
    for (const node of document.querySelectorAll('[data-placeholder]')) {
      node.placeholder = text(node.dataset.placeholder);
    }
    for (const node of document.querySelectorAll('[data-tooltip]')) {
      node.setAttribute('text', text(node.dataset.tooltip));
    }
  }

  function showTab() {
    const current = activeTab();
    for (const button of document.querySelectorAll('.tab')) {
      button.setAttribute(
        'aria-selected',
        String(button.dataset.tab === current),
      );
    }
    document.getElementById('tab-body').innerHTML = strings().body[current];
  }

  function showSession() {
    const roles = page.session.roles ?? [];
    const signedIn = roles.join(', ') || strings().signedIn;
    element('sandbox-session').textContent = page.session.authenticated
      ? signedIn
      : strings().signedOut;
    element('sandbox-admin').hidden = !roles.includes('admin');
  }

  function showOnScreenSeconds() {
    element('sandbox-onscreen').textContent = String(page.onScreenSeconds);
    document.getElementById('idle').hidden = page.shown;
  }

  function showSharedNote() {
    const field = element('sandbox-scratch');
    if (field !== document.activeElement && field.value !== sharedNote()) {
      field.value = sharedNote();
    }
  }

  function render() {
    showTexts();
    showTab();
    showSession();
    showOnScreenSeconds();
    showSharedNote();
    document.querySelector('[data-keep]').hidden = !page.preview;
  }

  function followVisibility() {
    if (!page.shown) {
      clearInterval(page.ticker);
      page.ticker = null;
      return;
    }
    if (page.ticker === null) {
      page.ticker = setInterval(function () {
        page.onScreenSeconds += 1;
        showOnScreenSeconds();
      }, 1000);
    }
  }

  function callHost(invoke) {
    connection.promise.then(invoke).catch(function () {});
  }

  function showContextNote(command) {
    document.getElementById('ctx-note').textContent =
      command === 'reveal' ? strings().ctx.revealed : '';
  }

  function askBeforeClose() {
    return page.vetoArmed
      ? globalThis.askBeforeClosing(strings().veto)
      : Promise.resolve(true);
  }

  element('sandbox-draft').addEventListener('input', function (event) {
    const draft = event.target.value;
    callHost(function (host) {
      return host.setDirty(draft.length > 0);
    });
  });
  element('sandbox-scratch').addEventListener('input', function (event) {
    shared.set({ note: event.target.value });
  });
  element('sandbox-veto-toggle').addEventListener('change', function (event) {
    page.vetoArmed = event.target.checked;
  });
  element('frame-kit-button').addEventListener('click', function () {
    document.getElementById('ctx-note').textContent = strings().kitClicked;
  });
  document.querySelector('[data-keep]').addEventListener('click', function () {
    callHost(function (host) {
      return host.keep();
    });
  });
  for (const button of document.querySelectorAll('.tab')) {
    button.addEventListener('click', function () {
      callHost(function (host) {
        return host.navigate('sandbox-rpc/' + button.dataset.tab);
      });
    });
  }
  document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    globalThis.openContextMenu(
      event.clientX,
      event.clientY,
      [
        { command: 'reveal', label: strings().ctx.reveal },
        { command: 'clear', label: strings().ctx.clear },
      ],
      showContextNote,
    );
  });
  shared.onChange(showSharedNote);

  const connection = globalThis.Penpal.connect({
    messenger: new globalThis.Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
    methods: globalThis.LwFrame.surfaceMethods({
      render: function (next) {
        page.locale = next.locale;
        page.tab = next.tab;
        page.preview = next.preview === true;
        page.shown = next.shown !== false;
        page.session = next.session || { authenticated: false, roles: [] };
        followVisibility();
        globalThis.LwFrame.applySurfaceState(next);
        render();
      },
      beforeClose: askBeforeClose,
      stateChanged: function (key, value, loaded) {
        globalThis.LwFrame.state.apply(key, value, loaded);
      },
    }),
  });

  connection.promise.then(function (host) {
    globalThis.LwFrame.connectState(host);
  });

  connection.promise.catch(function (error) {
    console.error('[sandbox-rpc view] host connection failed', error);
  });

  render();
})();
