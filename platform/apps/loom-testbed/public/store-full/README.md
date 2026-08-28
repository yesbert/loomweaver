# Store plugin (full)

A sandboxed community plugin for **LoomWeaver Testbed** — installed at runtime from the built-in
plugin store.

## What it does

- Adds a static **Store plugin (full)** tab to the dashboard strip the moment you install it.
- Declares its own settings (greeting text + shout toggle) — they appear under the
  **Community plugins** group in the settings, and the plugin toasts whenever you change one.

## Permissions

| Capability | Why |
| --- | --- |
| Contribute to the UI | Registers the dashboard tab and the settings section. |
| Show dialogs and messages | Confirms a settings change with a toast. |

## How this README got here

Exactly like the plugin itself: the store operator reviewed the plugin and copied its files —
including this README — into the product's own origin. The store renders it in-app; nothing is
embedded from a foreign site.
