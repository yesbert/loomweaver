> **Status:** proposed — not approved for implementation yet.

## Why

`llms-full.txt` is what an assistant reads instead of the guides, and its contract section restates
the published interfaces by hand. The only check on it confirms that every exported name appears
somewhere in the file. Signatures, members and command lines are not checked, and the audit found
them wrong in many places at once: a member missing from a block headed "complete", a removed field
still described, `run` typed as returning a promise, a CLI binary that does not exist, a flag the CLI
refuses. All of it passed CI. The file is fixed now; nothing keeps it fixed.

## What Changes

- The interface and service-signature blocks of the contract section are generated from the packed
  declarations of the SDK, the shell and the frame kit, between markers, in the file's compact form.
  The hand-written prose around them stays hand-written.
- A guard regenerates the blocks and fails when the file differs, naming the command that rewrites
  them, the way the icon catalogue is kept current.
- A second check reads every command line the file and the guides give for the command-line tool and
  fails on a command or flag the tool does not accept.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This changes how a published file is maintained, not what the platform guarantees. It sets
`skip_specs`.

## Impact

- `llms-full.txt`: its interface blocks move between generated markers; the prose is untouched.
- Platform tools: a generator and two guards; the API-docs guard keeps its job of finding every
  exported name.
- CI: two more guard steps in the pull-request build.
