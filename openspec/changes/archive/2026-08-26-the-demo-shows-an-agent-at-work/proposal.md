> **Status:** approved.

## Why

Everything needed to show an agent driving the workbench now exists and is published, and nobody can
see any of it. The demo has no chat, and it has no commands at all — `registerCommand` appears in
`demo/src` exactly zero times — so there is currently nothing for an agent to do there.

What is worth showing is not a chat. Chats are everywhere. What no other frontend platform can show
is the sentence underneath ours: **an agent reaches what the user could have reached, and nothing
more.** That is only convincing when a visitor watches it fail as readily as it succeeds — refused
for a role it does not have, stopped at a confirmation, and switched off entirely from the
permissions surface while it is running.

## What Changes

- Some of the demo's existing weavers gain **callable commands worth driving**: opening a quote,
  switching the look, revealing the dashboard. Described, with declared arguments. This improves the
  demo whether or not an agent ever calls them, and it is the first real use of the surface by
  something other than its author.
- A new demo weaver contributes a **chat panel** in the right-hand dock, with a local agent behind it.
- The agent is **scripted, and says so**. It emits real protocol events, so everything downstream of
  the brain is real: the tool list comes from the live registry, the call goes through the workbench's
  own seam, and the answer carries a real outcome. Only the choosing is canned.
- The visitor drives the pace by clicking one of a few **suggested prompts** rather than typing.
  Nothing pretends to understand free text.
- The demo's platform dependency moves to the published `0.6.0`.

## The script

Five beats, each one a claim a visitor can check on the screen:

1. **"Open the quote for Nordwind Logistik."** The agent calls a command with a typed argument and
   the content area navigates to that document. *It really drives the app.*
2. **"Show me the overview."** The dashboard takes the whole content area — a screen that is not a
   document, with no tab of its own. Instant, no reload. *It moves the workbench, not just a page.*
3. **"Send this quote to the customer."** A confirmation appears, and the demo declines it. The agent
   is told the command did not run, and says so. *A human stays in front of what matters.*
4. **"Show me the margin."** Answered, because the demo starts on the accounting account. Switch to
   the sales account from the demo's own session control and ask again: refused, and the count of
   actions it was offered drops by one. *The agent reaches what you could have reached, and not a
   step further.*
5. **"Give it a different look."** The finale. The whole application re-colours, re-letters and
   re-words itself — and the page reloads, because this demo composes its looks at startup. The panel
   says exactly that, which turns the one limitation into the most interesting sentence of the
   demonstration: a look here is a composition decision, not a colour switch.

Then the beat nobody scripts: the visitor opens **Permissions**, turns the automation capability off
for the chat plugin, and asks again. Nothing works any more. Turning it back on, it does.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Everything here is a product built on the platform, using the published contract exactly as any
other product would. The change declares `skip_specs: true` and exists because the work needs a
worklist.

## Impact

- `demo/package.json` — the platform dependency moves to `^0.6.0`, and `@loom/ag-ui` and
  `@ag-ui/core` are added. Until `0.6.0` is in the feed this change cannot build, which is why the
  release goes first.
- `demo/src/quotes`, `demo/src/looks`, `demo/src/insights` — the commands, with descriptions and
  arguments, and the capability declarations they need.
- `demo/src/agent` — new: the chat panel, the scripted agent and the suggested prompts.
- `demo/src/app` — composing the new weaver and granting it what it needs.
- `demo/src/i18n` — every string the panel draws, in both languages the demo carries.
- `docs/samples.md` — the recipe, since a visitor who likes what they see will look for how it was
  done.
- No change to anything under `platform/`. If this change touches the platform, the platform was
  missing something and that is a separate change.
- No legacy source is dissolved by this change.
