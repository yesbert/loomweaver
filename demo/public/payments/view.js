(function () {
  const { OPEN_ITEMS_URL, SETTINGS_KEY, OPEN_COUNT_KEY, DEFAULT_SETTINGS } = globalThis.PaymentsShared;
  const STRINGS = globalThis.PaymentsStrings;
  const matching = globalThis.PaymentsMatching;
  const ACCOUNTING_ROLE = 'accounting';
  let settings = { ...DEFAULT_SETTINGS };

  const LOCALES = { de: 'de-DE', en: 'en-GB' };

  const app = document.getElementById('app');
  const decisions = new Map();

  let state = { locale: 'en', session: { authenticated: false, roles: [] } };
  let openItems = null;
  let surfaceHost;
  let failed = false;

  function strings() {
    return STRINGS[state.locale] ?? STRINGS.en;
  }

  function money(cents) {
    return new Intl.NumberFormat(LOCALES[state.locale] ?? LOCALES.en, {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  }

  function day(iso) {
    return new Intl.DateTimeFormat(LOCALES[state.locale] ?? LOCALES.en, {
      dateStyle: 'medium',
    }).format(new Date(iso));
  }

  function escapeHtml(text) {
    const holder = document.createElement('div');
    holder.textContent = String(text);
    return holder.innerHTML;
  }








  function outcomeBadge(line) {
    const decision = decisions.get(line.id);
    if (decision) {
      const tone = decision === 'accepted' ? 'lw-badge--success' : '';
      return (
        '<span class="lw-badge ' +
        tone +
        '" data-testid="outcome-' +
        decision +
        '">' +
        strings().decided[decision] +
        '</span>'
      );
    }
    const outcome = matching.outcomeOf(line, openItems, settings);
    const tone =
      outcome === 'confirmed'
        ? 'lw-badge--success'
        : outcome === 'flagged'
          ? 'lw-badge--danger'
          : '';
    return (
      '<span class="lw-badge ' +
      tone +
      '" data-testid="outcome-' +
      outcome +
      '">' +
      strings().outcome[outcome] +
      '</span>'
    );
  }

  function actionsFor(line) {
    const t = strings();
    if (decisions.has(line.id)) {
      return (
        '<lw-button variant="ghost" size="sm" data-undo="' +
        line.id +
        '">' +
        t.action.undo +
        '</lw-button>'
      );
    }
    if (matching.outcomeOf(line, openItems, settings) === 'unassigned') {
      return '';
    }
    return (
      '<lw-button variant="primary" size="sm" data-confirm="' +
      line.id +
      '">' +
      t.action.confirm +
      '</lw-button>' +
      '<lw-button variant="ghost" size="sm" data-dismiss="' +
      line.id +
      '">' +
      t.action.dismiss +
      '</lw-button>'
    );
  }

  function statementRow(line) {
    return (
      '<li class="row" data-line="' +
      line.id +
      '"><div class="row-head"><span class="payer">' +
      escapeHtml(line.payer) +
      '</span><span class="amount">' +
      money(line.amount) +
      '</span></div><div class="row-meta"><span>' +
      day(line.date) +
      '</span><span class="reference">' +
      escapeHtml(line.reference) +
      '</span></div><div class="row-foot">' +
      outcomeBadge(line) +
      '<span class="actions">' +
      actionsFor(line) +
      '</span></div></li>'
    );
  }

  function openItemRow(item) {
    const settled = matching.settledNumbers(openItems, decisions).includes(item.number);
    return (
      '<li class="row" data-item="' +
      item.number +
      '"><div class="row-head"><span class="payer">' +
      escapeHtml(item.number) +
      '</span><span class="amount">' +
      money(item.open) +
      '</span></div><div class="row-meta"><span>' +
      escapeHtml(item.customer) +
      '</span>' +
      (settled
        ? '<span class="lw-badge lw-badge--success">' + strings().settled + '</span>'
        : '') +
      '</div></li>'
    );
  }

  function header() {
    const t = strings();
    return (
      '<header class="head"><h1>' +
      t.title +
      '</h1><span class="lw-badge lw-badge--brand" data-testid="payments-badge">' +
      t.badge +
      '<lw-tooltip text="' +
      escapeHtml(t.badgeTip) +
      '" position="bottom"></lw-tooltip></span></header>'
    );
  }

  function notice(message, testid) {
    return header() + '<p class="notice" data-testid="' + testid + '">' + message + '</p>';
  }

  function matchingView() {
    const t = strings();
    return (
      header() +
      '<div class="columns"><section><h2>' +
      t.statement +
      '</h2><ul class="rows" data-testid="statement">' +
      matching.shownStatement(settings).map(statementRow).join('') +
      '</ul></section><section><h2>' +
      t.openItems +
      '</h2><ul class="rows" data-testid="open-items">' +
      openItems.map(openItemRow).join('') +
      '</ul><p class="total">' +
      t.stillOpen +
      ': <strong data-testid="still-open">' +
      money(matching.stillOpen(openItems, decisions)) +
      '</strong></p></section></div>'
    );
  }

  function bindActions() {
    app.querySelectorAll('[data-confirm]').forEach((button) => {
      button.addEventListener('click', () => decide(button.dataset.confirm, 'accepted'));
    });
    app.querySelectorAll('[data-dismiss]').forEach((button) => {
      button.addEventListener('click', () => decide(button.dataset.dismiss, 'dismissed'));
    });
    app.querySelectorAll('[data-undo]').forEach((button) => {
      button.addEventListener('click', () => {
        decisions.delete(button.dataset.undo);
        render();
      });
    });
  }


  function publishOpenCount() {
    if (surfaceHost && openItems) {
      surfaceHost.stateSet(OPEN_COUNT_KEY, matching.openCount(openItems, decisions));
    }
  }

  function decide(lineId, decision) {
    decisions.set(lineId, decision);
    render();
  }

  function render() {
    const t = strings();
    const session = state.session ?? { authenticated: false, roles: [] };
    const roles = session.roles ?? [];

    if (!session.authenticated) {
      app.innerHTML = notice(t.signIn, 'payments-sign-in');
      return;
    }
    if (!roles.includes(ACCOUNTING_ROLE)) {
      const message =
        roles.length === 0
          ? t.noRole
          : t.wrongRole.replace('{{roles}}', escapeHtml(roles.join(', ')));
      app.innerHTML = notice(message, 'payments-wrong-role');
      return;
    }
    if (failed) {
      app.innerHTML = notice(t.failed, 'payments-failed');
      return;
    }
    if (openItems === null) {
      app.innerHTML = notice(t.loading, 'payments-loading');
      return;
    }
    matching.applyAutoConfirm(openItems, settings, decisions);
    app.innerHTML = matchingView();
    bindActions();
    publishOpenCount();
  }

  function loadOpenItems() {
    fetch(OPEN_ITEMS_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then((items) => {
        openItems = items;
        render();
      })
      .catch((error) => {
        failed = true;
        console.error('[payments] the open items could not be fetched', error);
        render();
      });
  }

  globalThis.Penpal.connect({
    messenger: new globalThis.Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
    methods: {
      stateChanged(key, value) {
        if (key !== SETTINGS_KEY || !value) {
          return;
        }
        settings = { ...DEFAULT_SETTINGS, ...value };
        render();
      },
      render(next) {
        state = {
          locale: next.locale,
          session: next.session ?? { authenticated: false, roles: [] },
        };
        globalThis.LwFrame.applySurfaceState(next);
        render();
      },
    },
  })
    .promise.then((host) => {
      surfaceHost = host;
      return host
        .stateWatch(SETTINGS_KEY)
        .then(() => host.stateWatch(OPEN_COUNT_KEY))
        .then(() => publishOpenCount());
    })
    .catch((error) => {
      console.error('[payments view] host connection failed', error);
    });

  render();
  loadOpenItems();
})();
