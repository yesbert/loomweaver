## Context

See proposal.md, *Why*. What shapes the approach:

- The launch article exists and carries the story; it must not be retold. The new article is a
  different genre: a tutorial, where the reader learns something whether or not they adopt the
  project.
- The owner's voice is the differentiator and the constraint: long sentences, modest tone, no
  copywriter punch, "my own project" disclosed where the project first appears. The text starts
  from the owner's own draft; the assistant reorders and adds facts.
- The dash rule of the repository does not apply to dev.to, but the voice rule does.
- The platform's `--agent` scaffold generates the panel, the seam that decides about a call before
  it runs, and a stand-in that speaks the protocol and nothing else. The demo's assistant is a
  scripted one. Neither has a model behind it, and an article that promises an assistant and
  delivers an echo would be called out in its own comments.
- OpenRouter offers models with a `:free` variant behind an ordinary API key, limited to 20
  requests a minute and 50 a day per key without purchased credits. A key shared through the
  article would be exhausted within the hour; the reader's own key is the only honest setup.
- The AG-UI TypeScript client ships an agent base class that can run in the browser, so an agent
  whose run calls OpenRouter and yields protocol events is a legitimate AG-UI agent, not a shortcut
  around the protocol.

## Goals / Non-Goals

**Goals:**

- A reader with the problem finishes the article with a workbench an assistant operates, and
  understands why the assistant cannot reach further than they can.
- The project is named once, where it is first used, disclosed as the author's own, with a link to
  the demo and the getting-started guide.

**Non-Goals:**

- No feature list, no architecture tour, no retelling of the launch story.
- No second article in this change; if the topic not chosen is worth writing, it is its own change.

## Decisions

**Topic: a desktop-like workbench an AI assistant operates.** Decided by the owner on 2026-09-05
over the two candidates from the review. The isolation topic is the cheaper article and the
workbench topic the broader one; this is the workbench topic with the reason people want one
today. The owner sees it in their own surroundings: the goal set for teams is to cut the clicks a
user makes by a large share, because the assistant is to carry out the individual steps. That
sentence goes into the article as the owner's observation, not as a statistic, and the example
makes it concrete on one workflow the reader can count: the clicks by hand, then the one sentence
to the assistant.

**The assistant is real, runs in the browser, and uses the reader's own key.** An AG-UI agent
in the shape the platform's scaffold already uses, an async generator of protocol events, whose
run sends the conversation and the workbench's offered tools to OpenRouter and yields the events
back, tool results included, so the generated panel's loop stays as it is. The client SDK's agent
base class was considered and not used: it adds a dependency and an observable for a loop that is
twelve lines as a generator. The reader pastes their own
OpenRouter key into the workbench; it is kept in the browser's local storage and sent to nobody
but OpenRouter. A free model is chosen on the day the example is built, and it has to support tool
calling; the article states the daily limit so nobody mistakes it for a defect. The alternative, a
small TypeScript server with Mastra and its AG-UI adapter, is closer to production and was
rejected for the tutorial: a second project, a second start command and a second place to fail
turn twenty minutes into thirty. The article says in one paragraph what production changes: the
agent's run moves behind the product's own endpoint, and the panel, the seam and the commands
stay as they are.

**The example is a directory in this repository, not a repository of its own.** Decided by the
owner on 2026-09-05. The demo already shows the shape: a directory that installs the published
packages from the registry and is built by the pipeline on every pull request, so a change to the
platform that breaks it is caught before it merges. A second repository for one article is the
kind of side project that goes stale. Two costs are accepted with open eyes. The repository's
guards apply to the example, the comment ban included; that is bearable because the article is the
explanation and the code is not. And the code moves on with the platform after publishing, while
the article's snippets do not; so the article links to the directory at the release tag of
publishing day, not at `main`, and the reader fetches the directory alone with `npx degit
yesbert/loomweaver/examples/assistant-workbench`, never the monorepo.

**Problem first; the project where it is first used.** The opening is the problem and the
workflow, counted in clicks. The build follows the shortest path, and the project is named at the
first command the reader types, with "my own project" in that sentence. The earlier decision,
project last after a hand-built solution, does not survive the topic: nobody hand-builds a
workbench in twenty minutes, and pretending to would be the feature list the reviews warned
against. What the article does keep from that decision is that it teaches something whether or
not the reader adopts the project: how a command becomes a tool, why the tool list is not a second
list, and where the permission check sits.

**Drafted in the owner's voice, from the owner's text.** As with the launch posts: the owner writes
the first version or dictates the argument, the assistant reorders and fills in facts, and the full
text is always shown whole, never as a fragment.

## Risks / Trade-offs

- [The tutorial half grows into a guide that belongs in `docs/`] → If the hand-built solution is
  worth documenting, it becomes a docs page and the article links to it; the article stays a story
  with one example.
- [The example rots] → Pin the versions in the example, and say so.
- [The free model is retired or its limits change] → The example names the model in one place
  and the article says how to pick another; the daily limit is stated, not hidden.
- [A reader ships the key-in-browser pattern to production] → The production paragraph is not
  optional and sits before the closing, not in a footnote.
- [The click count reads as a benchmark] → It is one workflow in one example, and the article says
  so in the sentence that gives the number.

## Open Questions

None left open. The topic is decided above; the example is a directory of this repository, and the
demo's assistant stays scripted because giving it a model is its own change; the outbound links
carry `?ref=devto`, the convention the positioning change set. The isolation topic the review preferred
is not lost: if it is worth writing, it is its own change.
