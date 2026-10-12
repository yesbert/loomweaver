## Context

The button's class contract already pairs the native disabled state with the accessible unavailable
marking in one rule. The three choice controls carry a rule for the native state only.

## Goals / Non-Goals

**Goals:**

- One look for both ways of saying "unavailable" on the three choice controls.

**Non-Goals:**

- Preventing the change. A pointer rule would stop a click but not the space bar, and a half guard is
  worse than none; the brief tells the owner to refuse the change.
- The range and field contracts. Nobody has asked, and a field that is unavailable but reachable is
  usually read-only, which is a different state.

## Decisions

**Extend the existing disabled rules to also match the unavailable marking**, as the button does,
instead of a modifier class. A modifier would be a second way to say what the attribute already says,
and a typo in a class name would be a silent no-op.

**Keep the not-allowed cursor and the reduced opacity, and keep the focus ring.** The focus ring is
what makes the reachable state worth having.

## Risks / Trade-offs

- [A consumer relies on the attribute alone and forgets to refuse the change] → The brief states the
  limit next to the class contract, and the requirement states it as a limit.
