## 1. The demo takes the published 0.6.0

- [x] 1.1 Move `demo/package.json` to `^0.6.0` for `@loom/plugin-sdk`, `@loom/shell` and
      `@loom/frame-kit`, and add `@loom/ag-ui` and `@ag-ui/core`.
- [x] 1.2 Install, build and test the demo against the feed, so the release is verified from the
      consumer's side rather than only from ours.

## 2. Commands worth driving

- [x] 2.1 Give the quotes weaver a callable command that opens a quote, taking the quote as a choice
      argument, described well enough for something that has never seen the demo.
- [x] 2.2 Give the looks weaver a callable command that switches the look, taking the look as a
      choice argument. Its description says that applying it reloads the page, because the caller
      deserves to know before it calls.
- [x] 2.3 Give the insights weaver a callable command that reveals the dashboard.
- [x] 2.4 Give the quotes weaver the command the confirmation beat needs — sending a quote to the
      customer — described as the consequential action it is.
- [x] 2.5 Declare the capabilities those commands need, and check each one works from the command
      palette, since a command an agent can run is one a person can run.

## 3. The chat panel

- [x] 3.1 Add a demo weaver contributing a surface to the `right-panel` dock: a conversation, the
      suggested prompts, and a line saying the agent is scripted.
- [x] 3.2 Draw it with the semantic design tokens and the `.lw-*` class contract only, and confirm it
      holds up in all three looks.
- [x] 3.3 Put every string it draws into the demo's own i18n bundles, in both languages.
- [x] 3.4 Confirm it survives being dragged to another dock, since that is the workbench's own claim
      and a visitor will try it.

## 4. The scripted agent

- [x] 4.1 Write the local agent: it takes a chosen prompt and emits the protocol events for that
      beat, including the streamed argument deltas rather than one whole call, so what the adapter
      does is what it would do against a real backend.
- [x] 4.2 Wire it through `commandTools(ctx)`: the tool list comes from the live registry at the
      start of each run, and every event goes to `receive`.
- [x] 4.3 Put the confirmation on the `before` hook, and decline when the visitor says no.
- [x] 4.4 Render what comes back, including a refusal, in words a visitor understands rather than the
      developer-facing message.

## 5. The four beats

- [x] 5.1 Opening a quote: the content area navigates to that quote.
- [x] 5.2 The overview: the dashboard takes the whole content area, instantly and without a reload.
- [x] 5.3 Sending a quote: the confirmation appears, declining it stops the command, and the panel
      says the command did not run.
- [x] 5.4 The margin: answered for the accounting account the demo starts on, and refused after
      switching to the sales account with the demo's own session control, without a reload. The beat
      reads the session rather than assuming a starting state.
- [x] 5.5 The finale, the look: the application re-colours, re-letters and re-words itself, and the
      panel says beforehand that this one reloads the page and why — a look here is composed at
      startup, not switched at runtime.

## 6. Proving it

- [x] 6.1 Test each beat by what the workbench did — where it navigated, which look is active, that
      the command did not run — rather than by what the panel drew.
- [x] 6.2 Test that the tool list is read per run, by registering a command after the panel exists
      and finding it offered.
- [x] 6.3 Test the refusal beat both ways round, anonymous and signed in, so the second half is
      pinned as well as the first.
- [x] 6.4 Confirm no network request leaves the page during any beat.

## 7. Documentation

- [x] 7.1 Add the recipe to `docs/samples.md`, pointing at
      [agent tools](../../../docs/reference/agent-tools.md) for the contract and keeping the sample
      to what a reader would copy.
- [x] 7.2 Say in the demo's README what the chat is and what it is not, so the first thing a reader
      learns is that the brain is scripted.

## 8. Verification

- [x] 8.1 Run the demo's own lint, test, build and pwa-check.
- [x] 8.2 Run the workspace gate and the repository guards, and confirm nothing under `platform/`
      changed.
- [x] 8.3 Run the website build, since `docs/samples.md` gained a link.
