> **Status:** approved.

## Why

A weaver generated with a command already declares that command reachable by a caller that is not the
user, and the adapter that offers such commands to an agent is published and documented. Between
those two facts sits work nobody has generated: the loop that hands the list over, the hook where a
product says no, and something to look at while finding out whether any of it is wired correctly. So
the fastest path to an agent-driven product today is to copy a recipe out of a guide, which is the
kind of ceremony this platform generates away everywhere else.

The cost is not the thirty lines. It is that three things are easy to get wrong and invisible when
they are: the list must be asked for again every run, every event must be handed over unfiltered, and
a decision before a call can only narrow what the workbench would have allowed anyway. Prose says all
three. Generated code that already does them says it once, in a form that cannot be skimmed past, and
a generated test says it as something that fails when broken.

We also already know the shape works, because it exists: the demo carries a panel, a runner emitting
real protocol events, a confirmation that declines, and tests. What has never been generated is that
shape without the demo's own script.

## What Changes

- A weaver can be generated **ready to be driven by an agent**. The generated output runs on the
  first serve, with no backend, no key and no network: a local stand-in produces genuine protocol
  events so the whole path is exercised, and it names itself as the part to replace.
- The connection to a real agent stays the consumer's: nothing is generated for transport, for
  credentials or for a language model, and the generated output says so where the replacement goes.
- Generated output may for the first time need a package the consumer does not have. A route that can
  reach the workspace installs it; a route that cannot names it as a step still to take. This is
  stated as a guarantee rather than left to each generator to remember.
- The generated weaver declares the permission an agent-reachable command needs, derived from the
  choice rather than typed by the consumer, as every other generated permission already is.
- No change to the plugin contract, to the adapter, or to what an agent may reach. This generates
  what a consumer could have written by hand against the published surface, and nothing else.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `scaffolding`: adds the requirement that a weaver can be generated ready for an agent to drive it,
  and that what is generated runs and demonstrates itself before any agent exists. Widens the
  requirement that generated output needs no repair to cover a package the generated output needs and
  the consumer does not yet have.

## Impact

- `platform/libs/tooling/devkit/src/recipes/angular-weaver/recipe.ts` — the feature set, the derived
  permissions and the emitted files gain the agent connection.
- `platform/libs/tooling/devkit/src/lib/scaffolds/scaffolds.ts` — the option is described once here,
  which is what carries it to all three routes.
- `platform/libs/tooling/devkit/src/lib/amend/types.ts` and the routes that apply amendments — a
  package the generated output needs is a new kind of amendment, applied by the route with workspace
  access and named by the routes without one.
- `platform/libs/tooling/devkit/src/recipes/angular-weaver/amendments.ts` — the weaver states the two
  packages its agent connection needs.
- `docs/scaffolding.md`, `docs/samples.md` and `llms.txt` / `llms-full.txt` — the recipe that is now
  generated says so, as the other generated recipes already do.

Not dissolved, and deliberately kept: `demo/src/agent`. It is the demonstration, with a scripted
brain and five prompts chosen to prove specific claims, and it stays that. The generated output is not
a second copy of it: it shares no code with it, as no template ever does, and the two are allowed to
differ. Nobody should later reconcile them.

Legacy sources dissolved by this change: none.
