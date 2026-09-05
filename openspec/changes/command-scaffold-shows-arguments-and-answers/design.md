## Context

See proposal.md, *Why*. What shapes the approach:

- The weaver recipe emits one command block, shared by `--command`, `--shortcut`, `--menu`,
  `--bar-item` and `--agent`. Changing it changes the example every route produces, which is the
  point: there is one pattern to copy and it should be the complete one.
- The stand-in template reads the offered tools and picks the one whose name appears in the prompt;
  it then streams `{}` as arguments in pieces, with a comment saying it has nothing to fill them
  from. The tool it is handed carries the JSON schema the adapter derived from the declaration, so
  it does have something to fill them from.
- The generated connection test feeds a call with `{"who":"you"}` and expects `it ran` back, a
  fixed string from a fake context. It documents the shape of a call, not the command.
- The generated command's effect is a toast keyed by the weaver's id. A person triggering it from
  the rail should still see something happen; an agent should get something back.

## Goals / Non-Goals

**Goals:**

- The generated command is the one a reader should copy: id, title, description, one described
  argument, `answers`, `callable`, a `run` that uses the argument and returns the answer.
- The generated path, served without edits, shows an argument streaming and an answer returning.

**Non-Goals:**

- No second command, no options to shape the argument. One `choice` argument is the smallest
  complete example; a reader replaces it.
- No change to the panel or the connection beyond the test that reads the answer.

## Decisions

**One `choice` argument named `tone`, with the toast's kind as the effect.** The command greets with
a tone the caller chooses, `info`, `success` or `warning`, which maps onto the toast kinds the
workbench already has, so the argument visibly changes the effect and needs no new vocabulary. A
`text` argument was considered and rejected: a stand-in cannot invent a sensible text, and a choice
gives it a first value to take. The description says what the argument selects and what a sensible
value looks like, as the guide asks.

**`answers` declared, and the answer is the greeting it showed.** `run` returns a small plain object
with the tone and the message it displayed, so an agent learns what happened rather than that
something happened. The panel already shows `content`; nothing there changes.

**The stand-in takes the first declared choice.** It reads the tool's `parameters`, finds the first
property with an `enum`, and sends its first value; a command without such an argument still gets
`{}`, as today. The comment that said it has nothing to fill from goes, replaced by one line saying
where the value comes from. This keeps the stand-in a stand-in: no model, no network, and one
deterministic choice.

**The generated test asserts the answer's shape.** The fake context's `invokeCommand` returns the
value the generated `run` would, and the test reads `content` as JSON and checks the tone came
through. This pins that arguments reach `run` and answers reach the caller, which the old fixed
string did not.

## Risks / Trade-offs

- [Every route that emits the command block now emits a longer block] → It is eight lines longer and
  each line is the pattern the reader needs; the README beside the weaver names the fields.
- [Consumers who diff a regenerated weaver see the change] → Generators write once; an existing
  weaver is never rewritten.

## Migration Plan

One branch, one pull request, in the same patch release as the other scaffold changes if they land
together. Nothing to migrate.
