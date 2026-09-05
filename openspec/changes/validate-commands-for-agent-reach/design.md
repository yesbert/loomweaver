## Context

See proposal.md, *Why*. What shapes the approach:

- Three validators exist in the devkit, for the manifest, the i18n bundles and the store catalogue.
  Each is a pure function over files that returns findings with a severity and a consequence; the
  CLI prints them and maps severity to an exit code under `--strict`, and the MCP server exposes the
  same function as a tool. The new check follows that shape exactly, so it is available on every
  route on the day it lands.
- A command's reach is a property of its registration object: `callable`, `description`,
  `arguments[].description`, `answers`. Those are object literals passed to `registerCommand`, which
  the TypeScript compiler API, already a dependency of the devkit, can find and read without running
  anything. Descriptions are translation keys or literals; the check cannot know which language
  bundle resolves a key, so it judges presence, not prose.
- What the check cannot know: whether the plugin holding the agent connection was granted
  `automation`, whether the session meets a command's `access`, whether the command belongs to the
  current window. Those decide the effective list at runtime. Pretending otherwise would make the
  check lie in exactly the case the developer is debugging.
- The dev-mode warning for a callable command without a description exists already. The check is
  that warning moved to where a developer, or an assistant through the MCP server, can ask for it
  before serving anything.

## Goals / Non-Goals

**Goals:**

- One command answers "which of my commands can an agent reach, and what would make the rest
  reachable" for a directory of plugin sources, in seconds, offline.
- The same answer through the CLI, the Nx devkit and the MCP server.
- Findings phrased as consequences, matching the existing checks.

**Non-Goals:**

- No rewriting of consumer code. The check reports; the developer edits.
- No judgement of description quality beyond presence. Whether a sentence helps a model choose is
  editorial and belongs in the guide.
- No runtime probe. The effective list is the workbench's and is readable there; this check is for
  the moment before the workbench runs.
- No new generator, and no change to the existing ones in this change. Two ideas raised alongside
  are recorded under open questions.

## Decisions

**A reader over TypeScript sources, not a runtime hook.** The compiler API finds every call to
`registerCommand` and reads the literal it is given. Registrations built dynamically, spread from
variables or assembled in loops are reported as "could not read", which is the third outcome the
requirement demands rather than a silent pass. The alternative, booting the workbench headlessly to
ask it for the invocable list, would give the effective answer but needs a browser, a build and the
grants, none of which the moment before serving has.

**Three outcomes, and strict mode fails on one of them.** Offered; offered but underdescribed; not
offered. Strict fails only on a callable command without a description, because that is the one
state that is never intended: somebody opened the command and forgot the sentence a caller needs.
An argument without a description narrows the agent's understanding and warns. A command that is
not callable is the default and is reported as information, so a plugin with private commands
passes strict mode. The alternative, failing on every closed command, would turn the check into
noise on day one.

**The limit is printed with every report.** One trailing line: grants, access and the window decide
what is finally offered, and were not judged here. Every report carries it, not only the ones with
findings, because the developer who reads a clean report is the one most likely to be misled.

**Same wiring as the other three checks.** `validate-commands --dir <dir> [--strict]` in the CLI,
a tool of the same name in the MCP server with the same options, both delegating to the devkit
function. The usage text and the docs list all four together.

## Risks / Trade-offs

- [A registration the reader cannot follow is reported as unreadable, and the developer restructures
  code to satisfy a tool] → The finding says the check could not read it and why, and does not
  fail strict mode; readability of the literal is not a requirement of the platform.
- [The check and the dev-mode warning drift apart] → Both read the same field for the same
  condition; the test for the check names the warning it mirrors.
- [Descriptions that are translation keys pass while the key is missing from a bundle] → That is
  `validate-i18n`'s finding, and the report says so in the finding's consequence.

## Migration Plan

One branch, one pull request, then the next patch release carries the CLI and the MCP server with
the new command. Nothing to migrate; a consumer who never runs it is unaffected.

## Open Questions

Two ideas came up with this change and are recorded here so they are not lost; neither changes this
change's scope, and each would be a change of its own if wanted:

- Whether the `--command` scaffold should emit its example command with `arguments` and `answers`
  filled in, so that the pattern a reader copies is the complete one rather than the two-field one.
- Whether the agent scaffold should offer, behind an explicit option, a browser-side agent against an
  OpenAI-compatible endpoint with the user's own key, as the tutorial builds by hand. The reservation
  is that a key in the browser is right for a tutorial and wrong for generated product code, and a
  generator that emits it would have to say so loudly.
