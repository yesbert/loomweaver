## 1. Decide

- [x] 1.1 Choose the topic (plugin isolation with iframes and RPC, or a desktop-like workbench in
      Angular) and record it in design.md. Decided 2026-09-05: a desktop-like workbench an AI
      assistant operates, with a real model through OpenRouter and the reader's own key.
- [x] 1.2 Decide where the runnable example lives and record it. Decided 2026-09-05:
      `examples/assistant-workbench/` in this repository, built by the pipeline like the demo; the
      demo stays scripted for now.

## 2. Draft

- [x] 2.1 Build the example first, in `examples/assistant-workbench/`: a workbench scaffolded with
      the CLI against the published packages, two or three commands that make up one real workflow,
      the `--agent` weaver, and the stand-in replaced by a browser-side AG-UI agent that calls
      OpenRouter with the reader's own key from local storage. Pick a free model that supports tool
      calling and record it in one place. Pin every version. A README of a few lines says what it is
      and points at the article.
      Built 2026-09-05 on 0.8.3. The domain is a support inbox: a ticket store and five callable
      commands (`tickets.list`, `.open`, `.assign`, `.reply`, `.status`), `tickets.reply` marked
      consequential. The list is docked in the left sidebar and every ticket opens as a tab of
      its own (preview on click, kept on double click), the demo's pattern, so the example is a
      workbench and not a page. The assistant weaver is called `assistant`, not `copilot`, because
      that is a product name a reader attaches to Microsoft. All texts come from the weavers'
      bundles in English and German. The model is `minimax/minimax-m2.7:free`, named once in the agent source;
      `nvidia/nemotron-3-super-120b-a12b:free` also passed the tool-calling probe, the Gemma and
      GLM free variants answered 429 upstream all afternoon. The agent is an async generator of
      protocol events, the same shape the generated stand-in has, so the panel's loop did not
      change; the design's "agent base class" wording is corrected below. Three things the reader's
      path needs that the scaffold does not give, each a step in the article: the page's
      Content-Security-Policy must allow `connect-src https://openrouter.ai`; the two
      `provideCapabilityGrants` calls the CLI appends must be merged into one, because the second
      overrides the first and the first weaver silently never activates (a scaffold defect,
      followed up in its own change); and `app.spec.ts` from `ng new` fails once the shell is in,
      so it is replaced by a test that boots the shell with the app's providers.
- [x] 2.1a A job in `.github/workflows/build.yml` beside the demo's, same shape: its own working
      directory, `npm install` from the registry, lint, build, unit tests. The deploy workflow is not
      touched; the example is not deployed. Added as `example`; the example's `src` is also a root
      of the comment guard, like the demo's.
- [x] 2.2 Run the workflow by hand and count the clicks; run it through the assistant and count
      again. The two numbers and the workflow go into the article as they are.
      Counted 2026-09-05 in a headless browser on the example. The workflow: open the ticket about
      the blank invoice PDF, assign it to Dana, reply that the fix ships on Monday. By hand: five
      clicks (ticket row in the sidebar, assignee select, the option, the reply field, send) and
      one typed reply. Through the assistant: two clicks (the prompt field
      and the confirmation of the reply) and one typed sentence. The model called list, assign and
      reply in under ten seconds; it skipped `open` in one run and used it in another, so the
      article does not promise the exact sequence of calls.
- [x] 2.3 The owner writes or dictates the argument; the assistant produces the full draft in the
      owner's voice: the problem and the counted workflow, the shortest path, the project named
      once where it is first used with "my own project" and the qualifier sentence, the production
      paragraph, the demo link with `?ref=devto`. Every snippet comes from the example. Links to
      the code point at the release tag of publishing day, and the fetch instruction is
      `npx degit yesbert/loomweaver/examples/assistant-workbench`.
- [x] 2.4 Cover with the existing cover tooling; tags `angular`, `ai`, `agents`, `webdev`.
      Chosen 2026-09-05: `covers/cover-intent-f.png`, eyebrow "TUTORIAL · ANGULAR · AG-UI",
      headline "Intent-driven UIs: say what you mean.", the workbench in dark behind it. The owner's
      rule for it: the icon appears as a design element, the brand name does not, so the cover does
      not read as advertising. Tag `tutorial` added.
- [ ] 2.5 A written answer to "why not SCION Workbench, Luigi or Module Federation", in the owner's
      voice, ready before publishing; the positioning change's design says what it covers.
- [ ] 2.6 On publishing day, check the free model still exists and its limits are as the article
      states.

## 3. Publish and record

- [ ] 3.1 The owner publishes on dev.to; the URL is recorded here.
- [ ] 3.2 Poll reactions and comments through the dev.to API for the first week; answer comments
      in the owner's voice, pasted by the owner.
- [ ] 3.3 `openspec validate dev-to-tutorial-article --strict` passes.
