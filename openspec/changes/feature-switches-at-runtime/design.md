## Context

See proposal.md, *Why*. What shapes the approach is how the switches are held today.

The switch set is a plain object behind an injection token, provided once by `provideShellFeatures`
with the declaration merged over the defaults, and read once into `readonly` fields at seventeen
places in fifteen files. Three of those copy a single boolean (`content.escalate` in the tab strip,
`commands.shortcuts` in the command service and the keybinding service, `commands.recentlyUsed` in the
palette). The keybinding service does not even start its key listener when shortcuts are off. The
seeding of built-in commands in `shell-seeds.ts` registers a command only when its switch is on
(`shell.content.splitRight`, `shell.rail.customize`, `shell.views.customize`,
`shell.workspace.manage`, `shell.workspace.reset`), and `seedBuiltInMenus` does the same for menu
entries. `ContributionRegistry.addCommand` returns a `Disposable`, so a registration can be undone.

The rules this change specifies were written down first, in `CONTRIBUTING.md` under *Shaping the
surface* and in `openspec/config.yaml`. The design follows them rather than re-deriving them.

## Goals / Non-Goals

**Goals:**

- One source of truth for the current switches, readable as signals under the names the declaration
  uses, changeable with the shape the declaration uses.
- Every place that honours a switch reads it live. No copy of a switch value survives anywhere.
- Built-in commands and menu entries that exist only while a switch is on come and go with it.
- The forward-only rule and the no-persistence rule are pinned by tests, not only stated.

**Non-Goals:**

- No programmatic twins for panes, sidebars or workspaces. Those are later slices; this one only
  makes sure a switch no longer takes a code path with it, which for the services already published
  (tabs, pop-out, theme, settings, commands) is already true and is pinned here.
- No change to `provideShell({ omit })`. Contributions are removed the way they are today.
- No new persistence key. The storage-key inventory does not grow.
- No plugin-facing access to switches. The distribution's surface is the only one this touches.

## Decisions

**A small service holds the current switches; the token keeps the declaration.** `SHELL_FEATURES`
stays what `provideShellFeatures` provides, in `foundation/` where composition facts live, and is
read exactly once, by a new root service (working name `FeatureSwitches`) that seeds a writable
signal from it. The service lives in a slice of its own, `features/`, not in `foundation/`: the
house rule admits composition facts there and excludes a service that holds feature state, however
many slices read it. The service exposes the groups with one
`Signal<boolean>` per switch (`switches.content.splitRight()`), the whole set as one signal for the
few readers that need it, and `update(input: ShellFeaturesInput)` that merges group by group, exactly
as the provider does today. Readers inject the service; nothing outside it injects the token any
more.

Alternatives: turning the token itself into a writable signal was rejected because a token that
holds mutable state hides where the state lives and loses the distinction between what was declared
and what is current, which the *Everything is on unless the product says otherwise* requirement now
draws. A signal per switch that is individually writable was rejected because the declaration's
shape, a partial nested object, would then have to be translated into thirty-one setters, and the
requirement that declaring, changing and reading share one vocabulary is easier to keep with one
`update`.

**Readers read at the moment they need the value.** Components and templates read the signal
(`switches.escalate()` in place of a copied boolean); services read the signal inside the method that
depends on it (`shortcutOf` asks `commands.shortcuts()` when asked, not at construction). The
keybinding service always installs its listener and checks the switch per keystroke, instead of
deciding at start whether to listen at all: a listener that is cheap to run and honours a signal is
simpler than one that has to be started and stopped by an effect.

**Conditional seeds become effects that hold a `Disposable`.** For each built-in command or menu
entry that exists only while a switch is on, the seeding runs an `effect` that registers it when the
switch turns on and disposes it when the switch turns off. This uses the mechanics the registry
already has and keeps the guarantee literal: when a switch is off, the command is not registered, so
it is not in the palette, not bound and not listed to any caller.

Alternative rejected: registering every built-in command unconditionally and hiding it with a `when`
filter. The palette and the enumeration of invocable commands would still see the command, which is a
route remaining, and the shortcut would need a second gate. A registration that does not exist needs
no gate.

**Forward-only needs no code, only a test.** Turning a switch off changes nothing but the switch;
every consumer stops offering its route on the next read. That a split stays split and a collapsed
sidebar stays collapsed is what happens when nothing tidies up, so the design does not add anything,
and a test pins that nothing does.

**No persistence needs no code, only a test.** The service writes to no store. A test asserts that
`update` produces no write on the working-state or settings port.

**The composition report keeps reporting the declaration.** `CompositionReport.disabledFeatures()`
runs at boot in development and says what the application was composed with. It keeps reading the
declaration; a live report of the current switches is not something anyone asked for.

**A guard keeps the token private.** A lint restriction stops `SHELL_FEATURES` from being injected
anywhere but in the service and the composition root, so that a future reader cannot re-introduce a
one-time copy by accident. The seventeen sites are found by search today; the guard is what makes the
number stay at one.

**Documentation carries the new reading side.** `docs/reference/host-services.md` gains a section
for the switches in the style of the sections around it (`ThemeService`, `PopoutService`): what to
inject, the read and the update, and the two rules a reader must know (forward-only, not
remembered). `docs/building-a-distribution.md`, *Switching capabilities off*, says that the
declaration is a starting value and points at the reference for the runtime side. Every exported name
the service adds appears in one of the two, which is what `check-api-docs.mjs` verifies.

## Risks / Trade-offs

- [A reader is missed and keeps a stale copy] → The lint restriction on the token catches any
  remaining `inject(SHELL_FEATURES)`; a table-driven test flips every switch and asserts the
  service reflects it; a rendered test on the pane toolbar and tab strip flips the content switches
  and asserts the controls appear and disappear.
- [Effects register seeds one tick after boot] → In the application this is invisible. In tests
  that inspect commands right after `provideShell`, effects must be flushed before asserting; the
  seeding spec is written accordingly and says so.
- [A distribution reads `SHELL_FEATURES` directly today] → The token is exported and documented as
  the declaration. Its meaning does not change and nothing breaks; the reference points readers who
  want the current value at the service.
- [A switched-off toggle strands the user] → Stated in the requirement and repeated in the guide:
  put the state where you want it before taking the way away. The workbench does not decide that on
  the distribution's behalf.
