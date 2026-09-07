## 1. The navigation tree page

- [x] 1.1 Write `docs/weaver/navigation-tree.md` with the derived-from-specs marker and the box
      naming `ui-primitives` and `routing`, and a lead that says what the tree is and is not: the
      workbench draws it, marks where the user is and reports a choice; it navigates nothing
- [x] 1.2 Section: the declaration as data, a typed array of groups and destinations for the notes
      weaver, with one destination outside every group and one group holding a single destination,
      and why the tree draws exactly that shape
- [x] 1.3 Section: reporting and acting, the `lw-nav-select` event with `detail.path`, the weaver
      calling `ctx.navigateContent`, and the one place that says the tree needs `navigation` for
      `activeContent`, `isShowingUnder` and `navigateContent`, and `contributions` for
      `retitleSurface`
- [x] 1.4 Section: marking where the user is, `current` fed from `ctx.activeContent`, why a deeper
      address marks the destination above it and a longer name does not
- [x] 1.5 Section: folding, `collapsed` in the declaration and the `[attr.collapsed]` idiom, the
      `key` rule and the translated-label trap, what the session keeps and a reload forgets, and
      the group holding nothing
- [x] 1.6 Section: hiding destinations nobody registered, from the content routes the registry
      reports, and why a product that switches a plugin off must not leave a dead entry
- [x] 1.7 Section: retitling the panel to the area the user is in, as an effect over the marked
      destination and `ctx.retitleSurface`
- [x] 1.8 Section: the accessible name, `aria-label` on the tree, and what the tree announces on
      its own
- [x] 1.9 Section: content inside an item, a count after the label
- [x] 1.10 A "Where next" that sends the reader to the recipe, to sub-routes and follows, and to
      the design-tokens bullet for the attribute table
- [x] 1.11 Add the page to `website/sidebar.mjs` in the authoring group directly after "Surfaces
      in a sidebar"

## 2. Recipe 11 on the samples page

- [x] 2.1 Add recipe 11, "A navigation tree in the sidebar", as whole files: the declaration
      module, the view component with `CUSTOM_ELEMENTS_SCHEMA`, its template, and the
      `registerSurface` call in `activate(ctx)` with `docks: ['left-panel']` and `padded: false`;
      capabilities `contributions` and `navigation`, with the reason
- [x] 2.2 Add the anchor and the "You get" paragraph in the form the other recipes use, and add the
      recipe to the sentence under the generator table that names the recipes with no generator
      behind them, with one sentence that a generator is intended

## 3. The cross-references

- [x] 3.1 In `docs/reference/design-tokens.md`, shrink the sidebar-navigation bullet to the tags,
      their attributes and events and `forgetLwNavFolds()`, and point at the new page for the story
- [x] 3.2 In `docs/weaver/sidebar-surfaces.md`, name the tree under "What your view's own body can
      use" with a link to the new page
- [x] 3.3 In `docs/weaver/sub-routes-and-follows.md`, link the sentence "A navigation tree marks
      where the user is" to the new page

## 4. The session without a backend

- [x] 4.1 In `docs/distribution/auth.md`, add a section before "1 · Feed the session": what
      `auth-source --name dev` writes, what the recipe adds, that the stand-in is presentation for
      a product without a backend yet, and that the three sections after it are the real
      integration
- [x] 4.2 Replace the testbed pointer in "Shape A" with a pointer at `demo/src/session`, the
      product built on the published packages
- [x] 4.3 Add recipe 12, "A session without a backend", as whole files: the generator's
      `dev-auth-source.ts` shown unchanged under its generated path with the `provideAuthSource`
      line for `app.config.ts`, and the plugin with three commands gated by `access` and a rail
      item whose menu carries them and shows the display name or initials
- [x] 4.4 Add recipe 12 to the generator table with `auth-source --name dev` as the invocation that
      writes its first file, and the note that the plugin is yours

## 5. The AI-readable files

- [x] 5.1 In `llms.txt`, add the page to the weaver list with a one-line hook
- [x] 5.2 In `llms-full.txt`, add the navigation family to the building-block bullet and the
      frame-kit list: the three tags, their attributes, `lw-nav-select` with `detail.path`, that the
      tree navigates nothing, `forgetLwNavFolds()`, the `key` rule and the `collapsed` idiom

## 6. Verification

- [x] 6.1 Compile recipes 11 and 12 against the published `@loomweaver/plugin-sdk` and
      `@loomweaver/shell` in a scratch weaver under `.claude/tests/`, and run the tree in the
      browser once: a choice navigates, the marking follows the address, a fold survives a panel
      toggle, a reload resets it
- [x] 6.2 `npm run docs-style-check` and `npm run api-docs-check` in `platform/`
- [x] 6.3 `npm run sync` and `npm run check` in `website/`, so the sidebar guard and the head
      check see the new page
- [x] 6.4 `openspec validate --all --strict`

## 7. Named for later, not built here

- [x] 7.1 Open the follow-up change for the generator that writes recipe 11 and the commands that
      recipe 12 adds to what `auth-source` writes, once both recipes have been merged and read
