## Context

Generation and wiring are separate in the dev kit: a recipe builds files, and its scaffold states
amendments — data every route interprets. The command-line route applies them to the filesystem,
the Nx route to its tree, and the assistant route turns them into "remaining" steps. Five amendment
kinds exist: a postcss plugin, a build-target merge, an entry-stylesheet `@source`, composing a
plugin into the composition root (with provider lines), and a package dependency.

The four scaffolds in question declare no amendments at all, which is why every route silently
leaves them unwired.

## Goals / Non-Goals

**Goals:**

- Every scaffold's wiring is stated once, as amendments, and applied or named by every route.
- Nothing a consumer declared is replaced: an existing layout or settings store is kept and the
  swap is named.

**Non-Goals:**

- Detecting a consumer's own theme import order beyond "after the shell's styles".
- Wiring into a composition root that no longer presents the generated shape; that case keeps the
  existing rule and is named.

## Decisions

**Two new amendment kinds, not special cases in each route.**

- `stylesheet-import`: ensure the entry stylesheet imports a file, after a named anchor import (the
  shell's styles). Applied by inserting the line after the anchor; where the anchor is missing, the
  import is appended and the route says so.
- A provider line that may only be added while no provider of its kind is present (`unless`)
  already exists inside compose-plugin. The layout and settings store are not plugins, so the
  provider-line part becomes its own kind, `compose-provider`, sharing the composition-root edit
  the compose-plugin kind uses. Where the `unless` marker is found, the route names the line instead
  of adding it.

*Alternative rejected:* letting each route special-case these four scaffolds. That is how the gap
arose: the knowledge lived in READMEs no route reads.

**The frame plugin is a plugin.** It reuses compose-plugin semantics through `provideFramePlugins`
plus `provideCapabilityGrants`, which composes with other grant declarations because grants are a
multi-provider. Its files are served by a build-target asset glob mapping the generated directory to
`/<id>/`.

## Risks / Trade-offs

- [A consumer imports the shell's styles under a different specifier] → The import is appended and
  named; the theme still applies because its layer order, not its position, decides precedence.
- [Two generated layouts] → The second is named, never applied, so a running product keeps one.
