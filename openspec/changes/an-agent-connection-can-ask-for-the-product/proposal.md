> **Status:** approved — approved for implementation on 2026-10-06.

## Why

A command states what an agent's word is enough for, and the platform deliberately acts on none of
it: asking, and remembering an answer, belong to whoever runs commands for the agent. So every
product writes the same twenty lines that turn the four statements into a decision — decline what
may never run on an agent's word, run what may, ask for the rest — and the audit found four copies:
the generated weaver, the demo, the example and the samples page. They already differ: the generated
one asks every time for a command that only asks to be asked first, because remembering an answer is
the part each copy leaves out.

This change proposes an opt-in policy in the agent connection that does exactly that mapping, with
the asking itself still the product's, through the confirmation it hands in. It touches a line the
commands specification draws on purpose, so it is a proposal for the owner to accept or reject, not
a cleanup.

## What Changes

- The agent connection package offers a policy a product may pass as its decision before a call
  runs. It declines a call to a command that may never run on an agent's word, runs one whose word is
  enough, and asks through a confirmation the product supplies for the rest: once per connection for
  a command that asks to be asked first, remembering a yes for that connection; every time for one
  that asks to be asked every time.
- A product that does not pass the policy is asked nothing and decides nothing, exactly as today.
- The generated weaver, the demo, the example and the samples page use the policy instead of their
  own copies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands`: the agent connection may act on a command's statement about an agent's word, when the
  product asks it to, through a confirmation the product supplies.

## Impact

- `@loomweaver/ag-ui`: one new published export; its guide and the reference page on agent tools.
- Dev kit: the weaver recipe's agent connection; the demo, the example and the samples page follow.
- `llms-full.txt`: the agent section names the policy.
