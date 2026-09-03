# Settings

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `ui-primitives` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The host settings surface is a registry: the shell registers its own sections, plugins contribute
through `ctx`, and a distribution can do both, add sections and hide any of them.

## Do it

```ts
// src/app/… — inside an injection context (a component, or provideEnvironmentInitializer)
const settings = inject(SettingsService);

const handle = settings.register({
  id: 'acme.workspace',
  title: 'acme.workspace.title',
  group: 'settings.group.options',
  order: 20,
  rows: [
    { id: 'acme.autosave', label: 'acme.autosave.label', control: {
        kind: 'toggle', value: () => prefs.autosave(), set: (v) => prefs.setAutosave(v),
    } },
  ],
});

settings.open('acme.workspace');   // open the dialog on a specific section
handle.dispose();                  // remove the section again
```

## Read it

```ts
settings.all();          // the sections the dialog draws, ordered, with omitted sections and rows dropped
settings.registered();   // everything contributed, including what omit hides
```

`all()` is ordered by `order`, then registration order. `registered()` is what a dev-mode report needs to tell an `omit` that hid a row from one that hit nothing.

## What asks about unsaved work

Nothing on this page asks; registering, opening and disposing a section closes no surface.

## Switched off

No switch governs the settings surface. To remove built-in settings, prefer `provideShell({ omit: ['setting:…'] })`, which is declarative and lasting.

## In depth

**The same rules as a weaver.** Control kinds and the "each control owns its own storage" rule are
the same ones a weaver uses; see [authoring a weaver](../weaver/settings.md#settings-sections).
Registering an existing id replaces that section in place.

**The ids you can omit.** [Curating the settings
surface](../distribution/recomposing-chrome.md#curating-the-settings-surface) lists them.

## Where the story is told

- [Settings sections in a weaver](../weaver/settings.md#settings-sections): control kinds and the storage rule.
- [Curating the settings surface](../distribution/recomposing-chrome.md#curating-the-settings-surface): the ids you can omit.
