## 1. Verify the candidates

- [x] 1.1 Confirm `position-as-angular-plugin-platform` is deployed: the landing page title and the
      GitHub description carry the qualifier sentence. Confirmed 2026-09-05 after the deploy of
      PR #191: title, headline, lead, `llms.txt` and the GitHub description match.
- [x] 1.2 `awesome-angular`: confirm the *Micro Frontends* section and the entry format on the day
      of submission; record the last merged PR date here. The list lives at
      `PatrickJS/awesome-angular` (about ten thousand stars); last merged PR 2026-09-04, zero open
      PRs on 2026-09-05. *Micro Frontends* holds three entries (angular-micro-frontends, luigi,
      micro-frontends-mindmaps) in the format `* [Name](link) - Description.`; `contributing.md`
      asks for one PR per suggestion, capitalised title, appended at the bottom of the category.
- [x] 1.3 nx.dev plugin registry: find the current submission route, or record that there is none
      and drop it. The route exists and is alive: a PR against `nrwl/nx` adding one object with
      `name`, `url` and `description` to `astro-docs/src/content/approved-community-plugins.json`,
      commit message `chore(core): nx plugin submission @loomweaver/devkit`, PR template
      `COMMUNITY_PLUGIN.MD`. 114 entries, five of them Angular plugins; last submission merged
      2026-08-27, two open. Three criteria: automated e2e tests in the repository (met,
      `loom-testbed-e2e`), `repository.url` in the package (met), and `@nx/devkit` as a
      `dependency` rather than a `peerDependency` (not met: the devkit declares
      `peerDependencies: { "@nx/devkit": ">=23.0.0" }`). Kept, on the condition that the
      dependency moves and ships in a release first; that change is a branch of its own.
- [x] 1.4 For a micro-frontends list, a plugin-architecture list and a Web Components list: record
      repository, contribution rules in one line, last merged PR, whether a comparable entry exists,
      and keep or drop with the reason.
      - `rajasegar/awesome-micro-frontends` (1.3k stars): last merged PR 2023-12-24. Dropped, dead.
      - `ChristianUlbrich/awesome-microfrontends` (591 stars): last merged PR 2019-08-07, three PRs
        open for years. Dropped, dead.
      - Plugin-architecture list: none exists. Every repository the search returns is a catalogue
        of plugins for AI assistants or a plugin of some tool, none is a list of application plugin
        architectures. Dropped, no list.
      - `web-padawan/awesome-web-components` (3.6k stars): active, last merged PR 2026-08-27, 24
        PRs open. Rules: `[Name](link) - Description`, title case, alphabetical within the category.
        Its categories are components, component libraries, design systems, libraries for writing
        custom elements, framework integrations, and meta frameworks for shipping Web Components.
        A workbench that uses custom elements as its plugin boundary fits none of them, and a
        maintainer would reasonably decline. Dropped, out of scope.

## 2. Draft the entries

- [x] 2.1 `awesome-angular`: the entry from design.md under *Micro Frontends*, appended at the bottom,
      with a `?ref=awesome-angular` link, plus a two-sentence PR description.

      Entry, appended after micro-frontends-mindmaps:

      ```markdown
      * [LoomWeaver](https://loomweaver.dev/?ref=awesome-angular) - Open-source plugin platform for Angular workbenches; an alternative to micro-frontends for products built as plugins.
      ```

      PR title: `docs: add LoomWeaver`. PR description: "Adds LoomWeaver to Micro Frontends. It is
      an open-source plugin platform for Angular workbenches, Apache 2.0, seven npm packages, with
      a live demo at https://demo.loomweaver.dev; I am its maintainer." 
- [x] 2.2 For each other kept list, one entry in that list's format from the base text in
      design.md, its own `?ref=`, and a two-sentence PR description.

      nx.dev plugin registry, one object appended to `approved-community-plugins.json`. The `url`
      is the GitHub tree, as every other entry has it and as the registry needs it to show stars,
      so it carries no `?ref=`; the description carries the qualifier instead.

      ```json
      {
        "name": "@loomweaver/devkit",
        "description": "Nx generators for LoomWeaver, an open-source plugin platform for Angular workbenches: weavers, distributions, frame plugins and integration seams.",
        "url": "https://github.com/yesbert/loomweaver/tree/main/platform/libs/tooling/devkit"
      }
      ```

      Commit and PR title: `chore(core): nx plugin submission @loomweaver/devkit`. PR body is the
      repository's own template, filled in; the free text: "LoomWeaver is an open-source plugin
      platform for Angular workbenches, and this plugin carries its Nx generators. The package
      depends on `@nx/devkit`, lists its `repository.url`, and the repository runs Playwright e2e
      tests in CI." Opened only after the release that ships `@nx/devkit` as a dependency.

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
