(function () {
  const SUB_TABS = ['overview', 'architecture'];

  const STRINGS = {
    en: {
      badge: 'sandboxed · non-Angular',
      ticking: 'Seconds counted while this panel was on screen: ',
      idle: ' — paused, because the workbench says this panel is not being shown.',
      badgeTip: 'This whole panel runs in its own <iframe sandbox> — opaque origin, no host DOM access.',
      title: 'Hello from an isolated iframe 👋',
      hint: 'Sub-tabs below are navigable and reflected in the route:',
      session: 'Session',
      signedOut: 'signed out',
      adminOnly: 'Admin-only surface content — the plugin drew this itself because the host pushed a session with the admin role.',
      keep: 'Keep open',
      shared: 'Shared scratch note (this plugin, every surface)',
      ctxHint: 'Right-click anywhere in this panel — the menu is drawn INSIDE the iframe, not by the host.',
      kitHint: 'Host primitives from /frame-kit/ — elements + classes drawn by the kit, not by this plugin:',
      kitButton: 'Kit button',
      kitClicked: 'The <lw-button> click was handled in-process — element, paint and icons all come from /frame-kit/.',
      ctx: {
        reveal: 'Reveal iframe context',
        clear: 'Clear',
        revealed:
          'Right-click handled inside the iframe: the plugin drew this menu with the vendored ' +
          '<lw-menu> and handled the choice in-process — no host RPC, no cross-frame coordinates.',
      },
      draft: {
        label: 'Draft (kept while this tab is hidden)',
        placeholder: 'Type here, switch tabs, come back…',
      },
      veto: {
        label: 'Ask before closing (beforeClose veto)',
        question: 'The host wants to close this tab.',
        keep: 'Keep open',
        allow: 'Close it',
      },
      tab: { overview: 'Overview', architecture: 'Architecture' },
      body: {
        overview:
          'This panel is <strong>not Angular</strong> — it runs in its own <code>&lt;iframe sandbox&gt;</code>: ' +
          'own JS context, opaque origin, no access to the host DOM, variables or storage. The host mounted it ' +
          'because the plugin registered a content route with <code>iframe:</code> instead of <code>component:</code>.',
        architecture:
          'Two Penpal channels: a hidden runtime iframe received the <code>ctx</code> that registered this route; ' +
          'this visible surface has its own channel. The host pushes the active language and sub-tab, and the ' +
          'sub-tabs call back into the host router — that is why switching a sub-tab changes the URL ' +
          '(<code>…/sandbox-rpc/architecture</code>) and switching the app language re-renders this text live.',
      },
    },
    de: {
      badge: 'sandboxed · kein Angular',
      ticking: 'Sekunden gezählt, während dieses Panel sichtbar war: ',
      idle: ' — angehalten, weil der Wirt meldet, dass dieses Panel nicht gezeigt wird.',
      badgeTip: 'Dieses ganze Panel läuft in einem eigenen <iframe sandbox> — opaque origin, kein Host-DOM-Zugriff.',
      title: 'Hallo aus einem isolierten iframe 👋',
      hint: 'Die Sub-Tabs unten sind annavigierbar und spiegeln sich in der Route:',
      session: 'Sitzung',
      signedOut: 'abgemeldet',
      adminOnly: 'Admin-only-Surface-Inhalt — das Plugin hat ihn selbst gezeichnet, weil der Wirt eine Sitzung mit der Admin-Rolle gepusht hat.',
      keep: 'Offen halten',
      shared: 'Gemeinsame Notiz (dieses Plugin, alle Flächen)',
      ctxHint: 'Rechtsklick irgendwo in diesem Panel — das Menü wird IM iframe gezeichnet, nicht vom Wirt.',
      kitHint: 'Host-Primitive aus /frame-kit/ — Elemente + Klassen zeichnet das Kit, nicht dieses Plugin:',
      kitButton: 'Kit-Button',
      kitClicked: 'Der <lw-button>-Klick wurde in-process behandelt — Element, Paint und Icons kommen aus /frame-kit/.',
      ctx: {
        reveal: 'iframe-Kontext zeigen',
        clear: 'Löschen',
        revealed:
          'Rechtsklick im iframe behandelt: das Plugin hat dieses Menü mit dem vendored <lw-menu> ' +
          'gezeichnet und die Auswahl in-process behandelt — kein Host-RPC, keine Cross-Frame-Koordinaten.',
      },
      draft: {
        label: 'Entwurf (bleibt erhalten, solange dieser Tab versteckt ist)',
        placeholder: 'Hier tippen, Tab wechseln, zurückkommen…',
      },
      veto: {
        label: 'Vor dem Schließen fragen (beforeClose-Veto)',
        question: 'Der Wirt möchte diesen Tab schließen.',
        keep: 'Offen halten',
        allow: 'Schließen',
      },
      tab: { overview: 'Überblick', architecture: 'Architektur' },
      body: {
        overview:
          'Dieses Panel ist <strong>kein Angular</strong> — es läuft in einem eigenen <code>&lt;iframe sandbox&gt;</code>: ' +
          'eigener JS-Kontext, opaque origin, kein Zugriff auf DOM, Variablen oder Storage des Wirts. Der Wirt hat es ' +
          'gemountet, weil das Plugin eine Content-Route mit <code>iframe:</code> statt <code>component:</code> registriert hat.',
        architecture:
          'Zwei Penpal-Kanäle: ein verstecktes Runtime-iframe bekam den <code>ctx</code>, der diese Route registriert hat; ' +
          'diese sichtbare Surface hat einen eigenen Kanal. Der Wirt pusht die aktive Sprache und den Sub-Tab, und die ' +
          'Sub-Tabs rufen in den Wirt-Router zurück — deshalb ändert ein Sub-Tab-Wechsel die URL ' +
          '(<code>…/sandbox-rpc/architecture</code>) und ein Sprachwechsel rendert diesen Text live neu.',
      },
    },
  };

  let state = {
    locale: 'en',
    tab: 'overview',
    preview: false,
    session: { authenticated: false, roles: [] },
  };

  function strings() {
    return STRINGS[state.locale] || STRINGS.en;
  }

  globalThis.LwFrame.setIcon(
    'testbed-sparkle',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/></svg>',
  );

  let draft = '';
  let onScreenSeconds = 0;
  let ticker = null;

  function followVisibility(shown) {
    if (shown === false) {
      if (ticker !== null) {
        clearInterval(ticker);
        ticker = null;
      }
      return;
    }
    if (ticker === null) {
      ticker = setInterval(function () {
        onScreenSeconds += 1;
        render();
      }, 1000);
    }
  }

  const shared = globalThis.LwFrame.state.watch('scratch');
  shared.onChange(function () {
    render();
  });

  function activeTab() {
    return SUB_TABS.includes(state.tab) ? state.tab : SUB_TABS[0];
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function render() {
    const t = strings();
    const current = activeTab();
    const app = document.getElementById('app');
    const tabs = SUB_TABS.map(function (key) {
      return (
        '<button class="tab" role="tab" data-tab="' +
        key +
        '" aria-selected="' +
        (key === current) +
        '">' +
        t.tab[key] +
        '</button>'
      );
    }).join('');
    const keep = state.preview
      ? '<button class="keep" type="button" data-keep>' + t.keep + '</button>'
      : '';
    const roles = state.session?.roles ?? [];
    const sessionText = escapeHtml(
      state.session?.authenticated ? roles.join(', ') || 'signed in' : t.signedOut,
    );
    const sessionLine =
      '<p style="font-size:0.85rem;color:var(--lw-content-muted,#64748b)">' +
      t.session +
      ': <strong data-testid="sandbox-session">' +
      sessionText +
      '</strong></p>';
    const tickerLine =
      '<p style="font-size:0.85rem;color:var(--lw-content-muted,#64748b)">' +
      t.ticking +
      '<strong data-testid="sandbox-onscreen">' +
      onScreenSeconds +
      '</strong>' +
      (state.shown === false ? escapeHtml(t.idle) : '') +
      '</p>';
    const adminBlock = roles.includes('admin')
      ? '<p data-testid="sandbox-admin" style="margin-top:0.75rem;padding:0.6rem 0.8rem;border-radius:0.375rem;' +
        'background:color-mix(in srgb,var(--lw-brand,#2e96c9) 12%,transparent)">' +
        t.adminOnly +
        '</p>'
      : '';
    app.innerHTML =
      '<span class="badge">' +
      t.badge +
      '<lw-tooltip text="' +
      t.badgeTip.replaceAll('"', '&quot;') +
      '" position="bottom"></lw-tooltip></span>' +
      keep +
      '<h1>' +
      t.title +
      '</h1><p>' +
      t.hint +
      '</p><div class="tabs" role="tablist">' +
      tabs +
      '</div><div class="body">' +
      t.body[current] +
      '</div>' +
      '<p style="margin-top:1.25rem;font-size:0.85rem;color:var(--lw-content-muted,#64748b)">' +
      t.kitHint +
      '</p>' +
      '<div class="kit-strip" data-testid="frame-kit-strip">' +
      '<lw-icon name="plugin" size="1.25rem" aria-hidden="true" data-testid="frame-kit-icon"></lw-icon>' +
      '<lw-icon name="testbed-sparkle" size="1.25rem" aria-hidden="true" data-testid="frame-kit-own-icon"></lw-icon>' +
      '<lw-button variant="primary" size="sm" data-testid="frame-kit-button">' +
      t.kitButton +
      '</lw-button>' +
      '<span class="lw-badge lw-badge--brand" data-testid="frame-kit-badge">kit</span>' +
      '<lw-progress-ring value="72" max="100" size="2rem" aria-label="72%" data-testid="frame-kit-ring"></lw-progress-ring>' +
      '</div>' +
      sessionLine +
      tickerLine +
      adminBlock +
      '<label style="display:block;margin-top:1rem;font-size:0.85rem">' +
      t.draft.label +
      '<input type="text" class="lw-field" data-testid="sandbox-draft" ' +
      'style="margin-top:0.35rem;width:100%" placeholder="' +
      escapeHtml(t.draft.placeholder) +
      '" value="' +
      escapeHtml(draft) +
      '"></label>' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-top:1rem;font-size:0.85rem">' +
      '<input type="checkbox" class="lw-checkbox" data-testid="sandbox-veto-toggle"' +
      (vetoArmed ? ' checked' : '') +
      '> ' +
      t.veto.label +
      '</label>' +
      '<label style="display:block;margin-top:1rem;font-size:0.85rem">' +
      t.shared +
      '<input type="text" class="lw-field" data-testid="sandbox-scratch" ' +
      'style="margin-top:0.35rem;width:100%" value="' +
      escapeHtml(shared.loaded() ? (shared.value()?.note ?? '') : '') +
      '"></label>' +
      '<p class="ctx-hint" style="margin-top:1.25rem;font-size:0.85rem;color:var(--lw-content-muted,#64748b)">' +
      t.ctxHint +
      '</p>';
    app
      .querySelector('[data-testid="sandbox-draft"]')
      .addEventListener('input', function (event) {
        draft = event.target.value;
        callHost(function (remote) {
          return remote.setDirty(draft.length > 0);
        });
      });
    app
      .querySelector('[data-testid="sandbox-scratch"]')
      .addEventListener('input', function (event) {
        shared.set({ note: event.target.value });
      });
    app
      .querySelector('[data-testid="sandbox-veto-toggle"]')
      .addEventListener('change', function (event) {
        vetoArmed = event.target.checked;
      });
    const keepButton = app.querySelector('[data-keep]');
    if (keepButton) {
      keepButton.addEventListener('click', keepHost);
    }
    app.querySelector('[data-testid="frame-kit-button"]')?.addEventListener('click', function () {
      document.getElementById('ctx-note').textContent = strings().kitClicked;
    });
    app.querySelectorAll('.tab').forEach(function (button) {
      button.addEventListener('click', function () {
        navigateHost(button.dataset.tab);
      });
    });
  }

  function callHost(invoke) {
    connection.promise.then(invoke).catch(function () {
    });
  }

  function keepHost() {
    callHost(function (remote) {
      return remote.keep();
    });
  }

  function navigateHost(tab) {
    callHost(function (remote) {
      return remote.navigate('sandbox-rpc/' + tab);
    });
  }

  let vetoArmed = false;

  function vetoButton(spec, finish) {
    const button = document.createElement('button');
    button.dataset.testid = spec[0];
    button.textContent = spec[1];
    button.className = 'lw-btn ' + (spec[2] ? 'lw-btn--danger' : 'lw-btn--default');
    button.addEventListener('click', function () {
      finish(spec[2]);
    });
    return button;
  }

  function askBeforeClose() {
    if (!vetoArmed) {
      return Promise.resolve(true);
    }
    return new Promise(function (resolve) {
      const t = strings().veto;
      const overlay = document.createElement('div');
      overlay.dataset.testid = 'sandbox-veto-overlay';
      overlay.style.cssText =
        'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'gap:0.75rem;background:color-mix(in srgb,var(--lw-scrim,#0f172a) 60%,transparent)';
      const question = document.createElement('p');
      question.textContent = t.question;
      question.style.cssText =
        'background:var(--lw-surface-raised,#fff);padding:0.6rem 1rem;border-radius:0.375rem';
      const buttons = document.createElement('div');
      buttons.style.cssText = 'display:flex;gap:0.5rem';
      const finish = function (answer) {
        overlay.remove();
        resolve(answer);
      };
      [
        ['sandbox-veto-keep', t.keep, false],
        ['sandbox-veto-allow', t.allow, true],
      ].forEach(function (spec) {
        buttons.appendChild(vetoButton(spec, finish));
      });
      overlay.appendChild(question);
      overlay.appendChild(buttons);
      document.body.appendChild(overlay);
    });
  }

  let openMenu = null;

  function closeMenu() {
    if (openMenu) {
      document.removeEventListener('pointerdown', onOutside, true);
      openMenu.remove();
      openMenu = null;
    }
  }

  function onOutside(event) {
    if (openMenu && !openMenu.contains(event.target)) {
      closeMenu();
    }
  }

  function onMenuSelect(command) {
    closeMenu();
    const note = document.getElementById('ctx-note');
    if (!note) return;
    note.textContent = command === 'reveal' ? strings().ctx.revealed : '';
  }

  function openContextMenu(x, y) {
    closeMenu();
    const t = strings();
    const menu = document.createElement('lw-menu');
    [['reveal', t.ctx.reveal], ['clear', t.ctx.clear]].forEach(function (pair) {
      const item = document.createElement('lw-menu-item');
      item.setAttribute('command', pair[0]);
      item.setAttribute('label', pair[1]);
      menu.appendChild(item);
    });
    document.body.appendChild(menu);
    menu.openAt(x, y);
    openMenu = menu;
    menu.addEventListener('lw-menu-select', function (e) {
      onMenuSelect(e.detail.command);
    });
    menu.addEventListener('lw-menu-dismiss', closeMenu);
    setTimeout(function () {
      document.addEventListener('pointerdown', onOutside, true);
    });
  }

  document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    openContextMenu(event.clientX, event.clientY);
  });

  const connection = globalThis.Penpal.connect({
    messenger: new globalThis.Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
    methods: {
      render: function (next) {
        state = {
          locale: next.locale,
          tab: next.tab,
          preview: next.preview === true,
          shown: next.shown !== false,
          session: next.session || { authenticated: false, roles: [] },
        };
        followVisibility(state.shown);
        globalThis.LwFrame.applySurfaceState(next);
        render();
      },
      beforeClose: askBeforeClose,
      stateChanged: function (key, value, loaded) {
        globalThis.LwFrame.state.apply(key, value, loaded);
      },
    },
  });

  connection.promise.then(function (host) {
    globalThis.LwFrame.connectState(host);
  });

  connection.promise.catch(function (error) {
    console.error('[sandbox-rpc view] host connection failed', error);
  });

  render();
})();
