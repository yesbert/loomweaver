> **Status:** approved.

## Why

Settings → Permissions lists every installed plugin with an on/off switch, and a distribution has no
way to say that one of its plugins is not an option. `PluginManifest` carries `id`, `name` and
`capabilities`, and nothing else.

This is not avoidable by composing differently. A routable surface can only be registered by a plugin
through `ctx.registerSurface`; `provideViews` takes the non-routable shape and there is no
distribution-level `provideSurfaces`. So the plugin carrying an application's starting place is
necessarily a plugin, and is necessarily offered to the user as optional.

Reported from outside against 0.7.6. Their sign-in weaver registers the home surface, the signed-in
name and the sign-out control. The gate itself sits in the distribution, so nobody is locked out, but
switching that plugin off leaves a signed-in person with no starting place and no way out until they
find Settings again.

The workbench already knows how to do this. A plugin the operator deployed is listed **without a
switch**, on the stated reasoning that withdrawing from such a plugin does not restrain software the
user is answerable for but breaks software they were given, in a way they cannot connect to the
switch they pressed. That reasoning applies unchanged here. What is missing is only a way to say it
about a plugin the distribution composed, because being deployed is discovered from the plugin store
catalog and a composed plugin never passes through it.

## What Changes

- A distribution MAY declare that some of the plugins it composes are **not optional**. Those are
  listed in the permissions surface without an on/off switch, and stay active.
- **The declaration is the distribution's, not the plugin's.** It is not a manifest field. Everything
  a plugin says about itself in this model is a request that the distribution grants, so a manifest
  flag would be the one place a plugin could exempt itself from being switched off. The reporter
  proposed a manifest flag and this deliberately differs from that.
- **Capabilities stay revocable.** A plugin the operator deployed has both its switch and its
  capability switches withheld. Not being optional is a narrower statement — the application needs
  the plugin, which says nothing about it needing every capability — so this reuses the shape and not
  that second half.
- A plugin already switched off that becomes not-optional comes back on, because the declaration is
  read where the disabled set is read, and there is therefore only one answer to whether it runs.
- In development, declaring a plugin nothing composed is reported, in the way a capability granted to
  a plugin that never declared it already is.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `plugin-permissions`: adds the requirement that a distribution may declare a plugin not optional,
  what the permissions surface then shows, and that this withholds only the plugin's own switch.

## Impact

- `platform/libs/core/shell/src/lib/permissions/` — the declaration and its token, beside the
  capability grants it mirrors.
- `platform/libs/core/shell/src/lib/permissions/permissions-settings.ts` and `.html` — a row learns
  whether it is optional, and the plugin switch is withheld when it is not.
- `platform/libs/core/shell/src/lib/plugin-store/lifecycle/plugin-enablement.service.ts` — a
  not-optional plugin is never in the disabled set, so the runtime and the surface cannot disagree.
- `platform/libs/core/shell/src/lib/i18n/en.json` and `de.json` — the note such a row carries.
- The shell's published surface gains the provider, so `docs/reference/host-services.md` and
  `docs/building-a-distribution.md` name it.

Legacy sources dissolved by this change: none.
