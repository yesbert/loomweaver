## 1. Decide

- [x] 1.1 Choose the topic (plugin isolation with iframes and RPC, or a desktop-like workbench in
      Angular) and record it in design.md. Decided 2026-09-05: a desktop-like workbench an AI
      assistant operates, with a real model through OpenRouter and the reader's own key.
- [x] 1.2 Decide where the runnable example lives and record it. A repository of its own; the demo
      stays scripted for now.

## 2. Draft

- [ ] 2.1 Build the example first: a workbench scaffolded with the CLI, two or three commands that
      make up one real workflow, the `--agent` weaver, and the stand-in replaced by a browser-side
      AG-UI agent that calls OpenRouter with the reader's own key from local storage. Pick a free
      model that supports tool calling and record it in one place. Pin every version.
- [ ] 2.2 Run the workflow by hand and count the clicks; run it through the assistant and count
      again. The two numbers and the workflow go into the article as they are.
- [ ] 2.3 The owner writes or dictates the argument; the assistant produces the full draft in the
      owner's voice: the problem and the counted workflow, the shortest path, the project named
      once where it is first used with "my own project" and the qualifier sentence, the production
      paragraph, the demo link with `?ref=devto`. Every snippet comes from the example.
- [ ] 2.4 Cover with the existing cover tooling; tags `angular`, `ai`, `agents`, `webdev`.
- [ ] 2.5 A written answer to "why not SCION Workbench, Luigi or Module Federation", in the owner's
      voice, ready before publishing; the positioning change's design says what it covers.
- [ ] 2.6 On publishing day, check the free model still exists and its limits are as the article
      states.

## 3. Publish and record

- [ ] 3.1 The owner publishes on dev.to; the URL is recorded here.
- [ ] 3.2 Poll reactions and comments through the dev.to API for the first week; answer comments
      in the owner's voice, pasted by the owner.
- [ ] 3.3 `openspec validate dev-to-tutorial-article --strict` passes.
