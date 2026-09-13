> **Status:** approved.

## Why

A product decides which languages its interface speaks. The workbench does not let it.

The set is fixed at English and German in three separate places: what the workbench accepts as a
language, what its translation loading knows about, and the names its switcher shows. `i18n` allows
a product to serve further languages by replacing translation loading, but everything around the
strings stays closed. The switcher never offers the product's language, a stored choice of it is
discarded on the next visit, the browser preference never selects it, and the document goes on
declaring English or German. The specification even records that last part as intended. A product
also cannot remove a language: an interface that speaks French and Japanese still offers German.

The same gap blocks a smaller request. A product that wants its own language control, in the status
bar or in another shape, can already put its own control in place of the workbench's by registering
the same identity. Its theme control can drive the workbench's theme, because that service is
published. Its language control has nothing to call, so it would have to rebuild how a language is
applied, stored and synchronised beside the workbench's own. And the settings surface, where the
same control appears a second time, allows removing a single row but not replacing one, so the two
places cannot differ without the product taking over the whole General section.

NextPA raised the second half as F-014. The first half was found while checking it, and publishing
the language service with the fixed set would have made the closed set part of the contract.

The workbench's own language and theme controls are not what this change is about. They stay as they
are; the point is that a product built on the workbench can replace them where it wants to.

## What Changes

- A distribution declares the whole set of languages the workbench serves. It can add languages,
  remove them, and serve a set that contains neither English nor German. Declaring nothing keeps
  English and German. One declaration decides what is loaded, what is offered, what a stored or
  browser preference may select, and what the document declares.
- Where a served language lacks some of the workbench's own strings, those strings are shown in
  English and the developer is told which ones. A language with none of them at all is shown in
  English throughout, and the developer is told that too.
- A product can read the active language, the served languages with the name of each in its own
  language, and change the language, through the same mechanism the workbench's switcher uses. A
  language that is not served is refused, and the developer is told.
- The shipped language switcher keeps its look. It offers whatever is served: English and German
  exactly as today, with their names and flags, and a language it has no flag for under that
  language's own name, shown by its code where the switcher is compact.
- A distribution can replace a single row of a settings section in place, keeping the section and
  every other row, so the language control in Settings can differ from the one in a bar. A
  replacement that matches no row is named in the composition report.
- The distribution guides describe how the workbench's own bar controls (language, theme, update,
  version) are replaced or moved to another bar, and which published service each one drives.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `i18n`: *The workbench serves the languages it ships, and says which* is removed and replaced by
  *A distribution decides which languages the workbench serves*, which carries its derived-set
  guarantee over and reverses its statement that a product's language is not reflected in the
  document. *The starting language is resolved before the first paint* resolves against the
  declared set. Two further requirements are added: missing workbench strings fall back to English
  and are named, and a product can read and change the language.
- `ui-primitives`: a requirement is added, *A distribution may replace a single settings row in
  place*.
- `platform-composition`: *A composition can be asked what is wrong with it* also names a row
  replacement that matched no row.

## Impact

- The shell publishes its language service. Its language type widens from two fixed codes to any
  served language code; since the service was never published, no consumer relied on the narrow
  type.
- The shell's options gain the language declaration, and the settings service gains row replacement.
  Nothing existing is renamed or removed.
- A distribution that declares nothing sees exactly today's languages and today's switcher.
- The frame protocol already carries the language as a free code, so isolated surfaces need no
  change.
- NextPA finding F-014.
- No legacy source is dissolved by this change.

## Non-Goals

- **Changing the workbench's own language or theme controls.** Their look and behaviour stay as they
  are. The switcher only learns to list a language a distribution declares.
- **Right-to-left layout.** A product can now serve Arabic or Hebrew strings, and the workbench will
  declare the language, but mirroring the frame is a separate capability.
- **Translating the workbench into further languages ourselves.** The workbench keeps shipping
  English and German.
- **Replacing rows from a plugin.** Replacing what the workbench ships is a distribution's right, as
  it already is for symbols.
