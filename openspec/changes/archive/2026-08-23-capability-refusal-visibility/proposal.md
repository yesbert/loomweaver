> **Status:** approved.

## Why

The permission model already promises that a refusal reaches the person using the application:
*an action fails because the plugin behind it lacks a capability, and the user is told and offered a
way to the permission settings.* The workbench keeps that promise in exactly one place — when a
registered command runs and hits the gate. Everywhere else the refusal is thrown into the plugin's
own code and nobody hears it.

That gap is reachable by a user in two clicks, because the switch that creates it is one we shipped.
Five of the six capabilities can be turned off in the permission settings. Turn off the one that
lets a plugin show dialogs, then press a button inside that plugin's own view: nothing happens. No
notice, no explanation, no trace. What the user did was withdraw a permission; what they see is a
broken application.

The same is true across the frame boundary, where a sandboxed plugin's refused call comes back as a
rejected promise the workbench never looks at.

This is a defect against a requirement the platform already states, not a new feature. It is filed
on its own because it is worth fixing whatever is decided about asking the user at the point of use
— and because it is the precondition for ever asking rather than only reporting.

## What Changes

- A refusal that nothing catches reaches the user wherever it arose, not only from a command.
- A refusal that crosses the frame boundary reaches the user too.
- The guarantee gains the limit it always had: in the page the workbench can see that a plugin
  handled its own refusal and stays quiet; across the boundary it cannot see that, and says so
  rather than implying a parity it does not have.

Activation is deliberately untouched. A revocation never blocks activation — the platform already
requires that — so a refusal there is a misconfigured composition, which is a developer's problem and
already reported to the console.

## Capabilities

### Modified Capabilities

- **plugin-permissions** — where the existing promise holds, and the one place it cannot.

## Impact

No contract surface changes. A distribution that composes the workbench gets the wider reporting
without doing anything.

A plugin running in a frame that deliberately probes a capability it may not hold — calling it to
see whether it works — will now produce a notice where it previously produced silence. That is the
stated limit rather than an oversight: across the boundary a handled refusal and an unhandled one
look identical from here, and of the two possible mistakes, telling the user about a refusal the
plugin absorbed is the one that leaves them better informed.
