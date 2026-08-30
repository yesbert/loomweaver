## Context

See `proposal.md` — Why.

Four things settle the shape of this, and all four were read rather than assumed.

`appReset.action` is used in exactly one place, the Settings button in `default-settings.ts`.
`appReset.title` is used in three: the settings row's own label, the command's title, and the title of
its confirmation. `workspace.reset` is used as the command title, as its confirmation title, and as
the accessible name of three controls in the workspace dialog. So the app reset is the command with
two names, and the workspace reset is consistent with itself.

A product may reword any shipped string through the translation-override mechanism, merged key by key
against `/i18n/overrides/<lang>.json`. A key that disappears takes a consumer's override with it,
silently, at the next upgrade.

The German bundle says "Workspace" everywhere: "Workspaces", "Workspace-Name", "Diesen Workspace
zurücksetzen", "Workspace „{{name}}" löschen?". One string breaks that, `appReset.confirm`, which says
"deine gespeicherten Arbeitsbereiche". That is the only occurrence in the bundle.

The contract does not carry this guarantee today. `commands` requires that every command a user may
run is findable and listed by its translated name; it says nothing about two of them being
distinguishable. `accessibility` requires it for two regions of the same kind, and for one surface
opened in two modes, but neither covers two commands.

## Goals / Non-Goals

**Goals:**

- Each reset names what it resets, so the words alone are enough to know which one runs.
- One command, one name, on every control that reaches it.
- The collision cannot come back unnoticed.

**Non-Goals:**

- No behaviour change. Both resets keep doing exactly what they do, and the reporter was explicit
  that the behaviour is correct.
- No key removal, and therefore no silent loss of a consumer's override.
- Not a runtime guard. The workbench does not check at startup whether a product's own commands
  collide with each other or with the shipped ones. That is the product's to own, and a startup
  warning about names is noise for something a check catches before release.
- Not a general audit of every shipped label. This fixes the collision that was reported and the
  guard that would have caught it; a sweep of all shell wording is its own piece of work.

## Decisions

**Rename the workspace reset rather than only the app reset.** Fixing only `appReset.action` would
leave "Reset layout" belonging to the workspace reset, which is the more surprising of the two,
because it is the one that can leave the content area empty. The short, general wording should belong
to neither, so the reader is never asked to infer scope from an omitted word.

**Keep `appReset.action` and reword it.** Deleting it is the tidier-looking option: the button would
fall back to `appReset.title` and one key would carry the whole command. It is rejected because a
shipped key is a consumer-facing surface here, not an internal detail — the override mechanism is
documented and merges key by key, so a product that reworded `appReset.action` would find its wording
gone with no error and no notice. The project's rule is that a removal is announced, not made
quietly, and this removal would buy a tidier bundle at the price of a silent regression in somebody
else's product.

The cost is that the settings row and its button then read alike. That is accepted: a person tabbing
between buttons hears a button that explains itself, and every route to the command now says the same
words, which is the point.

**"Workspace-Layout zurücksetzen", not "Arbeitsbereich".** The reporter suggested the latter. The
shell's own German says "Workspace" in every other string, which follows the project's rule against
translating technical terms, so their suggestion would have introduced the inconsistency it was
trying to remove. The one existing exception, in `appReset.confirm`, is corrected in the same pass
rather than left as the sole survivor.

**A check over the shipped bundles, not a test over one file.** The defect is a relationship between
two strings in two places, and no unit test sitting beside either one would have seen it. The check
resolves what each shipped command would present in each shipped language and fails on two commands
sharing a name, or on one command carrying two. It runs where the other repository checks run, so it
fails before a release rather than after one.

## Risks / Trade-offs

**A consumer already reads "Reset layout" and will see different words after upgrading.** → It is a
label, not an API, and the current wording is the defect being fixed. It belongs in the release notes,
which is where a user-visible wording change is announced.

**The check must resolve commands to titles, and command registration is code rather than data.** →
It reads the seeds and the settings defaults, which is where the shipped commands and their labels
actually are. A check that grew a parser for the whole registry would be more fragile than the thing
it guards; this one covers the shipped surface and says so.

**The check could be read as forbidding a product from reusing a name.** → It runs in this repository
over what this repository ships. The requirement states that limit in its own text, so a reader does
not have to infer it from where the check happens to live.

## Open Questions

None. The wording, the German term and the guard were settled with the owner before this was written.
