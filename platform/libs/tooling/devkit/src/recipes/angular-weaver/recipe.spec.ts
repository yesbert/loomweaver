import { generate } from '../../lib/generate/generate';
import { validateI18nParity } from '../../lib/validate/i18n';
import { angularWeaver, resolveWeaverInput } from './recipe';

describe('angularWeaver recipe', () => {
  it('rejects a non-kebab id', () => {
    expect(() => resolveWeaverInput({ id: 'Notes' })).toThrow(/kebab-case/);
  });

  it('defaults the name and capabilities from the id', () => {
    const w = resolveWeaverInput({ id: 'my-notes' });
    expect(w.name).toBe('My Notes');
    expect(w.className).toBe('MyNotes');
    expect(w.propertyName).toBe('myNotes');
    expect(w.capabilities).toEqual(['contributions', 'navigation']);
  });

  it('produces a deterministic weaver source tree', () => {
    const files = generate(angularWeaver, { id: 'notes', name: 'Notes' });
    expect(Object.keys(files).toSorted((a, b) => a.localeCompare(b))).toEqual(
      [
        'README.md',
        'src/index.ts',
        'src/lib/i18n/de.json',
        'src/lib/i18n/en.json',
        'src/lib/plugin/notes.plugin.spec.ts',
        'src/lib/plugin/notes.plugin.ts',
        'src/lib/views/notes-view.html',
        'src/lib/views/notes-view.ts',
      ].toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('wires the plugin manifest, surface and rail item', () => {
    const files = generate(angularWeaver, { id: 'notes', name: 'Notes' });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];
    expect(plugin).toContain("id: 'notes'");
    expect(plugin).toContain("name: 'Notes'");
    expect(plugin).toContain("capabilities: ['contributions', 'navigation']");
    expect(plugin).toContain('ctx.registerSurface(');
    expect(plugin).toContain("routable: { path: 'notes' }");
    expect(plugin).toContain('ctx.registerRailItem(');
    expect(plugin).toContain("ctx.navigateContent('notes')");
    expect(files['src/index.ts']).toBe(
      "export { notesPlugin } from './lib/plugin/notes.plugin';\n",
    );
    expect(JSON.parse(files['src/lib/i18n/en.json'])).toEqual({
      title: 'Notes',
    });
  });

  it('gives chrome items collision-safe ids distinct from surface and command ids', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { barItem: true, about: true },
    });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];
    expect(plugin).toContain("id: 'notes.rail'");
    expect(plugin).toContain("id: 'notes.bar'");
    expect(plugin).toContain("id: 'notes.rail.about'");
  });

  it('exposes an Angular view component with an lw- selector', () => {
    const files = generate(angularWeaver, { id: 'notes', name: 'Notes' });
    const view = files['src/lib/views/notes-view.ts'];
    expect(view).toContain('export class NotesView');
    expect(view).toContain("selector: 'lw-notes-view'");
    expect(view).not.toContain('ChangeDetectionStrategy');
    expect(view).toContain("templateUrl: './notes-view.html'");
    expect(files['src/lib/views/notes-view.html']).toContain('Notes');
  });

  it('keeps VIEW_STATE out of the routable default, where injecting it would throw', () => {
    const files = generate(angularWeaver, { id: 'notes', name: 'Notes' });
    expect(files['src/lib/views/notes-view.ts']).not.toContain('VIEW_STATE');
    expect(files['README.md']).toContain('no `VIEW_STATE` handle');
  });

  it('produces i18n bundles that pass parity validation', () => {
    const files = generate(angularWeaver, { id: 'notes', name: 'Notes' });
    const en = JSON.parse(files['src/lib/i18n/en.json']);
    const de = JSON.parse(files['src/lib/i18n/de.json']);
    expect(validateI18nParity({ en, de })).toEqual([]);
  });

  it('scaffolds a command + derives the ui capability', () => {
    const w = resolveWeaverInput({ id: 'notes', features: { command: true } });
    expect(w.capabilities).toEqual(['contributions', 'ui', 'navigation']);
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { command: true },
    });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];
    expect(plugin).toContain('ctx.registerCommand(');
    expect(plugin).toContain("id: 'notes.hello'");
    expect(plugin).toContain('ctx.ui.toast(');
    expect(JSON.parse(files['src/lib/i18n/en.json']).action).toBeDefined();
  });

  it('hooks a menu item into a slot (implying a command)', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { menu: 'content/tab/context' },
    });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];
    expect(plugin).toContain('ctx.registerMenuItem(');
    expect(plugin).toContain("menu: 'content/tab/context'");
    expect(plugin).toContain("command: 'notes.hello'");
    expect(plugin).toContain('ctx.registerCommand(');
  });

  it('scaffolds a settings section with signal-backed owners', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { settings: true },
    });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];
    expect(plugin).toContain("import { signal } from '@angular/core'");
    expect(plugin).toContain('ctx.registerSettingsSection(');
    expect(plugin).toContain('const notesEnabled = signal(true)');
    const en = JSON.parse(files['src/lib/i18n/en.json']);
    const de = JSON.parse(files['src/lib/i18n/de.json']);
    expect(en.settings.enabled).toBe('Enabled');
    expect(validateI18nParity({ en, de })).toEqual([]);
  });

  it('auth-gates the surface and rail with an access requirement', () => {
    const plugin = generate(angularWeaver, {
      id: 'notes',
      features: { access: 'role:admin' },
    })['src/lib/plugin/notes.plugin.ts'];
    expect(plugin).toContain("access: { anyRole: ['admin'] }");
    expect(
      generate(angularWeaver, {
        id: 'notes',
        features: { access: 'authenticated' },
      })['src/lib/plugin/notes.plugin.ts'],
    ).toContain('access: { authenticated: true }');
  });

  it('rejects an unknown access spec', () => {
    expect(() =>
      resolveWeaverInput({ id: 'notes', features: { access: 'nope' } }),
    ).toThrow(/Unknown access/);
  });

  it('rejects a role with quotes or backslashes (scaffold injection)', () => {
    expect(() =>
      resolveWeaverInput({ id: 'notes', features: { access: "role:ad'min" } }),
    ).toThrow(/quotes or backslashes/);
  });

  it('emits component selectors under a custom prefix so the generated lint passes', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      prefix: 'acme',
      features: { about: true },
    });
    expect(files['src/lib/views/notes-view.ts']).toContain(
      "selector: 'acme-notes-view'",
    );
    expect(files['src/lib/dialogs/notes-about-dialog.ts']).toContain(
      "selector: 'acme-notes-about-dialog'",
    );
  });

  it('writes the wiring README against the import path the workspace registers', () => {
    const scoped = generate(angularWeaver, {
      id: 'notes',
      importPath: '@acme/notes-weaver',
    });
    expect(scoped['README.md']).toContain("from '@acme/notes-weaver'");
    const unscoped = generate(angularWeaver, { id: 'notes' });
    expect(unscoped['README.md']).toContain("from '@loomweaver/notes-weaver'");
  });

  it('documents the assets glob that serves the i18n bundle', () => {
    const readme = generate(angularWeaver, { id: 'notes' })['README.md'];
    expect(readme).toContain('"output": "i18n/notes"');
    expect(readme).toContain('src/lib/i18n');
  });

  it('rejects a platform-bound shortcut chord in favour of mod', () => {
    expect(() =>
      generate(angularWeaver, { id: 'notes', features: { shortcut: 'cmd+k' } }),
    ).toThrow(/'mod'/);
    expect(() =>
      generate(angularWeaver, {
        id: 'notes',
        features: { shortcut: 'ctrl+shift+p' },
      }),
    ).toThrow(/'mod'/);
  });

  it('defaults the command shortcut and lets it be overridden', () => {
    const auto = generate(angularWeaver, {
      id: 'notes',
      features: { command: true },
    })['src/lib/plugin/notes.plugin.ts'];
    expect(auto).toContain("shortcut: 'mod+shift+n'");
    const custom = generate(angularWeaver, {
      id: 'notes',
      features: { shortcut: 'mod+k' },
    })['src/lib/plugin/notes.plugin.ts'];
    expect(custom).toContain("shortcut: 'mod+k'");
  });

  it('adds a status-bar button (implying a command)', () => {
    const plugin = generate(angularWeaver, {
      id: 'notes',
      features: { barItem: true },
    })['src/lib/plugin/notes.plugin.ts'];
    expect(plugin).toContain('ctx.registerBarItem(');
    expect(plugin).toContain("bar: 'status-bar'");
    expect(plugin).toContain('ctx.registerCommand(');
  });

  it('scaffolds an About dialog + derives ui and host capabilities', () => {
    const w = resolveWeaverInput({ id: 'notes', features: { about: true } });
    expect(w.capabilities).toEqual([
      'contributions',
      'ui',
      'host',
      'navigation',
    ]);
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { about: true },
    });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];
    expect(files['src/lib/dialogs/notes-about-dialog.ts']).toContain(
      'class NotesAboutDialog',
    );
    expect(files['src/lib/dialogs/notes-about-dialog.html']).toContain(
      'host.version()',
    );
    expect(plugin).toContain('ctx.ui.open(NotesAboutDialog');
    expect(plugin).toContain('data: ctx.host');
  });

  describe('--instanceable', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { instanceable: true },
    });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];

    it('marks the surface instanceable', () => {
      expect(plugin).toContain('instanceable: true');
    });

    it('persists the view through VIEW_STATE, the only path that survives a hide', () => {
      const view = files['src/lib/views/notes-view.ts'];
      expect(view).toContain(
        "import { VIEW_STATE, type ViewState } from '@loomweaver/plugin-sdk'",
      );
      expect(view).toContain('inject(VIEW_STATE)');
      expect(view).toContain('this.viewState.value() ?? FRESH');
      expect(view).toContain('...this.state(),');
      expect(files['src/lib/views/notes-view.html']).toContain('toggleSort()');
    });

    it('docks it into a panel instead of routing it, since the host drops the flag on a routable surface', () => {
      expect(plugin).toContain("docks: ['left-panel']");
      expect(plugin).not.toContain('routable:');
    });

    it('reveals the surface from the rail rather than navigating to a URL it does not have', () => {
      expect(plugin).toContain("ctx.revealSurface('notes')");
      expect(plugin).not.toContain('navigateContent');
    });
  });

  describe('--container', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { container: true },
    });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];

    it('declares a routable container whose tab carries its own id', () => {
      expect(plugin).toContain("routable: { path: 'notes/:id' }");
      expect(plugin).toContain('container: {');
      expect(plugin).toContain("children: ['notes.canvas', 'notes.details']");
      expect(plugin).toContain("initial: ['notes.canvas', 'notes.details']");
    });

    it('registers the children with the container-only docks convention', () => {
      expect(plugin).toContain("id: 'notes.canvas'");
      expect(plugin).toContain("id: 'notes.details'");
      expect(plugin.match(/docks: \[\],/g)).toHaveLength(2);
    });

    it('gives the children components that read the container id', () => {
      const canvas = files['src/lib/views/notes-canvas-view.ts'];
      expect(canvas).toContain('inject(ActivatedRoute, { optional: true })');
      expect(canvas).toContain("paramMap.get('id')");
      expect(files['src/lib/views/notes-details-view.ts']).toBeDefined();
    });

    it('emits the child views instead of the single plain one', () => {
      expect(files['src/lib/views/notes-view.ts']).toBeUndefined();
      expect(files['src/lib/views/notes-canvas-view.html']).toBeDefined();
      expect(files['src/lib/views/notes-details-view.html']).toBeDefined();
    });

    it('opens a concrete instance from the rail, since the path takes an id', () => {
      expect(plugin).toContain("ctx.navigateContent('notes/example')");
    });

    it('translates the child titles', () => {
      const bundle = JSON.parse(files['src/lib/i18n/en.json']);
      expect(bundle.canvas).toBe('Canvas');
      expect(bundle.details).toBe('Details');
    });
  });

  it('refuses a container that is also instanceable, which the contract cannot express', () => {
    expect(() =>
      generate(angularWeaver, {
        id: 'notes',
        features: { container: true, instanceable: true },
      }),
    ).toThrow(/cannot be both a container and instanceable/);
  });

  it('omits the starter spec when spec is false', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { spec: false },
    });
    expect(files['src/lib/plugin/notes.plugin.spec.ts']).toBeUndefined();
  });

  it('spreads providePlugins in the wiring instructions, which is variadic', () => {
    const readme = generate(angularWeaver, { id: 'notes' })['README.md'];
    expect(readme).toContain('...providePlugins(notesPlugin)');
    expect(readme).not.toMatch(/providePlugins\(\[/);
  });
});

describe('angularWeaver agent connection', () => {
  const agentWeaver = () =>
    generate(angularWeaver, {
      id: 'notes',
      name: 'Notes',
      features: { agent: true },
    });

  it('emits the connection, a panel, a stand-in and a test of the whole path', () => {
    expect(
      Object.keys(agentWeaver())
        .filter((path) => path.includes('/agent/'))
        .toSorted((a, b) => a.localeCompare(b)),
    ).toEqual([
      'src/lib/agent/notes-agent-panel.html',
      'src/lib/agent/notes-agent-panel.ts',
      'src/lib/agent/notes-agent-source.ts',
      'src/lib/agent/notes-agent.spec.ts',
      'src/lib/agent/notes-agent.ts',
    ]);
  });

  it('declares the permission that reaching other plugins commands needs', () => {
    const w = resolveWeaverInput({ id: 'notes', features: { agent: true } });
    expect(w.capabilities).toContain('automation');
    expect(w.capabilities).toContain('ui');
    expect(agentWeaver()['src/lib/plugin/notes.plugin.ts']).toContain(
      "'automation'",
    );
  });

  it('gives the connection something to offer, because one that offers nothing shows nothing', () => {
    const w = resolveWeaverInput({ id: 'notes', features: { agent: true } });
    expect(w.features.command).toBe(true);
    expect(agentWeaver()['src/lib/plugin/notes.plugin.ts']).toContain(
      "id: 'notes.hello'",
    );
  });

  it('docks the panel and clears the connection when the plugin goes away', () => {
    const plugin = agentWeaver()['src/lib/plugin/notes.plugin.ts'];
    expect(plugin).toContain("id: 'notes.agent'");
    expect(plugin).toContain("docks: ['right-panel']");
    expect(plugin).toContain('notesAgent.set(notesConnection(ctx));');
    expect(plugin).toContain('deactivate()');
  });

  it('generates no transport, no credential and no model', () => {
    for (const source of Object.values(agentWeaver())) {
      expect(source).not.toMatch(
        /\bfetch\(|EventSource|WebSocket|apiKey|API_KEY|Authorization/,
      );
    }
  });

  it('says in the stand-in itself that it is one, and what replaces it', () => {
    const standIn = agentWeaver()['src/lib/agent/notes-agent-source.ts'];
    expect(standIn).toContain('a stand-in for an agent, and not an agent');
    expect(standIn).toContain('this file, and only this file');
    expect(agentWeaver()['src/lib/agent/notes-agent-panel.html']).toContain(
      'This is a stand-in, not an assistant',
    );
  });

  it('confines the stand-in to one file the panel does not name', () => {
    const panel = agentWeaver()['src/lib/agent/notes-agent-panel.ts'];
    expect(panel).toContain("from './notes-agent-source'");
    expect(panel).not.toContain('stand-in');
  });

  it('asks the workbench for the offered list on every run rather than keeping one', () => {
    const panel = agentWeaver()['src/lib/agent/notes-agent-panel.ts'];
    expect(
      panel.match(/tools\.list\(\)|Agent\(\)\?\.list\(\)/g)?.length,
    ).toBeGreaterThan(1);
    expect(panel).toContain('const offered = tools.list();');
  });

  it('names the weaver own command as consequential and declines it by asking', () => {
    const connection = agentWeaver()['src/lib/agent/notes-agent.ts'];
    expect(connection).toContain(
      "const CONSEQUENTIAL = new Set(['notes.hello']);",
    );
    expect(connection).toContain('ctx.ui.confirm(');
    expect(connection).toContain("{ decision: 'decline'");
  });

  it('emits a test that drives a real call and a declined one', () => {
    const spec = agentWeaver()['src/lib/agent/notes-agent.spec.ts'];
    expect(spec).toContain('EventType.TOOL_CALL_START');
    expect(spec).toContain('EventType.TOOL_CALL_ARGS');
    expect(spec).toContain('EventType.TOOL_CALL_END');
    expect(spec).toContain(
      'never reaches the workbench when a consequential call is declined',
    );
  });

  it('omits the agent test where no starter test was asked for', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { agent: true, spec: false },
    });
    expect(files['src/lib/agent/notes-agent.spec.ts']).toBeUndefined();
    expect(files['src/lib/agent/notes-agent.ts']).toBeDefined();
  });

  it('emits nothing of the kind without the feature', () => {
    const files = generate(angularWeaver, { id: 'notes' });
    expect(Object.keys(files).some((path) => path.includes('/agent/'))).toBe(
      false,
    );
  });

  it('translates every string the connection puts through the host', () => {
    const files = agentWeaver();
    const en = JSON.parse(files['src/lib/i18n/en.json']);
    expect(en.agent.title).toBeTruthy();
    expect(en.agent.confirm.yes).toBeTruthy();
    expect(
      validateI18nParity({ en, de: JSON.parse(files['src/lib/i18n/de.json']) }),
    ).toEqual([]);
  });
});

describe('angularWeaver agent connection beside the other features', () => {
  it('is imported from one place only, so replacing the stand-in touches nothing else', () => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { agent: true },
    });
    const importing = Object.entries(files)
      .filter(([, source]) => source.includes("from './notes-agent-source'"))
      .map(([path]) => path);
    expect(importing).toEqual(['src/lib/agent/notes-agent-panel.ts']);
    expect(files['src/lib/agent/notes-agent-panel.ts']).toContain(
      "import { askAgent } from './notes-agent-source';",
    );
    expect(files['README.md']).toContain('Replace that one file with');
  });

  it.each([
    ['instanceable', { instanceable: true }],
    ['container', { container: true }],
    ['gated', { access: 'authenticated' }],
    ['settings and about', { settings: true, about: true }],
  ])('composes with a %s surface without reshaping either', (_, extra) => {
    const files = generate(angularWeaver, {
      id: 'notes',
      features: { agent: true, ...extra },
    });
    const plugin = files['src/lib/plugin/notes.plugin.ts'];
    expect(files['src/lib/agent/notes-agent.ts']).toBeDefined();
    expect(plugin).toContain("id: 'notes.agent'");
    expect(plugin).toContain("docks: ['right-panel']");
    expect(plugin).toContain('deactivate()');
  });

  it('leaves the agent panel ungated, because gating the surface is not gating the connection', () => {
    const plugin = generate(angularWeaver, {
      id: 'notes',
      features: { agent: true, access: 'authenticated' },
    })['src/lib/plugin/notes.plugin.ts'];
    const panel = plugin.slice(plugin.indexOf("id: 'notes.agent'"));
    expect(panel).not.toContain('access:');
  });
});
