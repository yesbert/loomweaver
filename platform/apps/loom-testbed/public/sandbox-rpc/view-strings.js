globalThis.sandboxViewStrings = {
  en: {
    badge: 'sandboxed · non-Angular',
    ticking: 'Seconds counted while this panel was on screen: ',
    idle: ' — paused, because the workbench says this panel is not being shown.',
    badgeTip:
      'This whole panel runs in its own <iframe sandbox> — opaque origin, no host DOM access.',
    title: 'Hello from an isolated iframe 👋',
    hint: 'Sub-tabs below are navigable and reflected in the route:',
    session: 'Session',
    signedIn: 'signed in',
    signedOut: 'signed out',
    adminOnly:
      'Admin-only surface content — the plugin drew this itself because the host pushed a session with the admin role.',
    keep: 'Keep open',
    shared: 'Shared scratch note (this plugin, every surface)',
    ctxHint:
      'Right-click anywhere in this panel — the menu is drawn INSIDE the iframe, not by the host.',
    kitHint:
      'Host primitives from /frame-kit/ — elements + classes drawn by the kit, not by this plugin:',
    kitButton: 'Kit button',
    kitClicked:
      'The <lw-button> click was handled in-process — element, paint and icons all come from /frame-kit/.',
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
    badgeTip:
      'Dieses ganze Panel läuft in einem eigenen <iframe sandbox> — opaque origin, kein Host-DOM-Zugriff.',
    title: 'Hallo aus einem isolierten iframe 👋',
    hint: 'Die Sub-Tabs unten sind annavigierbar und spiegeln sich in der Route:',
    session: 'Sitzung',
    signedIn: 'angemeldet',
    signedOut: 'abgemeldet',
    adminOnly:
      'Admin-only-Surface-Inhalt — das Plugin hat ihn selbst gezeichnet, weil der Wirt eine Sitzung mit der Admin-Rolle gepusht hat.',
    keep: 'Offen halten',
    shared: 'Gemeinsame Notiz (dieses Plugin, alle Flächen)',
    ctxHint:
      'Rechtsklick irgendwo in diesem Panel — das Menü wird IM iframe gezeichnet, nicht vom Wirt.',
    kitHint:
      'Host-Primitive aus /frame-kit/ — Elemente + Klassen zeichnet das Kit, nicht dieses Plugin:',
    kitButton: 'Kit-Button',
    kitClicked:
      'Der <lw-button>-Klick wurde in-process behandelt — Element, Paint und Icons kommen aus /frame-kit/.',
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
