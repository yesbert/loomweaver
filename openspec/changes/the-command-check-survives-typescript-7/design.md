## Context

See proposal.md. The lookup tries the directory being checked, then the working directory, and
returns whatever `require('typescript')` gives it. Under TypeScript 7 that is an object with
`version` and `versionMajorMinor` only. The 7.1 beta adds a new interface under subpaths
(`typescript/sync`, `typescript/ast`), which is shaped differently and still a beta.

## Goals / Non-Goals

**Goals:**

- The check keeps working in a project on TypeScript 7 that also has the compatibility package.
- Without it, the person learns what to install instead of reading a TypeError.

**Non-Goals:**

- Porting the check to the TypeScript 7.1 interface. It is a beta, and the compatibility package
  covers what the check reads. The port becomes worth doing when that interface is stable or when
  Microsoft retires the compatibility package.
- The workspace's own guards, which also read the 6.0 interface. They run on the workspace's
  TypeScript, which Angular holds on 6.0; `docs/reference/operations.md` records what to change when
  it moves.

## Decisions

### A compiler counts only if it can read a source file

The lookup accepts a module only where `createSourceFile` is a function, the one entry point the
check starts from. A version number alone is not a compiler. Testing the capability rather than the
version keeps a later TypeScript that brings the interface back working without a change here.

### The compatibility package is looked for beside the TypeScript that lacks the interface

It is resolved from the same place, so the check uses what the consumer's project installed and
nothing of its own. *Rejected: making `@typescript/typescript6` a dependency of the devkit.* The check
would then always work, but every installation of the devkit would carry a second copy of the whole
compiler for the sake of one tool, and the project that needs it can install it in one line, which
the message says.

### The lookup says why it found nothing, and the callers word it

The lookup returns either the compiler or what it found instead: no TypeScript, or a TypeScript at a
given version without the interface. The CLI and the MCP server each word that for where they run,
as they do today for the missing case, and both name the package to install.

## Risks / Trade-offs

- [Microsoft stops publishing the compatibility package] → The message then names a package that no
  longer helps. The non-goal above is the remedy, and the capability test in the lookup is where the
  port starts.
- [A project has the compatibility package but a TypeScript 6 as well] → The lookup takes the
  project's own TypeScript first while it has the interface, so nothing changes for it.
