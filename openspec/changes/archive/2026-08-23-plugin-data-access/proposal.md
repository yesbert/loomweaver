> **Status:** approved.

## Why

A plugin that needs the product's own data has no sanctioned way to reach it, and — the sharper
half — the permission model has no say over the way it reaches it anyway.

The six coarse capabilities each name a slice of the context object, and no slice of that object
fetches anything. There is nothing for the broker to route, so data access does not pass it. A
trusted plugin simply calls the browser's own fetch, in the application's JavaScript context, with
the application's origin and whatever credentials it carries. An isolated one is held back only by
an accident: its foreign origin puts every request through the browser's cross-origin gate. Two
levels that the platform describes as differing in isolation and transport also differ, undescribed,
in what they can read.

This was found while designing the demo's first isolated plugin, where the tempting shortcut was to
hand the plugin its data. That shortcut was rejected on the grounds that name this entry: a plugin
that is fed cannot be restricted, because the moment its data arrives inside its own bundle there is
no longer any place where anyone could decide what it may see. Preserving that place is the whole
subject here.

## What Changes

The question this entry was opened to answer — whether the platform offers a seam for reaching a
product's data — is answered **not yet, and here is what that means**. No seam is built, because
there is no plugin to build it for: every plugin that needs the product's data today is composed
with the product and already reaches it as any part of the application does. A data path invented
without a consumer would be wrong in ways nobody could see, and it would be wrong inside the
published contract.

What changes is what the platform says, which is where the actual defect is. Three things were true
and written down nowhere:

- **What a level reaches beyond the workbench.** An isolated plugin has no origin, so it obtains
  only what a service releases to anyone at all; an embedded one obtains whatever the origin it was
  served from is granted. The platform described the levels as differing in isolation and in
  transport and said nothing about this, which is the more consequential difference of the three.
- **That deploying a plugin separately does not separate it.** A plugin whose files come from its own
  deployment but are served at the application's address has the application's origin, its storage
  and its session. The browser is the only thing that can separate, and it sees addresses, not
  deployments.
- **That the workbench hands a plugin no credential.** Nothing it sends is usable to present the user
  to a service, and it offers no path whose purpose is to deliver one. Without this said, the only
  route left to a product that wants its isolated plugin to see real data is to push a token across
  the boundary itself — the worst available answer, arrived at because we were silent.

The seam that would carry data if one is ever needed is designed in the note and deliberately not
built. It is recorded so that whoever opens it next starts from a shape rather than from a blank
page.

## Capabilities

### New Capabilities

None. Data access does not become a seventh capability, because there is nothing yet for it to
decide.

### Modified Capabilities

- **plugin-sandbox** — what each level reaches beyond the workbench, and that a separate deployment
  served at the application's address is not a separation.
- **plugin-permissions** — that the capabilities govern the context and not what a plugin fetches
  for itself, and that the workbench hands a plugin no credential.

## Impact

No contract surface changes, no capability is added and nothing a consumer calls behaves
differently. One test is added, pinning what the workbench sends a plugin about the session, so the
new statement is held by something other than prose.

Two adjacent findings are recorded in the design note rather than acted on here: the published
contract documents a claim bag as reaching plugins that read the session, which it does not, and the
level between "no origin" and "the application's origin" is unreachable for a plugin installed at
runtime, because the store requires such a plugin's document to be served from the application's own
address. Neither has a consumer waiting.

`just-in-time-permissions` is unaffected. It asks whether a capability can be requested at the point
of use; this entry establishes that there is no data capability to request.
