> **Status:** proposed — not approved for implementation yet.

## Why

An assistant working on a LoomWeaver product has two of the three things it needs. `llms.txt` and
`llms-full.txt` are the knowledge: the contract, in one fetch. `@loomweaver/mcp` is the hands: the
generators and validators as tools. What it does not have is the procedure: when to reach for which,
in what order, and how to tell it is done. The sixteen runs recorded for the assistant guide on
2026-09-08 all found the order by themselves, and each spent five to ten turns reading the project
and discovering the tools before the first call. A reader asked for exactly this on Reddit ("Do you
have a skill or llms.txt for an agent to understand how to use it?"), and the owner answered that a
skill is next.

## What Changes

- **A skill file** in the format Claude Code and other agents read, `skills/loomweaver/SKILL.md`
  in this repository: when it applies (a project that depends on `@loomweaver/shell`), the order of
  work (`init` for a fresh project; `scaffold_weaver` and the other generators instead of plugin
  code from memory; `validate_manifest`, `validate_commands` and `validate_i18n` on the result), the
  conventions the recorded runs saw broken or nearly broken (semantic tokens only, grants exactly as
  the manifest declares, the `mod` token for shortcuts, translations composed by namespace), the
  traps Getting started names, and where the knowledge and the hands are. It states procedure and
  points at the docs; it repeats no contract, so it cannot drift from one.
- **Served beside `llms.txt`** on the site and named in the "For AI assistants" group, so it is one
  URL away, and **installable with one line** into a project, per tool, from the assistant guide.
- **One recorded run with the skill in place**, compared with the same prompt without it, so the
  guide can say what the skill changes rather than that it exists.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. A documentation artifact for assistants and its distribution; no platform behaviour. The
change declares `skip_specs`.

## Impact

- `skills/loomweaver/SKILL.md`, new.
- `website/tools/sync-docs.mjs`: the file served verbatim; `website/sidebar.mjs`: the entry under
  "For AI assistants".
- `docs/building-with-an-assistant.md`: the skill as the third thing the assistant gets, and how to
  install it per tool; `llms.txt` and `docs/README.md`: one line each.
- No legacy source is dissolved by this change.
