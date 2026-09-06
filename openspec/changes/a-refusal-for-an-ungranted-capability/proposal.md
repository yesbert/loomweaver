> **Status:** approved.

## Why

When a plugin is refused a capability, the workbench tells the user that a permission is switched
off and offers the way to the permission settings. That is the right answer when the user switched
it off themselves. It is the wrong answer when the capability was never granted at all, because the
distribution did not grant it or the plugin did not declare it: the permissions page then has no
switch for it, and the user is sent to a place where nothing can be done. Worse, the handler that
raises the notice swallows the refusal, so the developer who forgot the grant sees nothing in the
console either. The demo's "New quote" shows exactly this today.

## What Changes

- The workbench distinguishes a refusal caused by the user's own revocation from one caused by a
  capability that was never granted.
- A user's revocation keeps today's notice and its way to the settings.
- A capability never granted raises a neutral notice saying the action is not available in this
  installation, without a way to the settings, and in development tells the developer which plugin
  was refused which capability.
- What stays silent stays silent: a plugin in the page that handles its own refusal raises nothing,
  and a refusal across the frame boundary is reported as before.
- Not in scope: the demo's missing grant, which is a demo defect fixed on its own.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-permissions`: the requirement that a refusal tells the user and never locks them out
  gains the case of a capability that was never granted, and says what the user and the developer
  are told then.

## Impact

- The refusal reporter in the shell and the two texts it can show.
- No change to the published contract, to storage or to what a plugin can do.
- No legacy source is dissolved by this change.
