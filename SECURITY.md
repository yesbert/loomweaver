# Security Policy

## Reporting a vulnerability

Report a suspected vulnerability privately, either through GitHub's **Report a vulnerability** button
under this repository's Security tab, or by email to **security@loomweaver.dev** if you would rather
not use GitHub. Both reach the same people; the GitHub route keeps the discussion attached to the
repository and lets us credit you automatically in the advisory.

Do not open a public issue, pull request, or discussion for a suspected vulnerability — a public
report exposes users before a fix exists.

Helpful things to include, as far as you have them:

- what an attacker can achieve, and what access they need to start
- the affected package and version (`@loomweaver/shell`, `@loomweaver/plugin-sdk`, `@loomweaver/frame-kit`,
  `@loomweaver/cli`, `@loomweaver/devkit`, `@loomweaver/mcp`, `@loomweaver/ag-ui`)
- steps to reproduce, ideally a minimal case
- whether the issue is already public anywhere

We will acknowledge your report and keep you informed while we investigate. We do not run a bug
bounty. If you would like credit in the release notes, say so and tell us how to name you.

## Supported versions

LoomWeaver is pre-1.0 and ships as a single version line across all seven packages. Fixes go into the
**latest released version**; there are no maintained back-branches. Please reproduce against the
latest release before reporting.

## What is in scope

LoomWeaver is a **frontend platform and ships no server** — there is no LoomWeaver backend to attack.
The security-relevant surfaces we own are:

- the **capability broker**, which is default-deny: a plugin gets nothing it was not both granted by
  the distribution and declared in its own manifest
- the **sandbox boundary** for untrusted plugins — an isolated iframe (`allow-scripts` without
  `allow-same-origin`) reaching the host only through a narrow, sanitised RPC surface
- **access gating** of routes, commands and chrome against the session the product supplies
- what the platform persists through the `SettingsStore` port, and how it is scoped per identity

A report that shows a plugin escaping its granted capabilities, a sandboxed plugin reaching host
state it was never given, or the platform leaking one user's state to another is squarely in scope.

## What is out of scope

Some things look like platform issues but are not:

- **Client-side access gating is presentation, not enforcement.** Hiding a route or a button from a
  user who lacks a role is a user-experience decision. Real authorisation belongs in the product's
  own backend, and a client-side bypass of gating is expected rather than a vulnerability.
- **The product's backend, authentication and session handling** are not part of LoomWeaver. The
  platform defines the `SettingsStore` and `AuthSource` ports; whoever implements them owns their
  security. Report those to the product, not here.
- **Trusted, first-party plugins** run in the host page by design and are not sandboxed from it. A
  trusted plugin doing something a trusted plugin can do is not a platform vulnerability; the control
  for that is operator review before composing it.
- **A distribution's own configuration**, such as granting broad capabilities or a permissive
  Content-Security-Policy, is the distribution's decision.

If you are unsure which side of that line something falls on, report it anyway and say why you are
unsure — a wrong guess in that direction costs us nothing.
