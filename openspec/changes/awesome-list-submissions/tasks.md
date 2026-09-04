## 1. Verify the candidates

- [ ] 1.1 Confirm `position-as-angular-plugin-platform` is deployed: the landing page title and the
      GitHub description carry the qualifier sentence.
- [ ] 1.2 `awesome-angular`: confirm the *Micro Frontends* section and the entry format on the day
      of submission; record the last merged PR date here.
- [ ] 1.3 nx.dev plugin registry: find the current submission route, or record that there is none
      and drop it.
- [ ] 1.4 For a micro-frontends list, a plugin-architecture list and a Web Components list: record
      repository, contribution rules in one line, last merged PR, whether a comparable entry exists,
      and keep or drop with the reason.

## 2. Draft the entries

- [ ] 2.1 `awesome-angular`: the entry from design.md under *Micro Frontends*, appended at the bottom,
      with a `?ref=awesome-angular` link, plus a two-sentence PR description.
- [ ] 2.2 For each other kept list, one entry in that list's format from the base text in
      design.md, its own `?ref=`, and a two-sentence PR description.

## 3. Submit and record

- [ ] 3.1 The owner opens each PR from their own account; the PR URL is recorded beside the entry
      here.
- [ ] 3.2 The owner asks the AG-UI maintainers on their Discord how a frontend gets onto the
      integrations page; the answer is recorded here, and nothing in this change waits for it.
- [ ] 3.3 Requests from maintainers are answered within the week; a change to the project that a
      maintainer asks for goes to its own branch, not this change.

## 4. Close out

- [ ] 4.1 Every entry is merged, declined or recorded as open on an inactive list.
- [ ] 4.2 `openspec validate awesome-list-submissions --strict` passes.
