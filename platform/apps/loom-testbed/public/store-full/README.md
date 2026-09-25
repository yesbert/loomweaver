# Store plugin (full)

A sandboxed community plugin for the **LoomWeaver testbed**, installed at runtime from the built-in
plugin store.

## What it does

- Opens its own page at `/store-full` once you install it.
- Declares its own settings (a greeting and a shout toggle). They appear under the
  **Community plugins** group in the settings, and the plugin toasts the greeting whenever you
  change one.

## Permissions

| Capability                | Why                                          |
| ------------------------- | -------------------------------------------- |
| Contribute to the UI      | Registers the page and the settings section. |
| Show dialogs and messages | Answers a settings change with a toast.      |

## How this README got here

Exactly like the plugin itself: the store operator reviewed the plugin and copied its files, this
README included, into the product's own origin. The store renders it in-app; nothing is embedded
from a foreign site.
