## Context

See `proposal.md`, Why. What the skill has to fit:

- A skill is a directory with a `SKILL.md` whose frontmatter carries `name` and `description` and
  whose body is instructions; Claude Code loads it from `.claude/skills/<name>/` in a project and
  offers it when the description matches, and the same format is read by other agents. This
  repository uses it already for its own OpenSpec skills.
- The assistant guide tells the two AI stories apart and lists what the assistant gets in two
  halves, knowledge and hands. The skill is the third half, procedure, and the guide is where it is
  introduced.
- The site copies four files verbatim from the repository root (`llms.txt`, `llms-full.txt`,
  `LICENSE`, `NOTICE`); a fifth follows the same path.
- The recording recipe from 2026-09-08 exists under `.claude/tests/assistant-path/` and produces
  the turn count and the tool calls of a run.

## Goals / Non-Goals

**Goals:**

- An assistant with the skill installed reaches the right tool on the first turn it needs one and
  validates what it generated, on the prompts the guide already carries.
- The skill can be read in one screen and states nothing the contract states.

**Non-Goals:**

- No repetition of `llms-full.txt`, no option tables, no code samples beyond the tool calls.
- No per-tool packaging beyond a copy: the skill is one file; `init` does not write it, because
  where a tool reads skills from is the tool's convention, not the platform's.
- No claim about agents the run has not exercised.

## Decisions

**Procedure only, with pointers.** The skill says what to do and in which order, and links the
page that says why. Every fact it would be tempted to restate (an option, a token name, a capability
list) is a link instead. That is the one way it cannot disagree with the docs, and it keeps the file
short enough that an agent loads it whole.

**The order it teaches.** Detect: a fresh application gets `init`; an existing product gets
generators. Generate with the tools, never from memory: a weaver, a theme, an auth stand-in, a
settings store, each through its `scaffold_*` tool, then write the files where the project keeps
its plugins and do the steps the response names. Validate: `validate_manifest` on the manifest,
`validate_commands` on the sources, `validate_i18n` on the bundles, and build. Compose: grants
exactly as the manifest declares, translations by namespace, semantic tokens in templates, `mod` in
shortcuts. Each item one line, each linking its page.

**One file at the repository root under `skills/`, served verbatim.** Alternative: inside the CLI
package, written by `init`. Rejected: Claude Code reads `.claude/skills/`, other tools read other
places, and a scaffold that writes into a tool's private directory oversteps. The guide gives the
one-line copy per tool instead, the way it gives the MCP registration per tool.

**Measured, not asserted.** The same first-weaver prompt runs twice with the skill in
`.claude/skills/` of the test app and twice without, from the same clean state. The guide reports
turns and tool calls for both. If the skill does not shorten the path, it is rewritten or dropped
before it ships.

## Risks / Trade-offs

- **The skill goes stale when a tool is renamed.** → It names tools and pages only; both are
  guarded (the MCP tool tests, the site's link check). A renamed tool fails the recorded run.
- **A second place to say "semantic tokens only".** → The skill says it in five words and links the
  design-tokens page; the rule itself lives there.
- **The format shifts.** → Frontmatter with `name` and `description` and a markdown body is the
  stable core every reader shares; nothing else is used.
