# Samples

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `surfaces` · `routing` · `commands` · `ui-primitives` ·
> `access-gating` · `surface-retention` · `persistence-ports` · `i18n`. Where this page and a
> specification disagree, the specification is right, and that is a defect in this page: change the
> behaviour there, then explain it here.

Complete, copyable recipes: whole files with the path they belong at, what to wire, and what you get
on screen. Every one of them compiles against the published `@loomweaver/plugin-sdk`.

They all assume a distribution set up by the [quickstart](getting-started.md) or by
[hand](manual-setup.md), and a weaver of your own. If you have neither yet:

```bash
npx @loomweaver/cli weaver --id notes --out src/notes
```

Everything below goes **inside `activate(ctx)`** of your plugin unless the path says otherwise. The
capabilities each recipe needs are listed with it. Declare them in your `manifest` _and_ have the
distribution grant them, or the call throws `CapabilityError`.

## What the generator already writes

Five of these twelve recipes are what the generator writes, and two more, recipes 10 and 12, are
half written for you. That is worth knowing before you copy anything: a generated weaver compiles, passes its own lint, and comes out the same every time, so
your attention goes to the part that is actually yours.

| Recipe                                                                                           | The invocation that writes it                                                                                                             |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [1 · A sidebar view](#a-sidebar-view-that-remembers-its-state)                                   | `weaver --id notes --instanceable` — the docked surface and its rail item; the persisted state is yours                                   |
| [2 · A content surface with its own URL](#a-content-surface-with-its-own-url)                    | `weaver --id notes` — the default shape, at `/notes`; the `:id` is what you add                                                           |
| [3 · One behaviour, many triggers](#one-behaviour-many-triggers)                                 | `weaver --id notes --command --shortcut 'mod+shift+n' --menu content/tab/context --bar-item`                                              |
| [4 · A settings section](#a-settings-section)                                                    | `weaver --id notes --settings`                                                                                                            |
| [5 · Gating a surface behind a login](#gating-a-surface-behind-a-login)                          | `weaver --id notes --access authenticated`                                                                                                |
| [10 · Letting an AG-UI agent drive your product](#10--letting-an-ag-ui-agent-drive-your-product) | `weaver --id notes --agent` — the connection, a panel and a stand-in that works before you have a transport; what you replace is one file |
| [12 · A session without a backend](#a-session-without-a-backend)                                 | `auth-source --name dev` — the three states and the step around them; the plugin that turns the step into sign-in, switch and sign-out is yours                |

The options compose, so that is one call:

```bash
npx @loomweaver/cli weaver --id notes --out src/notes \
  --command --shortcut 'mod+shift+n' --menu content/tab/context --bar-item \
  --settings --access authenticated --agent
```

Recipes 6 to 9 and 11 have no generator behind them, and that is the honest split: they are the
ones where you decide something. A generator for recipe 11 is intended, once the recipe has been
read and copied enough to know its shape. Recipes 10 and 12 are the half-way cases. For recipe 10,
`--agent` writes the wiring and something that runs on the first serve, and the transport it talks
to stays yours. For recipe 12, `auth-source` writes the session's states, and the plugin that puts
them in the rail is yours.

**It does not matter who invokes it.** One description of each generator serves every route into it,
so `@loomweaver/cli` on a command line, `@loomweaver/devkit` as an Nx generator and `@loomweaver/mcp`
over MCP produce the same files from the same options. An assistant with the MCP server registered
scaffolds a weaver with a tool instead of writing plugin code from memory. Ask it for _"a weaver
called notes with a settings section and a command on mod+shift+n"_ and what lands in your diff is
the output above, not an invention you have to review line by line. See
[scaffolding](scaffolding.md) for the full option table and the three adapters.

## The file layout these recipes assume

```
src/notes/src/
  index.ts                     export { notesPlugin } from './lib/plugin/notes.plugin';
  lib/plugin/notes.plugin.ts   the manifest + activate(ctx) — all the recipes below
  lib/views/*.ts|.html         your components
  lib/i18n/en.json, de.json    your translation bundle, served under /i18n/notes/
```

<a id="a-sidebar-view-that-remembers-its-state"></a>

## 1 · A sidebar view that remembers its state

A surface docked into a panel region, whose sort order survives a reload: the host stores the blob,
the view never touches storage.

**Generated by** `weaver --id notes --instanceable`: the docked surface and the rail item that
reveals it. What follows is the part it leaves to you, the state that has to survive being
hidden.

**Capabilities:** `contributions`

```ts
// src/notes/src/lib/views/notes-list.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { VIEW_STATE, type ViewState } from '@loomweaver/plugin-sdk';

interface ListState {
  readonly sort: 'natural' | 'alpha';
}

@Component({
  selector: 'lw-notes-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="lw-btn lw-btn--default" (click)="toggle()">
      Sort: {{ sort() }}
    </button>
    <ul class="mt-3 space-y-1 text-sm text-content">
      @for (note of ordered(); track note) {
        <li>{{ note }}</li>
      }
    </ul>
  `,
})
export class NotesList {
  private readonly state = inject(VIEW_STATE) as ViewState<ListState>;
  private readonly notes = ['Roadmap', 'Anna', 'Budget'];

  // `undefined` for a fresh instance — apply your own default.
  protected readonly sort = computed(() => this.state.value()?.sort ?? 'natural');

  protected readonly ordered = computed(() =>
    this.sort() === 'alpha' ? [...this.notes].sort() : this.notes,
  );

  protected toggle(): void {
    this.state.set({ sort: this.sort() === 'alpha' ? 'natural' : 'alpha' });
  }
}
```

```ts
// in activate(ctx)
ctx.registerSurface({
  id: 'notes.list',
  title: 'notes.list.title',
  icon: 'notes',
  component: NotesList,
  docks: ['left-panel'],      // a region id from your layout — must be a `panel`
});
```

**You get:** a view in the left sidebar, tabbed automatically if other views dock there. Toggle the
sort and reload, and it comes back. Writes are debounced by the host. Since a hidden surface is destroyed as
soon as it is clean, this is also how the sort survives a tab switch or a collapsed sidebar;
[recipe 7](#everything-a-view-must-persist) is the same idea scaled to everything a real view holds.

> `docks[0]` must name a **panel** region. Docking a non-routable surface into a `content`, `bar` or
> `rail` region is a silent no-op (dev mode warns).

<a id="a-content-surface-with-its-own-url"></a>

## 2 · A content surface with its own URL

The main area is URL-addressed, so a surface that lives there is deep-linkable, and visiting it opens
a tab in the strip the host draws for the pane.

**Generated by** `weaver --id notes`: this is the default shape, emitted at `/notes` with the same
rail item beside it. The `:id` below is the one thing you add.

**Capabilities:** `contributions`, `navigation`

```ts
// in activate(ctx)
ctx.registerSurface({
  id: 'notes.detail',
  title: 'notes.detail.title',
  icon: 'notes',
  component: NoteDetail,
  routable: { path: 'note/:id' },   // add chromeless: true for a full-area screen with no strip
});

ctx.registerRailItem({
  id: 'notes.rail',
  rail: 'primary',                       // a `rail` region id from your layout
  icon: 'notes',
  title: 'notes.title',
  run: () => ctx.openContentTab({ path: 'note/roadmap', title: 'Roadmap', titleIsLiteral: true }),
});
```

Read the parameter the ordinary Angular way:

```ts
// src/notes/src/lib/views/note-detail.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'lw-note-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 class="text-lg font-medium text-content">Note {{ id() }}</h1>`,
})
export class NoteDetail {
  private readonly route = inject(ActivatedRoute);
  protected readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );
}
```

**You get:** a rail icon that opens `/note/roadmap` as a tab titled _Roadmap_.
`titleIsLiteral: true` says the title is text, not a translation key. The URL is shareable,
back/forward work, and the user can split the tab into its own pane. Add `chromeless: true` and
everything still works except the tab: the surface then fills the area on its own with no strip,
which is what you want for a login or onboarding screen.

<a id="one-behaviour-many-triggers"></a>

## 3 · One behaviour, many triggers

Register the behaviour **once** as a command; a shortcut, a status-bar button and a menu entry all
reference it by id. Never duplicate the `run`.

**Generated by** `weaver --id notes --command --shortcut 'mod+shift+n' --menu content/tab/context
--bar-item`: all three registrations, wired to each other, with a toast standing in for the action
until you write it.

**Capabilities:** `contributions`, `ui`

```ts
// in activate(ctx)
ctx.registerCommand({
  id: 'notes.add',
  title: 'notes.add',
  icon: 'notes',
  shortcut: 'mod+shift+n',              // `mod` = ⌘ on macOS, Ctrl elsewhere — never write cmd/ctrl
  run: () => ctx.ui.toast({ message: 'notes.added', kind: 'success', timeoutMs: 4000 }),
});

ctx.registerBarItem({
  id: 'notes.bar.add',                  // an item id must NOT equal the command id
  bar: 'status-bar',
  slot: 'end',                          // 'start' | 'center' | 'end'
  command: 'notes.add',
  icon: 'notes',
  tooltip: 'notes.add',
  showShortcut: true,                   // render the chord next to the label
});

ctx.registerMenuItem({
  menu: 'content/tab/context',
  command: 'notes.add',
});
```

**You get:** the action in the command palette (`mod+k`), on its shortcut, as a status-bar button
showing `⌘⇧N`, and in the tab context menu. Give the toast a `timeoutMs` unless you want it sticky.

<a id="a-settings-section"></a>

## 4 · A settings section

Rows the built-in settings dialog renders. **Your plugin owns the value**: the platform never
persists foreign data behind your back.

**Generated by** `weaver --id notes --settings`: the same section, a toggle and a text field over
two signals. The description and the placeholder below are yours to add.

**Capabilities:** `contributions`

```ts
// in activate(ctx) — `signal` imported from '@angular/core'
const compact = signal(false);
const author = signal('');

ctx.registerSettingsSection({
  id: 'notes.settings',
  title: 'notes.settings.title',
  rows: [
    {
      id: 'notes.compact',
      label: 'notes.settings.compact',
      description: 'notes.settings.compactDesc',
      control: { kind: 'toggle', value: () => compact(), set: (v) => compact.set(v) },
    },
    {
      id: 'notes.author',
      label: 'notes.settings.author',
      control: {
        kind: 'text',
        value: () => author(),
        set: (v) => author.set(v),
        placeholder: 'notes.settings.authorPlaceholder',
      },
    },
  ],
});
```

**You get:** a _Notes_ entry in the settings dialog's left nav with a switch and a text field, saving
as you type. To persist across reloads, write the values through your own storage in `set`. See
[backend integration](backend-integration.md) for doing it through the distribution's settings store.

<a id="gating-a-surface-behind-a-login"></a>

## 5 · Gating a surface behind a login

Declare the requirement; the host enforces it on every surface it draws, and re-evaluates when the
session changes.

**Generated by** `weaver --id notes --access authenticated`: the requirement lands on the surface
and on the rail item together, which is the pairing you want. A role requirement and `mode` you
write yourself.

**Capabilities:** `contributions` (plus `session` only if you also want to _read_ the session)

```ts
// in activate(ctx)
ctx.registerSurface({
  id: 'notes.admin',
  title: 'notes.admin.title',
  component: NotesAdmin,
  routable: { path: 'notes/admin' },
  access: { anyRole: ['admin'] },        // or { authenticated: true }
});

ctx.registerRailItem({
  id: 'notes.rail.admin',
  rail: 'primary',
  icon: 'notes',
  title: 'notes.admin.title',
  run: () => ctx.navigateContent('notes/admin'),
  access: { anyRole: ['admin'], mode: 'hide' },   // 'disable' greys it out instead
});
```

Reading it yourself, for UI that adapts rather than disappears:

```ts
// in activate(ctx) — needs the `session` capability
const canEdit = () => ctx.session.hasRole('admin');
```

**You get:** the rail item vanishes for everyone else, and the route refuses to activate: a
deep-link renders a neutral "sign-in required" placeholder with the URL intact, or redirects if the
distribution wired `provideUnauthorizedRedirect`. Client-side gating is presentation: enforce it in
your backend too. Full matrix in [access gating](reference/access-gating.md).

<a id="asking-before-doing-something-destructive"></a>

## 6 · Asking before doing something destructive

**Capabilities:** `ui`

```ts
// in activate(ctx)
ctx.registerCommand({
  id: 'notes.deleteAll',
  title: 'notes.deleteAll',
  run: async () => {
    const confirmed = await ctx.ui.confirm({
      title: 'notes.deleteAll',
      message: 'notes.deleteAll.body',      // rendered as Markdown
      tone: 'danger',
      confirmLabel: 'notes.deleteAll.yes',
    });
    if (!confirmed) return;

    // withProgress takes the promise itself, not a callback.
    await ctx.ui.withProgress({ message: 'notes.deleting' }, deleteEverything());
    ctx.ui.toast({ message: 'notes.deleted', kind: 'success', timeoutMs: 4000 });
  },
});
```

**You get:** a modal in the host's own vocabulary, with a tinted icon, a danger-red confirm button,
Escape and backdrop dismissal and focus trapped. Then a non-dismissable progress dialog while the
work runs.
The whole `ctx.ui` surface is listed in [host services](distribution-api/index.md).

<a id="everything-a-view-must-persist"></a>

## 7 · Everything a view must persist

A hidden surface is destroyed as soon as it is clean, so anything that must outlive a tab switch, a
collapsed sidebar or a reload lives in `VIEW_STATE`. This is recipe 1 grown up: one state shape
instead of five signals, and one place that writes it.

**Capabilities:** `contributions` · **applies to:** a **docked** surface; a routable one has no handle

```ts
// src/notes/src/lib/views/notes-workspace.ts
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { VIEW_STATE, type ViewState } from '@loomweaver/plugin-sdk';

interface WorkspaceState {
  readonly query: string;
  readonly tab: 'open' | 'archived';
  readonly expanded: readonly string[];
  readonly scrollTop: number;
}

const FRESH: WorkspaceState = { query: '', tab: 'open', expanded: [], scrollTop: 0 };

@Component({
  selector: 'lw-notes-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      #q
      class="lw-field w-full"
      placeholder="Filter"
      [value]="query()"
      (input)="patch({ query: q.value })"
    />

    <div class="lw-segmented mt-3">
      @for (name of tabs; track name) {
        <button
          type="button"
          class="lw-segmented-item w-auto px-3"
          [attr.aria-pressed]="tab() === name"
          (click)="patch({ tab: name })"
        >
          {{ name }}
        </button>
      }
    </div>

    <ul #list class="mt-3 h-64 overflow-auto" (scroll)="patch({ scrollTop: list.scrollTop })">
      @for (note of visible(); track note.title) {
        <li>
          <button type="button" class="lw-btn lw-btn--ghost" (click)="toggle(note.title)">
            {{ note.title }}
          </button>
          @if (isExpanded(note.title)) {
            <p class="px-3 text-sm text-content-faint">{{ note.body }}</p>
          }
        </li>
      }
    </ul>
  `,
})
export class NotesWorkspace {
  private readonly viewState = inject(VIEW_STATE) as ViewState<WorkspaceState>;
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  private readonly notes = [
    { title: 'Roadmap', body: 'Ship the thing.', archived: false },
    { title: 'Anna', body: 'Call back.', archived: false },
    { title: 'Budget', body: 'Signed off.', archived: true },
  ];

  protected readonly tabs = ['open', 'archived'] as const;

  // One read of the blob; `undefined` for a fresh instance → your own default.
  private readonly state = computed(() => this.viewState.value() ?? FRESH);

  // Narrow computeds: scrolling changes `state()`, but `query()` keeps its value,
  // so `visible()` is not recomputed on every scroll event.
  protected readonly query = computed(() => this.state().query);
  protected readonly tab = computed(() => this.state().tab);
  protected readonly expanded = computed(() => this.state().expanded);

  protected readonly visible = computed(() => {
    const needle = this.query().toLowerCase();
    const archived = this.tab() === 'archived';
    return this.notes.filter(
      (note) => note.archived === archived && note.title.toLowerCase().includes(needle),
    );
  });

  constructor() {
    afterNextRender(() => {
      this.list().nativeElement.scrollTop = this.state().scrollTop;
    });
  }

  protected isExpanded(title: string): boolean {
    return this.expanded().includes(title);
  }

  protected toggle(title: string): void {
    const open = this.expanded();
    this.patch({
      expanded: open.includes(title) ? open.filter((t) => t !== title) : [...open, title],
    });
  }

  // The one writer: `set` replaces the whole blob, so spread what is already there.
  protected patch(part: Partial<WorkspaceState>): void {
    this.viewState.set({ ...this.state(), ...part });
  }
}
```

```ts
// in activate(ctx)
ctx.registerSurface({
  id: 'notes.workspace',
  title: 'notes.workspace.title',
  icon: 'notes',
  component: NotesWorkspace,
  docks: ['left-panel'],
});
```

**You get:** a view you can filter, switch, expand and scroll, then move to another pane, collapse the
sidebar, reload the browser, and find it exactly as you left it. The host writes the blob for you,
debounced. The same view written with local signals loses the filter and the expanded rows the
moment the surface is hidden, and it always lost them on reload:

```ts
export class NotesWorkspaceLocal {
  protected readonly query = signal('');
  protected readonly expanded = signal<readonly string[]>([]);
}
```

The rules behind the recipe (`set` replaces rather than merges, a `set` per keystroke is fine, a
routable surface has no handle and uses its address instead) are
[View state that survives](weaver/view-state.md#the-view_state-handle).

---

<a id="an-editor-with-unsaved-changes"></a>

## 8 · An editor with unsaved changes

A hidden surface is destroyed as soon as it is clean, and _dirty_ is what makes it not clean.
Implement `DirtySurface` on your component and the host takes over the unsaved-work protocol. You
write two members; everything else is the host's job.

**Capabilities:** `contributions`

```ts
// in activate(ctx)
ctx.registerSurface({
  id: 'notes.editor',
  title: 'notes.editor.title',
  icon: 'notes',
  component: NoteEditor,
  routable: { path: 'note-editor' },
});
```

```ts
// src/notes/src/lib/views/note-editor.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { DirtySurface } from '@loomweaver/plugin-sdk';

@Component({
  selector: 'lw-note-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-3 p-6">
      <textarea
        class="lw-field min-h-40 flex-1"
        [value]="draft()"
        (input)="onInput($event)"
      ></textarea>
      <button
        class="lw-btn lw-btn--primary self-start"
        [disabled]="!dirty()"
        (click)="save()"
      >
        Save
      </button>
    </div>
  `,
})
export class NoteEditor implements DirtySurface {
  // What the backend has; a real editor loads it (see recipe 7 for view state).
  private readonly saved = signal('');
  protected readonly draft = signal(this.saved());
  protected readonly dirty = computed(() => this.draft() !== this.saved());

  // The host reads this reactively: while it returns true the instance is
  // never destroyed on hide, and closing runs the Save · Discard · Cancel ask.
  surfaceDirty(): boolean {
    return this.dirty();
  }

  // Optional — its presence puts the Save button into the host's close dialog.
  async surfaceSave(): Promise<void> {
    // await this.api.save(this.draft());
    this.saved.set(this.draft());
  }

  protected save(): void {
    void this.surfaceSave();
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }
}
```

**You get:** while `surfaceDirty()` is `true` the instance survives every hiding gesture without a
question; closing runs the host's _Save · Discard · Cancel_ dialog, where _Save_ appears only because
`surfaceSave` exists; closing the browser window triggers the native `beforeunload` prompt. Declare
`saveOn: 'hide'` on the registration and the question becomes an auto-save. The optional
`surfaceBeforeClose` replaces the dialog with your own flow:

```ts
  // Optional veto — replace the standard ask with your own close flow.
  async surfaceBeforeClose(): Promise<boolean> {
    if (!this.surfaceDirty()) {
      return true;
    }
    const choice = await this.askOwnDialog(); // 'save' | 'discard' | 'stay'
    if (choice === 'stay') {
      return false; // cancels the close
    }
    if (choice === 'save') {
      await this.surfaceSave();
    } else {
      this.draft.set(this.saved()); // discard: back to the saved body
    }
    return true; // now clean — the host's standard ask will not appear
  }
```

What each of those does in detail, what a failed save does, and the sandboxed variant that pushes
`setDirty` over the surface channel are [Unsaved changes](weaver/unsaved-changes.md).

---

<a id="sync-your-own-state-across-browser-windows"></a>

## 9 · Sync your own state across browser windows

Everything the shell persists already follows across same-origin windows live, with nothing to
wire. This recipe is for **your own** state: a distribution key, a product session, a backend push.

First decide where the state lives, because that decides how it syncs:

| Your state is…                              | Persist it…                   | Sync story                                      |
| ------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| a deliberate user decision (a preference)   | through `SETTINGS_STORE`      | broadcasts by itself — register a reaction      |
| usage state (drafts-of-layout, MRU, traces) | through `WORKING_STATE_STORE` | broadcasts by itself — register a reaction      |
| outside both ports (a product session)      | wherever it lives today       | `announce` on write + `register('external', …)` |

**Capabilities:** none. This is distribution wiring (`app.config.ts`), not a plugin API.

```ts
// src/app/app.config.ts — in the providers array
import { inject, provideEnvironmentInitializer } from '@angular/core';
import { SETTINGS_STORE, StateSyncService } from '@loomweaver/shell';

provideEnvironmentInitializer(() => {
  const sync = inject(StateSyncService);

  // ① State on a port syncs itself — you only register the reaction.
  //    'settings' names where the fresh value is read back from.
  const store = inject(SETTINGS_STORE);
  sync.register('settings', 'acme.density', (raw) => {
    applyDensity(raw ?? 'comfortable'); // apply WITHOUT writing back
  });
  // Writing through the port broadcasts on its own:
  //   void store.set('acme.density', 'compact');

  // ② State outside the ports announces itself and re-reads its own storage.
  sync.register('external', acmeSession.key, () => acmeSession.reload());

  // ③ Live cross-device tier: a backend push transport rings the bell for
  //    THIS window; the applier reads the fresh value back through the store.
  const events = new EventSource('/api/state/events');
  events.onmessage = (event) => sync.notifyRemoteChange(String(event.data));
}),
```

The `'external'` half needs the owning store to **announce** its own writes. A broadcast only happens
by itself for writes that go through the ports:

```ts
// src/app/session.ts — YOUR session store, persisted outside the shell's ports
const SESSION_KEY = 'acme.session';

export const acmeSession = {
  key: SESSION_KEY,
  current(): string | null {
    return localStorage.getItem(SESSION_KEY);
  },
  signIn(token: string, announce: (key: string) => void): void {
    localStorage.setItem(SESSION_KEY, token);
    announce(SESSION_KEY); // tell the other windows — nothing else can know
  },
  reload(): void {
    // re-read SESSION_KEY and update your AuthSource signal
  },
};
```

**You get:** a density change made in one window applied in every other, a sign-in in one window
picked up by the rest, and a change your backend pushes applied in the window that received it, all
by reading the fresh value back through the store. An applier must set state without persisting
again, or two windows write back and forth forever. How the sync works, what the shell already syncs
and why layout keys stay per window are
[Windows and sync](distribution/windows-and-sync.md#cross-tab-live-sync).

---

<a id="letting-an-agent-drive-your-product"></a>

## 10 · Letting an AG-UI agent drive your product

An agentic backend speaking [AG-UI](https://docs.ag-ui.com) can run the actions your product already
has, without you keeping a tool registry or a dispatch switch beside the command registry. The rule
underneath it: **an agent reaches what the user could have reached, and nothing more.**

**Capabilities:** `automation` · plus `ui` if you confirm before a consequential call

The generator writes all of this: `weaver --id notes --agent` emits the connection below, a docked
panel to watch it through, and a stand-in that produces the protocol's own events so the whole path
runs before you have a transport. Read on for what it wrote and where your part begins.

```bash
npm install @loomweaver/ag-ui @ag-ui/core
```

```ts
// src/notes/src/lib/plugin/notes-agent.ts
import type { BaseEvent, Message, Tool } from '@ag-ui/core';
import { commandTools } from '@loomweaver/ag-ui';
import type { PluginContext } from '@loomweaver/plugin-sdk';

const CONSEQUENTIAL = new Set(['notes.deleteAll']);

export function notesAgent(ctx: PluginContext) {
  const tools = commandTools(ctx, {
    before: async (call) => {
      if (!CONSEQUENTIAL.has(call.commandId)) {
        return { decision: 'run' };
      }
      const confirmed = await ctx.ui.confirm({
        title: 'notes.agent.confirm',
        message: 'notes.agent.confirmBody',
        tone: 'warning',
      });
      return confirmed
        ? { decision: 'run' }
        : { decision: 'decline', reason: 'the person at the keyboard said no.' };
    },
  });

  return {
    /** Ask at the start of every run. Never keep the answer: what you may reach changes. */
    offer: (): readonly Tool[] => tools.list(),

    /** Hand it every event of the run; send back whatever it answers. */
    async carry(event: BaseEvent, back: (message: Message) => void): Promise<void> {
      const answer = await tools.receive(event);
      if (answer) {
        back(answer);
      }
    },
  };
}
```

**You get:** every command that declared itself `callable` described to the agent as a tool, with its
declared arguments as JSON Schema, already narrowed by everything that would refuse it: the session,
the window, your grant. A call arrives as a start, a stream of argument deltas and an end; `receive`
assembles it, puts it to the workbench through the same seam a keystroke uses, and answers a tool
message carrying a real outcome. A refusal and a failure both come back in the protocol's `error`
field, worded so an agent can tell "you may not" from "it broke".

The package brings **no transport, no user interface and no agent**: you open the connection, you draw
the conversation, and you decide what the agent is. The full contract, including what the agent never
learns and why, is in [agent tools](reference/agent-tools.md).

<a id="a-navigation-tree-in-the-sidebar"></a>

## 11 · A navigation tree in the sidebar

A sidebar that lists your destinations, grouped and folded, marking the one the user is at. The
workbench draws the tree from what you declare and reports what the user chose; you navigate. The
story behind every line is [A navigation tree in the sidebar](weaver/navigation-tree.md).

**Capabilities:** `contributions` · `navigation` (for `activeContent`, `isShowingUnder` and
`navigateContent`)

```ts
// src/notes/src/lib/views/notes-navigation.ts
export interface Destination {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

export interface Group {
  readonly key: string;
  readonly label: string;
  readonly destinations: readonly Destination[];
  readonly startsShut?: boolean;
}

export const NOTES_NAVIGATION = {
  groups: [
    {
      key: 'notes/writing',
      label: 'notes.nav.writing',
      destinations: [
        { path: 'notes', label: 'notes.nav.all', icon: 'document' },
        { path: 'notes/drafts', label: 'notes.nav.drafts', icon: 'edit' },
      ],
    },
    {
      key: 'notes/archive',
      label: 'notes.nav.archive',
      startsShut: true,
      destinations: [{ path: 'notes/archive', label: 'notes.nav.archived', icon: 'lock' }],
    },
  ] as readonly Group[],
  loose: [{ path: 'notes/search', label: 'notes.nav.search', icon: 'search' }] as readonly Destination[],
};

export function groupShowing(
  groups: readonly Group[],
  showingUnder: (path: string) => boolean,
): Group | undefined {
  let deepest: { readonly group: Group; readonly depth: number } | undefined;
  for (const group of groups) {
    for (const destination of group.destinations) {
      if (showingUnder(destination.path) && destination.path.length > (deepest?.depth ?? -1)) {
        deepest = { group, depth: destination.path.length };
      }
    }
  }
  return deepest?.group;
}
```

```ts
// src/notes/src/lib/plugin/navigation.ts
import type { PluginContext } from '@loomweaver/plugin-sdk';

let ctx: PluginContext | undefined;
let lastTitle: string | undefined;

export const navigation = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
    lastTitle = undefined;
  },
  activePath(): string {
    return ctx?.activeContent()?.path ?? '';
  },
  showingUnder(path: string): boolean {
    return ctx?.isShowingUnder(path) ?? false;
  },
  go(path: string): void {
    ctx?.navigateContent(path);
  },
  retitle(surfaceId: string, title: string): void {
    if (!ctx || lastTitle === title) {
      return;
    }
    lastTitle = title;
    ctx.retitleSurface(surfaceId, title);
  },
};
```

```ts
// src/notes/src/lib/views/notes-navigation-view.ts
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { navigation } from '../plugin/navigation';
import { NOTES_NAVIGATION, groupShowing } from './notes-navigation';

@Component({
  selector: 'lw-notes-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './notes-navigation-view.html',
})
export class NotesNavigationView {
  protected readonly groups = computed(() => NOTES_NAVIGATION.groups);
  protected readonly loose = NOTES_NAVIGATION.loose;
  protected readonly shown = computed(() => navigation.activePath());

  constructor() {
    effect(() => {
      const group = groupShowing(this.groups(), (path) => navigation.showingUnder(path));
      navigation.retitle('notes.navigation', group?.label ?? 'notes.nav.title');
    });
  }

  protected open(event: Event): void {
    navigation.go((event as CustomEvent<{ path: string }>).detail.path);
  }
}
```

```html
<!-- src/notes/src/lib/views/notes-navigation-view.html -->
<lw-nav-tree
  [attr.current]="shown()"
  [attr.aria-label]="'notes.nav.title' | transloco"
  (lw-nav-select)="open($event)"
>
  @for (group of groups(); track group.key) {
    <lw-nav-group
      [attr.label]="group.label | transloco"
      [attr.key]="group.key"
      [attr.collapsed]="group.startsShut ? '' : null"
    >
      @for (destination of group.destinations; track destination.path) {
        <lw-nav-item
          [attr.path]="destination.path"
          [attr.icon]="destination.icon"
          [attr.label]="destination.label | transloco"
        ></lw-nav-item>
      }
    </lw-nav-group>
  }
  @for (destination of loose; track destination.path) {
    <lw-nav-item
      [attr.path]="destination.path"
      [attr.icon]="destination.icon"
      [attr.label]="destination.label | transloco"
    ></lw-nav-item>
  }
</lw-nav-tree>
```

```ts
// in activate(ctx) — the manifest declares ['contributions', 'navigation']
navigation.bind(ctx);
ctx.registerSurface({
  id: 'notes.navigation',
  title: 'notes.nav.title',
  icon: 'notes',
  component: NotesNavigationView,
  docks: ['left-panel'],
  padded: false,
});

// in deactivate()
navigation.unbind();
```

**You get:** a tree in the left sidebar with two groups and a loose entry, the archive group shut
until the user opens it. Choosing an entry navigates the content area; opening a draft marks the
drafts entry, because `notes/drafts/d-17` lies under `notes/drafts`; the panel header says
"Writing" or "Archive" for wherever the user is. Fold a group, collapse the sidebar and open it
again, and the fold is as the user left it. Reload, and the declaration wins again.

> Every group has a `key`, and `collapsed` is set as `''` or removed as `null`. Both are rules,
> not habits: the [guide](weaver/navigation-tree.md#folding) says what goes wrong without them.
> Hiding destinations whose route nobody registered is on the same page, and it needs the
> distribution's registry, which is why it is not in this recipe.

<a id="a-session-without-a-backend"></a>

## 12 · A session without a backend

The platform owns no sign-in. Before your product has an identity provider you still want to see
gating work: a rail item that says who is signed in, a menu to sign in, switch the account and sign
out, and every gated surface following. This is a stand-in, presentation for a product without a
backend yet; the real integration is in [Auth integration](distribution/auth.md).

The first file is not yours to write. `npx @loomweaver/cli auth-source --name dev --out src/auth`
emits it, as does `nx g @loomweaver/devkit:auth-source --name dev`, and this is what it writes:

```ts
// src/auth/dev-auth-source.ts — written by the generator, unchanged
import { signal, Signal } from '@angular/core';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';

const USER: AuthSnapshot = {
  authenticated: true,
  roles: ['user'],
  claims: {},
  displayName: 'Signed-in user',
};

const ADMIN: AuthSnapshot = {
  authenticated: true,
  roles: ['user', 'admin'],
  claims: {},
  displayName: 'Administrator',
};

const state = signal<AuthSnapshot>(ANONYMOUS);

export function devAuthSource(): Signal<AuthSnapshot> {
  return state.asReadonly();
}

export function cycleDevUser(): void {
  const current = state();
  const next = !current.authenticated
    ? USER
    : current.roles.includes('admin')
      ? ANONYMOUS
      : ADMIN;
  state.set(next);
}
```

A ring of three states and one step around it. The plugin below is the part that is yours: it
turns the one step into the three verbs a user knows, and puts them where a user looks.

**Capabilities:** `contributions`. This plugin does not read the session through `ctx`; it holds
the source itself.

```ts
// src/session/session.plugin.ts — a plugin of the product's own, beside the weavers it composes
import type { Disposable, Plugin, PluginContext } from '@loomweaver/plugin-sdk';
import { cycleDevUser, devAuthSource } from '../auth/dev-auth-source';

const MENU = 'session.account/menu';
const snapshot = devAuthSource();

let drawn: Disposable[] = [];

function signIn(): void {
  if (!snapshot().authenticated) {
    cycleDevUser();
  }
}

function switchAccount(): void {
  cycleDevUser();
  if (!snapshot().authenticated) {
    cycleDevUser();
  }
}

function signOut(): void {
  while (snapshot().authenticated) {
    cycleDevUser();
  }
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function draw(ctx: PluginContext): void {
  for (const part of drawn) {
    part.dispose();
  }
  const current = snapshot();
  const name = current.displayName ?? '';
  drawn = [
    ctx.registerRailItem({
      id: 'session.account',
      rail: 'primary',
      icon: 'account',
      title: current.authenticated ? name : 'session.signIn',
      anchor: 'bottom',
      order: 20,
      menu: MENU,
      menuTrigger: 'primary',
      ...(current.authenticated ? { initials: initialsOf(name) } : {}),
      menuHeader: current.authenticated
        ? {
            title: name,
            detail: `session.role.${current.roles.includes('admin') ? 'admin' : 'user'}`,
            initials: initialsOf(name),
          }
        : { title: 'session.signedOut', icon: 'account' },
    }),
    ...(current.authenticated
      ? [
          ctx.registerMenuItem({
            id: 'session.menu.switch',
            menu: MENU,
            command: 'session.switchAccount',
            group: 'account',
            order: 10,
          }),
          ctx.registerMenuItem({
            id: 'session.menu.signOut',
            menu: MENU,
            command: 'session.signOut',
            group: 'account',
            order: 20,
          }),
        ]
      : [
          ctx.registerMenuItem({
            id: 'session.menu.signIn',
            menu: MENU,
            command: 'session.signIn',
            group: 'account',
            order: 10,
          }),
        ]),
  ];
}

export const sessionPlugin: Plugin = {
  manifest: { id: 'session', name: 'Account', capabilities: ['contributions'] },
  activate(ctx) {
    const then = (step: () => void) => () => {
      step();
      draw(ctx);
    };
    ctx.registerCommand({
      id: 'session.signIn',
      title: 'session.signIn',
      icon: 'account',
      access: { authenticated: false },
      run: then(signIn),
    });
    ctx.registerCommand({
      id: 'session.switchAccount',
      title: 'session.switchAccount',
      icon: 'account',
      access: { authenticated: true },
      run: then(switchAccount),
    });
    ctx.registerCommand({
      id: 'session.signOut',
      title: 'session.signOut',
      icon: 'signOut',
      access: { authenticated: true },
      run: then(signOut),
    });
    draw(ctx);
  },
  deactivate() {
    for (const part of drawn) {
      part.dispose();
    }
    drawn = [];
  },
};
```

```ts
// src/app/app.config.ts — in the providers array
import { heroArrowRightStartOnRectangle, heroUserCircle } from '@ng-icons/heroicons/outline';
import { provideAuthSource, provideCapabilityGrants, provideIcons, providePlugins } from '@loomweaver/shell';
import { devAuthSource } from '../auth/dev-auth-source';
import { sessionPlugin } from '../session/session.plugin';

provideAuthSource(() => devAuthSource()),
provideIcons({ account: heroUserCircle, signOut: heroArrowRightStartOnRectangle }),
provideCapabilityGrants({ session: ['contributions'] }),
...providePlugins(sessionPlugin),
```

**You get:** a rail item at the bottom of the rail that reads "Sign in" for a visitor and
carries the user's initials once signed in. Its menu offers sign-in to a visitor, and switching and
signing out to a user; the three are commands, so the palette offers them too, each only when it
applies. Signing in flips the snapshot, and every surface, rail item and command gated with
`access` follows without a reload. Switch to the administrator and whatever asks for the `admin`
role appears; sign out and it goes. The keys `session.*` go in your product's own bundle.

Nothing here protects anything. The snapshot is a signal in the browser, and a gated surface is
hidden, not withheld. When the product gets its identity provider, the generated file is what you
replace, with `provideAuthSource` mapping the real session, and this plugin's three verbs become
calls into it or go away in favour of a [login page or dialog](distribution/auth.md#2--own-the-login-ui-page-or-dialog).

## Translations for all of the above

Every `title` / `label` / `message` here is a **translation key**. Put them in your bundle:

```jsonc
// src/notes/src/lib/i18n/en.json
{
  "title": "Notes",
  "add": "New note",
  "added": "Note created",
  "list": { "title": "All notes" },
  "nav": { "title": "Notes", "writing": "Writing", "all": "All notes", "drafts": "Drafts",
           "archive": "Archive", "archived": "Archived notes", "search": "Search" },
  "workspace": { "title": "Workspace" },
  "settings": { "title": "Notes", "compact": "Compact rows" }
}
```

The distribution composes it with `provideTranslationNamespaces('notes')`, so these live under
`notes.*` and can never collide with host keys, which is why the recipes above write
`'notes.add'`. Serve the bundle with an assets glob (`input: "src/notes/src/lib/i18n"`,
`output: "i18n/notes"`). An unknown key renders as-is, so a literal string works while you are
sketching.

---

**Next:** [Authoring a weaver](authoring-a-weaver.md) is the complete contract behind these recipes,
and [The plugin system](plugins.md) covers trusted, sandboxed and user-installed plugins.
