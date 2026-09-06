## Context

See `proposal.md` — Why. What the approach stands on:

- **The broker already knows the difference.** A plugin's base grant is the distribution's grant
  intersected with the plugin's declaration, and a user's revocation sits on top of it. The broker
  answers both questions separately: whether a capability is granted right now, and whether it is
  base-granted regardless of revocation. A refusal for a base-granted capability is therefore a
  revocation; a refusal for anything else is a capability never granted.
- **One reporter serves both boundaries.** The refusal a plugin in the page lets escape reaches the
  workbench's error handler, and a refusal crossing the frame boundary is handed to the same reporter
  by the sandbox runtime. Deciding in the reporter covers both without touching either boundary.
- **The refusal names its plugin and its capability**, so the reporter has what it needs to ask the
  broker and to tell the developer.

## Goals / Non-Goals

**Goals:**

- The user is never sent to a settings page that cannot help them.
- A forgotten grant is visible to the developer in development.

**Non-Goals:**

- No new notice in production for the developer; a product is not debugged from its users' screens.
- No change to how the frame boundary reports, or to the silence for a plugin that handles its own
  refusal.
- No attempt to say *why* the capability is missing, whether undeclared or ungranted; the developer
  reads that off the grant and the manifest, and the user does not need it.

## Decisions

### The reporter decides, by asking the broker whether the capability is base-granted

The alternative, carrying a "revoked" flag in the refusal itself, would spread the distinction to
every place that raises one, on both sides of the frame boundary, for a fact the broker already
holds. Asking the broker at reporting time is one lookup in one place.

### The developer is told through the console, only in development

The refusal's own message already names the plugin and the capability, so the reporter passes it
on rather than composing a second one. It does so only in development because a user's console is
not the developer's, and because the user-facing notice already says all a user can act on. The
notice for a revocation is unchanged, so nothing that worked differently before does so now.

### The neutral notice offers no action

A notice that says "not available here" and then offers a button to the settings would contradict
itself. Nothing the user can do makes the action available, so the notice offers nothing.

## Risks / Trade-offs

- **A developer running a production build sees no console line.** → Accepted; the user-facing
  notice still says the action is unavailable, and the grant is visible in the composition.
- **A product that deliberately withholds a capability now has its users told "not available"
  instead of being pointed to the settings.** → That is the truthful message; the settings could
  not have helped them before either.
