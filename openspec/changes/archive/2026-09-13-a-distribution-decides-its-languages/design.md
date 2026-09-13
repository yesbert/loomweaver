## Context

See `proposal.md`, Why. What already stands, established by reading the code on 2026-09-13:

- **The set is written down three times.** The locale service holds a constant of two codes and a
  union type derived from it, and uses both for detection, for accepting a stored or synchronised
  value, and for the setter. The shell's provider hands the same constant to the translation library
  as its available languages, with English as the fallback. The shipped switcher keeps a record of
  display names and flags keyed by that union.
- **The workbench's own strings are fetched per language from one location**, the directory the
  shell package's JSON files are copied into. For a language the workbench does not ship, that fetch
  fails, and the whole language load fails with it. Named bundles and the overlay are merged over the
  base afterwards and already tolerate their own absence.
- **The missing-key handler reports a key once a bundle for the active language has loaded**, and
  returns the key itself.
- **Isolated surfaces and pop-out windows read the active language as a free string.** The frame
  protocol types it as a string, so nothing on that boundary is narrow.
- **Settings sections upsert by identity; rows can only be removed.** Removal is a lasting filter
  applied when the visible sections are computed, and the composition report already reads what was
  contributed next to what is visible to find removals that matched nothing.
- **The theme service is published; the locale service is not.** A distribution can already replace
  the workbench's bar items by registering the same identity.

## Goals / Non-Goals

**Goals:**

- One declared list is the only place the served set exists.
- A product's language behaves like a shipped one in every respect except that the product supplies
  its strings.
- A product's own language control uses the workbench's mechanism and names.
- Settings and bar can carry different controls for the same preference without the product owning
  a whole section.

**Non-Goals:**

- Right-to-left mirroring, and plural or formatting rules beyond what the translation library does.
- Letting a plugin decide or extend the language set.

## Decisions

**The set is declared once, as an option of the shell, not through an accumulating provider.**
Translation namespaces accumulate on purpose, because several places may each add a bundle. A
language set that accumulates could only grow, and removing a language is half of what is asked. An
option on the shell's own configuration is stated exactly once, already reaches the place where the
translation library is configured, and is where a distribution already removes chrome.
*Alternative considered:* a separate provider function per language. It reads nicely for adding, and
it makes "only French and Japanese" impossible to say without a second mechanism for removal.

**Codes are canonical language tags, checked at composition.** Each declared code is canonicalised
with the platform's own locale support, duplicates collapse, and an empty set or a code that does not
canonicalise throws while the providers are built, the same way an overlay directory that resolves
to the root is refused. Canonical form means `pt-br` and `pt-BR` are the same language, which the
browser preference comparison relies on.

**The public language type is a string, deliberately.** The surface rules prefer typed identities
over free strings, because a typo in a free string is a silent no-op. Here a type would have to be
fixed where the workbench is compiled, and the set is decided where the product is composed; any
union we publish excludes the languages this change exists for. The silent no-op is closed at run
time instead: a setter given an unserved code changes nothing and warns in development. A product
that wants a compile-time check can narrow its own constant, and the declaration accepts it.
*Alternative considered:* a generic service parameterised by the product's codes. It adds a type
parameter to every injection site for a check the product can already have locally.

**Detection matches exactly, then by the language without its region.** A browser preference of
`de-AT` selects a served `de`. A preference of `pt` does not select a served `pt-BR`, because that
would be a guess about which variant the user reads. After the preferences, English if served,
otherwise the first declared code, since a product that removed English has told us its order.

**For a language the workbench does not ship, English is the base and the product's file is merged
over it.** The loader fetches the product's workbench strings from the same location as the shipped
ones. If the language is one the workbench ships, nothing changes. Otherwise it also takes the
shipped English strings, merges the product's file over them key by key with the merge the overlay
already uses, and reports in development the keys English has that the product's file lacks. A
missing file is not a failed language: it becomes English throughout, reported once. Named bundles
and the overlay then apply as today.
*Alternative considered:* leaving it to the translation library's fallback language. That falls back
only when a whole load fails, and the missing-key handler would report keys as absent while they are
in fact shown in English, which says the wrong thing to the developer.

**The language service is published with facts as signals.** The active code is a signal; the served
languages are a read-only list of code and name, fixed at composition; the setter takes a code. It
keeps its current behaviour for storage, synchronisation between windows and the document language.
The shipped switcher takes the languages and their names from the service, so the switcher and
a product's control read one source; nothing else about the switcher changes.

**Names come from the platform, in the language they name.** Each name is the platform's display
name of the code in that same language, with its first letter upper-cased by that language's own
rules, which gives "Deutsch", "English", "Français". Where the platform cannot name a code, the code
is shown.

**The shipped switcher keeps its look; flags stay its own presentation.** The owner's decision is
that the workbench's language and theme controls are not redesigned here; what this change adds is
the ability for a product to replace them. So the switcher keeps its flags for English and German
exactly as today. They are not part of the published list, because a flag is how this one control
presents a language, and a product's control decides its own presentation. A language the switcher
has no flag for is listed under its name without one, and where the switcher is compact and would
otherwise show only the flag, it shows the language's code, so that the entry is never blank.
*Alternative considered:* dropping the flags so that every language looks alike. It is the more
uniform result, and it is a redesign of a control the owner wants left as it is.

**Row replacement lives on the settings service, beside removal.** A distribution already removes
rows through that service, and a replacement is the same kind of lasting instruction applied at the
same moment. It is kept in its own map by row identity, applied when visible sections are computed,
after removal, so a removal wins. It returns a disposable like every registration. It is not on the
plugin context, which contributes whole sections and cannot reach a row it did not write. The
composition report checks replacements against contributed rows the way it checks removals.
*Alternative considered:* letting a section registered under an existing identity merge its rows
with the previous one. It would change what re-registering a section means for every existing
consumer, and it would make removing a row by re-registering impossible to tell from a mistake.

## Risks / Trade-offs

- **A declared language looks plainer in the shipped switcher than English and German.** → It has
  no flag there. A product that wants every language to look alike replaces the switcher, which is
  what this change makes possible.
- **A product's language file is fetched, and fails, for a language it forgot to translate.** → By
  design that is served as English and reported once, not a failed start.
- **Detection by region-less match can pick a language the user reads less well.** → Only when the
  exact form is not served and the region-less form is; the user's explicit choice then wins and is
  remembered.
- **Canonicalisation at composition relies on the platform's locale support.** → Present in every
  browser the workbench supports; a code it rejects is refused with the code named, not silently
  dropped.

## Migration Plan

Nothing to migrate for a distribution that declares nothing. A value stored as `en` or `de` stays
valid. A distribution that had replaced translation loading to serve a further language declares the
set instead and moves the workbench's strings for that language to the shipped location.
