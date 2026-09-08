## 1. The skill

- [ ] 1.1 `skills/loomweaver/SKILL.md`: frontmatter with name and description, the body in the
      four parts the design lays out (detect, generate, validate, compose), one line per item, each
      linking its docs page by live URL; under one screen.
- [ ] 1.2 Read it against `llms-full.txt` and the docs once: no fact that lives there is restated,
      only linked.

## 2. Measured

- [ ] 2.1 The first-weaver prompt from the assistant guide, twice with the skill installed in the
      test app's `.claude/skills/` and twice without, from the same clean state, with the recording
      recipe; turns and tool calls noted in `design.md`.
- [ ] 2.2 If the skill does not shorten the path or change what the assistant does first, rewrite it
      and run again; if it still does not, stop and report before shipping.

## 3. Wiring

- [ ] 3.1 `website/tools/sync-docs.mjs`: the skill served verbatim; `website/sidebar.mjs`: an entry
      under "For AI assistants".
- [ ] 3.2 `docs/building-with-an-assistant.md`: the skill as the third thing the assistant gets,
      with the one-line install per tool (Claude Code, Cursor, VS Code with Copilot), each checked
      against the tool's current documentation; the measured difference stated.
- [ ] 3.3 `llms.txt` and `docs/README.md`: one line each; `README.md`'s assistant door names it.

## 4. Verify

- [ ] 4.1 `npm run check` in `website/` green; docs style and format guards green.
- [ ] 4.2 `openspec validate the-platform-ships-an-agent-skill --strict` passes.
