> **Status:** approved.

## Why

Two tests in the testbed's end-to-end suite are red, and they have been red long enough that nobody
reads the suite's verdict any more. That is the whole cost: a suite with known failures cannot tell
anyone that something new has broken, so every future regression arrives silently.

They are two different things, and treating them as one problem would fix neither.

**One is a defect.** When an anonymous session adopts an identity, the arrangement the user was
looking at is lost. Reproduced in the testbed at an address holding a container of four panes, one of
them gated on a role:

| | Panes | The gated pane says |
|---|---|---|
| Signed out, opened fresh | 4 | Sign-in required |
| Immediately after adopting an identity without the role | **1** | **nothing at all** |
| The same address opened again, same identity | 4 | No access |

So the loss lasts only from the adoption until the next navigation, and nothing wrong is written
down. Every identity loaded fresh is correct, including the one without the role, so the gating
itself is sound. Only the moment of adoption is wrong.

**The other is a stale test.** A test asserts that a workspace the user switched away from stays away
across a restart. That was true until the change *the declared start holds on every opening*, which
deliberately replaced the requirement governing only a first visit with one that holds on every
opening. The test dates from the initial public release and was never brought along. The
implementation follows the contract; the test contradicts it.

## What Changes

- The arrangement a user is looking at survives an identity being adopted, instead of collapsing
  until they navigate again. The gated pane keeps saying why it is empty throughout, and the reason
  it gives follows the session.
- A test is corrected to assert the guarantee the platform actually makes about where an opening
  starts, so that it guards the contract instead of a superseded version of it.
- Nothing the platform guarantees changes. Both requirements named below are already written; one is
  not being kept, and one is being tested backwards.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This change adds no requirement and alters none, which is why it carries `skip_specs: true`.
The behaviour it restores is already required, in two places:

- `persistence-ports`, *Adopting a namespace reads it before it writes to it*, scenario **A person
  new to the product keeps what was built for them**: when an anonymous session adopts a namespace
  that holds nothing, what the workbench holds stands. At the moment of adoption the workbench held
  a four-pane arrangement, and it did not stand.
- `access-gating`, *Addressable content is gated at its address, and says why*: the reason shown has
  to match whether the user is signed out or merely lacks a role. While the arrangement is collapsed
  no reason is shown at all, which is neither.

Writing either of those a second time would state nothing new and give the contract a second place
to disagree with itself.

## Impact

- The path that adopts an identity's namespace, and whatever it does to the stored arrangement on
  the way. The cause is not yet located; finding it is the first task.
- One test file in the testbed's end-to-end suite is corrected, and the rest of that file is read for
  the same staleness.
- No legacy source is dissolved by this change.
