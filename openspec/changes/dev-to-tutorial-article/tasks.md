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
      The snapshot is the tag `tutorial-intent-driven` rather than a release tag, decided
      2026-09-07. A release tag cannot carry it: the example pins the packages that tag publishes,
      so the pins can only be raised after the publish, one commit too late. The tag sits on the
      commit that put the example on 0.9.1, it publishes nothing because the release workflow
      triggers on `v*` alone, and `npx degit yesbert/loomweaver/examples/assistant-workbench#tutorial-intent-driven`
      was run to confirm it delivers that snapshot.
      Moved to 0.9.2 on 2026-09-07, after the release that carries the scaffold's budget fix, so a
      reader fetches the example on the platform the article is published against. Moving a tag is
      not a thing to make a habit of; this one is a bookmark with no publish behind it and the
      article was not out yet, so nobody had followed it. The fetch was run again against the moved
      tag: four pins at ^0.9.2, the model the article names, and a budget a release build fits.
      Moved once more on 2026-09-08, to the commit that put the example on 0.9.3, for the same
      reason and under the same conditions: 0.9.3 is the release that publishes `init`, and the
      article's first step is now that one command, so the snapshot has to sit on the platform the
      step is written against. The step was rewritten on publishing day from the ten-line install
      chain to `init --weaver tickets`, the `--agent` weaver and one `npm install`, after the
      chain had run green against the published 0.9.3 packages; the published Getting started had
      already shown `init` since #329 with no package carrying it, which is why the release came
      before the article and not after.
- [x] 2.4 Cover with the existing cover tooling; tags `angular`, `ai`, `agents`, `webdev`.
      Chosen 2026-09-05: `covers/cover-intent-f.png`, eyebrow "TUTORIAL · ANGULAR · AG-UI",
      headline "Intent-driven UIs: say what you mean.", the workbench in dark behind it. The owner's
      rule for it: the icon appears as a design element, the brand name does not, so the cover does
      not read as advertising. The tags are `angular`, `ai`, `agents` and `tutorial`, decided
      2026-09-08: five had been picked and dev.to takes four, so `webdev` went, as the one that
      says least about the article. The draft carries them as dev.to front matter, which also
      holds the title, so the body no longer opens with a heading the title field would repeat.
- [x] 2.5 Dropped by the owner on 2026-09-05: no prepared answer on SCION Workbench, Luigi or
      Module Federation. If a comment asks, it is answered then.
- [x] 2.6 On publishing day, check the free model still exists and its limits are as the article
      states.
      Checked 2026-09-07, and it did not: OpenRouter answers `minimax/minimax-m2.7:free` with 404,
      the free variant is gone and only the paid slug remains. Of the fifteen free models that
      accept tools, `dots-studio/dots-3-note-preview:free` carried the counted workflow seven times
      out of seven in seven to ten seconds, so the article's "under ten seconds" still holds;
      `cohere/north-mini-code:free` also carried it every time but took up to eighteen seconds, and
      the nemotron free endpoints answered "service temporarily overloaded" in two runs out of
      three. The model changed in the example and in both drafts. Because a free model will vanish
      again, the README now says where the constant is and links the list filtered to free models
      with tool calling, and a 404 from OpenRouter adds that sentence to the message the panel
      shows. The example's package pins moved from `^0.9.0-preview.2` to `^0.9.0` at the same time,
      so a reader installs the released packages.
      Checked again on 2026-09-08, publishing day: the model is still listed and still free, the
      five docs anchors the article links resolve, and degit on the moved tag delivers the example
      at ^0.9.3. The reader's path was then walked end to end on 0.9.3, the article's own
      snippets where it shows them and the example's files where it points there: it builds,
      serves, and the owner drove the counted workflow through it. One hole surfaced: the text
      never said that the generator's example command, view and rail item on the assistant go,
      so a reader kept them and saw raw translation keys, and the generated test that pinned the
      example command failed once step 5 moved the confirmation to `tickets.reply`. Two sentences
      at the top of step 7 close it, and step 7 now names `openrouter-key.ts`.

## 3. Publish and record

- [x] 3.1 The owner publishes on dev.to; the URL is recorded here.
      Published 2026-09-08 at 14:14 UTC:
      https://dev.to/norbertrosenwinkel/intent-driven-uis-an-angular-workbench-your-ai-assistant-operates-5kd
      Checked through the API right after: the four tags, the cover, the three pictures on dev.to's
      own storage with no local path left, the degit line, eleven minutes reading time. The pasted
      file had to be unwrapped first, one line per paragraph, because dev.to renders every newline
      as a line break.
- [x] 3.2 Poll reactions and comments through the dev.to API for the first week; answer comments
      in the owner's voice, pasted by the owner.
      Polled 2026-09-09 through the authenticated API, one day after publishing: 14 page views,
      zero reactions, zero comments, nothing to answer. The account has 562 followers, so the
      article is not reaching its own feed, and the shortfall is distribution rather than the text.
      The same account for comparison: the launch article of 2026-09-04 has 39 views and one
      reaction after five days, and the best received article so far, on why AI projects fail
      (2026-05-31, tags `dotnet`, `ai`, `programming`, `eventsourcing`), has 568 views, nine
      reactions and 35 comments.
      One deviation from task 2.4 recorded while reading: the published tags are `ai`, `agents`,
      `tutorial`, `angular`, so `tutorial` went out in place of the planned `webdev`.
      Closed on the owner's decision of 2026-09-09: no daily polling, the numbers are fetched when
      there is a reason to. What the reading is good for beyond this article is written up in the
      private marketing worksheet, under *Was dev.to hergibt*: the article is visible in the feeds
      (position 3 in `angular`), the median article in every tag we use has zero reactions, and the
      ceiling in `angular` is around 36 reactions, so the silence is the platform and not the text.
- [ ] 3.3 The day after the article, the owner posts the less technical LinkedIn version, which
      links to the article; the draft and its image live beside the article draft, outside the
      repository.
- [ ] 3.4 `openspec validate dev-to-tutorial-article --strict` passes.
