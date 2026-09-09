## 1. The skill

- [x] 1.1 `skills/loomweaver/SKILL.md`: frontmatter with name and description, the body in the
      four parts the design lays out (detect, generate, validate, compose), one line per item, each
      linking its docs page by live URL; under one screen.
      Written 2026-09-09: 61 lines, 3.8 KB, twelve links, all resolving to pages that exist under
      `docs/`. A fifth part, *Where the rest is*, names the two llms files and Architecture, so the
      skill ends by pointing away from itself rather than by summarising.
- [x] 1.2 Read it against `llms-full.txt` and the docs once: no fact that lives there is restated,
      only linked.
      Two findings, both corrected before this task was closed. The `init` item had restated what
      the command wires, a list that lives in Getting started; it now states why the CLI owns the
      distribution and links the page. And the generator list had carried `scaffold_distribution`
      beside the everyday tools, which contradicts the assistant guide: the distribution stays with
      the CLI, so an assistant told to reach for that tool would be led against the documented
      path. The tool names were checked against the server, and `list_generators` is real.

## 2. Measured

- [x] 2.1 The first-weaver prompt from the assistant guide, twice with the skill installed in the
      test app's `.claude/skills/` and twice without, from the same clean state, with the recording
      recipe; turns and tool calls noted in `design.md`.
      Run 2026-09-09; the table and the reading are in `design.md`, section *Measured*. The recipe
      had to be repaired first: `run.sh` assumed `my-studio` was its own git repository, which it is
      not and, by the owner's decision of 2026-09-09, never will be. It would have run `git clean`
      against the enclosing repository instead. It now resets a working copy from `my-studio-base`
      with rsync, and that baseline is the state before the first weaver, rebuilt by reversing the
      recorded notes run.
- [x] 2.2 If the skill does not shorten the path or change what the assistant does first, rewrite it
      and run again; if it still does not, stop and report before shipping.
      The first version did not, so it was rewritten and measured again; both rounds are in
      `design.md`. The revision moved the reading instruction out of *Detect* and behind the tool
      call, and added the opening line that states the order. Steps before the first generator call
      went from five to two and three, against four and six without the skill. The full run is not
      shorter, because the saved exploration is spent on the two extra validators the skill prompts,
      and that is recorded rather than smoothed over.

## 3. Wiring

- [x] 3.1 `website/tools/sync-docs.mjs`: the skill served verbatim; `website/sidebar.mjs`: an entry
      under "For AI assistants".
      The verbatim list carried repo-root filenames only, so it now takes a path and the copy step
      creates the directory; `skills/loomweaver/SKILL.md` is served at that same path, which makes
      the install a single curl into the mirror of it. The sidebar entry is *Agent skill*, beside
      the two llms files.
- [x] 3.2 `docs/building-with-an-assistant.md`: the skill as the third thing the assistant gets,
      with the one-line install per tool (Claude Code, Cursor, VS Code with Copilot), each checked
      against the tool's current documentation; described neutrally, what the skill is and where it
      goes, with no before-and-after and no claim of a gain.
      Checked 2026-09-09 against each vendor's own page, not against a blog: Claude Code reads
      `.claude/skills/<name>/SKILL.md`; Cursor reads `.cursor/skills/` and `.agents/skills/`;
      VS Code with Copilot reads `.github/skills/`, `.claude/skills/` and `.agents/skills/`, and
      the feature is stable there rather than behind a setting. All three read the same file, so
      the section is one table of directories and one curl line, and it closes by saying that
      nothing depends on the skill.
- [x] 3.3 `llms.txt` and `docs/README.md`: one line each; `README.md`'s assistant door names it.
      Each line says it is optional. The `llms.txt` entry rewrites to the absolute site address on
      publish, like the other verbatim files, so an assistant that fetches it gets a URL it can
      follow.

## 4. Verify

- [x] 4.1 `npm run check` in `website/` green; docs style and format guards green.
      Green on 2026-09-09, re-run after the last edit rather than before it: lint, tests,
      contrast, build (81 pages) and check-head all pass. `check-docs-style` reports no new long
      sentence; the two the skill section first introduced were shortened rather than recorded as
      exceptions. `check-quick-start` and `check-agent-versions` were run as well, since the guide
      is one of the pages they read, and both pass.
- [x] 4.2 `openspec validate the-platform-ships-an-agent-skill --strict` passes.
