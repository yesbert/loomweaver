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
`.claude/skills/` of the test app and twice without, from the same clean state. If the skill does
not shorten the path, it is rewritten or dropped before it ships. The measurement is this change's
own gate and stays in this file; the guide does not report it.

## Measured, 2026-09-09

Four runs of the first-weaver prompt from the assistant guide, *Add a weaver called notes with a
command on mod+shift+n.*, from the same clean state: `my-studio-base`, a distribution with no weaver
yet, `@loomweaver/mcp` pinned to 0.9.2, Claude Code headless. Twice without the skill, twice with it
in the app's `.claude/skills/`. The recipe is `.claude/tests/assistant-path/run.sh`, which no longer
uses git; `compare.py` beside it produces this table.

| run | turns | tool calls | seconds | USD | first call | steps before the generator |
|---|---|---|---|---|---|---|
| plain a | 27 | 26 | 136 | 0.95 | Bash | 6 |
| plain b | 22 | 21 | 76 | 0.61 | Bash | 4 |
| skill a | 26 | 24 | 96 | 0.73 | Skill | 5 |
| skill b | 25 | 23 | 105 | 0.75 | Skill | 5 |

**The skill does not shorten the path.** Five steps precede the first generator call either way, and
the run is a turn longer with it than without. The exploration it was meant to save happens anyway,
in the same shape every time: `Bash → ToolSearch → Read`, the assistant looking at the project and
then loading the tool schemas. Two runs a side is thin, and the plain side alone spreads from 22 to
27 turns, so the honest reading is that no difference in length was measurable, not that the skill
costs a turn.

**One thing it does change, reproducibly.** Without the skill both runs validated once, with
`validate_commands` alone. With it, both ran the full set, `validate_manifest → validate_i18n →
validate_commands`, in that order. The generated product is byte-identical in all four runs, so this
is more care taken over the same result, not a different result.

**The first call changes for a trivial reason.** `Skill` appears first because loading an installed
skill *is* the first step; it is mechanics, not behaviour, and it should not be read as the skill
changing what the assistant does.

**Why the path did not shorten, and it is this file's fault.** The skill's *Detect* section
instructs the assistant to read `LOOMWEAVER.md` and the composition root *first*. That is exactly
the exploration the change set out to remove, prescribed by the artifact meant to remove it. The
generator needs none of it: `scaffold_weaver` takes an id and a shortcut, and where the files go is
a question that can be answered after the file map exists, not before.

### Revised, and measured again

The skill was rewritten against that finding on the same day: the reading instruction left *Detect*,
an opening line made the order explicit (*call the generator before you explore the project*), and
placing the files moved behind the tool call, where the file map already exists. Two more runs,
same prompt, same baseline, same pinned server.

| run | turns | tool calls | seconds | USD | steps before the generator | the path to it |
|---|---|---|---|---|---|---|
| plain a | 27 | 26 | 136 | 0.95 | 6 | Bash → Bash → Read → Bash → ToolSearch → Read |
| plain b | 22 | 21 | 76 | 0.61 | 4 | Bash → ToolSearch → Read → Bash |
| skill a | 26 | 24 | 96 | 0.73 | 5 | Skill → Bash → ToolSearch → Bash → Read |
| skill b | 25 | 23 | 105 | 0.75 | 5 | Skill → Bash → Read → Bash → ToolSearch |
| revised a | 26 | 24 | 102 | 0.72 | 3 | Skill → ToolSearch → Bash |
| revised b | 26 | 24 | 95 | 0.68 | 2 | Skill → ToolSearch |

**The path halves.** Five steps before the generator became two and three; against the plain runs,
four and six. What disappears is the reading: no `Read` at all in either revised run, and in one of
them no `Bash` either. What remains is `ToolSearch`, which loads the tool schemas and is the
harness's own mechanism; a skill cannot spend that step for the assistant.

**The whole run is not shorter, and that is the honest headline.** 26 turns both times, against 24.5
without the skill. The exploration it saves is spent again on the two extra validators it prompts.
The skill buys a straighter path and a fuller check, not a cheaper run. Cost is marginally lower
(0.70 against 0.78 on average) and well inside the spread of the plain runs, so nothing should be
claimed from it.

**The product is identical in all six runs**, the same three paths touched: `angular.json`,
`src/app/app.config.ts`, `src/weavers/`. The skill changes how the assistant gets there and how
thoroughly it checks, never what it builds.

## Risks / Trade-offs

- **The skill goes stale when a tool is renamed.** → It names tools and pages only; both are
  guarded (the MCP tool tests, the site's link check). A renamed tool fails the recorded run.
- **A second place to say "semantic tokens only".** → The skill says it in five words and links the
  design-tokens page; the rule itself lives there.
- **The format shifts.** → Frontmatter with `name` and `description` and a markdown body is the
  stable core every reader shares; nothing else is used.
