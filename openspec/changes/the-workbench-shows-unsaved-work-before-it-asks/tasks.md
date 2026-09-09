## 1. One rule, before anything reads it

- [x] 1.1 Extract the answer to *does this address hold unsaved work* into one place, resolving the
      surface at the address together with the children of an arrangement it holds, and reading the
      instance store's version so that a tab opened or closed is noticed too. It reads reactively.
- [x] 1.2 Make the two existing close paths call it instead of gathering candidates themselves, and
      check that the close behaviour is unchanged: the guard still needs the instances, not only the
      answer, so the shared part is the resolution and not the whole gathering.
- [x] 1.3 Unit tests on the rule: a clean address, a dirty one, an arrangement dirty in one child,
      an address with nothing open, and a surface whose report throws.

## 2. The mark on the tab

- [x] 2.1 Draw the three shapes named in design.md, *Open Questions*, for a pinned tab, look at them
      in light and dark, and settle it. Record the answer in design.md before building on it.
- [x] 2.2 The strip distinguishes a tab whose address holds unsaved work, in all three places it is
      used, with the settled shape and the control returning on hover where it shares a slot.
- [x] 2.3 The tab's accessible name carries the state, in both languages.
- [x] 2.4 Unit tests on the strip: marked when dirty, unmarked when saved, marked for an arrangement
      whose child is dirty and whose child is not on top, and the accessible name in both states.
- [x] 2.5 End-to-end in the demo: editing the note marks both the *Customer* tab and the *Q-0007*
      tab, saving clears both, and a tab in the sidebar behaves the same. The sidebar leg is a unit
      test on the icon variant of the strip, because the demo has no sidebar view that can hold
      unsaved work and inventing one belongs to no requirement here.

## 3. Reading it from outside

- [x] 3.1 The distribution reads whether an address holds unsaved work, as a workbench fact under
      the existing rule for facts.
- [x] 3.2 A plugin reads it for a surface it registered itself, with no capability consulted, and is
      told nothing about a surface another plugin registered.
- [x] 3.3 Unit tests for both, including the refusal, and one that binds a reader and checks it
      follows a save without further wiring.
- [x] 3.4 Publish nothing by accident: check the packed declarations for what these two additions
      expose, and that the API documentation check still passes.

## 4. What it says, and where

- [ ] 4.1 `docs/concepts/retention-and-unsaved-work.md`: what a user now sees before the question is
      asked, and that an arrangement answers for what is inside it.
- [ ] 4.2 `docs/weaver/unsaved-changes.md`: that a plugin may read its own, with the bound and the
      sandbox limit stated beside it.
- [ ] 4.3 The distribution's own guide: the fact, beside the other readable facts.
- [ ] 4.4 `docs/the-workbench.md`: the mark, in the section that now carries the prompt. A picture
      only if a still of a tab reads at all on that page; a sentence otherwise.
- [ ] 4.5 Docs style check, the comment guard, the API documentation check, the site sync and build.

## 5. The demo shows it

- [ ] 5.1 The quotes list marks the row of a quote whose document holds unsaved work, using the
      plugin read. This is the demo's proof that the read is usable, and the reason the read exists.
- [ ] 5.2 End-to-end: the row is marked while the note is unsaved and unmarked after saving.
