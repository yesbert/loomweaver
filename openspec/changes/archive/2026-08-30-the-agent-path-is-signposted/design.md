## Context

See `proposal.md` — Why.

Five facts about how this repository publishes its documentation decide the shape of the work, and
all five were read from the code rather than assumed.

Documentation pages are single-sourced in `docs/` and synced into the site by
`website/tools/sync-docs.mjs`. It collects its sources with `git ls-files`, so a page that is written
but not tracked does not exist as far as the site is concerned. It rewrites every relative link to a
site route and fails the build on a target it cannot resolve, which is what makes the site build the
guard for documentation edits.

The sidebar in `astro.config.mjs` is hand-kept, not generated: Starlight's `autogenerate` derives its
tree from its own collection, and these pages arrive through a `glob()` loader, so the group rendered
empty. The sync therefore carries a check that every page under `docs/reference/` is linked from the
sidebar. **Guides have no equivalent check.**

Landing media is single-sourced in `assets/media/`, listed by name in the sync, and copied to
`website/public/media/`. A file named there and missing on disk fails the build. This is why the
README and the site show the same picture rather than two that drift apart.

The landing page shows features as still images in a light and dark pair, chosen by CSS class
(`only-light` / `only-dark`). It has exactly one video, the hero tour, whose sources are swapped by an
inline script when the visitor changes theme.

The demo docks `agent.chat` into `right-panel` in all three of its workspaces, so the panel is on
screen the moment a visitor arrives at the demo's root. No deep link is needed to reach it.

## Goals / Non-Goals

**Goals:**

- A reader working through the guides in order meets the agent path without knowing its vocabulary.
- The landing page states the claim that matters, which is the limit rather than the feature: an
  agent reaches what the user could have reached, and nothing more.
- One picture, single-sourced, shown by both the README and the site.

**Non-Goals:**

- No second video, and no change to the hero tour. That was weighed and declined; the reasoning is in
  the proposal.
- No new wording for the adapter's own behaviour. `docs/reference/agent-tools.md` is the reference and
  stays the reference; the guide points at it rather than paraphrasing it, because two descriptions of
  one behaviour are two chances to disagree.
- No change to `llms-full.txt`. It gained the adapter in full in #66.
- Nothing in the demo changes. The screenshot is taken of what is deployed.

## Decisions

**A guide, not a longer reference page.** The two answer different questions. `agent-tools.md`
answers "what does this adapter do", section by section, and it does that well. A reader who wants an
agent-driven product is asking "what do I do", and the honest answer since the generator landed is
four steps, most of which are reading generated output. Widening the reference page to hold both would
make it worse at the job it already does.

**The guide is mostly about generated output.** `weaver --id copilot --agent` writes the connection,
the panel, the stand-in and the confirmation seam. So the guide runs the command, shows what appears,
and spends its length on the two things a reader must decide for themselves: which commands are
consequential enough to ask about, and what replaces the stand-in. This keeps it short, and short is
why it will stay true.

**The landing section leads with the limit, not the capability.** Every platform in this space can say
"an agent can call your functions". The sentence that is worth the space is that the agent cannot
exceed the user, because the call goes through the same seam every other trigger uses, and because a
refusal reads the same whatever its reason so nothing can be learned by probing. That is already
guaranteed and already tested; the section says it rather than inventing a new claim.

**The screenshot is of a call in flight, not of an idle panel.** An empty panel shows a text box, which
proves nothing. The frame worth capturing has the offered tools visible, a call with its arguments, the
confirmation asking, and the outcome line. That is the whole loop in one still, and it is readable,
which was the argument against a clip in the first place.

**The demo link is a plain link to the demo's root.** The panel is docked open in every workspace, so
the visitor lands on it. A deep link would encode a route that the demo is free to change, and it would
buy nothing.

**The existing "register the action once" section stays.** It is about the command model, and its
sentence about four callers is true. The new section sits apart from it and carries a different claim.
Removing the old mention to avoid saying "agent" twice would weaken the page's actual argument, which
is that one registration serves everything.

## Risks / Trade-offs

**A new guide can be added and be unreachable, because only reference pages are guarded.** → The
sidebar entry is a task in its own right rather than a step inside another one, and the site build is
run before the change is called done. The proposal separately names extending the guard to guides as an
item to accept or strike, because it is beyond what was asked.

**A screenshot ages faster than prose.** The panel is generated output and the demo's own panel is
hand-written, so a change to either can date the picture. → The picture is of the demo, which is
deployed from this repository on every merge, so the drift is visible to us rather than to a reader
first. Accepted rather than mitigated further: the alternative is no picture.

**Two pages will describe the same subject at different depths, and could drift.** → The guide links to
the reference for anything about the adapter's behaviour and states none of it itself. This is the same
arrangement Samples already has with the reference pages.

**The guide could become a third copy of the recipe in Samples.** → Samples recipe 10 shows the code as
something to copy for a reader who is not generating. The guide shows the generator writing it. They
overlap in subject and not in use, and the guide says which one to read when.

## Open Questions

None that change the approach. Two are settled at implementation time and cannot alter it: which demo
workspace makes the best backdrop for the screenshot, and whether the new landing section reads better
before or after the existing "register the action once" one.
