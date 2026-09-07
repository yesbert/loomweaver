## Context

See proposal.md, Why. What shapes the approach:

- Every scaffold is one descriptor in a single list: name, summary, options, a `build` that returns
  a file map, and an optional `amend` that returns amendments to the workspace. The CLI, the Nx
  generator and the MCP server all read that list, so an option or an amendment added there is
  offered on all three routes at once. `auth-source` has a `build` and no `amend` today.
- An amendment is an "ensure this is present", never a "set this to": applying one twice changes
  nothing, and what the consumer chose wins. The kinds that exist cover a package the output needs,
  a build target, a stylesheet source, a PostCSS plugin and composing a plugin into the composition
  root. The last one is what the weaver scaffold uses, and it already refuses a composition root it
  cannot recognise and names the lines instead.
- Composing the stand-in needs one thing no amendment does yet: a provider line in the composition
  root that is not a plugin, `provideAuthSource(() => devAuthSource())`, and two icon registrations.
  That is a small extension of the compose amendment, or a sibling kind, decided below.
- Recipe 12 on the samples page is the plugin, whole, and the four wiring lines. The generator has
  to write exactly that, because the samples page's generator table will say so.
- The quick-start check scaffolds a product against the packed platform, builds it, runs its tests,
  serves it and drives the agent panel in Chromium. It packs `shell`, `plugin-sdk` and `ag-ui`; the
  frame kit now arrives through the distribution's recorded dependency.

## Goals / Non-Goals

**Goals:**

- One invocation gives a product a stand-in session its user can operate, composed in, with the
  same guarantees the weaver scaffold gives for composing.
- The samples page's generator table stays true by changing rows, not by rewriting recipes.
- Recipes 11 and 12 cannot drift from the packages without the nightly saying so.

**Non-Goals:**

- A navigation generator. Decided against in the proposal.
- A login page or dialog. The auth guide's shapes stay the product's own.
- Changing what `auth-source` writes in the session source file. Recipe 12 shows it unchanged, and
  the change keeps it that way.

## Decisions

### The verbs are on by default, and `--bare` is the shape alone

The generator's own comment says what it is for, a development stand-in to be replaced by the
product's session, and a stand-in nobody can switch shows nothing. So the plugin and the wiring are
what `auth-source --name dev` writes, and `--bare` keeps today's single file.

*Alternative rejected: an opt-in flag for the verbs.* The default would then be a file that does
nothing visible until the reader finds the flag, which is the state the recipes were written to end.

### One more provider is composed the way a plugin is

The compose amendment gains what the stand-in needs beyond a plugin: a list of provider lines to
ensure in the composition root's `providers` array, each with the import it needs, alongside the
plugin registration it already performs. `provideAuthSource(() => devAuthSource())` and
`provideIcons({ account, signOut })` are two such lines; the grant and the plugin are what the
amendment does today.

*Alternative rejected: a separate amendment kind for providers.* It would recognise the composition
root a second time by the same shape and refuse it by the same rule; one recognition, one refusal,
one report is easier to keep true.

The rule for an unrecognised root is unchanged: leave it, name the lines, do not report the
stand-in as composed in. The two icons come from `@ng-icons/heroicons`, which every documented
install line already carries.

### A second `provideAuthSource` is never added

Where the composition root already carries a `provideAuthSource`, the generator leaves it and says
so. In Angular the last provider wins, and a stand-in composed after a real session would silently
replace it. "Ensure present" is read as "one is present", not "this one is present".

### The plugin the generator writes is recipe 12, and a test holds them together

The plugin source is the fenced block of recipe 12 with the name substituted. A recipe test
generates `auth-source --name dev` and compares the plugin file and the session file with the
blocks on the samples page, read by the path comment each block opens with. The samples page
becomes the fixture, so a change to either side fails until both agree.

### The nightly builds the recipes from the page

The quick-start check reads recipes 11 and 12 from the samples page the same way, drops the files
into the product it scaffolds, adds the routes recipe 11 points at as plain surfaces, builds, runs
the tests, and in the browser: a choice in the tree navigates and marks, a fold survives a panel
toggle, and the stand-in signs in from the rail and a gated item follows. Recipe 12's part is then
what the generator writes, so the check covers the generator's output and the page in one run.

### Descriptor, then docs

The descriptor's summary says what the scaffold writes, so the CLI's `list`, the MCP tool list and
the scaffolding page all change wording from the same source; the option table on the scaffolding
page gains `--bare`. The samples page's table moves recipe 12 to "written", and the auth guide's
stand-in section says the generator writes all of it.

## Risks / Trade-offs

- **A product with its own session runs `auth-source` and gets a plugin it will delete.** → That is
  what `--bare` is for, and the generated plugin says in its own README lines what it is. The
  default serves the reader trying the platform, who is the reader the generator exists for.
- **The compose amendment grows a second responsibility.** → It stays one recognition and one
  refusal; the provider lines are a list beside the plugin registration, tested on their own.
- **The nightly check gets longer.** → It already scaffolds, builds, tests and serves; two recipes
  and three browser assertions are minutes, not a new job.
- **The samples page as a fixture makes a docs edit fail a platform test.** → Intended: the page
  claims the generator writes this, and the test is what makes the claim true. The binding is
  confined to the repository: the test reads the page from the checkout and runs in this CI, the
  generator carries its template and reads no page at runtime, and nothing of it ships in a package,
  so a consumer of the packages is never affected.

## Open Questions

None that change the tasks. Whether the icons should come through `provideIcons` in the composition
root or through `ctx.contributeIcons` in the plugin is settled by recipe 12, which does the former,
and the generator writes the recipe.
