## 1. The published contract

- [x] 1.1 Add the argument descriptor to `platform/libs/core/plugin-sdk/src/lib/command.ts`: a name,
      one of the closed set of kinds (text, number, boolean, choice from a fixed list, and a list of
      any of those), a required flag, and a description. Types only, no runtime dependency.
- [x] 1.2 Let `Command` declare its arguments and answer with a result, both optional, both plain
      data. Verify that a command registered today still type-checks unchanged.
- [x] 1.3 Add the machine-readable description to `Command`, accepting a translation key or a
      literal, with JSDoc stating that it explains the action rather than labelling a control.
- [x] 1.4 Add the flag that opens a command to a caller other than its own plugin, defaulting to
      closed, with JSDoc carrying the reasoning in the shape the detached-window flag already uses.
- [x] 1.5 Add invocation by identity and enumeration of what the caller may invoke to
      `PluginContext` in `platform/libs/core/plugin-sdk/src/lib/plugin.ts`, with a result type that
      tells an answer, a refusal and a failure apart.
- [x] 1.6 Add the capability entry to `platform/libs/core/plugin-sdk/src/lib/capability.ts` and its
      JSDoc line naming the slice of the context it covers.

## 2. The execution seam

- [x] 2.1 Extract the narrowing that decides whether a foreign caller may reach a command into one
      predicate in `platform/libs/core/shell/src/lib/commands/`: the openness flag, the session
      access requirement, the detached-window rule, and the calling plugin's grant.
- [x] 2.2 Route invocation by identity through the existing execution seam in
      `command.service.ts`, so access gating, refusal reporting and failure handling apply without a
      second path. The recently-used record turned out to live in the palette rather than in the
      seam, so a programmatic invocation joins it no more than a keybinding does. The delta says
      nothing about it either way: an existing requirement already claims the record cannot differ by
      route, and naming an exception to it from a neighbouring requirement would put the capability
      at odds with itself. That claim overstates what the seam does and deserves its own change.
- [x] 2.3 Validate declared arguments at the seam before the command runs: refuse a missing required
      argument, refuse a value of the wrong kind, and refuse a value that cannot be carried as data.
- [x] 2.4 Return the command's answer to the caller, and return a refusal and a failure as
      distinguishable outcomes rather than as an answer.
- [x] 2.5 Cap invocation depth at the seam and refuse beyond it, reported the way a refusal already
      is.
- [x] 2.6 Refuse an unknown identity and a command the caller may not reach identically, so that a
      refusal cannot be used to discover what is installed.
- [x] 2.7 Implement enumeration from the same predicate as 2.1, in a predictable order, resolving
      each description to the active language before it leaves the workbench.

## 3. Permissions

- [x] 3.1 Recognise the added capability in
      `platform/libs/core/shell/src/lib/permissions/capability-grants.ts` and the grant service, so
      it is granted, refused and revoked like the others.
- [x] 3.2 Gate invocation and enumeration on the grant: without it, invocation is refused and
      enumeration is empty whatever is installed.
- [x] 3.3 Exempt a plugin invoking a command it registered itself from the grant.
- [x] 3.4 Make revocation take effect at once: the next invocation is refused and the enumeration
      empties without a reload.
- [x] 3.5 Confirm the permissions settings surface lists the added capability with a label a user can
      act on, and that its refusal reaches the user through the existing path.

## 4. The sandbox boundary

- [x] 4.1 Carry invocation and enumeration across the plugin boundary in
      `platform/libs/core/shell/src/lib/plugin/host-plugin-context.ts` and
      `sandbox-plugin-runtime.ts`, so a sandboxed plugin sees the same context surface.
- [x] 4.2 Constrain what crosses the boundary, refusing a value that cannot be carried as data rather
      than letting it arrive stripped. Landed in `foundation/command-arguments.ts` (the narrowing,
      shared by both slices) and `plugin/sandbox/sandbox-rpc-contract.ts` (the wire contract and the
      refusal) rather than in `sandbox-rpc-sanitize.ts`, because the check belongs beside the
      argument rules it mirrors.
- [x] 4.3 Verify a sandboxed plugin and an in-process plugin get the same outcome for the same
      invocation, including the same refusal for the same reason.

## 5. Scaffolding

- [x] 5.1 Emit the new fields in the plugin and command templates in `@loom/devkit`, so a generated
      plugin carries them in place.
- [x] 5.2 Reflect the same in the `scaffold_*` tools of `@loom/mcp` and in `@loom/cli`.
- [x] 5.3 Report a command that declares itself open to a foreign caller but carries no description,
      since such an entry is unusable to the caller it opened itself to. Landed as a dev-mode warning
      at registration rather than in manifest validation: a command is registered at runtime and
      never appears in a manifest, so there is nothing static to validate. The manifest validator
      did need the added capability in its known set, and got it.

## 6. Documentation

- [x] 6.1 Write the plugin-author guide under `docs/` covering the chain end to end: declaring
      arguments, describing the action, opening it, and what the user then sees and can revoke.
- [x] 6.2 State the closed default and its reasoning in the JSDoc on the published contract, and
      check `docs/reference/` for any statement about commands that this change makes untrue.

## 7. Verification

- [x] 7.1 Cover every scenario in `specs/commands/spec.md` with a test, including the one that pins
      the list and the seam to the same predicate.
- [x] 7.2 Cover every scenario in `specs/plugin-permissions/spec.md` with a test.
- [x] 7.3 Run `openspec validate --all --strict`, the workspace lint including the Nx tag boundary,
      and confirm no platform package gained a dependency.
