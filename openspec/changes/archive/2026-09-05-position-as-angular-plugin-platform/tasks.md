## 1. Landing page

- [x] 1.1 `website/src/pages/index.astro`: `frontmatter.title` becomes "Open-source plugin platform
      for Angular workbenches" (Starlight appends the name); `frontmatter.description` becomes the
      lead from design.md.
- [x] 1.2 Hero: `<h1>` becomes "Build Angular workbenches that grow with your product."; the
      `.lead` paragraph becomes the lead from design.md; the `.fit` paragraph keeps its who-for and
      not-for sentences, gains the AG-UI sentence moved out of the lead, and closes with the
      project-state sentence from design.md.
- [x] 1.3 `website/astro.config.mjs`: Starlight `description` becomes the qualifier sentence; `title`
      stays `LoomWeaver`.
- [x] 1.4 Replace both "React, Vue, Svelte" sentences on the landing page (the rung card and the
      sandbox section) with "any framework".
- [x] 1.5 `npm run build` in `website/` passes; the built `index.html` contains exactly
      `<title>Open-source plugin platform for Angular workbenches | LoomWeaver</title>` and the new
      meta description.

## 2. README first screen

- [x] 2.1 Logo block: the `<b>` line becomes the new headline; the two lines beneath it become the
      lead from design.md.
- [x] 2.2 Directly under the tour caption, add *What can you build* with five bullets naming
      application kinds, then the existing *Who it is for* paragraph, which closes with the
      project-state sentence from design.md.
- [x] 2.3 Move the *Register the action once* section with its `registerCommand` block to sit
      directly after Quick start; every other section keeps its order.
- [x] 2.4 The formatter and the dash checker pass on the README.

## 3. The same sentence elsewhere

- [x] 3.1 `llms.txt`: the opening blockquote starts with the qualifier sentence; the rest of the
      paragraph (the `ctx` contract, the broker, the packages) stays. `llms-full.txt` opens with the
      same sentence, because an assistant that fetches one file fetches that one.
- [x] 3.2 `gh repo edit yesbert/loomweaver --description "LoomWeaver: open-source plugin platform
      for Angular workbenches"`; confirm with `gh repo view --json description`.
- [x] 3.3 The `description` of the seven `package.json` files under `platform/libs/`: the qualifier
      plus one clause per package, no dash; note in the PR that they reach the registry with the
      next release.

## 4. Verify and hand over

- [x] 4.1 `grep -rn "plugin platform for Angular workbenches"` finds the landing page, the site
      config, the README and `llms.txt`.
- [x] 4.2 Open the deployed landing page and the GitHub repository side by side: same headline, same
      qualifier, same lead. Verified on 2026-09-05 after the deploy from `main`: title, headline,
      lead, `llms.txt` and the GitHub description all carry the same words.
- [x] 4.3 Record the baseline in this change before merging: stars and forks, the last fourteen
      days of `gh api repos/yesbert/loomweaver/traffic/referrers` and `.../traffic/views`, and the
      dev.to article's reactions and comments from its API.
- [x] 4.4 The day the site deploys with the new first screen, the owner emails hn@ycombinator.com
      asking for a review of the flagged Show HN, with the demo link and the qualifier sentence.
      Sent on 2026-09-04, a day before the deploy and therefore with the earlier wording. No reply
      by 2026-09-05, and the item is still dead. Not sent a second time; one request is a request,
      two are a nuisance.
- [x] 4.5 `openspec validate position-as-angular-plugin-platform --strict` passes.
