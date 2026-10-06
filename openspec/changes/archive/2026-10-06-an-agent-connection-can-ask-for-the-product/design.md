## Context

The agent connection takes an optional `before` decision per call, which may run, decline or answer
the call; each call it passes carries the command's statement about an agent's word. The four copies
implement the same mapping on top of it, differing only in wording and in whether a yes is
remembered.

## Goals / Non-Goals

**Goals:**

- One implementation of the mapping, opt-in, with the asking still done by the product's own
  confirmation.

**Non-Goals:**

- Remembering an answer beyond one connection. Persisting consent is a product decision with
  privacy weight; a product that wants it keeps writing its own policy.

## Decisions

**The policy is a function returning the `before` decision**, taking the product's confirmation
(`(call) => Promise<boolean>`) and optional decline wording, so a product composes it like any other
`before` and can wrap it.

**Memory lives in the policy instance.** A connection that creates its own policy remembers for
itself; two connections never share an answer.

*Alternative rejected:* acting on the statement inside the connection by default. That would ask on
the product's behalf, which the commands specification rules out, and would surprise every product
that already asks in its own way.

## Risks / Trade-offs

- [The owner rejects the boundary move] → Then the change closes without code, and the four copies
  are aligned to remember a yes for "ask first" instead.
