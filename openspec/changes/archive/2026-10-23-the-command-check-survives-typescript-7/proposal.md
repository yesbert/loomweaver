> **Status:** approved.

## Why

The command check behind `validate commands` in the CLI and `validate_commands` in the MCP server
reads a consumer's sources with the TypeScript compiler of the consumer's own project. TypeScript 7,
the native rewrite, no longer offers that programming interface: from 7.0 and in the 7.1 beta,
`require('typescript')` returns only the version. The check would take such a module for a compiler
and fail inside it with "createSourceFile is not a function".

No Angular project can move to TypeScript 7 yet, because Angular 22 accepts only 6.0. The day it can,
many will move at once, and the check would break for all of them together. Microsoft publishes the
6.0 interface as a separate package, `@typescript/typescript6`, for exactly this kind of tool, and the
check only reads syntax, which that package covers fully.

## What Changes

- Looking up the compiler distinguishes three outcomes: a compiler with the interface the check needs,
  a TypeScript that has none, and no TypeScript at all.
- Where the project's TypeScript has no such interface, the check uses `@typescript/typescript6` from
  the same project when it is installed.
- Where it is not installed, the CLI and the MCP server say that the installed TypeScript no longer
  offers the interface and name the package to install, instead of failing inside the compiler.
- Where no TypeScript is installed at all, the existing message stays.
- The scaffolding capability states this in the requirement on checking a consumer's declarations.

The published contract of the plugin SDK and the shell does not change. Ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scaffolding`: the command check reads sources where the project's TypeScript offers no programming
  interface, through the compatibility release when the project has it, and otherwise says what it
  lacks.

## Impact

- `@loomweaver/devkit`: the compiler lookup the command check uses, exported for the CLI and the MCP
  server.
- `@loomweaver/cli` (`validate commands`) and `@loomweaver/mcp` (`validate_commands`): their message
  when no usable compiler is found.
- Unit tests for the lookup, with a stand-in TypeScript 7 and a stand-in compatibility package.
